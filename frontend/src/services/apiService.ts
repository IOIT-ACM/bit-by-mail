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

  saveTemplate(emailBody: string) {
    this.sendMessage("save_template", emailBody);
  }

  saveConfig(config: Partial<Config>) {
    const { config: currentConfig, sender_password } = useAppStore.getState();
    const fullConfig = { ...currentConfig, ...config, sender_password };
    this.sendMessage("save_config", fullConfig);
  }

  saveAndTestConfig(config: Omit<Config, "sender_password">, password: string) {
    const { setConfig, clearLogs } = useAppStore.getState();
    const fullConfig = { ...config, sender_password: password };

    setConfig(config);
    this.sendMessage("save_config", fullConfig);

    clearLogs();
    this.sendMessage("preflight_check", fullConfig);
  }

  saveRecipients(recipients: Recipient[]) {
    this.sendMessage("save_recipients", recipients);
  }

  uploadRecipients(base64Content: string) {
    this.sendMessage("upload_recipients", base64Content);
  }

  startMailing() {
    const { config, recipients, sender_password, clearLogs, setIsSending } =
      useAppStore.getState();
    if (recipients.length === 0) return;

    clearLogs();
    setIsSending(true);
    const fullConfig = { ...config, sender_password };
    this.sendMessage("start_mailing", { config: fullConfig, recipients });
  }

  runPreflightCheck(configOverride?: Config) {
    const { config, sender_password, clearLogs } = useAppStore.getState();
    clearLogs();
    const fullConfig = configOverride
      ? configOverride
      : { ...config, sender_password };
    this.sendMessage("preflight_check", fullConfig);
  }
}

export const apiService = new ApiService();
