import uuid
import aiosqlite

class SettingsService:
    def __init__(self, db_path):
        self.db_path = db_path

    async def get_config(self):
        config = {"accounts": []}
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT * FROM accounts") as cursor:
                rows = await cursor.fetchall()
                for r in rows:
                    acc = dict(r)
                    acc["sender_password"] = acc.get("sender_password") or ""
                    acc["use_ssl"] = bool(acc["use_ssl"])
                    acc["is_default"] = bool(acc["is_default"])
                    config["accounts"].append(acc)
        return config

    async def save_config(self, data):
        old_config = await self.get_config()
        old_accounts_map = {acc["id"]: acc for acc in old_config.get("accounts", [])}
        async with aiosqlite.connect(self.db_path) as db:
            if "accounts" in data:
                await db.execute("DELETE FROM accounts")
                for acc in data.get("accounts", []):
                    acc_id = acc.get("id", str(uuid.uuid4()))
                    name = acc.get("name", "")
                    smtp_server = acc.get("smtp_server", "")
                    smtp_port = acc.get("smtp_port", 587)
                    sender_email = acc.get("sender_email", "")
                    use_ssl = acc.get("use_ssl", False)
                    is_default = acc.get("is_default", False)
                    password = acc.get("sender_password")
                    if not password:
                        old_acc = old_accounts_map.get(acc_id)
                        password = old_acc.get("sender_password", "") if old_acc else ""
                    await db.execute("INSERT INTO accounts (id, name, smtp_server, smtp_port, sender_email, sender_password, use_ssl, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", (acc_id, name, smtp_server, smtp_port, sender_email, password, use_ssl, is_default))
            await db.commit()

    async def clear_config(self):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("DELETE FROM accounts")
            await db.commit()

    async def factory_reset(self, erase_accounts: bool):
        async with aiosqlite.connect(self.db_path) as db:
            tables = [
                "campaigns", "campaign_recipients", "databases",
                "database_recipients", "global_templates", "assets",
                "campaign_events"
            ]
            for table in tables:
                await db.execute(f"DELETE FROM {table}")

            if erase_accounts:
                await db.execute("DELETE FROM accounts")

            await db.commit()

