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
  SentTimestamp?: string | undefined;
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

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  createdAt: string;
  recipientCount: number;
  latestReportUrl?: string | null;
}

export interface AppState {
  config: Omit<Config, "sender_password" | "subject_template">;
  sender_password: string;
  logs: LogEntry[];
  isSending: boolean;
  isPasswordSet: boolean;
  connectionStatus: "connecting" | "open" | "closed";
  previewRecipient: Recipient | null;
  progress: {
    sent: number;
    total: number;
  };
  recipientIssues: Record<number, RecipientIssue>;
  showCampaignSummaryModal: boolean;
  campaignSummary: CampaignSummary | null;
  campaigns: Campaign[];
  activeCampaignId: string | null;
  activeCampaignData: {
    emailBody: string;
    recipients: Recipient[];
  } | null;
  selectedCampaignIds: Set<string>;
  selectedRecipientIndices: Set<number>;
  isLogCollapsed: boolean;
  showAddRecipientModal: boolean;
}
