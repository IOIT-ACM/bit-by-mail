import csv
import logging
import os
import sys
from datetime import datetime

from src.config import settings
from src.html_reader import load_html
from src.mailer import Mailer
from src.preflight_checks import run_checks
from src.recipients import load_recipients_df, save_recipients_df


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

    color_map = {
        "SENT": "\033[92m",
        "SKIPPED": "\033[93m",
        "ERROR": "\033[91m",
        "CRITICAL_ERROR": "\033[91m",
    }
    color = color_map.get(status, "\033[34m")
    reset_color = "\033[0m"
    details_text = f" | Details: {details}" if details else ""

    logging.info(f"{color}Status: {status} | To: {email}{details_text}{reset_color}")


def main():
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s"
    )

    logging.info("--- Running Pre-flight Checks ---")
    preflight_result = run_checks(settings)
    if not preflight_result.ok:
        logging.error(
            "Pre-flight checks failed. Please fix the following critical errors:"
        )
        for error in preflight_result.errors:
            logging.error(f" - {error}")
        logging.error("Aborting mailer.")
        sys.exit(1)

    if preflight_result.warnings:
        logging.warning("Pre-flight checks passed with warnings:")
        for warning in preflight_result.warnings:
            logging.warning(f" - {warning}")
    else:
        logging.info("All pre-flight checks passed successfully.")

    log_file, log_writer = setup_csv_logger(settings.log_folder)
    recipients_df = None
    try:
        logging.info("--- Starting Mailer ---")
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

        total_recipients = len(recipients_df)
        sent_count = len(recipients_df[recipients_df["Status"] == "SENT"])
        num_to_process = len(recipients_to_process)

        logging.info(f"Found {total_recipients} total recipients in the CSV.")
        logging.info(f"{sent_count} are already marked as SENT.")
        logging.info(f"{num_to_process} emails are queued for sending.")

        if not recipients_to_process:
            logging.info("No new recipients to process. Exiting.")
            return

        logging.info("--- Initializing SMTP Connection ---")
        with Mailer(
            settings.smtp_server,
            settings.smtp_port,
            settings.sender_email,
            settings.sender_password,
            settings.use_ssl,
        ) as mailer:
            for _, r in enumerate(recipients_to_process):
                name = r["Name"]
                email = r["Email"]
                index = r["df_index"]

                try:
                    subject = settings.subject_template.format(**r)
                    body = html.format(**r)
                    mailer.send_email(email, subject, body, r["attachment_path"])
                    recipients_df.loc[index, "Status"] = "SENT"
                    log_status(log_writer, name, email, "SENT")
                except KeyError as e:
                    error_msg = f"Template formatting error. Missing key: {e}"
                    recipients_df.loc[index, "Status"] = "ERROR"
                    log_status(log_writer, name, email, "ERROR", error_msg)
                    logging.error(f"Skipping {email} due to {error_msg}")
                except Exception as e:
                    recipients_df.loc[index, "Status"] = "ERROR"
                    log_status(log_writer, name, email, "ERROR", str(e))

    except Exception as e:
        logging.exception("A critical error occurred: %s", e)
        log_status(log_writer, "SYSTEM", "N/A", "CRITICAL_ERROR", str(e))
    finally:
        if recipients_df is not None:
            logging.info("--- Process Summary ---")
            final_sent = (recipients_df["Status"] == "SENT").sum()
            final_error = (recipients_df["Status"] == "ERROR").sum()
            final_skipped = (recipients_df["Status"] == "SKIPPED").sum()
            final_pending = (recipients_df["Status"] == "PENDING").sum()

            logging.info(f"Total Sent: {final_sent}")
            logging.info(f"Total Errors: {final_error}")
            logging.info(f"Total Skipped: {final_skipped}")
            logging.info(f"Total Pending: {final_pending}")

            logging.info(
                "Saving updated recipient status to %s", settings.recipients_csv
            )
            save_recipients_df(recipients_df, settings.recipients_csv)

        logging.info("Process finished. Closing log file.")
        log_file.close()


if __name__ == "__main__":
    main()
