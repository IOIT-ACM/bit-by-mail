import os
import json
import uuid
import shutil
import base64
import io
import pandas as pd
from datetime import datetime, timezone
from tornado.ioloop import IOLoop
from filelock import FileLock

class DatabaseService:
    def __init__(self, base_dir):
        self.base_dir = base_dir
        self.data_dir = os.path.join(self.base_dir, "data")
        self.databases_dir = os.path.join(self.data_dir, "databases")
        self.manifest_path = os.path.join(self.databases_dir, "manifest.json")
        self._initialize_storage()

    def _initialize_storage(self):
        os.makedirs(self.databases_dir, exist_ok=True)
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
            except (IOError, json.JSONDecodeError):
                return []

    def _write_manifest(self, dbs):
        with FileLock(self.manifest_path + ".lock"):
            with open(self.manifest_path, "w") as f:
                json.dump(dbs, f, indent=2)

    def get_db_path(self, db_id):
        return os.path.join(self.databases_dir, str(db_id))

    def _get_databases_with_details(self):
        dbs = self._read_manifest()
        for db in dbs:
            csv_path = os.path.join(self.get_db_path(db["id"]), "recipients.csv")
            count = 0
            if os.path.exists(csv_path):
                with FileLock(csv_path + ".lock"):
                    try:
                        df = pd.read_csv(csv_path)
                        count = len(df)
                    except Exception:
                        pass
            db["recipientCount"] = count
        dbs.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        return dbs

    async def get_databases(self):
        return await IOLoop.current().run_in_executor(None, self._get_databases_with_details)

    async def create_database(self, name, base64_content=None):
        dbs = self._read_manifest()
        new_id = str(uuid.uuid4())
        new_db = {
            "id": new_id,
            "name": name,
            "createdAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        }
        dbs.append(new_db)
        db_path = self.get_db_path(new_id)
        os.makedirs(db_path, exist_ok=True)

        csv_path = os.path.join(db_path, "recipients.csv")

        with FileLock(csv_path + ".lock"):
            if base64_content:
                content_str = base64.b64decode(base64_content).decode("utf-8")
                df = pd.read_csv(io.StringIO(content_str)).fillna("")
                if "Status" in df.columns:
                    df = df.drop(columns=["Status"])
                if "SentTimestamp" in df.columns:
                    df = df.drop(columns=["SentTimestamp"])
                df.to_csv(csv_path, index=False)
            else:
                with open(csv_path, "w", encoding="utf-8") as f:
                    f.write("Name,Email,AttachmentFile\n")

        await IOLoop.current().run_in_executor(None, self._write_manifest, dbs)
        all_dbs = await self.get_databases()
        new_db_detail = next((d for d in all_dbs if d["id"] == new_id), None)
        return new_db_detail, all_dbs

    async def update_database(self, db_id, updates):
        dbs = self._read_manifest()
        for db in dbs:
            if db["id"] == db_id:
                db.update(updates)
                break
        await IOLoop.current().run_in_executor(None, self._write_manifest, dbs)
        return await self.get_databases()

    async def delete_databases(self, db_ids):
        dbs = self._read_manifest()
        id_set = set(db_ids)
        kept = [d for d in dbs if d["id"] not in id_set]
        if len(kept) < len(dbs):
            for db_id in id_set:
                path = self.get_db_path(db_id)
                if os.path.isdir(path):
                    shutil.rmtree(path)
            await IOLoop.current().run_in_executor(None, self._write_manifest, kept)
        return await self.get_databases()

    def _read_data(self, db_id):
        path = os.path.join(self.get_db_path(db_id), "recipients.csv")
        if not os.path.exists(path):
            return []
        with FileLock(path + ".lock"):
            try:
                df = pd.read_csv(path).fillna("")
                return df.to_dict(orient="records")
            except Exception:
                return []

    async def get_database_data(self, db_id):
        return await IOLoop.current().run_in_executor(None, self._read_data, db_id)

    def _write_data(self, db_id, recipients_data):
        path = os.path.join(self.get_db_path(db_id), "recipients.csv")
        with FileLock(path + ".lock"):
            df = pd.DataFrame(recipients_data)
            if "Status" in df.columns:
                df = df.drop(columns=["Status"])
            if "SentTimestamp" in df.columns:
                df = df.drop(columns=["SentTimestamp"])
            df.to_csv(path, index=False)

    async def save_database_data(self, db_id, data):
        await IOLoop.current().run_in_executor(None, self._write_data, db_id, data)

    def _import_csv(self, db_id, base64_content, mode):
        path = os.path.join(self.get_db_path(db_id), "recipients.csv")
        content = base64.b64decode(base64_content).decode("utf-8")
        new_df = pd.read_csv(io.StringIO(content)).fillna("")

        with FileLock(path + ".lock"):
            if mode == 'merge' and os.path.exists(path):
                old_df = pd.read_csv(path).fillna("")
                df = pd.concat([old_df, new_df], ignore_index=True)
            else:
                df = new_df

            if "Status" in df.columns:
                df = df.drop(columns=["Status"])
            if "SentTimestamp" in df.columns:
                df = df.drop(columns=["SentTimestamp"])
            df.to_csv(path, index=False)

    async def import_csv_to_database(self, db_id, base64_content, mode):
        await IOLoop.current().run_in_executor(None, self._import_csv, db_id, base64_content, mode)

