import os
import pandas as pd
import base64
import io
from tornado.ioloop import IOLoop


class RecipientService:
    def __init__(self, campaign_service):
        self.campaign_service = campaign_service

    def get_recipients_path(self, campaign_id):
        return os.path.join(
            self.campaign_service.get_campaign_path(campaign_id), "recipients.csv"
        )

    def _read_recipients(self, campaign_id):
        recipients_path = self.get_recipients_path(campaign_id)
        if not os.path.exists(recipients_path):
            return []
        df = pd.read_csv(recipients_path).fillna("")
        return df.to_dict(orient="records")

    def _write_recipients_from_base64(self, campaign_id, base64_content):
        recipients_path = self.get_recipients_path(campaign_id)
        file_content = base64.b64decode(base64_content).decode("utf-8")
        string_io = io.StringIO(file_content)
        df = pd.read_csv(string_io)
        if "Status" not in df.columns:
            df["Status"] = "PENDING"
        df.to_csv(recipients_path, index=False)

    def write_recipients_from_json(self, campaign_id, recipients_data):
        recipients_path = self.get_recipients_path(campaign_id)
        df = pd.DataFrame(recipients_data)
        df.to_csv(recipients_path, index=False)

    async def get_recipients(self, campaign_id):
        return await IOLoop.current().run_in_executor(
            None, self._read_recipients, campaign_id
        )

    async def save_recipients_from_base64(self, campaign_id, base64_content):
        await IOLoop.current().run_in_executor(
            None, self._write_recipients_from_base64, campaign_id, base64_content
        )

    async def save_recipients_from_json(self, campaign_id, data):
        await IOLoop.current().run_in_executor(
            None, self.write_recipients_from_json, campaign_id, data
        )
