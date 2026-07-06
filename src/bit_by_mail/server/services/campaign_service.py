import uuid
from datetime import datetime, timezone
import aiosqlite

class CampaignService:
    def __init__(self, db_path, base_dir):
        self.db_path = db_path
        self.base_dir = base_dir

    async def get_campaigns(self):
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT * FROM campaigns ORDER BY created_at DESC") as cursor:
                rows = await cursor.fetchall()
            campaigns = []
            for r in rows:
                c = dict(r)
                c["createdAt"] = c.pop("created_at")
                c["sourceDbId"] = c.pop("source_db_id")
                c["send_attachments"] = bool(c["send_attachments"])
                c["is_html"] = bool(c["is_html"])
                async with db.execute("SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = ? AND email != ''", (c["id"],)) as rc:
                    row = await rc.fetchone()
                    c["recipientCount"] = row[0] if row else 0
                c["latestReportUrl"] = f"/reports/{c['id']}/report.csv" if c["recipientCount"] > 0 else None
                campaigns.append(c)
            return campaigns

    async def create_campaign(self, name, subject=None, body=None, recipients=None, source_db_id=None, sender_account_id="", is_html=True):
        new_id = str(uuid.uuid4())
        subject = subject if subject is not None else f"Subject for {name}"
        created_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        template_content = body if body is not None else (f"<strong>Email for {name}</strong>\n<p>Hello {{{{Name}}}}</p>" if is_html else f"Email for {name}\nHello {{{{Name}}}}")
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("INSERT INTO campaigns (id, name, subject, attachment_folder, send_attachments, sender_account_id, is_html, delay, created_at, source_db_id, body) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", (new_id, name, subject, self.base_dir, False, sender_account_id, is_html, 0, created_at, source_db_id, template_content))
            if recipients:
                for r in recipients:
                    await db.execute("INSERT INTO campaign_recipients (campaign_id, name, email, attachment_file, status, sent_timestamp) VALUES (?, ?, ?, ?, ?, ?)", (new_id, r.get("Name", ""), r.get("Email", ""), r.get("AttachmentFile", ""), r.get("Status", "PENDING"), r.get("SentTimestamp", "")))
            await db.commit()
        campaigns = await self.get_campaigns()
        return next((c for c in campaigns if c["id"] == new_id), None), campaigns

    async def update_campaign(self, campaign_id, updates):
        async with aiosqlite.connect(self.db_path) as db:
            for k, v in updates.items():
                if k in ["name", "subject", "attachment_folder", "send_attachments", "sender_account_id", "is_html", "delay"]:
                    await db.execute(f"UPDATE campaigns SET {k} = ? WHERE id = ?", (v, campaign_id))
            await db.commit()
        return await self.get_campaigns()

    async def delete_campaign(self, campaign_id):
        return await self.delete_campaigns([campaign_id])

    async def delete_campaigns(self, campaign_ids):
        async with aiosqlite.connect(self.db_path) as db:
            query = f"DELETE FROM campaigns WHERE id IN ({','.join('?' * len(campaign_ids))})"
            await db.execute(query, campaign_ids)
            query_rec = f"DELETE FROM campaign_recipients WHERE campaign_id IN ({','.join('?' * len(campaign_ids))})"
            await db.execute(query_rec, campaign_ids)
            await db.commit()
        return await self.get_campaigns()
