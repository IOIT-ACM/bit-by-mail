import os
import json
import uuid
import shutil
from datetime import datetime, timezone
from tornado.ioloop import IOLoop

class GlobalTemplateService:
    def __init__(self, base_dir):
        self.base_dir = base_dir
        self.data_dir = os.path.join(self.base_dir, "data")
        self.templates_dir = os.path.join(self.data_dir, "templates")
        self.manifest_path = os.path.join(self.templates_dir, "manifest.json")
        self._initialize_storage()

    def _initialize_storage(self):
        os.makedirs(self.templates_dir, exist_ok=True)
        if not os.path.exists(self.manifest_path):
            with open(self.manifest_path, "w") as f:
                json.dump([], f)

    def _read_manifest(self):
        try:
            with open(self.manifest_path, "r") as f:
                return json.load(f)
        except (IOError, json.JSONDecodeError):
            return []

    def _write_manifest(self, templates):
        with open(self.manifest_path, "w") as f:
            json.dump(templates, f, indent=2)

    def get_template_path(self, template_id):
        return os.path.join(self.templates_dir, f"{template_id}.html")

    def _get_templates(self):
        templates = self._read_manifest()
        for t in templates:
            if "is_html" not in t:
                t["is_html"] = True
        templates.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        return templates

    async def get_templates(self):
        return await IOLoop.current().run_in_executor(None, self._get_templates)

    def _get_template_data(self, template_id):
        templates = self._read_manifest()
        template = next((t for t in templates if t["id"] == template_id), None)
        if not template:
            return None

        body = ""
        path = self.get_template_path(template_id)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                body = f.read()

        return {
            "id": template["id"],
            "name": template["name"],
            "subject": template.get("subject", ""),
            "category": template.get("category", ""),
            "is_html": template.get("is_html", True),
            "createdAt": template["createdAt"],
            "body": body
        }

    async def get_template_data(self, template_id):
        return await IOLoop.current().run_in_executor(None, self._get_template_data, template_id)

    async def create_template(self, name, category="", subject="", body="", is_html=True):
        templates = self._read_manifest()
        new_id = str(uuid.uuid4())
        new_template = {
            "id": new_id,
            "name": name,
            "category": category,
            "subject": subject,
            "is_html": is_html,
            "createdAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        }
        templates.append(new_template)

        path = self.get_template_path(new_id)
        with open(path, "w", encoding="utf-8") as f:
            f.write(body)

        await IOLoop.current().run_in_executor(None, self._write_manifest, templates)
        return new_template, await self.get_templates()

    async def update_template(self, template_id, updates, body=None):
        templates = self._read_manifest()
        for t in templates:
            if t["id"] == template_id:
                if "name" in updates:
                    t["name"] = updates["name"]
                if "subject" in updates:
                    t["subject"] = updates["subject"]
                if "category" in updates:
                    t["category"] = updates["category"]
                if "is_html" in updates:
                    t["is_html"] = updates["is_html"]
                break

        if body is not None:
            path = self.get_template_path(template_id)
            with open(path, "w", encoding="utf-8") as f:
                f.write(body)

        await IOLoop.current().run_in_executor(None, self._write_manifest, templates)
        return await self.get_templates()

    async def delete_templates(self, template_ids):
        templates = self._read_manifest()
        id_set = set(template_ids)
        kept = [t for t in templates if t["id"] not in id_set]

        if len(kept) < len(templates):
            for t_id in id_set:
                path = self.get_template_path(t_id)
                if os.path.exists(path):
                    os.remove(path)
            await IOLoop.current().run_in_executor(None, self._write_manifest, kept)
        return await self.get_templates()

    async def duplicate_template(self, template_id):
        templates = self._read_manifest()
        source = next((t for t in templates if t["id"] == template_id), None)
        if not source:
            return await self.get_templates()

        new_id = str(uuid.uuid4())
        new_template = {
            "id": new_id,
            "name": source["name"] + " (Copy)",
            "category": source.get("category", ""),
            "subject": source.get("subject", ""),
            "is_html": source.get("is_html", True),
            "createdAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        }
        templates.append(new_template)

        src_path = self.get_template_path(template_id)
        dst_path = self.get_template_path(new_id)
        if os.path.exists(src_path):
            shutil.copy(src_path, dst_path)
        else:
            with open(dst_path, "w", encoding="utf-8") as f:
                f.write("")

        await IOLoop.current().run_in_executor(None, self._write_manifest, templates)
        return await self.get_templates()

