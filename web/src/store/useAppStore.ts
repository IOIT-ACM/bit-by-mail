import { create } from "zustand";
import { AppState, Recipient, LogEntry, CampaignSummary, RecipientIssue } from "@/types";

type ConnectionStatus = "connecting" | "open" | "closed";

interface AppActions {
  setSenderPassword: (password: string) => void;
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  setIsSending: (isSending: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setPreviewRecipient: (recipient: Recipient | null) => void;
  setProgress: (sent: number, total: number) => void;
  setRecipientIssues: (issues: Record<number, RecipientIssue>) => void;
  clearRecipientIssues: () => void;
  setShowCampaignSummaryModal: (show: boolean) => void;
  setCampaignSummary: (summary: CampaignSummary | null) => void;
  setSelectedCampaignIds: (ids: Set<string>) => void;
  clearCampaignSelection: () => void;
  toggleCampaignSelection: (id: string) => void;
  selectSingleCampaign: (id: string) => void;
  selectAllCampaigns: (ids: string[]) => void;
  setIsLogCollapsed: (isCollapsed: boolean) => void;
  toggleRecipientSelection: (index: number) => void;
  clearRecipientSelection: () => void;
  selectAllRecipients: (count: number) => void;
  setShowAddRecipientModal: (show: boolean) => void;
  setIsPasswordSet: (isSet: boolean) => void;
}

export const useAppStore = create<AppState & AppActions>((set) => ({
  sender_password: "",
  logs: [],
  isSending: false,
  isPasswordSet: false,
  connectionStatus: "connecting",
  previewRecipient: null,
  progress: { sent: 0, total: 0 },
  recipientIssues: {},
  showCampaignSummaryModal: false,
  campaignSummary: null,
  selectedCampaignIds: new Set(),
  selectedRecipientIndices: new Set(),
  isLogCollapsed: false,
  showAddRecipientModal: false,

  setSenderPassword: (password) => set({ sender_password: password }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  clearLogs: () => set({ logs: [] }),
  setIsSending: (isSending) => {
    set({ isSending });
    if (isSending) {
      set({ progress: { sent: 0, total: 0 }, recipientIssues: {} });
    }
  },
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setPreviewRecipient: (recipient) => set({ previewRecipient: recipient }),
  setProgress: (sent, total) => set({ progress: { sent, total } }),
  setRecipientIssues: (issues) => set({ recipientIssues: issues }),
  clearRecipientIssues: () => set({ recipientIssues: {} }),
  setShowCampaignSummaryModal: (show) => set({ showCampaignSummaryModal: show }),
  setCampaignSummary: (summary) => set({ campaignSummary: summary }),
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
  selectAllCampaigns: (ids) => set({ selectedCampaignIds: new Set(ids) }),
  setIsLogCollapsed: (isCollapsed) => set({ isLogCollapsed: isCollapsed }),
  toggleRecipientSelection: (index) =>
    set((state) => {
      const newSelection = new Set(state.selectedRecipientIndices);
      if (newSelection.has(index)) {
        newSelection.delete(index);
      } else {
        newSelection.add(index);
      }
      return { selectedRecipientIndices: newSelection };
    }),
  clearRecipientSelection: () => set({ selectedRecipientIndices: new Set() }),
  selectAllRecipients: (count) => set({ selectedRecipientIndices: new Set(Array.from({ length: count }, (_, i) => i)) }),
  setShowAddRecipientModal: (show) => set({ showAddRecipientModal: show }),
  setIsPasswordSet: (isSet) => set({ isPasswordSet: isSet }),
}));

