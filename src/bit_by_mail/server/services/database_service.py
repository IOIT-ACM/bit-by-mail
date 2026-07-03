import uuid
import base64
import io
import pandas as pd
from datetime import datetime, timezone
import aiosqlite

class DatabaseService:
    def __init__(self, db_path):
        self.db_path = db_path

    async def get_databases(self):
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT * FROM databases ORDER BY created_at DESC") as cursor:
                rows = await cursor.fetchall()
            dbs = []
            for r in rows:
                d = dict(r)
                d["createdAt"] = d.pop("created_at")
                async with db.execute("SELECT COUNT(*) FROM database_recipients WHERE db_id = ?", (d["id"],)) as rc:
                    row = await rc.fetchone()
                    d["recipientCount"] = row[0] if row else 0
                dbs.append(d)
            return dbs

    async def create_database(self, name, base64_content=None):
        new_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("INSERT INTO databases (id, name, created_at) VALUES (?, ?, ?)", (new_id, name, created_at))
            if base64_content:
                content_str = base64.b64decode(base64_content).decode("utf-8")
                df = pd.read_csv(io.StringIO(content_str)).fillna("")
                for _, r in df.iterrows():
                    await db.execute("INSERT INTO database_recipients (db_id, name, email, attachment_file) VALUES (?, ?, ?, ?)", (new_id, r.get("Name", ""), r.get("Email", ""), r.get("AttachmentFile", "")))
            await db.commit()
        all_dbs = await self.get_databases()
        return next((d for d in all_dbs if d["id"] == new_id), None), all_dbs

    async def update_database(self, db_id, updates):
        async with aiosqlite.connect(self.db_path) as db:
            if "name" in updates:
                await db.execute("UPDATE databases SET name = ? WHERE id = ?", (updates["name"], db_id))
            await db.commit()
        return await self.get_databases()

    async def delete_databases(self, db_ids):
        async with aiosqlite.connect(self.db_path) as db:
            q = f"DELETE FROM databases WHERE id IN ({','.join('?' * len(db_ids))})"
            await db.execute(q, db_ids)
            qr = f"DELETE FROM database_recipients WHERE db_id IN ({','.join('?' * len(db_ids))})"
            await db.execute(qr, db_ids)
            await db.commit()
        return await self.get_databases()

    async def get_database_data(self, db_id):
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT name as Name, email as Email, attachment_file as AttachmentFile FROM database_recipients WHERE db_id = ?", (db_id,)) as cursor:
                rows = await cursor.fetchall()
                return [dict(r) for r in rows]

    async def save_database_data(self, db_id, data):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("DELETE FROM database_recipients WHERE db_id = ?", (db_id,))
            for r in data:
                await db.execute("INSERT INTO database_recipients (db_id, name, email, attachment_file) VALUES (?, ?, ?, ?)", (db_id, r.get("Name", ""), r.get("Email", ""), r.get("AttachmentFile", "")))
            await db.commit()

    async def import_csv_to_database(self, db_id, base64_content, mode):
        content_str = base64.b64decode(base64_content).decode("utf-8")
        df = pd.read_csv(io.StringIO(content_str)).fillna("")
        async with aiosqlite.connect(self.db_path) as db:
            if mode != 'merge':
                await db.execute("DELETE FROM database_recipients WHERE db_id = ?", (db_id,))
            for _, r in df.iterrows():
                await db.execute("INSERT INTO database_recipients (db_id, name, email, attachment_file) VALUES (?, ?, ?, ?)", (db_id, r.get("Name", ""), r.get("Email", ""), r.get("AttachmentFile", "")))
            await db.commit()
