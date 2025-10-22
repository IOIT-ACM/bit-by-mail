from dataclasses import dataclass
import yaml
from typing import Any, Dict
import os
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Settings:
    smtp_server: str = ""
    smtp_port: int = 587
    use_ssl: bool = False
    sender_email: str = ""
    sender_password: str = ""
    recipients_csv: str = "recipients.csv"
    html_path: str = "email.html"
    subject_template: str = "Thank You, {name}!"
    attachment_folder: str = "attachments/"
    log_folder: str = "logs/"

    @classmethod
    def from_yaml(cls, path: str = "config.yaml"):
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        kwargs: Dict[str, Any] = {}

        if "use_ssl" in data:
            kwargs["use_ssl"] = bool(data["use_ssl"])
        if "recipients_csv" in data:
            kwargs["recipients_csv"] = data["recipients_csv"]
        if "html_path" in data:
            kwargs["html_path"] = data["html_path"]
        if "subject_template" in data:
            kwargs["subject_template"] = data["subject_template"]
        if "attachment_folder" in data:
            kwargs["attachment_folder"] = data["attachment_folder"]
        if "log_folder" in data:
            kwargs["log_folder"] = data["log_folder"]

        env_smtp_server = os.getenv("SMTP_SERVER")
        if env_smtp_server:
            kwargs["smtp_server"] = env_smtp_server

        env_smtp_port = os.getenv("SMTP_PORT")
        if env_smtp_port:
            kwargs["smtp_port"] = int(env_smtp_port)

        env_sender_email = os.getenv("SENDER_EMAIL")
        if env_sender_email:
            kwargs["sender_email"] = env_sender_email

        env_sender_password = os.getenv("SENDER_PASSWORD")
        if env_sender_password:
            kwargs["sender_password"] = env_sender_password

        return cls(**kwargs)


settings = Settings.from_yaml()
