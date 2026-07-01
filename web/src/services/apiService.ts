import type { Config, Recipient } from '@/types'

class ApiService {
  private socket: WebSocket | null = null
  private resolvers: Map<string, Function[]> = new Map()
  private messageQueue: string[] = []

  setSocket(socket: WebSocket | null) {
    this.socket = socket
  }

  flushQueue() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      while (this.messageQueue.length > 0) {
        const msg = this.messageQueue.shift()
        if (msg) this.socket.send(msg)
      }
    }
  }

  sendMessage(action: string, payload?: any) {
    const msg = JSON.stringify({ action, payload })
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(msg)
    } else {
      this.messageQueue.push(msg)
    }
  }

  async request(
    action: string,
    payload?: any,
    expectedAction?: string,
  ): Promise<any> {
    return new Promise((resolve) => {
      const waitAction = expectedAction || action
      if (!this.resolvers.has(waitAction)) {
        this.resolvers.set(waitAction, [])
      }
      this.resolvers.get(waitAction)!.push(resolve)
      this.sendMessage(action, payload)
    })
  }

  handleResponse(action: string, payload: any) {
    if (this.resolvers.has(action)) {
      const callbacks = this.resolvers.get(action)!
      callbacks.forEach((cb) => cb(payload))
      this.resolvers.delete(action)
    }
  }

  getCampaigns() {
    this.sendMessage('get_campaigns')
  }

  getCampaignData(campaignId: string) {
    this.sendMessage('get_campaign_data', { campaign_id: campaignId })
  }

  createCampaign(
    name: string,
    databaseId?: string,
    templateId?: string,
    senderAccountId?: string,
    isHtml?: boolean,
  ) {
    this.sendMessage('create_campaign', {
      name,
      database_id: databaseId,
      template_id: templateId,
      sender_account_id: senderAccountId,
      is_html: isHtml !== undefined ? isHtml : true,
    })
  }

  updateCampaign(
    campaignId: string,
    updates: {
      name?: string
      subject?: string
      sourceDbId?: string
      attachment_folder?: string
      send_attachments?: boolean
      sender_account_id?: string
      is_html?: boolean
    },
  ) {
    this.sendMessage('update_campaign', { campaign_id: campaignId, updates })
  }

  deleteCampaign(campaignId: string) {
    this.sendMessage('delete_campaign', { campaign_id: campaignId })
  }

  deleteCampaigns(campaignIds: string[]) {
    this.sendMessage('delete_campaigns', { campaign_ids: campaignIds })
  }

  duplicateCampaign(campaignId: string) {
    this.sendMessage('duplicate_campaign', { campaign_id: campaignId })
  }

  saveTemplate(campaignId: string, emailBody: string) {
    this.sendMessage('save_template', {
      campaign_id: campaignId,
      content: emailBody,
    })
  }

  saveConfig(config: Partial<Config>) {
    this.sendMessage('save_config', config)
  }

  clearConfig() {
    this.sendMessage('clear_config')
  }

  saveRecipients(campaignId: string, recipients: Recipient[]) {
    this.sendMessage('save_recipients', { campaign_id: campaignId, recipients })
  }

  uploadRecipients(campaignId: string, base64Content: string) {
    this.sendMessage('upload_recipients', {
      campaign_id: campaignId,
      content: base64Content,
    })
  }

  startMailing(campaignId: string, indices?: number[]) {
    this.sendMessage('start_mailing', {
      campaign_id: campaignId,
      recipient_indices: indices,
    })
  }

  stopMailing() {
    this.sendMessage('stop_mailing')
  }

  getCampaignSummary(campaignId: string, indices?: number[]) {
    this.sendMessage('get_campaign_summary', {
      campaign_id: campaignId,
      recipient_indices: indices,
    })
  }

  runPreflightCheck(campaignId: string) {
    this.sendMessage('preflight_check', {
      campaign_id: campaignId,
    })
  }

  getDatabases() {
    this.sendMessage('get_databases')
  }

  getDatabaseData(databaseId: string) {
    this.sendMessage('get_database_data', { database_id: databaseId })
  }

  createDatabase(name: string, content?: string) {
    this.sendMessage('create_database', { name, content })
  }

  updateDatabase(databaseId: string, updates: { name?: string }) {
    this.sendMessage('update_database', { database_id: databaseId, updates })
  }

  deleteDatabases(databaseIds: string[]) {
    this.sendMessage('delete_databases', { database_ids: databaseIds })
  }

  saveDatabaseData(databaseId: string, recipients: Recipient[]) {
    this.sendMessage('save_database_data', {
      database_id: databaseId,
      recipients,
    })
  }

  importCsvToDatabase(
    databaseId: string,
    base64Content: string,
    mode: 'merge' | 'replace',
  ) {
    this.sendMessage('import_csv_to_database', {
      database_id: databaseId,
      content: base64Content,
      mode,
    })
  }

  getGlobalTemplates() {
    this.sendMessage('get_global_templates')
  }

  getGlobalTemplateData(templateId: string) {
    this.sendMessage('get_global_template_data', { template_id: templateId })
  }

  createGlobalTemplate(
    name: string,
    category: string = '',
    subject: string = '',
    body: string = '',
    isHtml: boolean = true,
    navigate: boolean = true,
  ) {
    this.sendMessage('create_global_template', {
      name,
      category,
      subject,
      body,
      is_html: isHtml,
      navigate,
    })
  }

  updateGlobalTemplate(templateId: string, updates: any, body?: string) {
    this.sendMessage('update_global_template', {
      template_id: templateId,
      updates,
      body,
    })
  }

  deleteGlobalTemplates(templateIds: string[]) {
    this.sendMessage('delete_global_templates', { template_ids: templateIds })
  }

  duplicateGlobalTemplate(templateId: string) {
    this.sendMessage('duplicate_global_template', { template_id: templateId })
  }

  getAssets() {
    this.sendMessage('get_assets')
  }

  createAsset(name: string, url: string, is_gdrive: boolean) {
    this.sendMessage('create_asset', { name, url, is_gdrive })
  }

  deleteAssets(assetIds: string[]) {
    this.sendMessage('delete_assets', { asset_ids: assetIds })
  }

  updateAsset(assetId: string, updates: any) {
    this.sendMessage('update_asset', { asset_id: assetId, updates })
  }
}

export const apiService = new ApiService()
