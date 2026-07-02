import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { apiService } from '@/services/apiService'
import { useAppStore } from '@/store/useAppStore'
import { Save, AlertCircle } from 'lucide-react'
import type { Campaign, Config } from '@/types'
import { useQuery } from '@tanstack/react-query'

export const CampaignSettingsModal: React.FC<{ campaign: Campaign }> = ({
  campaign,
}) => {
  const { data: config } = useQuery<Config>({ queryKey: ['config'] })
  const accounts = config?.accounts || []

  const setShowCampaignSettingsModal = useAppStore(
    (state) => state.setShowCampaignSettingsModal,
  )
  const [folder, setFolder] = useState(
    campaign.attachment_folder || config?.server_pwd || '',
  )
  const [sendAttachments, setSendAttachments] = useState(
    campaign.send_attachments || false,
  )
  const [senderAccountId, setSenderAccountId] = useState(
    campaign.sender_account_id || '',
  )
  const [delay, setDelay] = useState(campaign.delay || 0)

  const hasDefaultAccount = accounts.some((a) => a.is_default)

  useEffect(() => {
    if (!senderAccountId && !hasDefaultAccount && accounts.length > 0) {
      setSenderAccountId(accounts[0].id)
    }
  }, [senderAccountId, hasDefaultAccount, accounts])

  const handleSave = () => {
    apiService.updateCampaign(campaign.id, {
      attachment_folder: folder,
      send_attachments: sendAttachments,
      sender_account_id: senderAccountId,
      delay,
    })
    setShowCampaignSettingsModal(false)
  }

  const selectedAccount = senderAccountId
    ? accounts.find((a) => a.id === senderAccountId)
    : accounts.find((a) => a.is_default)

  return (
    <Modal
      isOpen={true}
      onClose={() => setShowCampaignSettingsModal(false)}
      title="Campaign Settings"
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Sender Account
          </label>
          {accounts.length > 0 ? (
            <>
              <select
                value={senderAccountId}
                onChange={(e) => setSenderAccountId(e.target.value)}
                className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-blue outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name || acc.sender_email}{' '}
                    {acc.is_default && senderAccountId !== ''
                      ? '(Default)'
                      : ''}
                  </option>
                ))}
              </select>

              {selectedAccount ? (
                <div className="mt-3 p-3 bg-background-base rounded-lg border border-borders-primary/50 text-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Email</span>
                    <span className="text-text-primary font-medium">
                      {selectedAccount.sender_email}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Server</span>
                    <span className="text-text-primary font-mono text-xs bg-surface-element px-2 py-0.5 rounded">
                      {selectedAccount.smtp_server}:{selectedAccount.smtp_port}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">SSL/TLS</span>
                    <span
                      className={
                        selectedAccount.use_ssl
                          ? 'text-status-success-text'
                          : 'text-text-secondary'
                      }
                    >
                      {selectedAccount.use_ssl ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 p-3 bg-status-danger-bg/10 border border-status-danger-text/20 rounded-lg text-sm text-status-danger-text">
                  <AlertCircle size={16} />
                  Selected account not found.
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-status-danger-bg/10 border border-status-danger-text/20 rounded-lg text-sm text-status-danger-text">
              <AlertCircle size={16} />
              No accounts configured in Global Settings.
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-borders-primary/50">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Delay Between Emails (Seconds)
            </label>
            <input
              type="number"
              min="0"
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
              className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-blue outline-none"
            />
            <p className="text-xs text-text-tertiary mt-2">
              Add a delay to prevent triggering SMTP rate limits or spam
              filters.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-borders-primary/50">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="send_attachments"
              checked={sendAttachments}
              onChange={(e) => setSendAttachments(e.target.checked)}
              className="custom-checkbox"
            />
            <label
              htmlFor="send_attachments"
              className="text-sm font-medium text-text-primary cursor-pointer select-none"
            >
              Enable Attachments for this Campaign
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Attachment Folder Absolute Path (Server)
            </label>
            <input
              type="text"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="/home/user/Desktop"
              disabled={!sendAttachments}
              className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-blue outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-text-tertiary mt-2">
              Files specified in the recipients CSV will be looked up in this
              directory.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={() => setShowCampaignSettingsModal(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <Save size={16} /> Save Settings
          </Button>
        </div>
      </div>
    </Modal>
  )
}
