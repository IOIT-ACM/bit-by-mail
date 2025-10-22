import os
import json
import pandas as pd
import base64
from tornado.ioloop import IOLoop


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
        }
        if not os.path.exists(self.settings_path):
            return defaults
        try:
            with open(self.settings_path, "r") as f:
                stored_settings = json.load(f)
            defaults.update(stored_settings)
            return defaults
        except (IOError, json.JSONDecodeError):
            return defaults

    def _write_config(self, data):
        settings_to_save = {
            "smtp_server": data.get("smtp_server"),
            "smtp_port": data.get("smtp_port"),
            "sender_email": data.get("sender_email"),
            "use_ssl": data.get("use_ssl"),
            "subject_template": data.get("subject_template"),
            "attachment_folder": data.get("attachment_folder"),
        }
        with open(self.settings_path, "w") as f:
            json.dump(settings_to_save, f, indent=2)

    def _read_recipients(self):
        if not os.path.exists(self.recipients_path):
            return []
        df = pd.read_csv(self.recipients_path).fillna("")
        return df.to_dict(orient="records")

    def _write_recipients_from_base64(self, base64_content):
        file_content = base64.b64decode(base64_content)
        with open(self.recipients_path, "wb") as f:
            f.write(file_content)
        df = pd.read_csv(self.recipients_path)
        if "Status" not in df.columns:
            df["Status"] = "PENDING"
        df.to_csv(self.recipients_path, index=False)

    def _write_recipients_from_json(self, recipients_data):
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
            None, self._write_recipients_from_json, data
        )

    async def get_template(self):
        return await IOLoop.current().run_in_executor(
            None, self._read_file, self.template_path
        )

    async def save_template(self, content):
        await IOLoop.current().run_in_executor(
            None, self._write_file, self.template_path, content
        )
