export interface Config {
  smtp_server: string;
  smtp_port: number;
  sender_email: string;
  sender_password?: string;
  use_ssl: boolean;
  subject_template: string;
  attachment_folder: string;
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

export interface AppState {
  config: Omit<Config, "sender_password">;
  sender_password: string;
  recipients: Recipient[];
  emailBody: string;
  logs: LogEntry[];
  isSending: boolean;
  isPasswordSet: boolean;
}
