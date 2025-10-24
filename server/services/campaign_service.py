import os
import json
import shutil
import uuid
from tornado.ioloop import IOLoop


class CampaignService:
    def __init__(self, base_dir):
        self.base_dir = base_dir
        self.data_dir = os.path.join(self.base_dir, "data")
        self.campaigns_dir = os.path.join(self.data_dir, "campaigns")
        self.manifest_path = os.path.join(self.data_dir, "campaigns.json")
        self._initialize_storage()

    def _initialize_storage(self):
        os.makedirs(self.campaigns_dir, exist_ok=True)

        if not os.path.exists(self.manifest_path):
            root_template_path = os.path.join(self.base_dir, "email.html")
            root_recipients_path = os.path.join(self.base_dir, "recipients.csv")

            default_campaign_id = str(uuid.uuid4())
            default_campaign = {
                "id": default_campaign_id,
                "name": "My First Campaign",
                "subject": "Hello {{Name}}!",
            }

            campaign_path = os.path.join(self.campaigns_dir, default_campaign_id)
            os.makedirs(campaign_path, exist_ok=True)

            if os.path.exists(root_template_path):
                shutil.copy(
                    root_template_path, os.path.join(campaign_path, "template.html")
                )
            else:
                with open(os.path.join(campaign_path, "template.html"), "w") as f:
                    f.write("<h1>Hello {{Name}}</h1>")

            if os.path.exists(root_recipients_path):
                shutil.copy(
                    root_recipients_path,
                    os.path.join(campaign_path, "recipients.csv"),
                )

            with open(self.manifest_path, "w") as f:
                json.dump([default_campaign], f, indent=2)

    def _read_manifest(self):
        try:
            with open(self.manifest_path, "r") as f:
                return json.load(f)
        except (IOError, json.JSONDecodeError):
            return []

    def _write_manifest(self, campaigns):
        with open(self.manifest_path, "w") as f:
            json.dump(campaigns, f, indent=2)

    def get_campaign_path(self, campaign_id):
        return os.path.join(self.campaigns_dir, str(campaign_id))

    async def get_campaigns(self):
        return await IOLoop.current().run_in_executor(None, self._read_manifest)

    async def create_campaign(self, name):
        campaigns = await self.get_campaigns()
        new_id = str(uuid.uuid4())
        new_campaign = {"id": new_id, "name": name, "subject": f"Subject for {name}"}
        campaigns.append(new_campaign)

        campaign_path = self.get_campaign_path(new_id)
        os.makedirs(campaign_path, exist_ok=True)

        with open(os.path.join(campaign_path, "template.html"), "w") as f:
            f.write(f"<h1>Email for {name}</h1>\n<p>Hello {{Name}}</p>")

        await IOLoop.current().run_in_executor(None, self._write_manifest, campaigns)
        return new_campaign, campaigns

    async def update_campaign(self, campaign_id, updates):
        campaigns = await self.get_campaigns()
        campaign_found = False
        for campaign in campaigns:
            if campaign["id"] == campaign_id:
                campaign.update(updates)
                campaign_found = True
                break
        if campaign_found:
            await IOLoop.current().run_in_executor(
                None, self._write_manifest, campaigns
            )
        return campaigns

    async def delete_campaign(self, campaign_id):
        return await self.delete_campaigns([campaign_id])

    async def delete_campaigns(self, campaign_ids):
        campaigns = await self.get_campaigns()
        campaign_ids_set = set(campaign_ids)
        campaigns_to_keep = [c for c in campaigns if c["id"] not in campaign_ids_set]

        if len(campaigns_to_keep) < len(campaigns):
            deleted_ids = campaign_ids_set.intersection(c["id"] for c in campaigns)
            for campaign_id in deleted_ids:
                campaign_path = self.get_campaign_path(campaign_id)
                if os.path.isdir(campaign_path):
                    shutil.rmtree(campaign_path)
            await IOLoop.current().run_in_executor(
                None, self._write_manifest, campaigns_to_keep
            )

        return campaigns_to_keep
