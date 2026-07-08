import { create } from 'zustand'
import type {
  AppState,
  Recipient,
  LogEntry,
  CampaignSummary,
  RecipientIssue,
  PreflightResult,
} from '@/types'

type ConnectionStatus = 'connecting' | 'open' | 'closed'

interface AppActions {
  addLog: (log: LogEntry) => void
  clearLogs: () => void
  setIsSending: (isSending: boolean) => void
  setIsStopping: (isStopping: boolean) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  setSaveStatus: (status: 'saved' | 'saving' | 'error') => void
  setPreviewRecipient: (recipient: Recipient | null) => void
  setProgress: (sent: number, total: number) => void
  incrementStatusCount: (status: 'SENT' | 'ERROR' | 'SKIPPED') => void
  setRecipientIssues: (issues: Record<number, RecipientIssue>) => void
  clearRecipientIssues: () => void
  setShowCampaignSummaryModal: (show: boolean) => void
  setCampaignSummary: (summary: CampaignSummary | null) => void
  setShowPreflightModal: (show: boolean) => void
  setPreflightResult: (result: PreflightResult | null) => void
  setSelectedCampaignIds: (ids: Set<string>) => void
  clearCampaignSelection: () => void
  toggleCampaignSelection: (id: string) => void
  selectSingleCampaign: (id: string) => void
  selectAllCampaigns: (ids: string[]) => void
  setSelectedDatabaseIds: (ids: Set<string>) => void
  clearDatabaseSelection: () => void
  toggleDatabaseSelection: (id: string) => void
  selectSingleDatabase: (id: string) => void
  selectAllDatabases: (ids: string[]) => void
  setSelectedTemplateIds: (ids: Set<string>) => void
  clearTemplateSelection: () => void
  toggleTemplateSelection: (id: string) => void
  selectSingleTemplate: (id: string) => void
  selectAllTemplates: (ids: string[]) => void
  setSelectedAssetIds: (ids: Set<string>) => void
  clearAssetSelection: () => void
  toggleAssetSelection: (id: string) => void
  setIsLogCollapsed: (isCollapsed: boolean) => void
  setIsRecipientsCollapsed: (isCollapsed: boolean) => void
  setIsSidebarCollapsed: (isCollapsed: boolean) => void
  toggleRecipientSelection: (index: number) => void
  clearRecipientSelection: () => void
  selectAllRecipients: (count: number) => void
  setShowAddRecipientModal: (show: boolean) => void
  setShowCampaignSettingsModal: (show: boolean) => void
  setShowActivityView: (show: boolean) => void
}

export const useAppStore = create<AppState & AppActions>((set) => ({
  logs: [],
  isSending: false,
  isStopping: false,
  connectionStatus: 'connecting',
  saveStatus: 'saved',
  previewRecipient: null,
  progress: { sent: 0, total: 0 },
  statusCounts: { sent: 0, error: 0, skipped: 0 },
  recipientIssues: {},
  showCampaignSummaryModal: false,
  campaignSummary: null,
  showPreflightModal: false,
  preflightResult: null,
  selectedCampaignIds: new Set(),
  selectedDatabaseIds: new Set(),
  selectedTemplateIds: new Set(),
  selectedAssetIds: new Set(),
  selectedRecipientIndices: new Set(),
  isLogCollapsed: true,
  isRecipientsCollapsed: true,
  isSidebarCollapsed: false,
  showAddRecipientModal: false,
  showCampaignSettingsModal: false,
  showActivityView: false,

  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  clearLogs: () => set({ logs: [] }),
  setIsSending: (isSending) => {
    set({ isSending })
    if (isSending) {
      set({
        progress: { sent: 0, total: 0 },
        statusCounts: { sent: 0, error: 0, skipped: 0 },
        recipientIssues: {},
      })
    }
  },
  setIsStopping: (isStopping) => set({ isStopping }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setSaveStatus: (status) => set({ saveStatus: status }),
  setPreviewRecipient: (recipient) => set({ previewRecipient: recipient }),
  setProgress: (sent, total) => set({ progress: { sent, total } }),
  incrementStatusCount: (status) =>
    set((state) => {
      const key = status.toLowerCase() as 'sent' | 'error' | 'skipped'
      return {
        statusCounts: {
          ...state.statusCounts,
          [key]: state.statusCounts[key] + 1,
        },
      }
    }),
  setRecipientIssues: (issues) => set({ recipientIssues: issues }),
  clearRecipientIssues: () => set({ recipientIssues: {} }),
  setShowCampaignSummaryModal: (show) =>
    set({ showCampaignSummaryModal: show }),
  setCampaignSummary: (summary) => set({ campaignSummary: summary }),
  setShowPreflightModal: (show) => set({ showPreflightModal: show }),
  setPreflightResult: (result) => set({ preflightResult: result }),
  setSelectedCampaignIds: (ids) => set({ selectedCampaignIds: ids }),
  clearCampaignSelection: () => set({ selectedCampaignIds: new Set() }),
  toggleCampaignSelection: (id) =>
    set((state) => {
      const newSelection = new Set(state.selectedCampaignIds)
      if (newSelection.has(id)) {
        newSelection.delete(id)
      } else {
        newSelection.add(id)
      }
      return { selectedCampaignIds: newSelection }
    }),
  selectSingleCampaign: (id) =>
    set((state) => {
      const currentSelection = state.selectedCampaignIds
      if (currentSelection.size === 1 && currentSelection.has(id)) {
        return { selectedCampaignIds: new Set() }
      }
      return { selectedCampaignIds: new Set([id]) }
    }),
  selectAllCampaigns: (ids) => set({ selectedCampaignIds: new Set(ids) }),
  setSelectedDatabaseIds: (ids) => set({ selectedDatabaseIds: ids }),
  clearDatabaseSelection: () => set({ selectedDatabaseIds: new Set() }),
  toggleDatabaseSelection: (id) =>
    set((state) => {
      const newSelection = new Set(state.selectedDatabaseIds)
      if (newSelection.has(id)) {
        newSelection.delete(id)
      } else {
        newSelection.add(id)
      }
      return { selectedDatabaseIds: newSelection }
    }),
  selectSingleDatabase: (id) =>
    set((state) => {
      const currentSelection = state.selectedDatabaseIds
      if (currentSelection.size === 1 && currentSelection.has(id)) {
        return { selectedDatabaseIds: new Set() }
      }
      return { selectedDatabaseIds: new Set([id]) }
    }),
  selectAllDatabases: (ids) => set({ selectedDatabaseIds: new Set(ids) }),
  setSelectedTemplateIds: (ids) => set({ selectedTemplateIds: ids }),
  clearTemplateSelection: () => set({ selectedTemplateIds: new Set() }),
  toggleTemplateSelection: (id) =>
    set((state) => {
      const newSelection = new Set(state.selectedTemplateIds)
      if (newSelection.has(id)) {
        newSelection.delete(id)
      } else {
        newSelection.add(id)
      }
      return { selectedTemplateIds: newSelection }
    }),
  selectSingleTemplate: (id) =>
    set((state) => {
      const currentSelection = state.selectedTemplateIds
      if (currentSelection.size === 1 && currentSelection.has(id)) {
        return { selectedTemplateIds: new Set() }
      }
      return { selectedTemplateIds: new Set([id]) }
    }),
  selectAllTemplates: (ids) => set({ selectedTemplateIds: new Set(ids) }),
  setSelectedAssetIds: (ids) => set({ selectedAssetIds: ids }),
  clearAssetSelection: () => set({ selectedAssetIds: new Set() }),
  toggleAssetSelection: (id) =>
    set((state) => {
      const newSelection = new Set(state.selectedAssetIds)
      if (newSelection.has(id)) {
        newSelection.delete(id)
      } else {
        newSelection.add(id)
      }
      return { selectedAssetIds: newSelection }
    }),
  setIsLogCollapsed: (isCollapsed) => set({ isLogCollapsed: isCollapsed }),
  setIsRecipientsCollapsed: (isCollapsed) =>
    set({ isRecipientsCollapsed: isCollapsed }),
  setIsSidebarCollapsed: (isCollapsed) =>
    set({ isSidebarCollapsed: isCollapsed }),
  toggleRecipientSelection: (index) =>
    set((state) => {
      const newSelection = new Set(state.selectedRecipientIndices)
      if (newSelection.has(index)) {
        newSelection.delete(index)
      } else {
        newSelection.add(index)
      }
      return { selectedRecipientIndices: newSelection }
    }),
  clearRecipientSelection: () => set({ selectedRecipientIndices: new Set() }),
  selectAllRecipients: (count) =>
    set({
      selectedRecipientIndices: new Set(
        Array.from({ length: count }, (_, i) => i),
      ),
    }),
  setShowAddRecipientModal: (show) => set({ showAddRecipientModal: show }),
  setShowCampaignSettingsModal: (show) =>
    set({ showCampaignSettingsModal: show }),
  setShowActivityView: (show) => set({ showActivityView: show }),
}))
