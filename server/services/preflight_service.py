import os
import re
from dataclasses import dataclass, field
from typing import List, Dict, Any, cast
import pandas as pd


@dataclass
class PreflightResult:
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    successes: List[str] = field(default_factory=list)
    recipient_issues: List[Dict[str, Any]] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.errors

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ok": self.ok,
            "errors": self.errors,
            "warnings": self.warnings,
            "successes": self.successes,
            "recipient_issues": self.recipient_issues,
        }


class PreflightService:
    def __init__(self, base_dir: str, recipient_service, template_service):
        self.base_dir = base_dir
        self.recipient_service = recipient_service
        self.template_service = template_service

    def _replace_placeholders(
        self, template_string: str, recipient_dict: Dict[str, Any]
    ) -> str:
        for key, value in recipient_dict.items():
            placeholder = f"{{{{{key}}}}}"
            template_string = template_string.replace(placeholder, str(value))
        return template_string

    async def get_campaign_summary(
        self, campaign_id: str, config: Dict[str, Any], subject_template: str
    ) -> Dict[str, Any]:
        try:
            recipients_df = pd.DataFrame(
                await self.recipient_service.get_recipients(campaign_id)
            ).fillna("")
        except FileNotFoundError:
            recipients_df = pd.DataFrame({"Status": [], "AttachmentFile": []})

        if "Status" not in recipients_df.columns:
            recipients_df["Status"] = "PENDING"

        total_recipients = len(recipients_df)

        recipients_to_send_df = recipients_df[
            recipients_df["Status"].astype(str).str.upper() != "SENT"
        ]
        recipients_to_send_count = len(recipients_to_send_df)

        total_attachment_size = 0
        attachment_folder = config.get("attachment_folder", "")
        if (
            config.get("send_attachments", True)
            and attachment_folder
            and os.path.isdir(attachment_folder)
        ):
            for _, row in recipients_to_send_df.iterrows():
                attachment_file = str(row.get("AttachmentFile", "")).strip()
                if attachment_file:
                    file_path = os.path.join(attachment_folder, attachment_file)
                    if os.path.exists(file_path) and os.path.isfile(file_path):
                        total_attachment_size += os.path.getsize(file_path)

        preview_subject = "No pending recipients to preview."
        preview_body = "<p>No pending recipients to preview.</p>"
        if not recipients_to_send_df.empty:
            first_recipient = recipients_to_send_df.iloc[0].to_dict()
            html_template = await self.template_service.get_template(campaign_id)
            preview_subject = self._replace_placeholders(
                subject_template, first_recipient
            )
            preview_body = self._replace_placeholders(html_template, first_recipient)

        return {
            "total_recipients": total_recipients,
            "recipients_to_send": recipients_to_send_count,
            "total_attachment_size_bytes": total_attachment_size,
            "preview_subject": preview_subject,
            "preview_body": preview_body,
        }

    def _extract_placeholders(self, text: str) -> set:
        return set(re.findall(r"\{\{([^}]+)\}\}", text))

    def _extract_body_placeholders_with_lines(
        self, html_content: str
    ) -> Dict[str, List[int]]:
        placeholders = {}
        lines = html_content.splitlines()
        for i, line in enumerate(lines):
            found = re.findall(r"\{\{([^}]+)\}\}", line)
            for placeholder in found:
                if placeholder not in placeholders:
                    placeholders[placeholder] = []
                placeholders[placeholder].append(i + 1)
        return placeholders

    def _check_config_variables(self, config: Dict[str, Any], result: PreflightResult):
        errors = []
        required_vars = ["smtp_server", "sender_email", "sender_password", "smtp_port"]
        for var in required_vars:
            value = config.get(var)
            if not value:
                errors.append(f"Configuration value '{var}' is not set.")
            elif var == "sender_password" and value == "<your-app-password>":
                errors.append(
                    f"Default placeholder password for '{var}' is still present."
                )

        if not errors:
            result.successes.append(
                "Configuration variables (SMTP server, email, password, port) are present."
            )
        else:
            result.errors.extend(errors)

    async def _check_paths(
        self, campaign_id: str, config: Dict[str, Any], result: PreflightResult
    ) -> bool:
        errors = []
        attachment_folder = config.get("attachment_folder", "")

        recipients_path = self.recipient_service.get_recipients_path(campaign_id)
        template_path = self.template_service.get_template_path(campaign_id)

        if not os.path.exists(recipients_path):
            result.warnings.append(
                f"Recipients CSV file not found for this campaign at '{recipients_path}'. A new one can be uploaded."
            )

        if not os.path.exists(template_path):
            errors.append(
                f"HTML Template file not found for this campaign at '{template_path}'."
            )

        if config.get("send_attachments", True):
            if not attachment_folder or not os.path.isdir(attachment_folder):
                errors.append(
                    f"Attachment Folder not found or is not a directory at '{attachment_folder}'."
                )

        if not errors:
            result.successes.append("HTML template and attachment folder all exist.")
            return True
        else:
            result.errors.extend(errors)
            return False

    async def _check_recipients_and_attachments(
        self,
        campaign_id: str,
        config: Dict[str, Any],
        subject_template: str,
        result: PreflightResult,
    ):
        errors, warnings = [], []
        attachment_folder = config.get("attachment_folder", "")
        send_attachments = config.get("send_attachments", True)

        html_template = await self.template_service.get_template(campaign_id)
        if not html_template:
            errors.append(f"Could not read or empty HTML template file for campaign.")
            result.errors.extend(errors)
            return

        try:
            recipients_df = pd.DataFrame(
                await self.recipient_service.get_recipients(campaign_id)
            ).fillna("")
            if recipients_df.empty:
                warnings.append("Recipient list is empty for this campaign.")
                result.warnings.extend(warnings)
                return
            csv_columns = set(recipients_df.columns)
        except FileNotFoundError:
            return
        except (pd.errors.ParserError, Exception) as e:
            errors.append(f"Error processing recipients file for campaign: {e}")
            result.errors.extend(errors)
            return

        missing_column_errors = []
        subject_placeholders = self._extract_placeholders(subject_template)
        missing_in_subject = subject_placeholders - csv_columns
        for col in sorted(list(missing_in_subject)):
            missing_column_errors.append(
                f"Missing column '{{{{{col}}}}}' required by the email subject."
            )

        body_placeholders_with_lines = self._extract_body_placeholders_with_lines(
            html_template
        )
        missing_in_body = set(body_placeholders_with_lines.keys()) - csv_columns
        for col in sorted(list(missing_in_body)):
            lines = body_placeholders_with_lines[col]
            line_str = ", ".join(map(str, lines))
            missing_column_errors.append(
                f"Missing column '{{{{{col}}}}}' required by the email body on line(s): {line_str}."
            )

        if not missing_column_errors:
            result.successes.append(
                "Recipients CSV is readable and all columns required by templates are present."
            )
        else:
            errors.extend(missing_column_errors)

        if not recipients_df.empty:
            any_pending_attachments_missing = False
            all_attachments_found = True

            for index, row in recipients_df.iterrows():
                row_num = cast(int, index) + 2
                name = str(row.get("Name", "")).strip()
                email = str(row.get("Email", "")).strip()
                status = str(row.get("Status", "")).strip().upper()

                if not name:
                    msg = "Recipient has an empty 'Name' field."
                    errors.append(f"Row {row_num}: {msg}")
                    result.recipient_issues.append(
                        {"index": cast(int, index), "type": "error", "message": msg}
                    )

                if not email:
                    msg = f"Recipient '{name or f'Row {row_num}'}' has an empty 'Email' field."
                    errors.append(f"Row {row_num}: {msg}")
                    result.recipient_issues.append(
                        {"index": cast(int, index), "type": "error", "message": msg}
                    )

                if send_attachments:
                    cert_file = str(row.get("AttachmentFile", "")).strip()
                    name_for_msg = name or f"Row {row_num}"

                    if not cert_file:
                        msg = f"Recipient '{name_for_msg}' has an empty 'AttachmentFile' field."
                        warnings.append(f"Row {row_num}: {msg}")
                        result.recipient_issues.append(
                            {
                                "index": cast(int, index),
                                "type": "warning",
                                "message": msg,
                            }
                        )
                    else:
                        full_path = os.path.join(attachment_folder, cert_file)
                        if not os.path.exists(full_path):
                            all_attachments_found = False
                            if status == "SENT":
                                msg = f"Attachment '{cert_file}' for '{name_for_msg}' is missing, but email was already marked as SENT."
                                warnings.append(f"Row {row_num}: {msg}")
                                result.recipient_issues.append(
                                    {
                                        "index": cast(int, index),
                                        "type": "warning",
                                        "message": msg,
                                    }
                                )
                            else:
                                msg = f"Attachment '{cert_file}' for '{name_for_msg}' not found."
                                errors.append(f"Row {row_num}: {msg}")
                                result.recipient_issues.append(
                                    {
                                        "index": cast(int, index),
                                        "type": "error",
                                        "message": msg,
                                    }
                                )
                                any_pending_attachments_missing = True

            if send_attachments:
                if all_attachments_found:
                    result.successes.append(
                        "All attachment files listed in the CSV were found."
                    )
                elif not any_pending_attachments_missing:
                    result.successes.append(
                        "All required attachment files for pending recipients were found."
                    )

        result.errors.extend(errors)
        result.warnings.extend(warnings)

    async def run_checks(
        self, campaign_id: str, config: Dict[str, Any], subject_template: str
    ) -> PreflightResult:
        result = PreflightResult()

        self._check_config_variables(config, result)

        paths_ok = await self._check_paths(campaign_id, config, result)

        if paths_ok:
            await self._check_recipients_and_attachments(
                campaign_id, config, subject_template, result
            )

        return result
