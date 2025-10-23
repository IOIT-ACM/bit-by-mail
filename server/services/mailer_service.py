import os
import json
import smtplib
import pandas as pd
import tornado.websocket
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from contextlib import contextmanager


class MailerService:
    def __init__(
        self, template_service, recipient_service, websocket_connections, ioloop
    ):
        self.template_service = template_service
        self.recipient_service = recipient_service
        self.websockets = websocket_connections
        self.ioloop = ioloop
        self._is_running = False
        self._stop_requested = False

    def is_running(self):
        return self._is_running

    def stop(self):
        if self._is_running:
            self._stop_requested = True

    async def start_mailing(self, config, recipients):
        if self._is_running:
            return

        self._is_running = True
        self._stop_requested = False

        html_template = await self.template_service.get_template()

        self.ioloop.run_in_executor(
            None, self._run_mailing_loop, config, recipients, html_template
        )

    def _run_mailing_loop(self, config, recipients, html_template):
        recipients_df = pd.DataFrame()
        try:
            self._broadcast_log("info", "Mailing process started.")

            recipients_df = pd.DataFrame(recipients)
            recipients_to_process = recipients_df[
                recipients_df["Status"].str.upper() != "SENT"
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
                        server, config, html_template, recipient
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
                    recipients_df.to_dict(orient="records")
                )
            self._is_running = False
            self._stop_requested = False
            self._broadcast_finish()

    def _process_recipient(self, server, config, html_template, recipient):
        email = recipient.get("Email")
        attachment_file = recipient.get("AttachmentFile")

        if not email or not attachment_file:
            return "SKIPPED", "Missing email or attachment file name."

        try:
            attachment_path = os.path.join(config["attachment_folder"], attachment_file)
            if not os.path.exists(attachment_path):
                raise FileNotFoundError(f"Attachment not found: {attachment_path}")

            msg = MIMEMultipart()
            msg["From"] = config["sender_email"]
            msg["To"] = email
            msg["Subject"] = config["subject_template"].format(**recipient)

            self._broadcast_log(
                "info", f"Composing email with subject: \"{msg['Subject']}\""
            )
            msg.attach(MIMEText(html_template.format(**recipient), "html"))

            self._broadcast_log("info", f"Attaching file: {attachment_path}")
            with open(attachment_path, "rb") as attachment:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(attachment.read())
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition", f"attachment; filename= {attachment_file}"
            )
            msg.attach(part)

            server.send_message(msg)
            self._broadcast_log("success", f"Email successfully sent to {email}")
            return "SENT", "Email sent successfully."
        except Exception as e:
            self._broadcast_log("error", f"Failed to send email to {email}: {e}")
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
        self.ioloop.add_callback(self._safe_write_message, message)

    def _safe_write_message(self, message):
        for ws in self.websockets:
            try:
                ws.write_message(json.dumps(message))
            except tornado.websocket.WebSocketClosedError:
                print("Attempted to write to a closed WebSocket.")

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
