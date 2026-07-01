import json
import tornado.websocket
from urllib.parse import urlparse

class WebSocketHandler(tornado.websocket.WebSocketHandler):
    def open(self):
        self.application.settings["websocket_manager"].add(self)
        self.settings_service = self.application.settings["settings_service"]
        self.recipient_service = self.application.settings["recipient_service"]
        self.template_service = self.application.settings["template_service"]
        self.mailer_service = self.application.settings["mailer_service"]
        self.preflight_service = self.application.settings["preflight_service"]
        self.campaign_service = self.application.settings["campaign_service"]
        self.database_service = self.application.settings["database_service"]
        self.global_template_service = self.application.settings["global_template_service"]
        self.action_handlers = {
            "get_campaigns": self._handle_get_campaigns,
            "get_campaign_data": self._handle_get_campaign_data,
            "create_campaign": self._handle_create_campaign,
            "update_campaign": self._handle_update_campaign,
            "delete_campaign": self._handle_delete_campaign,
            "delete_campaigns": self._handle_delete_campaigns,
            "save_config": self._handle_save_config,
            "clear_config": self._handle_clear_config,
            "save_template": self._handle_save_template,
            "upload_recipients": self._handle_upload_recipients,
            "save_recipients": self._handle_save_recipients,
            "start_mailing": self._handle_start_mailing,
            "stop_mailing": self._handle_stop_mailing,
            "preflight_check": self._handle_preflight_check,
            "get_campaign_summary": self._handle_get_campaign_summary,
            "get_databases": self._handle_get_databases,
            "get_database_data": self._handle_get_database_data,
            "create_database": self._handle_create_database,
            "update_database": self._handle_update_database,
            "delete_databases": self._handle_delete_databases,
            "save_database_data": self._handle_save_database_data,
            "import_csv_to_database": self._handle_import_csv_to_database,
            "get_global_templates": self._handle_get_global_templates,
            "get_global_template_data": self._handle_get_global_template_data,
            "create_global_template": self._handle_create_global_template,
            "update_global_template": self._handle_update_global_template,
            "delete_global_templates": self._handle_delete_global_templates,
            "duplicate_global_template": self._handle_duplicate_global_template,
        }

    def on_close(self):
        self.application.settings["websocket_manager"].remove(self)

    async def on_message(self, message):
        try:
            data = json.loads(message)
            action = data.get("action")
            payload = data.get("payload")

            handler = self.action_handlers.get(action)
            if handler:
                await handler(payload)
            else:
                raise ValueError(f"Unknown action: {action}")

        except Exception as e:
            self.write_message(
                json.dumps(
                    {
                        "action": "log",
                        "payload": {"level": "error", "message": str(e)},
                    }
                )
            )

    async def _handle_get_campaigns(self, _):
        campaigns = await self.campaign_service.get_campaigns()
        config = await self.settings_service.get_config()
        is_password_set = bool(config.get("sender_password"))
        config.pop("sender_password", None)

        self.write_message(
            json.dumps(
                {
                    "action": "initial_data",
                    "payload": {
                        "campaigns": campaigns,
                        "config": config,
                        "is_password_set": is_password_set,
                    },
                }
            )
        )

    async def _handle_get_campaign_data(self, payload):
        campaign_id = payload.get("campaign_id")
        if not campaign_id:
            return

        recipients = await self.recipient_service.get_recipients(campaign_id)
        template = await self.template_service.get_template(campaign_id)
        self.write_message(
            json.dumps(
                {
                    "action": "campaign_data",
                    "payload": {
                        "campaign_id": campaign_id,
                        "recipients": recipients,
                        "emailBody": template,
                    },
                }
            )
        )

    async def _handle_create_campaign(self, payload):
        name = payload.get("name")
        db_id = payload.get("database_id")
        template_id = payload.get("template_id")
        if not name:
            return

        subject = None
        body = None
        recipients = None

        if template_id:
            t_data = await self.global_template_service.get_template_data(template_id)
            if t_data:
                subject = t_data.get("subject")
                body = t_data.get("body")

        if db_id:
            recipients = await self.database_service.get_database_data(db_id)

        new_campaign, all_campaigns = await self.campaign_service.create_campaign(name, subject, body, recipients, db_id)

        self.application.settings["websocket_manager"].broadcast(
            {"action": "campaigns_list", "payload": all_campaigns}
        )

        self.write_message(
            json.dumps(
                {
                    "action": "campaign_created",
                    "payload": new_campaign,
                }
            )
        )

    async def _handle_update_campaign(self, payload):
        campaign_id = payload.get("campaign_id")
        updates = payload.get("updates")
        if not campaign_id or not updates:
            return
        campaigns = await self.campaign_service.update_campaign(campaign_id, updates)
        self.application.settings["websocket_manager"].broadcast(
            {"action": "campaigns_list", "payload": campaigns}
        )

    async def _handle_delete_campaign(self, payload):
        campaign_id = payload.get("campaign_id")
        if not campaign_id:
            return
        campaigns = await self.campaign_service.delete_campaign(campaign_id)
        self.application.settings["websocket_manager"].broadcast(
            {"action": "campaigns_list", "payload": campaigns}
        )

    async def _handle_delete_campaigns(self, payload):
        campaign_ids = payload.get("campaign_ids")
        if not isinstance(campaign_ids, list):
            return
        campaigns = await self.campaign_service.delete_campaigns(campaign_ids)
        self.application.settings["websocket_manager"].broadcast(
            {"action": "campaigns_list", "payload": campaigns}
        )

    async def _handle_save_config(self, payload):
        await self.settings_service.save_config(payload)

    async def _handle_clear_config(self, _):
        await self.settings_service.clear_config()
        config = await self.settings_service.get_config()
        self.application.settings["websocket_manager"].broadcast(
            {"action": "config_cleared", "payload": config}
        )

    async def _handle_save_template(self, payload):
        campaign_id = payload.get("campaign_id")
        content = payload.get("content")
        if campaign_id is not None and content is not None:
            await self.template_service.save_template(campaign_id, content)

    async def _handle_upload_recipients(self, payload):
        campaign_id = payload.get("campaign_id")
        base64_content = payload.get("content")
        if not campaign_id or not base64_content:
            return
        await self.recipient_service.save_recipients_from_base64(
            campaign_id, base64_content
        )
        recipients = await self.recipient_service.get_recipients(campaign_id)
        self.write_message(
            json.dumps({"action": "recipients_updated", "payload": recipients})
        )

    async def _handle_save_recipients(self, payload):
        campaign_id = payload.get("campaign_id")
        recipients = payload.get("recipients")
        if campaign_id is not None and recipients is not None:
            await self.recipient_service.save_recipients_from_json(
                campaign_id, recipients
            )

    async def _handle_start_mailing(self, payload):
        campaign_id = payload.get("campaign_id")
        recipient_indices = payload.get("recipient_indices")
        if not campaign_id:
            return

        if self.mailer_service.is_running():
            self.write_message(
                json.dumps(
                    {
                        "action": "log",
                        "payload": {
                            "level": "warn",
                            "message": "Mailing process already running.",
                        },
                    }
                )
            )
        else:
            stored_config = await self.settings_service.get_config()
            client_config = payload.get("config", {})
            if not client_config.get("sender_password"):
                client_config["sender_password"] = stored_config.get("sender_password")

            campaigns = await self.campaign_service.get_campaigns()
            subject = next(
                (c["subject"] for c in campaigns if c["id"] == campaign_id), ""
            )

            await self.mailer_service.start_mailing(
                campaign_id, client_config, subject, recipient_indices
            )

    async def _handle_stop_mailing(self, _):
        self.mailer_service.stop()

    async def _handle_preflight_check(self, payload):
        campaign_id = payload.get("campaign_id")
        if not campaign_id:
            return

        stored_config = await self.settings_service.get_config()
        client_config = payload.get("config", {})
        if not client_config.get("sender_password"):
            client_config["sender_password"] = stored_config.get("sender_password")

        campaigns = await self.campaign_service.get_campaigns()
        subject = next((c["subject"] for c in campaigns if c["id"] == campaign_id), "")

        result = await self.preflight_service.run_checks(
            campaign_id, client_config, subject
        )
        self.write_message(
            json.dumps({"action": "preflight_result", "payload": result.to_dict()})
        )

    async def _handle_get_campaign_summary(self, payload):
        campaign_id = payload.get("campaign_id")
        recipient_indices = payload.get("recipient_indices")
        if not campaign_id:
            return

        stored_config = await self.settings_service.get_config()
        client_config = payload.get("config", {})
        if not client_config.get("sender_password"):
            client_config["sender_password"] = stored_config.get("sender_password")

        campaigns = await self.campaign_service.get_campaigns()
        subject = next((c["subject"] for c in campaigns if c["id"] == campaign_id), "")

        summary = await self.preflight_service.get_campaign_summary(
            campaign_id, client_config, subject, recipient_indices
        )
        self.write_message(
            json.dumps({"action": "campaign_summary", "payload": summary})
        )

    async def _handle_get_databases(self, _):
        dbs = await self.database_service.get_databases()
        self.write_message(json.dumps({"action": "databases_list", "payload": dbs}))

    async def _handle_get_database_data(self, payload):
        db_id = payload.get("database_id")
        if not db_id:
            return
        recipients = await self.database_service.get_database_data(db_id)
        self.write_message(json.dumps({
            "action": "database_data",
            "payload": {"database_id": db_id, "recipients": recipients}
        }))

    async def _handle_create_database(self, payload):
        name = payload.get("name")
        if not name:
            return
        new_db, all_dbs = await self.database_service.create_database(name)
        self.application.settings["websocket_manager"].broadcast(
            {"action": "databases_list", "payload": all_dbs}
        )
        self.write_message(json.dumps({"action": "database_created", "payload": new_db}))

    async def _handle_update_database(self, payload):
        db_id = payload.get("database_id")
        updates = payload.get("updates")
        if not db_id or not updates:
            return
        dbs = await self.database_service.update_database(db_id, updates)
        self.application.settings["websocket_manager"].broadcast(
            {"action": "databases_list", "payload": dbs}
        )

    async def _handle_delete_databases(self, payload):
        db_ids = payload.get("database_ids")
        if not isinstance(db_ids, list):
            return
        dbs = await self.database_service.delete_databases(db_ids)
        self.application.settings["websocket_manager"].broadcast(
            {"action": "databases_list", "payload": dbs}
        )

    async def _handle_save_database_data(self, payload):
        db_id = payload.get("database_id")
        recipients = payload.get("recipients")
        if db_id is not None and recipients is not None:
            await self.database_service.save_database_data(db_id, recipients)

    async def _handle_import_csv_to_database(self, payload):
        db_id = payload.get("database_id")
        content = payload.get("content")
        mode = payload.get("mode")
        if not db_id or not content or not mode:
            return
        await self.database_service.import_csv_to_database(db_id, content, mode)
        recipients = await self.database_service.get_database_data(db_id)
        self.write_message(json.dumps({
            "action": "database_recipients_updated",
            "payload": {"database_id": db_id, "recipients": recipients}
        }))

    async def _handle_get_global_templates(self, _):
        templates = await self.global_template_service.get_templates()
        self.write_message(json.dumps({"action": "global_templates_list", "payload": templates}))

    async def _handle_get_global_template_data(self, payload):
        template_id = payload.get("template_id")
        if not template_id:
            return
        data = await self.global_template_service.get_template_data(template_id)
        self.write_message(json.dumps({"action": "global_template_data", "payload": data}))

    async def _handle_create_global_template(self, payload):
        name = payload.get("name")
        category = payload.get("category", "")
        subject = payload.get("subject", "")
        body = payload.get("body", "")
        navigate = payload.get("navigate", True)
        if not name:
            return
        new_t, all_t = await self.global_template_service.create_template(name, category, subject, body)
        self.application.settings["websocket_manager"].broadcast(
            {"action": "global_templates_list", "payload": all_t}
        )
        self.write_message(json.dumps({
            "action": "global_template_created",
            "payload": {"template": new_t, "navigate": navigate}
        }))

    async def _handle_update_global_template(self, payload):
        template_id = payload.get("template_id")
        updates = payload.get("updates", {})
        body = payload.get("body")
        if not template_id:
            return
        all_t = await self.global_template_service.update_template(template_id, updates, body)
        self.application.settings["websocket_manager"].broadcast(
            {"action": "global_templates_list", "payload": all_t}
        )

    async def _handle_delete_global_templates(self, payload):
        template_ids = payload.get("template_ids")
        if not isinstance(template_ids, list):
            return
        all_t = await self.global_template_service.delete_templates(template_ids)
        self.application.settings["websocket_manager"].broadcast(
            {"action": "global_templates_list", "payload": all_t}
        )

    async def _handle_duplicate_global_template(self, payload):
        template_id = payload.get("template_id")
        if not template_id:
            return
        all_t = await self.global_template_service.duplicate_template(template_id)
        self.application.settings["websocket_manager"].broadcast(
            {"action": "global_templates_list", "payload": all_t}
        )

    def check_origin(self, origin):
        if self.application.settings.get("debug", False):
            return True
        parsed_origin = urlparse(origin)
        origin_host = parsed_origin.netloc.lower()
        request_host = self.request.host.lower()
        return origin_host == request_host

class WebSocketManager:
    def __init__(self):
        self.connections = set()

    def add(self, connection):
        self.connections.add(connection)

    def remove(self, connection):
        self.connections.discard(connection)

    def broadcast(self, message):
        for connection in self.connections:
            try:
                connection.write_message(json.dumps(message))
            except tornado.websocket.WebSocketClosedError:
                pass

