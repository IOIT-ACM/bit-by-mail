import os
import json
import uuid
import re
from datetime import datetime, timezone
from tornado.ioloop import IOLoop
from filelock import FileLock

class AssetService:
    def __init__(self, base_dir):
        self.base_dir = base_dir
        self.data_dir = os.path.join(self.base_dir, "data")
        self.manifest_path = os.path.join(self.data_dir, "assets.json")
        self._initialize_storage()

    def _initialize_storage(self):
        os.makedirs(self.data_dir, exist_ok=True)
        if not os.path.exists(self.manifest_path):
            with FileLock(self.manifest_path + ".lock"):
                if not os.path.exists(self.manifest_path):
                    with open(self.manifest_path, "w") as f:
                        json.dump([], f)

    def _read_manifest(self):
        with FileLock(self.manifest_path + ".lock"):
            try:
                with open(self.manifest_path, "r") as f:
                    return json.load(f)
            except Exception:
                return []

    def _write_manifest(self, assets):
        with FileLock(self.manifest_path + ".lock"):
            with open(self.manifest_path, "w") as f:
                json.dump(assets, f, indent=2)

    def _get_assets(self):
        assets = self._read_manifest()
        assets.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        return assets

    async def get_assets(self):
        return await IOLoop.current().run_in_executor(None, self._get_assets)

    async def create_asset(self, name, url, is_gdrive):
        if is_gdrive:
            match = re.search(r'(?:id=|/d/)([a-zA-Z0-9_-]+)', url)
            if match:
                file_id = match.group(1)
                url = f"https://drive.google.com/thumbnail?id={file_id}&sz=w800"

        assets = self._read_manifest()
        new_id = str(uuid.uuid4())
        new_asset = {
            "id": new_id,
            "name": name,
            "url": url,
            "createdAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        }
        assets.append(new_asset)
        await IOLoop.current().run_in_executor(None, self._write_manifest, assets)
        return await self.get_assets()

    async def delete_assets(self, asset_ids):
        assets = self._read_manifest()
        id_set = set(asset_ids)
        kept = [a for a in assets if a["id"] not in id_set]
        await IOLoop.current().run_in_executor(None, self._write_manifest, kept)
        return await self.get_assets()

    async def update_asset(self, asset_id, updates):
        assets = self._read_manifest()
        for a in assets:
            if a["id"] == asset_id:
                if "name" in updates:
                    a["name"] = updates["name"]
                if "url" in updates:
                    a["url"] = updates["url"]
                break
        await IOLoop.current().run_in_executor(None, self._write_manifest, assets)
        return await self.get_assets()

