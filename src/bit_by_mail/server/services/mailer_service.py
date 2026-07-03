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
import asyncio
import aiosqlite

class MailerService:
    def __init__(self, template_service, recipient_service, campaign_service, analytics_service, websocket_manager, ioloop, db_path):
        self.template_service = template_service
        self.recipient_service = recipient_service
        self.campaign_service = campaign_service
        self.analytics_service = analytics_service
        self.websockets = websocket_manager
        self.ioloop = ioloop
        self.db_path = db_path
        self._is_running = False
        self._stop_requested = False

    def is_running(self):
        return self._is_running

    def stop(self):
        if self._is_running:
            self._stop_requested = True

    async def start_mailing(self, campaign_id, config, subject, recipient_indices=None):
        if self._is_running:
            return
        self._is_running = True
        self._stop_requested = False
        html_template = await self.template_service.get_template(campaign_id)
        recipients = await self.recipient_service.get_recipients(campaign_id)
        campaigns = await self.campaign_service.get_campaigns()
        campaign = next((c for c in campaigns if c["id"] == campaign_id), {})
        self.ioloop.run_in_executor(None, self._run_mailing_loop, campaign_id, config, campaign, subject, recipients, html_template, recipient_indices)

    def _replace_placeholders(self, template_string, recipient_dict):
        for key, value in recipient_dict.items():
            template_string = template_string.replace(f"{{{{{key}}}}}", str(value))
        return template_string

    def _update_recipient_db(self, campaign_id, email, status, timestamp):
        async def _update():
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("UPDATE campaign_recipients SET status = ?, sent_timestamp = ? WHERE campaign_id = ? AND email = ?", (status, timestamp, campaign_id, email))
                await db.commit()
        self.ioloop.add_callback(_update)

    def _log_event_db(self, campaign_id, email, event_type, data=""):
        async def _update():
            await self.analytics_service.log_event(campaign_id, email, event_type, data)
        self.ioloop.add_callback(_update)

    def _run_mailing_loop(self, campaign_id, config, campaign, subject, recipients, html_template, recipient_indices):
        try:
            if not subject.strip() or not html_template.strip():
                self._broadcast({"action": "log", "payload": {"level": "error", "message": "Email subject or body is empty."}})
                return
            accounts = config.get("accounts", [])
            if not accounts:
                self._broadcast({"action": "log", "payload": {"level": "error", "message": "No sender accounts configured."}})
                return
            account = next((a for a in accounts if a.get("id") == campaign.get("sender_account_id")), None) or next((a for a in accounts if a.get("is_default")), None) or accounts[0]
            recipients_df = pd.DataFrame(recipients)
            if recipients_df.empty:
                self._broadcast({"action": "log", "payload": {"level": "error", "message": "No recipients found."}})
                return
            if recipient_indices is not None:
                selected = recipients_df.iloc[recipient_indices]
                to_process = selected[selected["Status"].astype(str).str.upper() != "SENT"]
            else:
                to_process = recipients_df[recipients_df["Status"].astype(str).str.upper() != "SENT"]
            if to_process.empty:
                self._broadcast({"action": "log", "payload": {"level": "warn", "message": "No pending recipients to process."}})
                return
            sent_count = 0
            total = len(to_process)
            delay = int(campaign.get("delay", 0))
            self._broadcast({"action": "mailing_started", "payload": {"total_to_send": total}})
            
            self._broadcast({"action": "log", "payload": {"level": "info", "message": f"Attempting SMTP login for {account.get('sender_email')}..."}})
            
            with self._smtp_connect(account) as server:
                self._broadcast({"action": "log", "payload": {"level": "success", "message": "SMTP login successful. Commencing email dispatch..."}})
                for index, row in to_process.iterrows():
                    if self._stop_requested:
                        self._broadcast({"action": "log", "payload": {"level": "warn", "message": "Mailing stopped by user."}})
                        break
                    rec_dict = row.to_dict()
                    status, details, timestamp = self._process_recipient(server, account, campaign, subject, html_template, rec_dict)
                    self._update_recipient_db(campaign_id, rec_dict["Email"], status, timestamp or "")
                    recipients_df.loc[index, "Status"] = status
                    if timestamp:
                        recipients_df.loc[index, "SentTimestamp"] = timestamp
                    sent_count += 1
                    self._broadcast({"action": "status_update", "payload": {"email": rec_dict["Email"], "status": status, "details": details, "recipients": recipients_df.to_dict(orient="records"), "sent_count": sent_count, "total_to_send": total}})
                    if delay > 0 and sent_count < total and not self._stop_requested:
                        time.sleep(delay)
            
            if not self._stop_requested:
                self._broadcast({"action": "log", "payload": {"level": "success", "message": "Mailing finished successfully."}})
        except Exception as e:
            self._broadcast({"action": "log", "payload": {"level": "error", "message": f"Mailing process failed: {str(e)}"}})
        finally:
            report_url = f"/reports/{campaign_id}/report.csv"
            self._broadcast({"action": "report_generated", "payload": {"url": report_url}})
            self._is_running = False
            self._stop_requested = False
            self._broadcast({"action": "finish"})

    def _process_recipient(self, server, account, campaign, subject_template, html_template, recipient, retry=True):
        email = recipient.get("Email")
        campaign_id = campaign.get("id")
        if not email:
            self._log_event_db(campaign_id, "Unknown", "SKIPPED", "Missing email address.")
            return "SKIPPED", "Missing email address.", None
        try:
            msg = MIMEMultipart()
            msg["From"] = account["sender_email"]
            msg["To"] = email
            msg["Subject"] = self._replace_placeholders(subject_template, recipient)
            body = self._replace_placeholders(html_template, recipient)
            msg.attach(MIMEText(body, "html" if campaign.get("is_html", True) else "plain"))
            if campaign.get("send_attachments", False):
                for filename in [f.strip() for f in str(recipient.get("AttachmentFile", "")).split(";") if f.strip()]:
                    with open(os.path.join(campaign.get("attachment_folder", ""), os.path.basename(filename)), "rb") as a:
                        part = MIMEBase("application", "octet-stream")
                        part.set_payload(a.read())
                    encoders.encode_base64(part)
                    part.add_header("Content-Disposition", f"attachment; filename= {os.path.basename(filename)}")
                    msg.attach(part)
            server.send_message(msg)
            self._log_event_db(campaign_id, email, "SENT", "Email dispatched successfully.")
            return "SENT", "Email sent successfully.", datetime.now().isoformat()
        except smtplib.SMTPServerDisconnected:
            if retry:
                self._broadcast({"action": "log", "payload": {"level": "warn", "message": f"SMTP disconnected while sending to {email}. Attempting to reconnect..."}})
                try:
                    if account.get("use_ssl", False):
                        server.connect(account.get("smtp_server"), int(account.get("smtp_port", 587)))
                    else:
                        server.connect(account.get("smtp_server"), int(account.get("smtp_port", 587)))
                        server.starttls()
                    server.login(account.get("sender_email"), account.get("sender_password"))
                    self._broadcast({"action": "log", "payload": {"level": "success", "message": "Reconnection successful."}})
                    return self._process_recipient(server, account, campaign, subject_template, html_template, recipient, False)
                except Exception as e:
                    self._broadcast({"action": "log", "payload": {"level": "error", "message": f"Reconnection failed: {str(e)}"}})
                    self._log_event_db(campaign_id, email, "ERROR", str(e))
                    return "ERROR", str(e), None
            self._log_event_db(campaign_id, email, "ERROR", "SMTP connection lost.")
            return "ERROR", "SMTP connection lost.", None
        except Exception as e:
            self._log_event_db(campaign_id, email, "ERROR", str(e))
            return "ERROR", str(e), None

    @contextmanager
    def _smtp_connect(self, account):
        server = None
        try:
            host = account.get("smtp_server")
            port = int(account.get("smtp_port", 587))
            if account.get("use_ssl", False):
                server = smtplib.SMTP_SSL(host, port)
            else:
                server = smtplib.SMTP(host, port)
                server.starttls()
            server.login(account.get("sender_email"), account.get("sender_password"))
            yield server
        finally:
            if server:
                try:
                    server.quit()
                except:
                    pass

    def _broadcast(self, message):
        self.ioloop.add_callback(self.websockets.broadcast, message)