from src.config import settings
from src.html_reader import load_html
from src.recipients import load_recipients
from src.mailer import Mailer
from src.utils import format_subject
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


def main():
    logging.info("Loading recipients from %s", settings.recipients_csv)
    recipients = load_recipients(settings.recipients_csv)
    logging.info("Loaded %d recipients", len(recipients))
    logging.info("Loading HTML content from %s", settings.html_path)
    html = load_html(settings.html_path)
    logging.info("Connecting to SMTP %s:%s", settings.smtp_server, settings.smtp_port)
    with Mailer(
        settings.smtp_server,
        settings.smtp_port,
        settings.sender_email,
        settings.sender_password,
        settings.use_ssl,
    ) as mailer:
        logging.info("Logged in as %s", settings.sender_email)
        for idx, r in enumerate(recipients):
            name = str(r.get("Name", ""))
            to_email = str(r.get("Email", ""))
            logging.info("Processing %d: %s <%s>", idx + 1, name, to_email)
            subject = format_subject(settings.subject_template, name)
            try:
                mailer.send_html(to_email, subject, html)
                logging.info("Sent to %s", to_email)
            except Exception as e:
                logging.exception("Failed to send to %s: %s", to_email, e)
    logging.info("All done")


if __name__ == "__main__":
    main()
