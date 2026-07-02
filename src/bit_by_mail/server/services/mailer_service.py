import os
import smtplib
import time
import pandas as pd
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from contextlib import contextmanager
from datetime import datetime
from typing import List, Optional

class MailerService:
    def __init__(self, template_service, recipient_service, campaign_service, websocket_manager, ioloop):
        self.template_service = template_service
        self.recipient_service = recipient_service
        self.campaign_service = campaign_service
        self.websockets = websocket_manager
        self.ioloop = ioloop
        self._is_running = False
        self._stop_requested = False

    def is_running(self):
        return self._is_running

    def stop(self):
        if self._is_running:
            self._stop_requested = True

    async def start_mailing(
        self,
        campaign_id,
        config,
        subject,
        recipient_indices: Optional[List[int]] = None,
    ):
        if self._is_running:
            return

        self._is_running = True
        self._stop_requested = False

        html_template = await self.template_service.get_template(campaign_id)
        recipients = await self.recipient_service.get_recipients(campaign_id)
        campaigns = await self.campaign_service.get_campaigns()
        campaign = next((c for c in campaigns if c["id"] == campaign_id), {})

        self.ioloop.run_in_executor(
            None,
            self._run_mailing_loop,
            campaign_id,
            config,
            campaign,
            subject,
            recipients,
            html_template,
            recipient_indices,
        )

    def _replace_placeholders(self, template_string, recipient_dict):
        for key, value in recipient_dict.items():
            placeholder = f"{{{{{key}}}}}"
            template_string = template_string.replace(placeholder, str(value))
        return template_string

    def _run_mailing_loop(
        self,
        campaign_id,
        config,
        campaign,
        subject,
        recipients,
        html_template,
        recipient_indices,
    ):
        recipients_df = pd.DataFrame()
        try:
            self._broadcast_log("info", "Mailing process started.")

            if not subject.strip() or not html_template.strip():
                self._broadcast_log("error", "Cannot send: Subject or Email body is empty.")
                return

            accounts = config.get("accounts", [])
            if not accounts:
                self._broadcast_log("error", "No sender accounts configured in Settings.")
                return

            account = next((a for a in accounts if a.get("id") == campaign.get("sender_account_id")), None)
            if not account:
                account = next((a for a in accounts if a.get("is_default")), None)
            if not account:
                account = accounts[0]

            recipients_df = pd.DataFrame(recipients)
            if recipients_df.empty:
                self._broadcast_log("info", "Recipient list is empty.")
                return

            if "Status" not in recipients_df.columns:
                recipients_df["Status"] = "PENDING"
            if "SentTimestamp" not in recipients_df.columns:
                recipients_df["SentTimestamp"] = ""
            recipients_df["SentTimestamp"] = recipients_df["SentTimestamp"].fillna("")

            if recipient_indices is not None:
                selected_recipients = recipients_df.iloc[recipient_indices]
                recipients_to_process = selected_recipients[
                    selected_recipients["Status"].astype(str).str.upper() != "SENT"
                ]
            else:
                recipients_to_process = recipients_df[
                    recipients_df["Status"].astype(str).str.upper() != "SENT"
                ]

            if recipients_to_process.empty:
                self._broadcast_log("info", "No pending recipients to process.")
                return

            sent_count = 0
            total_to_send = len(recipients_to_process)
            delay = int(campaign.get("delay", 0))
            self._broadcast_mailing_started(total_to_send)

            with self._smtp_connect(account) as server:
                for index, recipient_row in recipients_to_process.iterrows():
                    if self._stop_requested:
                        self._broadcast_log("warn", "Mailing process stopped by user.")
                        break

                    recipient = recipient_row.to_dict()
                    status, details, timestamp = self._process_recipient(
                        server, account, campaign, subject, html_template, recipient
                    )

                    recipients_df.loc[index, "Status"] = status
                    if timestamp:
                        recipients_df.loc[index, "SentTimestamp"] = timestamp

                    sent_count += 1
                    self._broadcast_status(
                        recipient["Email"],
                        status,
                        details,
                        recipients_df.to_dict(orient="records"),
                        sent_count,
                        total_to_send,
                    )

                    if delay > 0 and sent_count < total_to_send and not self._stop_requested:
                        time.sleep(delay)

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
                from filelock import FileLock
                with FileLock(report_path + ".lock"):
                    recipients_df.to_csv(report_path, index=False)

                self._broadcast_log(
                    "info", f"Generated final report: {report_filename}"
                )
                report_url = f"/reports/{campaign_id}/{report_filename}"
                self._broadcast_report_ready(report_url)

            self._is_running = False
            self._stop_requested = False
            self._broadcast_finish()

    def _process_recipient(
        self, server, account, campaign, subject_template, html_template, recipient, retry=True
    ):
        email = recipient.get("Email")
        if not email:
            return "SKIPPED", "Missing email address.", None

        try:
            msg = MIMEMultipart()
            msg["From"] = account["sender_email"]
            msg["To"] = email

            msg["X-Label"] = "bit by mail"
            msg["X-Mailer"] = "bit-by-mail"

            subject = self._replace_placeholders(subject_template, recipient)
            msg["Subject"] = subject

            body = self._replace_placeholders(html_template, recipient)
            is_html = campaign.get("is_html", True)
            msg.attach(MIMEText(body, "html" if is_html else "plain"))

            send_attachments = campaign.get("send_attachments", False)
            if send_attachments:
                attachment_files_str = str(recipient.get("AttachmentFile", "")).strip()

                if attachment_files_str:
                    attachment_files = [
                        f.strip() for f in attachment_files_str.split(";") if f.strip()
                    ]

                    for filename in attachment_files:
                        safe_filename = os.path.basename(filename)
                        attachment_path = os.path.join(
                            campaign.get("attachment_folder", ""), safe_filename
                        )
                        if not os.path.exists(attachment_path):
                            raise FileNotFoundError(f"Attachment not found: {safe_filename}")

                        with open(attachment_path, "rb") as attachment:
                            part = MIMEBase("application", "octet-stream")
                            part.set_payload(attachment.read())

                        encoders.encode_base64(part)
                        part.add_header(
                            "Content-Disposition", f"attachment; filename= {safe_filename}"
                        )
                        msg.attach(part)

            server.send_message(msg)
            timestamp = datetime.now().isoformat()
            return "SENT", "Email sent successfully.", timestamp
        except smtplib.SMTPServerDisconnected:
            if retry:
                try:
                    self._broadcast_log("warn", "SMTP connection lost. Attempting to reconnect...")
                    smtp_server_host = account.get("smtp_server")
                    port = int(account.get("smtp_port", 587))
                    sender_email = account.get("sender_email")
                    password = account.get("sender_password")
                    use_ssl = account.get("use_ssl", False)

                    if use_ssl:
                        server.connect(smtp_server_host, port)
                    else:
                        server.connect(smtp_server_host, port)
                        server.starttls()
                    server.login(sender_email, password)
                    self._broadcast_log("info", "Reconnected successfully. Retrying email...")
                    return self._process_recipient(server, account, campaign, subject_template, html_template, recipient, False)
                except Exception as reconnect_err:
                    return "ERROR", f"Connection lost and reconnect failed: {str(reconnect_err)}", None
            return "ERROR", "SMTP connection lost.", None
        except Exception as e:
            return "ERROR", str(e), None

    @contextmanager
    def _smtp_connect(self, account):
        server = None
        try:
            smtp_server_host = account.get("smtp_server")
            port = int(account.get("smtp_port", 587))
            sender_email = account.get("sender_email")
            password = account.get("sender_password")
            use_ssl = account.get("use_ssl", False)

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
                try:
                    server.quit()
                except Exception:
                    pass
                self._broadcast_log("success", "Connection closed.")

    def _broadcast(self, message):
        self.ioloop.add_callback(self.websockets.broadcast, message)

    def _broadcast_log(self, level, message):
        self._broadcast(
            {"action": "log", "payload": {"level": level, "message": message}}
        )

    def _broadcast_mailing_started(self, total_to_send):
        self._broadcast(
            {"action": "mailing_started", "payload": {"total_to_send": total_to_send}}
        )

    def _broadcast_status(
        self, email, status, details, recipients, sent_count, total_to_send
    ):
        self._broadcast(
            {
                "action": "status_update",
                "payload": {
                    "email": email,
                    "status": status,
                    "details": details,
                    "recipients": recipients,
                    "sent_count": sent_count,
                    "total_to_send": total_to_send,
                },
            }
        )

    def _broadcast_finish(self):
        self._broadcast({"action": "finish"})

    def _broadcast_report_ready(self, url):
        self._broadcast({"action": "report_generated", "payload": {"url": url}})

