import json
import tornado.websocket


class WebSocketHandler(tornado.websocket.WebSocketHandler):
    def open(self):
        self.application.settings["websocket_manager"].add(self)
        self.config_service = self.application.settings["config_service"]
        self.mailer_service = self.application.settings["mailer_service"]
        self.preflight_service = self.application.settings["preflight_service"]

    def on_close(self):
        self.application.settings["websocket_manager"].remove(self)

    async def on_message(self, message):
        try:
            data = json.loads(message)
            action = data.get("action")
            payload = data.get("payload")

            if action == "get_initial_data":
                config = await self.config_service.get_full_config()
                recipients = await self.config_service.get_recipients()
                template = await self.config_service.get_template()
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

            elif action == "save_config":
                await self.config_service.save_full_config(payload)
                self.write_message(
                    json.dumps(
                        {
                            "action": "notify",
                            "payload": {
                                "status": "success",
                                "message": "Configuration saved.",
                            },
                        }
                    )
                )

            elif action == "save_template":
                await self.config_service.save_template(payload)
                self.write_message(
                    json.dumps(
                        {
                            "action": "notify",
                            "payload": {
                                "status": "success",
                                "message": "Template saved.",
                            },
                        }
                    )
                )

            elif action == "upload_recipients":
                await self.config_service.save_recipients_from_base64(payload)
                recipients = await self.config_service.get_recipients()
                self.write_message(
                    json.dumps({"action": "recipients_updated", "payload": recipients})
                )

            elif action == "save_recipients":
                await self.config_service.save_recipients_from_json(payload)
                self.write_message(
                    json.dumps(
                        {
                            "action": "notify",
                            "payload": {
                                "status": "success",
                                "message": "Recipient changes saved.",
                            },
                        }
                    )
                )

            elif action == "start_mailing":
                if self.mailer_service.is_running():
                    self.write_message(
                        json.dumps(
                            {
                                "action": "notify",
                                "payload": {
                                    "status": "error",
                                    "message": "Mailing process already running.",
                                },
                            }
                        )
                    )
                else:
                    stored_config = await self.config_service.get_full_config()
                    client_config = payload.get("config", {})
                    if not client_config.get("sender_password"):
                        client_config["sender_password"] = stored_config.get(
                            "sender_password"
                        )
                    await self.mailer_service.start_mailing(
                        client_config, payload.get("recipients")
                    )

            elif action == "preflight_check":
                stored_config = await self.config_service.get_full_config()
                client_config = payload or {}
                if not client_config.get("sender_password"):
                    client_config["sender_password"] = stored_config.get(
                        "sender_password"
                    )
                result = self.preflight_service.run_checks(client_config)
                self.write_message(
                    json.dumps(
                        {"action": "preflight_result", "payload": result.to_dict()}
                    )
                )

        except Exception as e:
            self.write_message(
                json.dumps(
                    {
                        "action": "notify",
                        "payload": {"status": "error", "message": str(e)},
                    }
                )
            )

    def check_origin(self, _):
        return True
