import os
import pandas as pd
import base64
import io
from tornado.ioloop import IOLoop


class RecipientService:
    def __init__(self, base_dir):
        self.recipients_path = os.path.join(base_dir, "recipients.csv")

    def _read_recipients(self):
        if not os.path.exists(self.recipients_path):
            return []
        df = pd.read_csv(self.recipients_path).fillna("")
        return df.to_dict(orient="records")

    def _write_recipients_from_base64(self, base64_content):
        file_content = base64.b64decode(base64_content).decode("utf-8")
        string_io = io.StringIO(file_content)
        df = pd.read_csv(string_io)
        if "Status" not in df.columns:
            df["Status"] = "PENDING"
        df.to_csv(self.recipients_path, index=False)

    def write_recipients_from_json(self, recipients_data):
        df = pd.DataFrame(recipients_data)
        df.to_csv(self.recipients_path, index=False)

    async def get_recipients(self):
        return await IOLoop.current().run_in_executor(None, self._read_recipients)

    async def save_recipients_from_base64(self, base64_content):
        await IOLoop.current().run_in_executor(
            None, self._write_recipients_from_base64, base64_content
        )

    async def save_recipients_from_json(self, data):
        await IOLoop.current().run_in_executor(
            None, self.write_recipients_from_json, data
        )
