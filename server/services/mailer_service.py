import os
import smtplib
import pandas as pd
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from contextlib import contextmanager
from datetime import datetime


class MailerService:
    def __init__(self, template_service, recipient_service, websocket_manager, ioloop):
        self.template_service = template_service
        self.recipient_service = recipient_service
        self.websockets = websocket_manager
        self.ioloop = ioloop
        self._is_running = False
        self._stop_requested = False

    def is_running(self):
        return self._is_running

    def stop(self):
        if self._is_running:
            self._stop_requested = True

    async def start_mailing(self, campaign_id, config, subject):
        if self._is_running:
            return

        self._is_running = True
        self._stop_requested = False

        html_template = await self.template_service.get_template(campaign_id)
        recipients = await self.recipient_service.get_recipients(campaign_id)

        self.ioloop.run_in_executor(
            None,
            self._run_mailing_loop,
            campaign_id,
            config,
            subject,
            recipients,
            html_template,
        )

    def _replace_placeholders(self, template_string, recipient_dict):
        for key, value in recipient_dict.items():
            placeholder = f"{{{{{key}}}}}"
            template_string = template_string.replace(placeholder, str(value))
        return template_string

    def _run_mailing_loop(
        self, campaign_id, config, subject, recipients, html_template
    ):
        recipients_df = pd.DataFrame()
        try:
            self._broadcast_log("info", "Mailing process started.")

            recipients_df = pd.DataFrame(recipients)
            if recipients_df.empty:
                self._broadcast_log("info", "Recipient list is empty.")
                return

            if "Status" not in recipients_df.columns:
                recipients_df["Status"] = "PENDING"

            recipients_to_process = recipients_df[
                recipients_df["Status"].astype(str).str.upper() != "SENT"
            ]

            if recipients_to_process.empty:
                self._broadcast_log("info", "No pending recipients to process.")
                return

            with self._smtp_connect(config) as server:
                for index, recipient_row in recipients_to_process.iterrows():
                    if self._stop_requested:
                        self._broadcast_log("warn", "Mailing process stopped by user.")
                        break

                    recipient = recipient_row.to_dict()
                    status, details = self._process_recipient(
                        server, config, subject, html_template, recipient
                    )

                    recipients_df.loc[index, "Status"] = status
                    self._broadcast_status(
                        recipient["Email"],
                        status,
                        details,
                        recipients_df.to_dict(orient="records"),
                    )

            self._broadcast_log("success", "Mailing process finished.")
        except Exception as e:
            self._broadcast_log(
                "error", f"Mailing process aborted due to a critical error: {e}"
            )
        finally:
            if not recipients_df.empty:
                self.recipient_service.write_recipients_from_json(
                    campaign_id, recipients_df.to_dict(orient="records")
                )

                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                report_filename = f"report_{timestamp}.csv"
                report_path = os.path.join(
                    self.recipient_service.campaign_service.get_campaign_path(
                        campaign_id
                    ),
                    report_filename,
                )
                recipients_df.to_csv(report_path, index=False)
                self._broadcast_log(
                    "info", f"Generated final report: {report_filename}"
                )

            self._is_running = False
            self._stop_requested = False
            self._broadcast_finish()

    def _process_recipient(
        self, server, config, subject_template, html_template, recipient
    ):
        email = recipient.get("Email")
        if not email:
            return "SKIPPED", "Missing email address."

        try:
            msg = MIMEMultipart()
            msg["From"] = config["sender_email"]
            msg["To"] = email
            subject = self._replace_placeholders(subject_template, recipient)
            msg["Subject"] = subject

            body = self._replace_placeholders(html_template, recipient)
            msg.attach(MIMEText(body, "html"))

            send_attachments = config.get("send_attachments", True)
            if send_attachments:
                attachment_file = recipient.get("AttachmentFile")
                if not attachment_file:
                    return "SKIPPED", "Attachment file name is missing."

                attachment_path = os.path.join(
                    config["attachment_folder"], attachment_file
                )
                if not os.path.exists(attachment_path):
                    raise FileNotFoundError(f"Attachment not found: {attachment_path}")

                with open(attachment_path, "rb") as attachment:
                    part = MIMEBase("application", "octet-stream")
                    part.set_payload(attachment.read())
                encoders.encode_base64(part)
                part.add_header(
                    "Content-Disposition", f"attachment; filename= {attachment_file}"
                )
                msg.attach(part)

            server.send_message(msg)
            return "SENT", "Email sent successfully."
        except Exception as e:
            return "ERROR", str(e)

    @contextmanager
    def _smtp_connect(self, config):
        server = None
        try:
            smtp_server_host = config.get("smtp_server")
            port = int(config.get("smtp_port", 587))
            sender_email = config.get("sender_email")
            password = config.get("sender_password")
            use_ssl = config.get("use_ssl", False)

            self._broadcast_log(
                "info",
                f"Attempting to connect to SMTP server {smtp_server_host}:{port}...",
            )

            if use_ssl:
                self._broadcast_log("info", "Using SSL for connection.")
                server = smtplib.SMTP_SSL(smtp_server_host, port)
                self._broadcast_log("success", "SSL connection established.")
            else:
                self._broadcast_log("info", "Using standard SMTP connection.")
                server = smtplib.SMTP(smtp_server_host, port)
                self._broadcast_log("success", "SMTP connection established.")
                self._broadcast_log("info", "Initiating TLS handshake (STARTTLS)...")
                server.starttls()
                self._broadcast_log("success", "TLS handshake successful.")

            self._broadcast_log("info", f"Logging in as {sender_email}...")
            server.login(sender_email, password)
            self._broadcast_log("success", "SMTP login successful.")

            yield server

        except smtplib.SMTPAuthenticationError as e:
            err_text = e.smtp_error
            if isinstance(err_text, bytes):
                err_text = err_text.decode("utf-8", "ignore")

            error_message = f"SMTP Authentication Error: {e.smtp_code} {err_text}. Check email/password."

            self._broadcast_log("error", error_message)
            raise Exception(error_message)
        except ConnectionRefusedError:
            error_message = (
                "Connection refused by the server. Check server address and port."
            )
            self._broadcast_log("error", error_message)
            raise Exception(error_message)
        except smtplib.SMTPException as e:
            error_message = f"An SMTP error occurred: {e}"
            self._broadcast_log("error", error_message)
            raise Exception(error_message)
        except Exception as e:
            error_message = f"An unexpected error occurred during connection: {e}"
            self._broadcast_log("error", error_message)
            raise Exception(error_message)
        finally:
            if server:
                self._broadcast_log("info", "Closing SMTP connection.")
                server.quit()
                self._broadcast_log("success", "Connection closed.")

    def _broadcast(self, message):
        self.ioloop.add_callback(self.websockets.broadcast, message)

    def _broadcast_log(self, level, message):
        self._broadcast(
            {"action": "log", "payload": {"level": level, "message": message}}
        )

    def _broadcast_status(self, email, status, details, recipients):
        self._broadcast(
            {
                "action": "status_update",
                "payload": {
                    "email": email,
                    "status": status,
                    "details": details,
                    "recipients": recipients,
                },
            }
        )

    def _broadcast_finish(self):
        self._broadcast({"action": "finish"})
