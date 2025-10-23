import os
import string
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
        attachment_folder = os.path.join(
            self.base_dir, config.get("attachment_folder", "")
        )

        paths_to_check = {
            "Recipients CSV": self.recipient_service.recipients_path,
            "HTML Template": self.template_service.template_path,
            "Attachment Folder": attachment_folder,
        }
        for name, path in paths_to_check.items():
            if not path or not os.path.exists(path):
                errors.append(f"{name} file/folder not found at '{path}'.")

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
        attachment_folder = os.path.join(
            self.base_dir, config.get("attachment_folder", "")
        )
        subject_template = config.get("subject_template", "")

        try:
            recipients_df = pd.read_csv(self.recipient_service.recipients_path)

            try:
                placeholders = {
                    field_name.lower()
                    for _, field_name, _, _ in string.Formatter().parse(
                        subject_template
                    )
                    if field_name is not None
                }
                csv_columns_lower = {col.lower() for col in recipients_df.columns}
                missing_columns = placeholders - csv_columns_lower
                if missing_columns:
                    errors.append(
                        f"Subject template requires column(s) not found in CSV: {', '.join(missing_columns)}"
                    )
            except ValueError as e:
                warnings.append(f"Could not parse subject template: {e}")

            if not errors:
                result.successes.append(
                    "Recipients CSV is readable and columns match subject template."
                )

            recipients_to_process = recipients_df[
                recipients_df["Status"].str.upper() != "SENT"
            ]
            if not recipients_to_process.empty:
                missing_attachments = False
                for index, row in recipients_to_process.iterrows():
                    row_num = cast(int, index) + 2
                    cert_file = str(row.get("AttachmentFile", "")).strip()
                    name = row.get("Name", f"Row {row_num}")

                    if not cert_file:
                        warnings.append(
                            f"Row {row_num}: Recipient '{name}' has an empty 'AttachmentFile' field."
                        )
                        continue

                    full_path = os.path.join(attachment_folder, cert_file)
                    if not os.path.exists(full_path):
                        warnings.append(
                            f"Row {row_num}: Attachment '{cert_file}' for '{name}' not found."
                        )
                        missing_attachments = True

                if not missing_attachments:
                    result.successes.append(
                        "All required attachment files for pending recipients were found."
                    )

        except FileNotFoundError:
            pass
        except (pd.errors.ParserError, Exception) as e:
            errors.append(
                f"Error processing '{self.recipient_service.recipients_path}': {e}"
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
