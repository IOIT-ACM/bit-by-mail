export interface Config {
  smtp_server: string;
  smtp_port: number;
  sender_email: string;
  sender_password?: string;
  use_ssl: boolean;
  subject_template: string;
  attachment_folder: string;
  send_attachments: boolean;
}

export interface Recipient {
  Name: string;
  Email: string;
  AttachmentFile: string;
  Status: string;
  [key: string]: string;
}

export interface LogEntry {
  level: string;
  message: string;
}

export interface RecipientIssue {
  type: "error" | "warning";
  message: string;
}

export interface CampaignSummary {
  total_recipients: number;
  recipients_to_send: number;
  total_attachment_size_bytes: number;
  preview_subject: string;
  preview_body: string;
}

export interface AppState {
  config: Omit<Config, "sender_password">;
  sender_password: string;
  recipients: Recipient[];
  emailBody: string;
  logs: LogEntry[];
  isSending: boolean;
  isPasswordSet: boolean;
  connectionStatus: "connecting" | "open" | "closed";
  previewRecipient: Recipient | null;
  progress: number;
  recipientIssues: Record<number, RecipientIssue>;
  showCampaignSummaryModal: boolean;
  campaignSummary: CampaignSummary | null;
}
