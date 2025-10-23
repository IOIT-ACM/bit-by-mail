import os
from tornado.ioloop import IOLoop


class TemplateService:
    def __init__(self, base_dir):
        self.template_path = os.path.join(base_dir, "email.html")

    def _read_file(self, path):
        if not os.path.exists(path):
            return ""
        with open(path, "r", encoding="utf-8") as f:
            return f.read()

    def _write_file(self, path, content):
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

    async def get_template(self):
        return await IOLoop.current().run_in_executor(
            None, self._read_file, self.template_path
        )

    async def save_template(self, content):
        await IOLoop.current().run_in_executor(
            None, self._write_file, self.template_path, content
        )
