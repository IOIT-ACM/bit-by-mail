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
        self.action_handlers = {
            "get_initial_data": self._handle_get_initial_data,
            "save_config": self._handle_save_config,
            "save_template": self._handle_save_template,
            "upload_recipients": self._handle_upload_recipients,
            "save_recipients": self._handle_save_recipients,
            "start_mailing": self._handle_start_mailing,
            "preflight_check": self._handle_preflight_check,
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

    async def _handle_get_initial_data(self, _):
        config = await self.settings_service.get_config()
        recipients = await self.recipient_service.get_recipients()
        template = await self.template_service.get_template()
        is_password_set = bool(config.get("sender_password"))
        config.pop("sender_password", None)
        self.write_message(
            json.dumps(
                {
                    "action": "initial_data",
                    "payload": {
                        "config": config,
                        "recipients": recipients,
                        "template": template,
                        "is_password_set": is_password_set,
                    },
                }
            )
        )

    async def _handle_save_config(self, payload):
        await self.settings_service.save_config(payload)

    async def _handle_save_template(self, payload):
        await self.template_service.save_template(payload)

    async def _handle_upload_recipients(self, payload):
        await self.recipient_service.save_recipients_from_base64(payload)
        recipients = await self.recipient_service.get_recipients()
        self.write_message(
            json.dumps({"action": "recipients_updated", "payload": recipients})
        )

    async def _handle_save_recipients(self, payload):
        await self.recipient_service.save_recipients_from_json(payload)

    async def _handle_start_mailing(self, payload):
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
            await self.mailer_service.start_mailing(
                client_config, payload.get("recipients")
            )

    async def _handle_preflight_check(self, payload):
        stored_config = await self.settings_service.get_config()
        client_config = payload or {}
        if not client_config.get("sender_password"):
            client_config["sender_password"] = stored_config.get("sender_password")
        result = self.preflight_service.run_checks(client_config)
        self.write_message(
            json.dumps({"action": "preflight_result", "payload": result.to_dict()})
        )

    def check_origin(self, origin):
        if self.application.settings.get("debug"):
            return True

        parsed_origin = urlparse(origin)
        origin_host = parsed_origin.netloc.lower()
        request_host = self.request.host.lower()
        return origin_host == request_host
