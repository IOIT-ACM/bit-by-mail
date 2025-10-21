# Bulk Certificate Mailer

This is a simple Python utility designed to send bulk emails with personalized subjects and unique attachments. It reads recipient data from a CSV file, attaches a corresponding file for each recipient, and tracks the sending status.

## Features

- Reads recipients from a CSV file (`Name`, `Email`, `CertificateFile`).
- Personalizes the email subject line for each recipient.
- Attaches a unique file (e.g., a PDF certificate) for each recipient.
- Updates the CSV with sending status (`SENT`, `ERROR`, `SKIPPED`) to prevent re-sending.
- Logs all operations to a timestamped CSV file in the `logs/` directory.
- Configuration is managed via `.env` for secrets and `config.yaml` for settings.

## Setup

1.  **Install Dependencies**

    ```bash
    python3 -m venv venv
    source venv/bin/activate

    # On Windows, use:
    # python -m venv venv
    # venv\Scripts\activate

    # Install required packages
    pip install -r requirements.txt
    ```

1.  **Configure Environment Variables**

    Create a `.env` file by copying the example and add your SMTP credentials.

    ```bash
    cp .env.example .env
    ```

    Now, edit the `.env` file with your email server details:

    ```env
    SMTP_SERVER="your.smtp.server.com"
    SENDER_EMAIL="your-email@example.com"
    SENDER_PASSWORD="your-app-password"
    SMTP_PORT=587
    ```

1.  **Prepare Data**

    - **Recipients:** Create your `recipients.csv` file by copying the example (`cp recipients.example.csv recipients.csv`) and filling it with your data.
    - **Attachments:** Place all attachment files (e.g., `aditya_certificate.pdf`) into the `attachments/` folder. Create this folder if it doesn't exist.

1.  **Review Configuration**

    Adjust the `config.yaml` file if you need to change file paths or the email subject template. The defaults are generally fine.

## Usage

Once the setup is complete, run the script using the provided Makefile command:

```bash
make run
```

The script will process any recipients in `recipients.csv` that do not have the status `SENT`. Check the `logs/` directory for a detailed report of the sending process.
