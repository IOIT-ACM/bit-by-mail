import json
import os
import logging
import smtplib
import tornado.websocket
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

class WebSocketHandler(tornado.websocket.WebSocketHandler):
    def open(self):
        logger.info("New WebSocket connection opened.")
        self.application.settings["websocket_manager"].add(self)
        self.settings_service = self.application.settings["settings_service"]
        self.recipient_service = self.application.settings["recipient_service"]
        self.template_service = self.application.settings["template_service"]
        self.mailer_service = self.application.settings["mailer_service"]
        self.preflight_service = self.application.settings["preflight_service"]
        self.campaign_service = self.application.settings["campaign_service"]
        self.database_service = self.application.settings["database_service"]
        self.global_template_service = self.application.settings["global_template_service"]
        self.asset_service = self.application.settings["asset_service"]
        self.analytics_service = self.application.settings["analytics_service"]
        self.action_handlers = {
            "get_campaigns": self._handle_get_campaigns,
            "get_campaign_data": self._handle_get_campaign_data,
            "create_campaign": self._handle_create_campaign,
            "update_campaign": self._handle_update_campaign,
            "delete_campaign": self._handle_delete_campaign,
            "delete_campaigns": self._handle_delete_campaigns,
            "save_config": self._handle_save_config,
            "clear_config": self._handle_clear_config,
            "test_smtp_connection": self._handle_test_smtp_connection,
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
            "get_assets": self._handle_get_assets,
            "create_asset": self._handle_create_asset,
            "delete_assets": self._handle_delete_assets,
            "update_asset": self._handle_update_asset,
            "get_campaign_analytics": self._handle_get_campaign_analytics,
            "get_campaign_events": self._handle_get_campaign_events,
            "factory_reset": self._handle_factory_reset,
        }
        self.current_req_id = None

    def on_close(self):
        logger.info("WebSocket connection closed.")
        self.application.settings["websocket_manager"].remove(self)

    async def _get_campaign_name(self, campaign_id):
        campaigns = await self.campaign_service.get_campaigns()
        return next((c["name"] for c in campaigns if c["id"] == campaign_id), str(campaign_id))

    async def _get_db_name(self, db_id):
        dbs = await self.database_service.get_databases()
        return next((d["name"] for d in dbs if d["id"] == db_id), str(db_id))

    async def _get_template_name(self, template_id):
        t = await self.global_template_service.get_template_data(template_id)
        return t["name"] if t else str(template_id)

    async def _get_asset_name(self, asset_id):
        assets = await self.asset_service.get_assets()
        return next((a["name"] for a in assets if a["id"] == asset_id), str(asset_id))

    async def safe_write_message(self, message_str):
        if self.ws_connection is None or self.ws_connection.is_closing():
            return
        try:
            data = json.loads(message_str)
            if hasattr(self, 'current_req_id') and self.current_req_id:
                data['req_id'] = self.current_req_id
                message_str = json.dumps(data)
            await self.write_message(message_str)
        except tornado.websocket.WebSocketClosedError:
            pass
        except Exception as e:
            logger.error(f"Error writing WebSocket message: {str(e)}", exc_info=True)

    async def on_message(self, message):
        try:
            data = json.loads(message)
            action = data.get("action")
            payload = data.get("payload")
            self.current_req_id = data.get("req_id")

            handler = self.action_handlers.get(action)
            if handler:
                await handler(payload)
            else:
                raise ValueError(f"Unknown action: {action}")

        except Exception as e:
            req_id = getattr(self, 'current_req_id', None)
            try:
                action = json.loads(message).get("action", "unknown")
            except:
                action = "unknown"

            logger.error(f"Error handling WebSocket action '{action}': {str(e)}", exc_info=True)

            error_msg = {
                "action": "action_error",
                "payload": {"original_action": action, "message": str(e)}
            }
            if req_id:
                error_msg["req_id"] = req_id

            await self.safe_write_message(json.dumps(error_msg))
            await self.safe_write_message(json.dumps({
                "action": "log",
                "payload": {"level": "error", "message": str(e)}
            }))
        finally:
            self.current_req_id = None

    async def _handle_get_campaigns(self, _):
        logger.info("Fetched all campaigns.")
        campaigns = await self.campaign_service.get_campaigns()
        config = await self.settings_service.get_config()
        config["server_pwd"] = os.getcwd()

        for acc in config.get("accounts", []):
            acc["has_password"] = bool(acc.get("sender_password"))

        await self.safe_write_message(
            json.dumps(
                {
                    "action": "initial_data",
                    "payload": {
                        "campaigns": campaigns,
                        "config": config,
                    },
                }
            )
        )

    async def _handle_get_campaign_data(self, payload):
        campaign_id = payload.get("campaign_id")
        if not campaign_id:
            return

        await self.campaign_service.touch(campaign_id)
        name = await self._get_campaign_name(campaign_id)
        logger.info(f"Opened campaign data for: {name}")
        recipients = await self.recipient_service.get_recipients(campaign_id)
        template = await self.template_service.get_template(campaign_id)
        await self.safe_write_message(
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
        sender_account_id = payload.get("sender_account_id", "")
        is_html = payload.get("is_html", True)
        if not name:
            return

        logger.info(f"Created new campaign: {name}")
        subject = None
        body = None
        recipients = None

        if template_id:
            t_data = await self.global_template_service.get_template_data(template_id)
            if t_data:
                subject = t_data.get("subject")
                body = t_data.get("body")
                is_html = t_data.get("is_html", True)

        if db_id:
            recipients = await self.database_service.get_database_data(db_id)

        new_campaign, all_campaigns = await self.campaign_service.create_campaign(name, subject, body, recipients, db_id, sender_account_id, is_html)

        self.application.settings["websocket_manager"].broadcast(
            {"action": "campaigns_list", "payload": all_campaigns}
        )

        await self.safe_write_message(
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

        name = await self._get_campaign_name(campaign_id)
        logger.info(f"Deleted campaign: {name}")
        campaigns = await self.campaign_service.delete_campaign(campaign_id)
        self.application.settings["websocket_manager"].broadcast(
            {"action": "campaigns_list", "payload": campaigns}
        )

    async def _handle_delete_campaigns(self, payload):
        campaign_ids = payload.get("campaign_ids")
        if not isinstance(campaign_ids, list):
            return

        campaigns = await self.campaign_service.get_campaigns()
        names = [c["name"] for c in campaigns if c["id"] in campaign_ids]
        logger.info(f"Deleted multiple campaigns: {', '.join(names)}")
        updated_campaigns = await self.campaign_service.delete_campaigns(campaign_ids)
        self.application.settings["websocket_manager"].broadcast(
            {"action": "campaigns_list", "payload": updated_campaigns}
        )

    async def _handle_save_config(self, payload):
        logger.info("Saved configuration and sender accounts")
        await self.settings_service.save_config(payload)
        config = await self.settings_service.get_config()
        config["server_pwd"] = os.getcwd()
        for acc in config.get("accounts", []):
            acc["has_password"] = bool(acc.get("sender_password"))
        self.application.settings["websocket_manager"].broadcast(
            {"action": "config_updated", "payload": config}
        )

    async def _handle_clear_config(self, _):
        logger.info("Cleared configuration")
        await self.settings_service.clear_config()
        config = await self.settings_service.get_config()
        config["server_pwd"] = os.getcwd()
        self.application.settings["websocket_manager"].broadcast(
            {"action": "config_cleared", "payload": config}
        )

    async def _handle_test_smtp_connection(self, payload):
        try:
            host = payload.get("smtp_server")
            port = int(payload.get("smtp_port", 587))
            use_ssl = payload.get("use_ssl", False)
            sender_email = payload.get("sender_email")
            password = payload.get("sender_password")

            if use_ssl:
                server = smtplib.SMTP_SSL(host, port, timeout=10)
            else:
                server = smtplib.SMTP(host, port, timeout=10)
                server.starttls()
            server.login(sender_email, password)
            server.quit()
            await self.safe_write_message(json.dumps({
                "action": "test_smtp_connection_result",
                "payload": {"success": True, "message": "Connection successful!"}
            }))
        except Exception as e:
            await self.safe_write_message(json.dumps({
                "action": "test_smtp_connection_result",
                "payload": {"success": False, "message": str(e)}
            }))

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

        name = await self._get_campaign_name(campaign_id)
        logger.info(f"Uploaded recipients via base64 for campaign: {name}")
        await self.recipient_service.save_recipients_from_base64(
            campaign_id, base64_content
        )
        recipients = await self.recipient_service.get_recipients(campaign_id)
        await self.safe_write_message(
            json.dumps({"action": "recipients_updated", "payload": recipients})
        )

    async def _handle_save_recipients(self, payload):
        campaign_id = payload.get("campaign_id")
        recipients = payload.get("recipients")
        if campaign_id is not None and recipients is not None:
            name = await self._get_campaign_name(campaign_id)
            logger.info(f"Saved recipients via JSON for campaign: {name}")
            await self.recipient_service.save_recipients_from_json(
                campaign_id, recipients
            )

    async def _handle_start_mailing(self, payload):
        campaign_id = payload.get("campaign_id")
        recipient_indices = payload.get("recipient_indices")
        if not campaign_id:
            return

        if self.mailer_service.is_running():
            logger.warning("Attempted to start mailing but a mailing process is already running")
            await self.safe_write_message(
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
            name = await self._get_campaign_name(campaign_id)
            logger.info(f"Started mailing for campaign: {name}")
            stored_config = await self.settings_service.get_config()
            campaigns = await self.campaign_service.get_campaigns()
            subject = next(
                (c["subject"] for c in campaigns if c["id"] == campaign_id), ""
            )

            await self.mailer_service.start_mailing(
                campaign_id, stored_config, subject, recipient_indices
            )

    async def _handle_stop_mailing(self, _):
        logger.info("Requested to stop the mailing process")
        self.mailer_service.stop()

    async def _handle_preflight_check(self, payload):
        campaign_id = payload.get("campaign_id")
        if not campaign_id:
            return

        name = await self._get_campaign_name(campaign_id)
        logger.info(f"Ran preflight check for campaign: {name}")
        stored_config = await self.settings_service.get_config()
        campaigns = await self.campaign_service.get_campaigns()
        subject = next((c["subject"] for c in campaigns if c["id"] == campaign_id), "")

        result = await self.preflight_service.run_checks(
            campaign_id, stored_config, subject
        )
        await self.safe_write_message(
            json.dumps({"action": "preflight_result", "payload": result.to_dict()})
        )

    async def _handle_get_campaign_summary(self, payload):
        campaign_id = payload.get("campaign_id")
        recipient_indices = payload.get("recipient_indices")
        if not campaign_id:
            return

        name = await self._get_campaign_name(campaign_id)
        logger.info(f"Fetched summary for campaign: {name}")
        stored_config = await self.settings_service.get_config()
        campaigns = await self.campaign_service.get_campaigns()
        subject = next((c["subject"] for c in campaigns if c["id"] == campaign_id), "")

        summary = await self.preflight_service.get_campaign_summary(
            campaign_id, stored_config, subject, recipient_indices
        )
        await self.safe_write_message(
            json.dumps({"action": "campaign_summary", "payload": summary})
        )

    async def _handle_get_databases(self, _):
        logger.info("Fetched all databases")
        dbs = await self.database_service.get_databases()
        await self.safe_write_message(json.dumps({"action": "databases_list", "payload": dbs}))

    async def _handle_get_database_data(self, payload):
        db_id = payload.get("database_id")
        if not db_id:
            return

        await self.database_service.touch(db_id)
        name = await self._get_db_name(db_id)
        logger.info(f"Opened database data for: {name}")
        recipients = await self.database_service.get_database_data(db_id)
        await self.safe_write_message(json.dumps({
            "action": "database_data",
            "payload": {"database_id": db_id, "recipients": recipients}
        }))

    async def _handle_create_database(self, payload):
        name = payload.get("name")
        content = payload.get("content")
        navigate = payload.get("navigate", True)
        if not name:
            return

        logger.info(f"Created database: {name}")
        new_db, all_dbs = await self.database_service.create_database(name, content)
        self.application.settings["websocket_manager"].broadcast(
            {"action": "databases_list", "payload": all_dbs}
        )
        await self.safe_write_message(json.dumps({"action": "database_created", "payload": {"id": new_db["id"], "navigate": navigate}}))

    async def _handle_update_database(self, payload):
        db_id = payload.get("database_id")
        updates = payload.get("updates")
        if not db_id or not updates:
            return

        name = await self._get_db_name(db_id)
        logger.info(f"Updated database: {name}")
        dbs = await self.database_service.update_database(db_id, updates)
        self.application.settings["websocket_manager"].broadcast(
            {"action": "databases_list", "payload": dbs}
        )

    async def _handle_delete_databases(self, payload):
        db_ids = payload.get("database_ids")
        if not isinstance(db_ids, list):
            return

        dbs = await self.database_service.get_databases()
        names = [d["name"] for d in dbs if d["id"] in db_ids]
        logger.info(f"Deleted multiple databases: {', '.join(names)}")
        updated_dbs = await self.database_service.delete_databases(db_ids)
        self.application.settings["websocket_manager"].broadcast(
            {"action": "databases_list", "payload": updated_dbs}
        )

    async def _handle_save_database_data(self, payload):
        db_id = payload.get("database_id")
        recipients = payload.get("recipients")
        if db_id is not None and recipients is not None:
            name = await self._get_db_name(db_id)
            logger.info(f"Saved recipients for database: {name}")
            await self.database_service.save_database_data(db_id, recipients)

    async def _handle_import_csv_to_database(self, payload):
        db_id = payload.get("database_id")
        content = payload.get("content")
        mode = payload.get("mode")
        if not db_id or not content or not mode:
            return

        name = await self._get_db_name(db_id)
        logger.info(f"Imported CSV to database: {name} in '{mode}' mode")
        await self.database_service.import_csv_to_database(db_id, content, mode)
        recipients = await self.database_service.get_database_data(db_id)
        await self.safe_write_message(json.dumps({
            "action": "database_recipients_updated",
            "payload": {"database_id": db_id, "recipients": recipients}
        }))

    async def _handle_get_global_templates(self, _):
        logger.info("Fetched all global templates")
        templates = await self.global_template_service.get_templates()
        await self.safe_write_message(json.dumps({"action": "global_templates_list", "payload": templates}))

    async def _handle_get_global_template_data(self, payload):
        template_id = payload.get("template_id")
        if not template_id:
            return

        await self.global_template_service.touch(template_id)
        name = await self._get_template_name(template_id)
        logger.info(f"Opened global template data for: {name}")
        data = await self.global_template_service.get_template_data(template_id)
        await self.safe_write_message(json.dumps({"action": "global_template_data", "payload": data}))

    async def _handle_create_global_template(self, payload):
        name = payload.get("name")
        category = payload.get("category", "")
        subject = payload.get("subject", "")
        body = payload.get("body", "")
        is_html = payload.get("is_html", True)
        navigate = payload.get("navigate", True)
        if not name:
            return

        logger.info(f"Created global template: {name}")
        new_t, all_t = await self.global_template_service.create_template(name, category, subject, body, is_html)
        self.application.settings["websocket_manager"].broadcast(
            {"action": "global_templates_list", "payload": all_t}
        )
        await self.safe_write_message(json.dumps({
            "action": "global_template_created",
            "payload": {"template": new_t, "navigate": navigate}
        }))

    async def _handle_update_global_template(self, payload):
        template_id = payload.get("template_id")
        updates = payload.get("updates", {})
        body = payload.get("body")
        if not template_id:
            return

        name = await self._get_template_name(template_id)
        logger.info(f"Updated global template: {name}")
        all_t = await self.global_template_service.update_template(template_id, updates, body)
        self.application.settings["websocket_manager"].broadcast(
            {"action": "global_templates_list", "payload": all_t}
        )

    async def _handle_delete_global_templates(self, payload):
        template_ids = payload.get("template_ids")
        if not isinstance(template_ids, list):
            return

        templates = await self.global_template_service.get_templates()
        names = [t["name"] for t in templates if t["id"] in template_ids]
        logger.info(f"Deleted multiple global templates: {', '.join(names)}")
        all_t = await self.global_template_service.delete_templates(template_ids)
        self.application.settings["websocket_manager"].broadcast(
            {"action": "global_templates_list", "payload": all_t}
        )

    async def _handle_duplicate_global_template(self, payload):
        template_id = payload.get("template_id")
        if not template_id:
            return

        name = await self._get_template_name(template_id)
        logger.info(f"Duplicated global template: {name}")
        all_t = await self.global_template_service.duplicate_template(template_id)
        self.application.settings["websocket_manager"].broadcast(
            {"action": "global_templates_list", "payload": all_t}
        )

    async def _handle_get_assets(self, _):
        logger.info("Fetched all assets")
        assets = await self.asset_service.get_assets()
        await self.safe_write_message(json.dumps({"action": "assets_list", "payload": assets}))

    async def _handle_create_asset(self, payload):
        logger.info(f"Created asset: {payload.get('name')}")
        assets = await self.asset_service.create_asset(payload.get("name"), payload.get("url"), payload.get("is_gdrive"))
        self.application.settings["websocket_manager"].broadcast({"action": "assets_list", "payload": assets})

    async def _handle_delete_assets(self, payload):
        asset_ids = payload.get("asset_ids")
        if isinstance(asset_ids, list):
            assets = await self.asset_service.get_assets()
            names = [a["name"] for a in assets if a["id"] in asset_ids]
            logger.info(f"Deleted multiple assets: {', '.join(names)}")
        updated_assets = await self.asset_service.delete_assets(asset_ids)
        self.application.settings["websocket_manager"].broadcast({"action": "assets_list", "payload": updated_assets})

    async def _handle_update_asset(self, payload):
        asset_id = payload.get("asset_id")
        name = await self._get_asset_name(asset_id)
        logger.info(f"Updated asset: {name}")
        assets = await self.asset_service.update_asset(asset_id, payload.get("updates"))
        self.application.settings["websocket_manager"].broadcast({"action": "assets_list", "payload": assets})

    async def _handle_get_campaign_analytics(self, payload):
        campaign_id = payload.get("campaign_id")
        if not campaign_id: return
        analytics = await self.analytics_service.get_campaign_analytics(campaign_id)
        await self.safe_write_message(json.dumps({
            "action": "campaign_analytics",
            "payload": {"campaign_id": campaign_id, "analytics": analytics}
        }))

    async def _handle_get_campaign_events(self, payload):
        campaign_id = payload.get("campaign_id")
        if not campaign_id: return
        events = await self.analytics_service.get_campaign_events(campaign_id)
        await self.safe_write_message(json.dumps({
            "action": "campaign_events",
            "payload": {"campaign_id": campaign_id, "events": events}
        }))

    async def _handle_factory_reset(self, payload):
        erase_accounts = payload.get("erase_accounts", False)
        logger.info(f"Performing factory reset. Erase accounts: {erase_accounts}")

        await self.settings_service.factory_reset(erase_accounts)
        seeder_service = self.application.settings.get("seeder_service")
        if seeder_service:
            await seeder_service.seed()

        await self.safe_write_message(json.dumps({"action": "factory_reset_complete", "payload": {}}))

    def check_origin(self, origin):
        parsed_origin = urlparse(origin)
        origin_host = parsed_origin.netloc.lower()
        if origin_host.startswith("localhost") or origin_host.startswith("127.0.0.1"):
            return True
        return False

class WebSocketManager:
    def __init__(self):
        self.connections = set()

    def add(self, connection):
        self.connections.add(connection)

    def remove(self, connection):
        self.connections.discard(connection)

    def broadcast(self, message):
        msg_str = json.dumps(message)
        for connection in list(self.connections):
            if connection.ws_connection is None or connection.ws_connection.is_closing():
                continue
            try:
                fut = connection.write_message(msg_str)
                if fut is not None:
                    fut.add_done_callback(lambda f: f.exception())
            except Exception:
                pass

