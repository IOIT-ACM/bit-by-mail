import os
import logging
from datetime import datetime
import pandas as pd

from .config import Settings
from .html_reader import load_html
from .mailer import Mailer
from .recipients import load_recipients_df, save_recipients_df


class MailerProcessor:
    def __init__(self, settings: Settings, log_writer):
        self.settings = settings
        self.log_writer = log_writer
        self.recipients_df = pd.DataFrame()
        self.html_template = ""

    def run(self):
        try:
            self._load_and_prepare_data()
            recipients_to_process = self._filter_and_validate_recipients()
            self._log_initial_summary(recipients_to_process)

            if not recipients_to_process:
                logging.info("No new recipients to process. Exiting.")
                return

            self._send_emails(recipients_to_process)

        except Exception as e:
            logging.exception("A critical error occurred: %s", e)
            self._log_status("SYSTEM", "N/A", "CRITICAL_ERROR", str(e))
        finally:
            if not self.recipients_df.empty:
                self._log_final_summary()

    def _load_and_prepare_data(self):
        logging.info("--- Starting Mailer ---")
        self.recipients_df = load_recipients_df(self.settings.recipients_csv)
        self.html_template = load_html(self.settings.html_path)

    def _filter_and_validate_recipients(self):
        recipients_to_process = []
        pending_recipients = self.recipients_df[
            self.recipients_df["Status"] != "SENT"
        ].copy()

        for index, row in pending_recipients.iterrows():
            name = str(row.get("Name", ""))
            email = str(row.get("Email", ""))
            cert_file = str(row.get("CertificateFile", ""))

            if not cert_file:
                self.recipients_df.loc[index, "Status"] = "SKIPPED"
                self._log_status(name, email, "SKIPPED", "CertificateFile is empty.")
                continue

            full_path = os.path.join(self.settings.attachment_folder, cert_file)
            if not os.path.exists(full_path):
                self.recipients_df.loc[index, "Status"] = "SKIPPED"
                self._log_status(
                    name, email, "SKIPPED", f"Attachment not found: {full_path}"
                )
                continue

            row_data = row.to_dict()
            row_data["attachment_path"] = full_path
            row_data["df_index"] = index
            recipients_to_process.append(row_data)

        if not self.recipients_df.empty:
            save_recipients_df(self.recipients_df, self.settings.recipients_csv)

        return recipients_to_process

    def _log_initial_summary(self, recipients_to_process):
        total_recipients = len(self.recipients_df)
        num_to_process = len(recipients_to_process)

        logging.info(f"Found {total_recipients} total recipients in the CSV.")
        logging.info(f"{num_to_process} emails are queued for sending.")

    def _send_emails(self, recipients_to_process):
        logging.info("--- Initializing SMTP Connection ---")
        with Mailer(
            self.settings.smtp_server,
            self.settings.smtp_port,
            self.settings.sender_email,
            self.settings.sender_password,
            self.settings.use_ssl,
        ) as mailer:
            for r in recipients_to_process:
                name = r["Name"]
                email = r["Email"]
                index = r["df_index"]

                try:
                    subject = self.settings.subject_template.format(**r)
                    body = self.html_template.format(**r)
                    mailer.send_email(email, subject, body, r["attachment_path"])
                    self.recipients_df.loc[index, "Status"] = "SENT"
                    self._log_status(name, email, "SENT")
                except KeyError as e:
                    error_msg = f"Template formatting error. Missing key: {e}"
                    self.recipients_df.loc[index, "Status"] = "ERROR"
                    self._log_status(name, email, "ERROR", error_msg)
                    logging.error(f"Skipping {email} due to {error_msg}")
                except Exception as e:
                    self.recipients_df.loc[index, "Status"] = "ERROR"
                    self._log_status(name, email, "ERROR", str(e))
                finally:
                    save_recipients_df(self.recipients_df, self.settings.recipients_csv)

    def _log_final_summary(self):
        logging.info("--- Process Summary ---")
        final_sent = (self.recipients_df["Status"] == "SENT").sum()
        final_error = (self.recipients_df["Status"] == "ERROR").sum()
        final_skipped = (self.recipients_df["Status"] == "SKIPPED").sum()
        final_pending = (self.recipients_df["Status"] == "PENDING").sum()

        logging.info(f"Total Sent: {final_sent}")
        logging.info(f"Total Errors: {final_error}")
        logging.info(f"Total Skipped: {final_skipped}")
        logging.info(f"Total Pending: {final_pending}")

    def _log_status(self, name, email, status, details=""):
        timestamp = datetime.now().isoformat()
        self.log_writer.writerow([timestamp, name, email, status, details])

        color_map = {
            "SENT": "\033[92m",
            "SKIPPED": "\033[93m",
            "ERROR": "\033[91m",
            "CRITICAL_ERROR": "\033[91m",
        }
        color = color_map.get(status, "\033[34m")
        reset_color = "\033[0m"
        details_text = f" | Details: {details}" if details else ""

        logging.info(
            f"{color}Status: {status} | To: {email}{details_text}{reset_color}"
        )
