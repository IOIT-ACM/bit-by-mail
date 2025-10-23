import { create } from "zustand";
import {
  AppState,
  Recipient,
  Config,
  LogEntry,
  CampaignSummary,
  RecipientIssue,
} from "../types";

type ConnectionStatus = "connecting" | "open" | "closed";

interface AppActions {
  setConfig: (config: Omit<Config, "sender_password">) => void;
  setSenderPassword: (password: string) => void;
  setRecipients: (recipients: Recipient[]) => void;
  updateRecipient: (index: number, recipient: Recipient) => void;
  setEmailBody: (body: string) => void;
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  setIsSending: (isSending: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setInitialData: (data: {
    config: Config;
    recipients: Recipient[];
    template: string;
    is_password_set: boolean;
  }) => void;
  setPreviewRecipient: (recipient: Recipient | null) => void;
  setProgress: (progress: number) => void;
  setRecipientIssues: (issues: Record<number, RecipientIssue>) => void;
  clearRecipientIssues: () => void;
  setShowCampaignSummaryModal: (show: boolean) => void;
  setCampaignSummary: (summary: CampaignSummary | null) => void;
}

const emptyConfig: Omit<Config, "sender_password"> = {
  smtp_server: "",
  smtp_port: 587,
  sender_email: "",
  use_ssl: false,
  subject_template: "Hello {{Name}}!",
  attachment_folder: "",
  send_attachments: true,
};

export const useAppStore = create<AppState & AppActions>((set) => ({
  config: emptyConfig,
  sender_password: "",
  recipients: [],
  emailBody: "",
  logs: [],
  isSending: false,
  isPasswordSet: false,
  connectionStatus: "connecting",
  previewRecipient: null,
  progress: 0,
  recipientIssues: {},
  showCampaignSummaryModal: false,
  campaignSummary: null,

  setConfig: (config) => set({ config }),
  setSenderPassword: (password) => set({ sender_password: password }),
  setRecipients: (recipients) => set({ recipients, recipientIssues: {} }),
  updateRecipient: (index, updatedRecipient) =>
    set((state) => {
      const newRecipients = [...state.recipients];
      newRecipients[index] = updatedRecipient;
      return { recipients: newRecipients };
    }),
  setEmailBody: (emailBody) => set({ emailBody }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  clearLogs: () => set({ logs: [] }),
  setIsSending: (isSending) => {
    if (isSending) {
      set({ isSending, progress: 0, recipientIssues: {} });
    } else {
      set({ isSending });
    }
  },
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setInitialData: (data) => {
    const { sender_password, ...restConfig } = data.config;
    set({
      config: restConfig,
      sender_password: "",
      recipients: data.recipients,
      emailBody: data.template,
      isPasswordSet: data.is_password_set,
      recipientIssues: {},
    });
  },
  setPreviewRecipient: (recipient) => set({ previewRecipient: recipient }),
  setProgress: (progress) => set({ progress }),
  setRecipientIssues: (issues) => set({ recipientIssues: issues }),
  clearRecipientIssues: () => set({ recipientIssues: {} }),
  setShowCampaignSummaryModal: (show) =>
    set({ showCampaignSummaryModal: show }),
  setCampaignSummary: (summary) => set({ campaignSummary: summary }),
}));
