import { useAppStore } from "../store/useAppStore";
import { Config, Recipient } from "../types";

class ApiService {
  private socket: WebSocket | null = null;

  setSocket(socket: WebSocket | null) {
    this.socket = socket;
  }

  sendMessage(action: string, payload?: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ action, payload }));
    } else {
      console.error("WebSocket is not connected.");
    }
  }

  getCampaigns() {
    this.sendMessage("get_campaigns");
  }

  getCampaignData(campaignId: string) {
    this.sendMessage("get_campaign_data", { campaign_id: campaignId });
  }

  createCampaign(name: string) {
    this.sendMessage("create_campaign", { name });
  }

  updateCampaign(
    campaignId: string,
    updates: { name?: string; subject?: string },
  ) {
    this.sendMessage("update_campaign", { campaign_id: campaignId, updates });
  }

  deleteCampaign(campaignId: string) {
    this.sendMessage("delete_campaign", { campaign_id: campaignId });
  }

  deleteCampaigns(campaignIds: string[]) {
    this.sendMessage("delete_campaigns", { campaign_ids: campaignIds });
  }

  saveTemplate(campaignId: string, emailBody: string) {
    this.sendMessage("save_template", {
      campaign_id: campaignId,
      content: emailBody,
    });
  }

  saveConfig(config: Partial<Omit<Config, "subject_template">>) {
    const { config: currentConfig, sender_password } = useAppStore.getState();
    const fullConfig = { ...currentConfig, ...config, sender_password };
    this.sendMessage("save_config", fullConfig);
  }

  saveAndTestConfig(
    config: Omit<Config, "sender_password" | "subject_template">,
    password: string,
  ) {
    const { setConfig, clearLogs, activeCampaignId } = useAppStore.getState();
    const fullConfig = { ...config, sender_password: password };

    setConfig(config);
    this.sendMessage("save_config", fullConfig);

    if (activeCampaignId) {
      clearLogs();
      this.sendMessage("preflight_check", {
        campaign_id: activeCampaignId,
        config: fullConfig,
      });
    }
  }

  saveRecipients(campaignId: string, recipients: Recipient[]) {
    this.sendMessage("save_recipients", {
      campaign_id: campaignId,
      recipients,
    });
  }

  uploadRecipients(campaignId: string, base64Content: string) {
    this.sendMessage("upload_recipients", {
      campaign_id: campaignId,
      content: base64Content,
    });
  }

  startMailing(campaignId: string, indices?: number[]) {
    const { config, clearLogs } = useAppStore.getState();
    clearLogs();
    this.sendMessage("start_mailing", {
      campaign_id: campaignId,
      config: config,
      recipient_indices: indices,
    });
  }

  stopMailing() {
    this.sendMessage("stop_mailing");
  }

  getCampaignSummary(campaignId: string, indices?: number[]) {
    const { config } = useAppStore.getState();
    this.sendMessage("get_campaign_summary", {
      campaign_id: campaignId,
      config: config,
      recipient_indices: indices,
    });
  }

  runPreflightCheck(campaignId: string, configOverride?: Config) {
    const { config, clearLogs, setIsLogCollapsed } = useAppStore.getState();
    clearLogs();
    setIsLogCollapsed(false);
    const configPayload = configOverride ? configOverride : config;
    this.sendMessage("preflight_check", {
      campaign_id: campaignId,
      config: configPayload,
    });
  }
}

export const apiService = new ApiService();
