import type { Config, Recipient } from '@/types'

const getApiUrl = (path: string) => {
  return window.location.port === '3000' ? `http://localhost:8888${path}` : path
}

class ApiService {
  private socket: WebSocket | null = null
  private resolvers: Map<string, { resolve: Function; reject: Function }[]> =
    new Map()
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

  sendMessage(action: string, payload?: any, req_id?: string) {
    const data: any = { action, payload }
    if (req_id) data.req_id = req_id
    const msg = JSON.stringify(data)

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
    return new Promise((resolve, reject) => {
      const waitAction = expectedAction || action
      const reqId = crypto.randomUUID()

      const wrappedResolve = (data: any) => {
        this.resolvers.delete(reqId)
        resolve(data)
      }

      const wrappedReject = (err: any) => {
        this.resolvers.delete(reqId)
        reject(err)
      }

      if (!this.resolvers.has(waitAction)) {
        this.resolvers.set(waitAction, [])
      }
      if (!this.resolvers.has(reqId)) {
        this.resolvers.set(reqId, [])
      }

      this.resolvers
        .get(waitAction)!
        .push({ resolve: wrappedResolve, reject: wrappedReject })
      this.resolvers
        .get(reqId)!
        .push({ resolve: wrappedResolve, reject: wrappedReject })

      this.sendMessage(action, payload, reqId)
    })
  }

  handleResponse(id: string, payload: any) {
    if (this.resolvers.has(id)) {
      const callbacks = this.resolvers.get(id)!
      callbacks.forEach((cb) => cb.resolve(payload))
      this.resolvers.delete(id)
    }
  }

  handleError(id: string, error: string) {
    if (this.resolvers.has(id)) {
      const callbacks = this.resolvers.get(id)!
      callbacks.forEach((cb) => cb.reject(new Error(error)))
      this.resolvers.delete(id)
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
      delay?: number
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

  async uploadRecipientsHttp(campaignId: string, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(getApiUrl(`/api/upload/recipients/${campaignId}`), {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) throw new Error('Upload failed')
    return res.json()
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

  async uploadDatabaseHttp(
    databaseId: string,
    file: File,
    mode: 'merge' | 'replace',
  ) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(
      getApiUrl(`/api/upload/database/${databaseId}?mode=${mode}`),
      {
        method: 'POST',
        body: formData,
      },
    )
    if (!res.ok) throw new Error('Upload failed')
    return res.json()
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
