import sys
import os
import logging
from src.config import settings
from src.preflight_checks import (
    check_environment_variables,
    check_paths,
    check_recipients_and_attachments,
)


def print_check(message: str, success: bool):
    status = f"\033[92mOK\033[0m" if success else f"\033[91mFAIL\033[0m"
    print(f"[{status}] {message}")


def main():
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    all_errors: list[str] = []
    all_warnings: list[str] = []

    print(f"\033[1m--- Running Pre-flight Checks ---\033[0m")

    print("\n\033[1mChecking Environment Variables (.env)...\033[0m")
    env_errors = check_environment_variables()
    all_errors.extend(env_errors)

    expected_vars = ["SMTP_SERVER", "SENDER_EMAIL", "SENDER_PASSWORD", "SMTP_PORT"]
    for var in expected_vars:
        is_ok = not any(f"'{var}'" in err for err in env_errors)
        print_check(f"'{var}' is configured correctly.", is_ok)

    print("\n\033[1mChecking Files and Folders (from config.yaml)...\033[0m")
    path_errors, paths_ok = check_paths(settings)
    all_errors.extend(path_errors)

    paths_to_check = {
        "Recipients CSV": settings.recipients_csv,
        "HTML Template": settings.html_path,
        "Attachment Folder": settings.attachment_folder,
        "Log Folder": settings.log_folder,
    }
    for name, path in paths_to_check.items():
        is_ok = os.path.exists(path)
        print_check(f"{name} ('{path}') exists.", is_ok)

    print("\n\033[1mChecking Recipients CSV and Attachments...\033[0m")
    if not paths_ok:
        print("\033[93m  - Skipped due to missing files or folders.\033[0m")
    else:
        recipient_errors, recipient_warnings = check_recipients_and_attachments(
            settings
        )
        all_errors.extend(recipient_errors)
        all_warnings.extend(recipient_warnings)

        if not recipient_errors and not recipient_warnings:
            print_check(
                "CSV format, subject template, and all attachments are valid.", True
            )
        else:
            print_check("Found issues in CSV content or attachments.", False)

    print(f"\n\033[1m--- Pre-flight Summary ---\033[0m")
    if not all_errors and not all_warnings:
        print(f"\033[92m\033[1mAll checks passed! You are ready to send emails.\033[0m")
        sys.exit(0)

    if all_errors:
        print(f"\033[91m\033[1mFound {len(all_errors)} critical error(s):\033[0m")
        for error in all_errors:
            print(f"  - \033[91m{error}\033[0m")

    if all_warnings:
        print(f"\033[93m\033[1mFound {len(all_warnings)} warning(s):\033[0m")
        for warning in all_warnings:
            print(f"  - \033[93m{warning}\033[0m")

    if all_errors:
        print(
            f"\n\033[91mPre-flight failed. Please fix the critical errors before running the mailer.\033[0m"
        )
        sys.exit(1)
    else:
        print(
            f"\n\033[93mPre-flight completed with warnings. Proceed with caution.\033[0m"
        )
        sys.exit(0)


if __name__ == "__main__":
    main()
