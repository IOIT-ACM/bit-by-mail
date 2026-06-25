import { Config, Recipient } from "../types";
import { queryClient } from "../queryClient";

class ApiService {
  private socket: WebSocket | null = null;
  private resolvers: Map<string, Function[]> = new Map();

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

  async request(action: string, payload?: any, expectedAction?: string): Promise<any> {
    return new Promise((resolve) => {
      const waitAction = expectedAction || action;
      if (!this.resolvers.has(waitAction)) {
        this.resolvers.set(waitAction, []);
      }
      this.resolvers.get(waitAction)!.push(resolve);
      this.sendMessage(action, payload);
    });
  }

  handleResponse(action: string, payload: any) {
    if (this.resolvers.has(action)) {
      const callbacks = this.resolvers.get(action)!;
      callbacks.forEach(cb => cb(payload));
      this.resolvers.delete(action);
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

  updateCampaign(campaignId: string, updates: { name?: string; subject?: string }) {
    this.sendMessage("update_campaign", { campaign_id: campaignId, updates });
  }

  deleteCampaign(campaignId: string) {
    this.sendMessage("delete_campaign", { campaign_id: campaignId });
  }

  deleteCampaigns(campaignIds: string[]) {
    this.sendMessage("delete_campaigns", { campaign_ids: campaignIds });
  }

  saveTemplate(campaignId: string, emailBody: string) {
    this.sendMessage("save_template", { campaign_id: campaignId, content: emailBody });
  }

  saveConfig(config: Partial<Omit<Config, "subject_template">>, sender_password?: string) {
    const currentConfig = (queryClient.getQueryData(['config']) as Partial<Config>) || {};
    const fullConfig = { ...currentConfig, ...config, sender_password };
    this.sendMessage("save_config", fullConfig);
  }

  saveAndTestConfig(config: Omit<Config, "sender_password" | "subject_template">, password: string, activeCampaignId?: string) {
    const fullConfig = { ...config, sender_password: password };
    queryClient.setQueryData(['config'], config);
    this.sendMessage("save_config", fullConfig);
    if (activeCampaignId) {
      this.sendMessage("preflight_check", { campaign_id: activeCampaignId, config: fullConfig });
    }
  }

  saveRecipients(campaignId: string, recipients: Recipient[]) {
    this.sendMessage("save_recipients", { campaign_id: campaignId, recipients });
  }

  uploadRecipients(campaignId: string, base64Content: string) {
    this.sendMessage("upload_recipients", { campaign_id: campaignId, content: base64Content });
  }

  startMailing(campaignId: string, indices?: number[]) {
    const config = queryClient.getQueryData(['config']);
    this.sendMessage("start_mailing", { campaign_id: campaignId, config: config, recipient_indices: indices });
  }

  stopMailing() {
    this.sendMessage("stop_mailing");
  }

  getCampaignSummary(campaignId: string, indices?: number[]) {
    const config = queryClient.getQueryData(['config']);
    this.sendMessage("get_campaign_summary", { campaign_id: campaignId, config: config, recipient_indices: indices });
  }

  runPreflightCheck(campaignId: string, configOverride?: Config) {
    const config = queryClient.getQueryData(['config']);
    const configPayload = configOverride ? configOverride : config;
    this.sendMessage("preflight_check", { campaign_id: campaignId, config: configPayload });
  }
}

export const apiService = new ApiService();

