import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Send, CheckCircle, XCircle } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { apiService } from '@/services/apiService'
import { Button } from '@/components/common/Button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { toast } from 'sonner'
import { useParams } from '@tanstack/react-router'
import { queryClient } from '@/services/queryClient'
import type { CampaignData } from '@/types'

export const RecipientActionPopup: React.FC = () => {
  const params = useParams({ strict: false }) as Record<
    string,
    string | undefined
  >
  const campaignId = params.campaignId
  const { selectedRecipientIndices, clearRecipientSelection } = useAppStore()
  const selectedCount = selectedRecipientIndices.size

  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const getCampaignData = () => {
    if (!campaignId) return undefined
    return queryClient.getQueryData<CampaignData>(['campaignData', campaignId])
  }

  const handleSend = () => {
    if (!campaignId) return
    apiService.flushQueue()
    apiService.getCampaignSummary(
      campaignId,
      Array.from(selectedRecipientIndices),
    )
  }

  const confirmDelete = () => {
    if (!campaignId) return
    const data = getCampaignData()
    if (data) {
      const newRecipients = data.recipients.filter(
        (_, i) => !selectedRecipientIndices.has(i),
      )
      queryClient.setQueryData<CampaignData>(['campaignData', campaignId], {
        ...data,
        recipients: newRecipients,
      })
      apiService.saveRecipients(campaignId, newRecipients)
    }
    clearRecipientSelection()
    toast.success(`${selectedCount} recipient(s) deleted`)
  }

  const updateStatus = (status: 'SENT' | 'PENDING') => {
    if (!campaignId) return
    const data = getCampaignData()
    if (data) {
      const newRecipients = data.recipients.map((r, i) => {
        if (selectedRecipientIndices.has(i)) {
          const updated = { ...r, Status: status }
          if (status === 'SENT' && r.Status !== 'SENT')
            updated.SentTimestamp = new Date().toISOString()
          else if (status === 'PENDING') updated.SentTimestamp = undefined
          return updated
        }
        return r
      })
      queryClient.setQueryData<CampaignData>(['campaignData', campaignId], {
        ...data,
        recipients: newRecipients,
      })
      apiService.saveRecipients(campaignId, newRecipients)
    }
    clearRecipientSelection()
    toast.success(`${selectedCount} recipient(s) marked as ${status}`)
  }

  return (
    <>
      <AnimatePresence>
        {selectedCount > 0 && campaignId && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-4 bottom-4 z-40 bg-surface-card backdrop-blur-xl border border-borders-primary rounded-card shadow-card p-4 w-64"
          >
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-text-primary text-center">
                {selectedCount}{' '}
                {selectedCount === 1 ? 'recipient' : 'recipients'} selected
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={handleSend} variant="primary">
                  <Send size={16} />
                  <span>Send to {selectedCount}</span>
                </Button>
                <Button
                  onClick={() => setShowConfirmDelete(true)}
                  variant="danger"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </Button>
                <Button onClick={() => updateStatus('SENT')} variant="success">
                  <CheckCircle size={16} />
                  <span>Mark as Sent</span>
                </Button>
                <Button
                  onClick={() => updateStatus('PENDING')}
                  variant="warning"
                >
                  <XCircle size={16} />
                  <span>Mark as Pending</span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Delete Recipients"
        message={`Are you sure you want to delete ${selectedCount} selected recipient(s)? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </>
  )
}
