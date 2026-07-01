import React, { useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { apiService } from '@/services/apiService'
import { useAppStore } from '@/store/useAppStore'
import { Save } from 'lucide-react'
import type { Campaign } from '@/types'

export const CampaignSettingsModal: React.FC<{ campaign: Campaign }> = ({
  campaign,
}) => {
  const setShowCampaignSettingsModal = useAppStore(
    (state) => state.setShowCampaignSettingsModal,
  )
  const [folder, setFolder] = useState(campaign.attachment_folder || '')
  const [sendAttachments, setSendAttachments] = useState(
    campaign.send_attachments || false,
  )

  const handleSave = () => {
    apiService.updateCampaign(campaign.id, {
      attachment_folder: folder,
      send_attachments: sendAttachments,
    })
    setShowCampaignSettingsModal(false)
  }

  return (
    <Modal
      isOpen={true}
      onClose={() => setShowCampaignSettingsModal(false)}
      title="Campaign Settings"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="send_attachments"
            checked={sendAttachments}
            onChange={(e) => setSendAttachments(e.target.checked)}
            className="custom-checkbox"
          />
          <label
            htmlFor="send_attachments"
            className="text-sm font-medium text-text-primary"
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
            className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:ring-2 focus:ring-accent-blue"
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={() => setShowCampaignSettingsModal(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <Save size={16} /> Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}
