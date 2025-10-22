import csv
import logging
import os
import sys
from datetime import datetime

from src.config import settings
from src.preflight_checks import run_checks
from src.processor import MailerProcessor


def setup_csv_logger(log_dir):
    os.makedirs(log_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    log_file_path = os.path.join(log_dir, f"{timestamp}.csv")

    log_file = open(log_file_path, "w", newline="", encoding="utf-8")
    log_writer = csv.writer(log_file)
    header = ["Timestamp", "Name", "Email", "Status", "Details"]
    log_writer.writerow(header)

    return log_file, log_writer


def run_preflight_checks():
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


def main():
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s"
    )

    run_preflight_checks()

    log_file, log_writer = setup_csv_logger(settings.log_folder)

    try:
        processor = MailerProcessor(settings, log_writer)
        processor.run()
    finally:
        logging.info("Process finished. Closing log file.")
        log_file.close()


if __name__ == "__main__":
    main()
