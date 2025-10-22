import os
import string
from dataclasses import dataclass, field
from typing import List, cast, Tuple

from .config import Settings
from .recipients import load_recipients_df


@dataclass
class PreflightResult:
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.errors


def check_environment_variables() -> List[str]:
    errors = []
    env_vars = ["SMTP_SERVER", "SENDER_EMAIL", "SENDER_PASSWORD", "SMTP_PORT"]
    for var in env_vars:
        value = os.getenv(var)
        if not value:
            errors.append(f"Environment variable '{var}' is not set in .env file.")
        elif var == "SENDER_PASSWORD" and value == "<your-app-password>":
            errors.append(f"Default placeholder password for '{var}' is still present.")
    return errors


def check_paths(settings: Settings) -> Tuple[List[str], bool]:
    errors = []
    paths_ok = True
    paths_to_check = {
        "Recipients CSV": settings.recipients_csv,
        "HTML Template": settings.html_path,
        "Attachment Folder": settings.attachment_folder,
    }
    for name, path in paths_to_check.items():
        if not os.path.exists(path):
            errors.append(f"{name} file/folder not found at '{path}'.")
            paths_ok = False

    if not os.path.isdir(settings.log_folder):
        try:
            os.makedirs(settings.log_folder)
        except OSError as e:
            errors.append(
                f"Could not create log folder at '{settings.log_folder}': {e}"
            )
            paths_ok = False
    return errors, paths_ok


def check_recipients_and_attachments(settings: Settings) -> Tuple[List[str], List[str]]:
    errors, warnings = [], []
    try:
        recipients_df = load_recipients_df(settings.recipients_csv)

        try:
            placeholders = {
                field_name.lower()
                for _, field_name, _, _ in string.Formatter().parse(
                    settings.subject_template
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

        recipients_to_process = recipients_df[recipients_df["Status"] != "SENT"]
        if not recipients_to_process.empty:
            for index, row in recipients_to_process.iterrows():
                row_num = cast(int, index) + 2
                cert_file = str(row.get("CertificateFile", "")).strip()
                name = row.get("Name", f"Row {row_num}")

                if not cert_file:
                    warnings.append(
                        f"Row {row_num}: Recipient '{name}' has an empty 'CertificateFile' field."
                    )
                    continue

                full_path = os.path.join(settings.attachment_folder, cert_file)
                if not os.path.exists(full_path):
                    warnings.append(
                        f"Row {row_num}: Attachment '{cert_file}' for '{name}' not found."
                    )
    except Exception as e:
        errors.append(f"Error processing '{settings.recipients_csv}': {e}")

    return errors, warnings


def run_checks(settings: Settings) -> PreflightResult:
    result = PreflightResult()

    result.errors.extend(check_environment_variables())

    path_errors, paths_ok = check_paths(settings)
    result.errors.extend(path_errors)

    if paths_ok:
        recipient_errors, recipient_warnings = check_recipients_and_attachments(
            settings
        )
        result.errors.extend(recipient_errors)
        result.warnings.extend(recipient_warnings)

    return result
