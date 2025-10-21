from typing import Optional, Union
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os


class Mailer:
    def __init__(
        self, server: str, port: int, sender: str, password: str, use_ssl: bool = False
    ):
        self.server = server
        self.port = port
        self.sender = sender
        self.password = password
        self.use_ssl = use_ssl
        self._conn: Optional[Union[smtplib.SMTP, smtplib.SMTP_SSL]] = None

    def __enter__(self) -> "Mailer":
        if self.use_ssl:
            self._conn = smtplib.SMTP_SSL(self.server, self.port)
        else:
            self._conn = smtplib.SMTP(self.server, self.port)
            self._conn.ehlo()
            self._conn.starttls()
        self._conn.login(self.sender, self.password)
        return self

    def __exit__(self, _exc_type, _exc_value, _traceback) -> None:
        if self._conn is not None:
            try:
                self._conn.quit()
            finally:
                self._conn = None

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        attachment_path: str,
    ) -> None:
        if self._conn is None:
            raise RuntimeError("SMTP connection is not established")

        msg = MIMEMultipart("mixed")
        msg["From"] = self.sender
        msg["To"] = to_email
        msg["Subject"] = subject

        msg_alternative = MIMEMultipart("alternative")
        msg_alternative.attach(MIMEText(html_body, "html"))
        msg.attach(msg_alternative)

        with open(attachment_path, "rb") as attachment:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(attachment.read())

        encoders.encode_base64(part)
        filename = os.path.basename(attachment_path)
        part.add_header(
            "Content-Disposition",
            f"attachment; filename= {filename}",
        )
        msg.attach(part)

        self._conn.send_message(msg)
