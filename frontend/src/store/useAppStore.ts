import { create } from "zustand";
import { AppState, Recipient, Config, LogEntry } from "../types";

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
}

const emptyConfig: Omit<Config, "sender_password"> = {
  smtp_server: "",
  smtp_port: 587,
  sender_email: "",
  use_ssl: false,
  subject_template: "Hello {Name}!",
  attachment_folder: "attachments/",
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

  setConfig: (config) => set({ config }),
  setSenderPassword: (password) => set({ sender_password: password }),
  setRecipients: (recipients) => set({ recipients }),
  updateRecipient: (index, updatedRecipient) =>
    set((state) => {
      const newRecipients = [...state.recipients];
      newRecipients[index] = updatedRecipient;
      return { recipients: newRecipients };
    }),
  setEmailBody: (emailBody) => set({ emailBody }),
  addLog: (log) => set((state) => ({ logs: [...state.logs.slice(-100), log] })),
  clearLogs: () => set({ logs: [] }),
  setIsSending: (isSending) => set({ isSending }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setInitialData: (data) => {
    const { sender_password, ...restConfig } = data.config;
    set({
      config: restConfig,
      sender_password: "",
      recipients: data.recipients,
      emailBody: data.template,
      isPasswordSet: data.is_password_set,
    });
  },
}));
