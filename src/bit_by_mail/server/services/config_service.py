import os
import json
import pandas as pd
import base64
import io
from tornado.ioloop import IOLoop
from . import crypto_service


class ConfigService:
    def __init__(self, base_dir):
        self.base_dir = base_dir
        self.settings_path = os.path.join(base_dir, "settings.json")
        self.recipients_path = os.path.join(base_dir, "recipients.csv")
        self.template_path = os.path.join(base_dir, "email.html")

    def _read_config(self):
        defaults = {
            "smtp_server": "",
            "smtp_port": 587,
            "sender_email": "",
            "use_ssl": False,
            "subject_template": "Hello {Name}!",
            "attachment_folder": "attachments/",
            "sender_password": "",
        }
        if not os.path.exists(self.settings_path):
            return defaults
        try:
            with open(self.settings_path, "r") as f:
                stored_settings = json.load(f)

            if "sender_password_encrypted" in stored_settings:
                decrypted_password = crypto_service.decrypt(
                    stored_settings["sender_password_encrypted"]
                )
                stored_settings["sender_password"] = decrypted_password
                del stored_settings["sender_password_encrypted"]

            defaults.update(stored_settings)
            return defaults
        except (IOError, json.JSONDecodeError):
            return defaults

    def _write_config(self, data):
        current_config = self._read_config()
        config_to_update = {
            "smtp_server": data.get("smtp_server", current_config["smtp_server"]),
            "smtp_port": data.get("smtp_port", current_config["smtp_port"]),
            "sender_email": data.get("sender_email", current_config["sender_email"]),
            "use_ssl": data.get("use_ssl", current_config["use_ssl"]),
            "subject_template": data.get(
                "subject_template", current_config["subject_template"]
            ),
            "attachment_folder": data.get(
                "attachment_folder", current_config["attachment_folder"]
            ),
        }

        password_to_save = data.get("sender_password")
        if password_to_save:
            encrypted_password = crypto_service.encrypt(password_to_save)
            config_to_update["sender_password_encrypted"] = encrypted_password
        elif current_config.get("sender_password"):
            encrypted_password = crypto_service.encrypt(
                current_config["sender_password"]
            )
            config_to_update["sender_password_encrypted"] = encrypted_password

        with open(self.settings_path, "w") as f:
            json.dump(config_to_update, f, indent=2)

    def _read_recipients(self):
        if not os.path.exists(self.recipients_path):
            return []
        df = pd.read_csv(self.recipients_path).fillna("")
        return df.to_dict(orient="records")

    def _write_recipients_from_base64(self, base64_content):
        file_content = base64.b64decode(base64_content).decode("utf-8")
        string_io = io.StringIO(file_content)
        df = pd.read_csv(string_io)
        if "Status" not in df.columns:
            df["Status"] = "PENDING"
        df.to_csv(self.recipients_path, index=False)

    def write_recipients_from_json(self, recipients_data):
        df = pd.DataFrame(recipients_data)
        df.to_csv(self.recipients_path, index=False)

    def _read_file(self, path):
        if not os.path.exists(path):
            return ""
        with open(path, "r", encoding="utf-8") as f:
            return f.read()

    def _write_file(self, path, content):
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

    async def get_full_config(self):
        return await IOLoop.current().run_in_executor(None, self._read_config)

    async def save_full_config(self, data):
        await IOLoop.current().run_in_executor(None, self._write_config, data)

    async def get_recipients(self):
        return await IOLoop.current().run_in_executor(None, self._read_recipients)

    async def save_recipients_from_base64(self, base64_content):
        await IOLoop.current().run_in_executor(
            None, self._write_recipients_from_base64, base64_content
        )

    async def save_recipients_from_json(self, data):
        await IOLoop.current().run_in_executor(
            None, self.write_recipients_from_json, data
        )

    async def get_template(self):
        return await IOLoop.current().run_in_executor(
            None, self._read_file, self.template_path
        )

    async def save_template(self, content):
        await IOLoop.current().run_in_executor(
            None, self._write_file, self.template_path, content
        )
