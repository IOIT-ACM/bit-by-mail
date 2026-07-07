import json
import os
import importlib.resources
import aiosqlite

class SeederService:
    def __init__(self, db_path, global_template_service, asset_service):
        self.db_path = db_path
        self.global_template_service = global_template_service
        self.asset_service = asset_service

    async def seed(self):
        try:
            seeds_path = str(importlib.resources.files("bit_by_mail").joinpath("server/seeds/seeds.json"))
        except AttributeError:
            with importlib.resources.path("bit_by_mail", "") as p:
                seeds_path = os.path.join(p, "server/seeds", "seeds.json")

        if not os.path.exists(seeds_path):
            return

        with open(seeds_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)

        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("SELECT COUNT(*) FROM global_templates")
            template_count = (await cursor.fetchone())[0]

            cursor = await db.execute("SELECT COUNT(*) FROM assets")
            asset_count = (await cursor.fetchone())[0]

        if template_count == 0:
            for t in manifest.get("templates", []):
                try:
                    t_path = str(importlib.resources.files("bit_by_mail").joinpath(f"server/seeds/{t['file']}"))
                except AttributeError:
                    with importlib.resources.path("bit_by_mail", "") as p:
                        t_path = os.path.join(p, "server/seeds", t["file"])

                if os.path.exists(t_path):
                    with open(t_path, "r", encoding="utf-8") as f:
                        body = f.read()
                    await self.global_template_service.create_template(
                        name=t["name"],
                        category=t.get("category", ""),
                        subject=t.get("subject", ""),
                        body=body,
                        is_html=True
                    )

        if asset_count == 0:
            for a in manifest.get("assets", []):
                await self.asset_service.create_asset(
                    name=a["name"],
                    url=a["url"],
                    is_gdrive=a.get("is_gdrive", False)
                )

