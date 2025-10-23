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

    @property
    def ok(self) -> bool:
        return not self.errors

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ok": self.ok,
            "errors": self.errors,
            "warnings": self.warnings,
            "successes": self.successes,
        }


class PreflightService:
    def __init__(self, base_dir: str, recipient_service, template_service):
        self.base_dir = base_dir
        self.recipient_service = recipient_service
        self.template_service = template_service

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

    def _check_paths(self, config: Dict[str, Any], result: PreflightResult) -> bool:
        errors = []
        attachment_folder = config.get("attachment_folder", "")

        files_to_check = {
            "Recipients CSV": self.recipient_service.recipients_path,
            "HTML Template": self.template_service.template_path,
        }
        for name, path in files_to_check.items():
            if not path or not os.path.exists(path):
                errors.append(f"{name} file not found at '{path}'.")

        if config.get("send_attachments", True):
            if not attachment_folder or not os.path.isdir(attachment_folder):
                errors.append(
                    f"Attachment Folder not found or is not a directory at '{attachment_folder}'."
                )

        if not errors:
            result.successes.append(
                "Recipients CSV, HTML template, and attachment folder all exist."
            )
            return True
        else:
            result.errors.extend(errors)
            return False

    def _check_recipients_and_attachments(
        self, config: Dict[str, Any], result: PreflightResult
    ):
        errors, warnings = [], []
        attachment_folder = config.get("attachment_folder", "")
        subject_template = config.get("subject_template", "")
        send_attachments = config.get("send_attachments", True)

        html_template = ""
        try:
            with open(self.template_service.template_path, "r", encoding="utf-8") as f:
                html_template = f.read()
        except Exception as e:
            errors.append(f"Could not read HTML template file: {e}")
            result.errors.extend(errors)
            return

        try:
            recipients_df = pd.read_csv(self.recipient_service.recipients_path)
            csv_columns = set(recipients_df.columns)
        except FileNotFoundError:
            return
        except (pd.errors.ParserError, Exception) as e:
            errors.append(
                f"Error processing '{self.recipient_service.recipients_path}': {e}"
            )
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

        if not recipients_df.empty and send_attachments:
            any_pending_attachments_missing = False
            all_attachments_found = True

            for index, row in recipients_df.iterrows():
                row_num = cast(int, index) + 2
                cert_file = str(row.get("AttachmentFile", "")).strip()
                name = row.get("Name", f"Row {row_num}")
                status = str(row.get("Status", "")).strip().upper()

                if not cert_file:
                    warnings.append(
                        f"Row {row_num}: Recipient '{name}' has an empty 'AttachmentFile' field."
                    )
                    continue

                full_path = os.path.join(attachment_folder, cert_file)
                if not os.path.exists(full_path):
                    all_attachments_found = False
                    if status == "SENT":
                        warnings.append(
                            f"Row {row_num}: Attachment '{cert_file}' for '{name}' is missing, but email was already marked as SENT."
                        )
                    else:
                        errors.append(
                            f"Row {row_num}: Attachment '{cert_file}' for '{name}' not found."
                        )
                        any_pending_attachments_missing = True

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

    def run_checks(self, config: Dict[str, Any]) -> PreflightResult:
        result = PreflightResult()

        self._check_config_variables(config, result)

        paths_ok = self._check_paths(config, result)

        if paths_ok:
            self._check_recipients_and_attachments(config, result)

        return result
