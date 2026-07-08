import os
import re
import html
import pandas as pd
from dataclasses import dataclass, field

@dataclass
class PreflightResult:
    errors: list = field(default_factory=list)
    warnings: list = field(default_factory=list)
    successes: list = field(default_factory=list)
    recipient_issues: list = field(default_factory=list)

    @property
    def ok(self):
        return not self.errors

    def to_dict(self):
        return {
            "ok": self.ok,
            "errors": self.errors,
            "warnings": self.warnings,
            "successes": self.successes,
            "recipient_issues": self.recipient_issues
        }

class PreflightService:
    def __init__(self, campaign_service, recipient_service, template_service):
        self.campaign_service = campaign_service
        self.recipient_service = recipient_service
        self.template_service = template_service

    def _replace_placeholders(self, txt, d):
        for k, v in d.items():
            txt = txt.replace(f"{{{{{k}}}}}", str(v))
        return txt

    async def get_campaign_summary(self, campaign_id, _config, subject_template, recipient_indices=None):
        df = pd.DataFrame(await self.recipient_service.get_recipients(campaign_id)).fillna("")
        if df.empty:
            df = pd.DataFrame({"Status": [], "AttachmentFile": []})
        if recipient_indices is not None:
            df = df.iloc[recipient_indices]
        if "Status" not in df.columns:
            df["Status"] = "PENDING"

        to_send = df[df["Status"].astype(str).str.upper() != "SENT"]
        campaigns = await self.campaign_service.get_campaigns()
        campaign = next((c for c in campaigns if c["id"] == campaign_id), {})

        total_size = 0
        folder = campaign.get("attachment_folder", "")
        if campaign.get("send_attachments", False) and folder and os.path.isdir(folder):
            for _, row in to_send.iterrows():
                for f in [x.strip() for x in str(row.get("AttachmentFile", "")).split(";") if x.strip()]:
                    p = os.path.join(folder, f)
                    if os.path.exists(p) and os.path.isfile(p):
                        total_size += os.path.getsize(p)

        p_sub = "No pending recipients to preview."
        p_body = "<p>No pending recipients to preview.</p>"
        if not to_send.empty:
            first = to_send.iloc[0].to_dict()
            html_template = await self.template_service.get_template(campaign_id)
            p_sub = self._replace_placeholders(subject_template, first)
            p_body = self._replace_placeholders(html_template, first)
            if not campaign.get("is_html", True):
                p_body = f'<!DOCTYPE html><html><body><pre>{html.escape(p_body)}</pre></body></html>'

        return {
            "total_recipients": len(df),
            "recipients_to_send": len(to_send),
            "total_attachment_size_bytes": total_size,
            "preview_subject": p_sub,
            "preview_body": p_body
        }

    def _extract_ph(self, text):
        return set(re.findall(r"\{\{([^}]+)\}\}", text))

    async def run_checks(self, campaign_id, config, subject_template):
        r = PreflightResult()
        campaigns = await self.campaign_service.get_campaigns()
        c = next((cam for cam in campaigns if cam["id"] == campaign_id), {})

        accounts = config.get("accounts", [])
        acc = next((a for a in accounts if a.get("id") == c.get("sender_account_id")), None) or next((a for a in accounts if a.get("is_default")), None) or (accounts[0] if accounts else None)

        if not acc:
            r.errors.append("No sender account configured or selected.")
        else:
            acc_valid = True
            for v in ["smtp_server", "sender_email", "sender_password", "smtp_port"]:
                if not acc.get(v):
                    r.errors.append(f"Sender account is missing required field: {v}")
                    acc_valid = False
            if acc_valid:
                r.successes.append(f"Sender account '{acc.get('name') or acc.get('sender_email')}' is properly configured.")

        html_template = await self.template_service.get_template(campaign_id)
        if not html_template:
            r.errors.append("Email template is empty.")
        if not subject_template:
            r.errors.append("Email subject is empty.")
        if html_template and subject_template:
            r.successes.append("Email subject and template content are present.")

        if c.get("send_attachments", False):
            if not os.path.isdir(c.get("attachment_folder", "")):
                r.errors.append(f"Attachment folder is invalid or does not exist: {c.get('attachment_folder', '')}")
            else:
                r.successes.append(f"Attachment folder verified: {c.get('attachment_folder', '')}")

        df = pd.DataFrame(await self.recipient_service.get_recipients(campaign_id)).fillna("")

        ph_subject = self._extract_ph(subject_template) if subject_template else set()
        ph_body = self._extract_ph(html_template) if html_template else set()
        req_cols = ph_subject | ph_body

        if req_cols:
            r.successes.append(f"Found {len(req_cols)} placeholders in email: {', '.join(['{{'+x+'}}' for x in req_cols])}")
        else:
            r.warnings.append("No placeholders found in the email subject or body.")

        if df.empty:
            r.warnings.append("No recipients found for this campaign.")
        else:
            csv_cols = list(df.columns)
            r.successes.append(f"Found {len(csv_cols)} columns in recipient data: {', '.join(csv_cols)}")
            r.successes.append(f"Loaded {len(df)} total recipients.")

            missing = req_cols - set(df.columns)
            if missing:
                for col in missing:
                    r.errors.append(f"Missing required column for placeholder: {{{{{col}}}}}")
            elif req_cols:
                r.successes.append("All placeholders match CSV columns perfectly.")

            for idx, (_, row) in enumerate(df.iterrows()):
                name = str(row.get("Name", "")).strip()
                email = str(row.get("Email", "")).strip()

                if name:
                    identifier = f"'{name}'"
                elif email:
                    identifier = f"Email: '{email}'"
                else:
                    identifier = "Unknown"

                if not name:
                    r.errors.append(f"Row {idx+2} ({identifier}): Missing Name")
                if not email:
                    r.errors.append(f"Row {idx+2} ({identifier}): Missing Email")

                if c.get("send_attachments", False):
                    files = [x.strip() for x in str(row.get("AttachmentFile", "")).split(";") if x.strip()]
                    if not files:
                        r.warnings.append(f"Row {idx+2} ({identifier}): No attachment file specified but attachments are enabled.")
                    for f in files:
                        if not os.path.exists(os.path.join(c.get("attachment_folder", ""), f)):
                            r.errors.append(f"Row {idx+2} ({identifier}): Attachment file '{f}' not found")
        return r

