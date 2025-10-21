import logging
import os
import csv
from datetime import datetime
from src.config import settings
from src.html_reader import load_html
from src.recipients import load_recipients_df, save_recipients_df
from src.mailer import Mailer
from src.utils import format_subject


def setup_csv_logger(log_dir):
    os.makedirs(log_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    log_file_path = os.path.join(log_dir, f"{timestamp}.csv")

    log_file = open(log_file_path, "w", newline="", encoding="utf-8")
    log_writer = csv.writer(log_file)
    header = ["Timestamp", "Name", "Email", "Status", "Details"]
    log_writer.writerow(header)

    return log_file, log_writer


def log_status(writer, name, email, status, details=""):
    timestamp = datetime.now().isoformat()
    writer.writerow([timestamp, name, email, status, details])
    logging.info(f"Status: {status} | To: {email} | Details: {details}")


def main():
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s"
    )
    log_file, log_writer = setup_csv_logger(settings.log_folder)

    recipients_df = None
    try:
        logging.info("Loading recipients from %s", settings.recipients_csv)
        recipients_df = load_recipients_df(settings.recipients_csv)
        html = load_html(settings.html_path)

        recipients_to_process = []
        for index, row in recipients_df.iterrows():
            if row["Status"] == "SENT":
                continue

            name = str(row.get("Name", ""))
            email = str(row.get("Email", ""))
            cert_file = str(row.get("CertificateFile", ""))

            if not cert_file:
                recipients_df.loc[index, "Status"] = "SKIPPED"
                log_status(
                    log_writer, name, email, "SKIPPED", "CertificateFile is empty."
                )
                continue

            full_path = os.path.join(settings.attachment_folder, cert_file)
            if not os.path.exists(full_path):
                recipients_df.loc[index, "Status"] = "SKIPPED"
                log_status(
                    log_writer,
                    name,
                    email,
                    "SKIPPED",
                    f"Attachment not found: {full_path}",
                )
                continue

            row_data = row.to_dict()
            row_data["attachment_path"] = full_path
            row_data["df_index"] = index
            recipients_to_process.append(row_data)

        if not recipients_to_process:
            logging.info("No new recipients to process. Exiting.")
            return

        logging.info(
            f"Pre-flight checks passed. {len(recipients_to_process)} emails will be sent."
        )

        with Mailer(
            settings.smtp_server,
            settings.smtp_port,
            settings.sender_email,
            settings.sender_password,
            settings.use_ssl,
        ) as mailer:
            logging.info("Logged in as %s", settings.sender_email)
            for r in recipients_to_process:
                name = r["Name"]
                email = r["Email"]
                index = r["df_index"]

                subject = format_subject(settings.subject_template, name)
                try:
                    mailer.send_email(email, subject, html, r["attachment_path"])
                    recipients_df.loc[index, "Status"] = "SENT"
                    log_status(log_writer, name, email, "SENT")
                except Exception as e:
                    recipients_df.loc[index, "Status"] = "ERROR"
                    log_status(log_writer, name, email, "ERROR", str(e))

    except Exception as e:
        logging.exception("A critical error occurred: %s", e)
        log_status(log_writer, "SYSTEM", "N/A", "CRITICAL_ERROR", str(e))
    finally:
        if recipients_df is not None:
            logging.info(
                "Saving updated recipient status to %s", settings.recipients_csv
            )
            save_recipients_df(recipients_df, settings.recipients_csv)

        logging.info("Process finished. Closing log file.")
        log_file.close()


if __name__ == "__main__":
    main()
