import os
import json
from tornado.ioloop import IOLoop
from . import crypto_service

class SettingsService:
    def __init__(self, base_dir):
        self.base_dir = base_dir
        self.data_dir = os.path.join(self.base_dir, "data")
        os.makedirs(self.data_dir, exist_ok=True)
        self.settings_path = os.path.join(self.data_dir, "settings.json")

    def _read_config(self):
        defaults = {
            "smtp_server": "",
            "smtp_port": 587,
            "sender_email": "",
            "use_ssl": False,
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
            "smtp_server": data.get("smtp_server", current_config.get("smtp_server", "")),
            "smtp_port": data.get("smtp_port", current_config.get("smtp_port", 587)),
            "sender_email": data.get("sender_email", current_config.get("sender_email", "")),
            "use_ssl": data.get("use_ssl", current_config.get("use_ssl", False)),
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

    def _clear_config(self):
        with open(self.settings_path, "w") as f:
            json.dump({}, f, indent=2)

    async def get_config(self):
        return await IOLoop.current().run_in_executor(None, self._read_config)

    async def save_config(self, data):
        await IOLoop.current().run_in_executor(None, self._write_config, data)

    async def clear_config(self):
        await IOLoop.current().run_in_executor(None, self._clear_config)

