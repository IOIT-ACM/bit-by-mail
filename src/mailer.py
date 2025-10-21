from typing import Optional, Union
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


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
            conn = smtplib.SMTP_SSL(self.server, self.port)
            conn.login(self.sender, self.password)
            self._conn = conn
        else:
            conn = smtplib.SMTP(self.server, self.port)
            conn.ehlo()
            conn.starttls()
            conn.login(self.sender, self.password)
            self._conn = conn
        return self

    def __exit__(self, _exc_type, _exc_value, _traceback) -> None:
        conn = self._conn
        if conn is not None:
            try:
                conn.quit()
            finally:
                self._conn = None

    def send_html(self, to_email: str, subject: str, html_body: str) -> None:
        conn = self._conn
        if conn is None:
            raise RuntimeError("SMTP connection is not established")
        msg = MIMEMultipart("alternative")
        msg["From"] = self.sender
        msg["To"] = to_email
        msg["Subject"] = subject
        part = MIMEText(html_body, "html")
        msg.attach(part)
        conn.send_message(msg)
