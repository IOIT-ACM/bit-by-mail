import os
import string
from dataclasses import dataclass, field
from typing import List, Dict, Any, Tuple, cast
import pandas as pd


@dataclass
class PreflightResult:
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.errors

    def to_dict(self) -> Dict[str, Any]:
        return {"ok": self.ok, "errors": self.errors, "warnings": self.warnings}


class PreflightService:
    def __init__(self, base_dir: str):
        self.base_dir = base_dir
        self.recipients_csv = os.path.join(base_dir, "recipients.csv")
        self.html_path = os.path.join(base_dir, "email.html")

    def check_config_variables(self, config: Dict[str, Any]) -> List[str]:
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
        return errors

    def check_paths(self, config: Dict[str, Any]) -> Tuple[List[str], bool]:
        errors = []
        paths_ok = True
        attachment_folder = os.path.join(
            self.base_dir, config.get("attachment_folder", "")
        )

        paths_to_check = {
            "Recipients CSV": self.recipients_csv,
            "HTML Template": self.html_path,
            "Attachment Folder": attachment_folder,
        }
        for name, path in paths_to_check.items():
            if not path or not os.path.exists(path):
                errors.append(f"{name} file/folder not found at '{path}'.")
                paths_ok = False

        return errors, paths_ok

    def check_recipients_and_attachments(
        self, config: Dict[str, Any]
    ) -> Tuple[List[str], List[str]]:
        errors, warnings = [], []
        attachment_folder = os.path.join(
            self.base_dir, config.get("attachment_folder", "")
        )
        subject_template = config.get("subject_template", "")

        try:
            recipients_df = pd.read_csv(self.recipients_csv)

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
            except Exception as e:
                warnings.append(f"Could not parse subject template: {e}")

            recipients_to_process = recipients_df[
                (recipients_df["Status"] != "SENT")
                & (recipients_df["Status"] != "Sent")
            ]
            if not recipients_to_process.empty:
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
        except FileNotFoundError:
            pass
        except Exception as e:
            errors.append(f"Error processing '{self.recipients_csv}': {e}")

        return errors, warnings

    def run_checks(self, config: Dict[str, Any]) -> PreflightResult:
        result = PreflightResult()

        result.errors.extend(self.check_config_variables(config))

        path_errors, paths_ok = self.check_paths(config)
        result.errors.extend(path_errors)

        if paths_ok:
            (
                recipient_errors,
                recipient_warnings,
            ) = self.check_recipients_and_attachments(config)
            result.errors.extend(recipient_errors)
            result.warnings.extend(recipient_warnings)

        return result
