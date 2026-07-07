import uuid
from datetime import datetime, timezone
import aiosqlite

class GlobalTemplateService:
    def __init__(self, db_path):
        self.db_path = db_path

    async def get_templates(self):
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT id, name, category, subject, body, is_html, created_at FROM global_templates ORDER BY created_at DESC") as cursor:
                rows = await cursor.fetchall()
                return [{"id": r["id"], "name": r["name"], "category": r["category"], "subject": r["subject"], "body": r["body"], "is_html": bool(r["is_html"]), "createdAt": r["created_at"]} for r in rows]

    async def get_template_data(self, template_id):
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT * FROM global_templates WHERE id = ?", (template_id,)) as cursor:
                r = await cursor.fetchone()
                if r:
                    return {"id": r["id"], "name": r["name"], "category": r["category"], "subject": r["subject"], "is_html": bool(r["is_html"]), "createdAt": r["created_at"], "body": r["body"]}
        return None

    async def create_template(self, name, category="", subject="", body="", is_html=True):
        new_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("INSERT INTO global_templates (id, name, category, subject, body, is_html, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", (new_id, name, category, subject, body, is_html, created_at))
            await db.commit()
        t = await self.get_template_data(new_id)
        return t, await self.get_templates()

    async def update_template(self, template_id, updates, body=None):
        async with aiosqlite.connect(self.db_path) as db:
            for k, v in updates.items():
                if k in ["name", "subject", "category", "is_html"]:
                    await db.execute(f"UPDATE global_templates SET {k} = ? WHERE id = ?", (v, template_id))
            if body is not None:
                await db.execute("UPDATE global_templates SET body = ? WHERE id = ?", (body, template_id))
            await db.commit()
        return await self.get_templates()

    async def delete_templates(self, template_ids):
        async with aiosqlite.connect(self.db_path) as db:
            q = f"DELETE FROM global_templates WHERE id IN ({','.join('?' * len(template_ids))})"
            await db.execute(q, template_ids)
            await db.commit()
        return await self.get_templates()

    async def duplicate_template(self, template_id):
        src = await self.get_template_data(template_id)
        if src:
            await self.create_template(src["name"] + " (Copy)", src["category"], src["subject"], src["body"], src["is_html"])
        return await self.get_templates()
