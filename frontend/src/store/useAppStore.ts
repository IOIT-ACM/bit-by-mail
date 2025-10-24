import { create } from "zustand";
import {
  AppState,
  Recipient,
  Config,
  LogEntry,
  CampaignSummary,
  RecipientIssue,
  Campaign,
} from "../types";

type ConnectionStatus = "connecting" | "open" | "closed";

interface AppActions {
  setConfig: (
    config: Omit<Config, "sender_password" | "subject_template">,
  ) => void;
  setSenderPassword: (password: string) => void;
  setRecipients: (recipients: Recipient[]) => void;
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  setIsSending: (isSending: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setInitialData: (data: {
    campaigns: Campaign[];
    config: Omit<Config, "sender_password" | "subject_template">;
    is_password_set: boolean;
  }) => void;
  setPreviewRecipient: (recipient: Recipient | null) => void;
  setProgress: (progress: number) => void;
  setRecipientIssues: (issues: Record<number, RecipientIssue>) => void;
  clearRecipientIssues: () => void;
  setShowCampaignSummaryModal: (show: boolean) => void;
  setCampaignSummary: (summary: CampaignSummary | null) => void;
  setCampaigns: (campaigns: Campaign[]) => void;
  setActiveCampaignId: (id: string | null) => void;
  setActiveCampaignData: (
    data: { emailBody: string; recipients: Recipient[] } | null,
  ) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  setSelectedCampaignIds: (ids: Set<string>) => void;
  clearCampaignSelection: () => void;
  toggleCampaignSelection: (id: string) => void;
  selectSingleCampaign: (id: string) => void;
  selectAllCampaigns: () => void;
  setIsLogCollapsed: (isCollapsed: boolean) => void;
}

const emptyConfig: Omit<Config, "sender_password" | "subject_template"> = {
  smtp_server: "",
  smtp_port: 587,
  sender_email: "",
  use_ssl: false,
  attachment_folder: "",
  send_attachments: true,
};

export const useAppStore = create<AppState & AppActions>((set, get) => ({
  config: emptyConfig,
  sender_password: "",
  logs: [],
  isSending: false,
  isPasswordSet: false,
  connectionStatus: "connecting",
  previewRecipient: null,
  progress: 0,
  recipientIssues: {},
  showCampaignSummaryModal: false,
  campaignSummary: null,
  campaigns: [],
  activeCampaignId: null,
  activeCampaignData: null,
  selectedCampaignIds: new Set(),
  isLogCollapsed: false,

  setConfig: (config) => set({ config }),
  setSenderPassword: (password) => set({ sender_password: password }),
  setRecipients: (recipients) => {
    const { activeCampaignData } = get();
    if (activeCampaignData) {
      set({
        activeCampaignData: { ...activeCampaignData, recipients },
        recipientIssues: {},
      });
    }
  },
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
    set({
      campaigns: data.campaigns,
      config: data.config,
      sender_password: "",
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
  setCampaigns: (campaigns) => set({ campaigns }),
  setActiveCampaignId: (id) => {
    if (id === null) {
      set({ activeCampaignId: null, activeCampaignData: null, logs: [] });
    } else {
      set({
        activeCampaignId: id,
        activeCampaignData: null,
        selectedCampaignIds: new Set(),
      });
    }
  },
  setActiveCampaignData: (data) => set({ activeCampaignData: data }),
  updateCampaign: (id, updates) =>
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === id ? { ...c, ...updates } : c,
      ),
    })),
  setSelectedCampaignIds: (ids) => set({ selectedCampaignIds: ids }),
  clearCampaignSelection: () => set({ selectedCampaignIds: new Set() }),
  toggleCampaignSelection: (id) =>
    set((state) => {
      const newSelection = new Set(state.selectedCampaignIds);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return { selectedCampaignIds: newSelection };
    }),
  selectSingleCampaign: (id) =>
    set((state) => {
      const currentSelection = state.selectedCampaignIds;
      if (currentSelection.size === 1 && currentSelection.has(id)) {
        return { selectedCampaignIds: new Set() };
      }
      return { selectedCampaignIds: new Set([id]) };
    }),
  selectAllCampaigns: () =>
    set((state) => ({
      selectedCampaignIds: new Set(state.campaigns.map((c) => c.id)),
    })),
  setIsLogCollapsed: (isCollapsed) => set({ isLogCollapsed: isCollapsed }),
}));
