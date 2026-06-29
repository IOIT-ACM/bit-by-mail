import { useParams } from '@tanstack/react-router'
import { AlertTriangle, FileStack, Send, Users } from 'lucide-react'
import React from 'react'
import { apiService } from '@/services/apiService'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'

const formatBytes = (bytes: number, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const SummaryItem: React.FC<{
  icon: React.ReactNode
  label: string
  value: string | number
}> = ({ icon, label, value }) => (
  <div className="flex items-start gap-4 p-3 bg-surface-element rounded-lg">
    <div className="text-accent-blue flex-shrink-0 mt-1">{icon}</div>
    <div>
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="text-lg font-medium text-text-primary">{value}</p>
    </div>
  </div>
)

export const CampaignSummaryModal: React.FC = () => {
  const { campaignId } = useParams({ strict: false }) as Record<
    string,
    string | undefined
  >
  const {
    campaignSummary,
    showCampaignSummaryModal,
    setShowCampaignSummaryModal,
    selectedRecipientIndices,
    clearRecipientSelection,
  } = useAppStore()

  if (!campaignSummary) return null

  const handleClose = () => setShowCampaignSummaryModal(false)

  const handleConfirmSend = () => {
    if (campaignId) {
      const indices =
        selectedRecipientIndices.size > 0
          ? Array.from(selectedRecipientIndices)
          : undefined
      apiService.startMailing(campaignId, indices)
      if (selectedRecipientIndices.size > 0) clearRecipientSelection()
    }
    handleClose()
  }

  const hasRecipientsToSend = campaignSummary.recipients_to_send > 0

  return (
    <Modal
      isOpen={showCampaignSummaryModal}
      onClose={handleClose}
      title="Campaign Summary & Confirmation"
      maxWidth="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <h3 className="text-lg font-medium text-text-primary px-1">
            Summary
          </h3>
          <SummaryItem
            icon={<Users size={20} />}
            label="Total Recipients"
            value={campaignSummary.total_recipients}
          />
          <SummaryItem
            icon={<Send size={20} />}
            label="Emails to be Sent"
            value={campaignSummary.recipients_to_send}
          />
          <SummaryItem
            icon={<FileStack size={20} />}
            label="Total Attachment Size"
            value={formatBytes(campaignSummary.total_attachment_size_bytes)}
          />
          <div className="mt-auto pt-4">
            {!hasRecipientsToSend && (
              <div className="flex items-center gap-3 p-3 bg-accent-orange/10 border border-accent-orange/20 rounded-lg text-accent-orange mb-4">
                <AlertTriangle size={24} className="flex-shrink-0" />
                <p className="text-sm">
                  There are no pending recipients. All emails have already been
                  marked as 'SENT'.
                </p>
              </div>
            )}
            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmSend}
                disabled={!hasRecipientsToSend}
              >
                <Send size={16} />
                Confirm & Send
              </Button>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 flex flex-col min-h-0 h-full">
          <h3 className="text-lg font-medium text-text-primary px-1 mb-2">
            Preview for First Recipient
          </h3>
          <div className="p-3 bg-surface-element rounded-lg mb-4 flex-shrink-0">
            <p className="text-sm text-text-primary truncate">
              <strong>Subject:</strong> {campaignSummary.preview_subject}
            </p>
          </div>
          <div className="flex-grow min-h-0 bg-white border border-borders-primary rounded-lg overflow-hidden">
            <iframe
              srcDoc={campaignSummary.preview_body}
              title="Email Preview"
              className="w-full h-full"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
