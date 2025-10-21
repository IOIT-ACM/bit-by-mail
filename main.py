import smtplib
from email.mime.text import MIMEText
import pandas as pd

SMTP_SERVER = "mail.ioit.acm.org"
SMTP_PORT = 587  # Usually 587 for TLS, 465 for SSL
SENDER_EMAIL = "chair@ioit.acm.org"
SENDER_PASSWORD = "chair@ioit.acm.org"

print("Loading recipients CSV...")
recipients = pd.read_csv("recipients.csv")
print(f"Loaded {len(recipients)} recipients.")

print("Connecting to SMTP server...")
with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
    print("Starting TLS...")
    server.starttls()
    print("Logging in...")
    server.login(SENDER_EMAIL, SENDER_PASSWORD)
    print("Logged in successfully.")

    for index, row in recipients.iterrows():
        print(f"\nProcessing row {index}...")
        name = str(row["Name"])
        to_email = str(row["Email"])
        print(f"Preparing email for {name} <{to_email}>")

        subject = f"Thank You, {name}!"
        body = f"Hi {name},\n\nThis is a test email."

        msg = MIMEText(body)
        msg["From"] = SENDER_EMAIL
        msg["To"] = to_email
        msg["Subject"] = subject

        try:
            server.send_message(msg)
            print(f"Sent email to {name} <{to_email}> successfully.")
        except Exception as e:
            print(f"Failed to send email to {name} <{to_email}>. Error: {e}")

print("\nAll emails processed.")
