import os
import json
import uuid
from tornado.ioloop import IOLoop
from filelock import FileLock
from . import crypto_service

class SettingsService:
    def __init__(self, base_dir):
        self.base_dir = base_dir
        self.data_dir = os.path.join(self.base_dir, "data")
        os.makedirs(self.data_dir, exist_ok=True)
        self.settings_path = os.path.join(self.data_dir, "settings.json")

    def _read_config(self):
        defaults = {"accounts": []}
        if not os.path.exists(self.settings_path):
            return defaults
        with FileLock(self.settings_path + ".lock"):
            try:
                with open(self.settings_path, "r") as f:
                    data = json.load(f)

                if "accounts" not in data:
                    migrated_account = {
                        "id": str(uuid.uuid4()),
                        "name": "Default Account",
                        "smtp_server": data.get("smtp_server", ""),
                        "smtp_port": data.get("smtp_port", 587),
                        "sender_email": data.get("sender_email", ""),
                        "use_ssl": data.get("use_ssl", False),
                        "is_default": True
                    }
                    if "sender_password_encrypted" in data:
                        migrated_account["sender_password_encrypted"] = data["sender_password_encrypted"]

                    data = {"accounts": [migrated_account] if migrated_account["smtp_server"] else []}

                for acc in data.get("accounts", []):
                    if "sender_password_encrypted" in acc:
                        acc["sender_password"] = crypto_service.decrypt(acc["sender_password_encrypted"])
                        del acc["sender_password_encrypted"]
                    else:
                        acc["sender_password"] = ""

                return data
            except (IOError, json.JSONDecodeError):
                return defaults

    def _write_config(self, data):
        old_config = self._read_config()
        old_accounts_map = {acc["id"]: acc for acc in old_config.get("accounts", [])}

        config_to_save = {"accounts": []}
        for acc in data.get("accounts", []):
            acc_copy = {
                "id": acc.get("id", str(uuid.uuid4())),
                "name": acc.get("name", ""),
                "smtp_server": acc.get("smtp_server", ""),
                "smtp_port": acc.get("smtp_port", 587),
                "sender_email": acc.get("sender_email", ""),
                "use_ssl": acc.get("use_ssl", False),
                "is_default": acc.get("is_default", False)
            }

            if acc.get("sender_password"):
                acc_copy["sender_password_encrypted"] = crypto_service.encrypt(acc["sender_password"])
            else:
                old_acc = old_accounts_map.get(acc_copy["id"])
                if old_acc and old_acc.get("sender_password"):
                    acc_copy["sender_password_encrypted"] = crypto_service.encrypt(old_acc["sender_password"])

            config_to_save["accounts"].append(acc_copy)

        with FileLock(self.settings_path + ".lock"):
            with open(self.settings_path, "w") as f:
                json.dump(config_to_save, f, indent=2)

    def _clear_config(self):
        with FileLock(self.settings_path + ".lock"):
            with open(self.settings_path, "w") as f:
                json.dump({"accounts": []}, f, indent=2)

    async def get_config(self):
        return await IOLoop.current().run_in_executor(None, self._read_config)

    async def save_config(self, data):
        await IOLoop.current().run_in_executor(None, self._write_config, data)

    async def clear_config(self):
        await IOLoop.current().run_in_executor(None, self._clear_config)

