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
  CertificateFile: string;
  Status: string;
  [key: string]: string;
}

export interface AppState {
  config: Omit<Config, "sender_password">;
  sender_password: string;
  recipients: Recipient[];
  emailBody: string;
  logs: string[];
  isSending: boolean;
}
