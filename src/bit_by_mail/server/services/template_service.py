import os
from tornado.ioloop import IOLoop


class TemplateService:
    def __init__(self, campaign_service):
        self.campaign_service = campaign_service

    def get_template_path(self, campaign_id):
        return os.path.join(
            self.campaign_service.get_campaign_path(campaign_id), "template.html"
        )

    def _read_file(self, path):
        if not os.path.exists(path):
            return ""
        with open(path, "r", encoding="utf-8") as f:
            return f.read()

    def _write_file(self, path, content):
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

    async def get_template(self, campaign_id):
        template_path = self.get_template_path(campaign_id)
        return await IOLoop.current().run_in_executor(
            None, self._read_file, template_path
        )

    async def save_template(self, campaign_id, content):
        template_path = self.get_template_path(campaign_id)
        await IOLoop.current().run_in_executor(
            None, self._write_file, template_path, content
        )
