import aiosqlite
import pandas as pd
import base64
import io

class RecipientService:
    def __init__(self, db_path):
        self.db_path = db_path

    async def get_recipients(self, campaign_id):
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT name as Name, email as Email, attachment_file as AttachmentFile, status as Status, sent_timestamp as SentTimestamp FROM campaign_recipients WHERE campaign_id = ?", (campaign_id,)) as cursor:
                rows = await cursor.fetchall()
                return [dict(r) for r in rows]

    async def save_recipients_from_base64(self, campaign_id, base64_content):
        file_content = base64.b64decode(base64_content).decode("utf-8")
        df = pd.read_csv(io.StringIO(file_content)).fillna("")
        if "Status" not in df.columns:
            df["Status"] = "PENDING"
        if "SentTimestamp" not in df.columns:
            df["SentTimestamp"] = ""
        if "AttachmentFile" not in df.columns:
            df["AttachmentFile"] = ""
        records = df.to_dict(orient="records")
        await self.save_recipients_from_json(campaign_id, records)

    async def save_recipients_from_json(self, campaign_id, data):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("DELETE FROM campaign_recipients WHERE campaign_id = ?", (campaign_id,))
            for r in data:
                await db.execute("INSERT INTO campaign_recipients (campaign_id, name, email, attachment_file, status, sent_timestamp) VALUES (?, ?, ?, ?, ?, ?)", (campaign_id, r.get("Name", ""), r.get("Email", ""), r.get("AttachmentFile", ""), r.get("Status", "PENDING"), r.get("SentTimestamp", "")))
            await db.commit()
