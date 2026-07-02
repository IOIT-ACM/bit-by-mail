export interface Account {
  id: string
  name: string
  smtp_server: string
  smtp_port: number
  sender_email: string
  sender_password?: string
  has_password?: boolean
  use_ssl: boolean
  is_default: boolean
}

export interface Config {
  accounts: Account[]
  server_pwd?: string
}

export interface Recipient {
  Name: string
  Email: string
  AttachmentFile: string
  Status?: string
  SentTimestamp?: string | undefined
  [key: string]: any
}

export interface LogEntry {
  level: string
  message: string
}

export interface RecipientIssue {
  type: 'error' | 'warning'
  message: string
  index: number
}

export interface CampaignSummary {
  total_recipients: number
  recipients_to_send: number
  total_attachment_size_bytes: number
  preview_subject: string
  preview_body: string
}

export interface PreflightResult {
  ok: boolean
  errors: string[]
  warnings: string[]
  successes: string[]
  recipient_issues: RecipientIssue[]
}

export interface Campaign {
  id: string
  name: string
  subject: string
  createdAt: string
  recipientCount: number
  latestReportUrl?: string | null
  sourceDbId?: string
  attachment_folder?: string
  send_attachments?: boolean
  sender_account_id?: string
  is_html?: boolean
  delay?: number
}

export interface CampaignData {
  campaign_id: string
  emailBody: string
  recipients: Recipient[]
}

export interface Database {
  id: string
  name: string
  createdAt: string
  recipientCount: number
}

export interface DatabaseData {
  database_id: string
  recipients: Recipient[]
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  category: string
  createdAt: string
  is_html?: boolean
}

export interface EmailTemplateData extends EmailTemplate {
  body: string
}

export interface Asset {
  id: string
  name: string
  url: string
  createdAt: string
}

export interface AppState {
  logs: LogEntry[]
  isSending: boolean
  isStopping: boolean
  connectionStatus: 'connecting' | 'open' | 'closed'
  saveStatus: 'saved' | 'saving' | 'error'
  previewRecipient: Recipient | null
  progress: {
    sent: number
    total: number
  }
  recipientIssues: Record<number, RecipientIssue>
  showCampaignSummaryModal: boolean
  campaignSummary: CampaignSummary | null
  selectedCampaignIds: Set<string>
  selectedDatabaseIds: Set<string>
  selectedTemplateIds: Set<string>
  selectedAssetIds: Set<string>
  selectedRecipientIndices: Set<number>
  isLogCollapsed: boolean
  isRecipientsCollapsed: boolean
  isSidebarCollapsed: boolean
  showAddRecipientModal: boolean
  showCampaignSettingsModal: boolean
}
