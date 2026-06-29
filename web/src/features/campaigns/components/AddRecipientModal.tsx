import { useQuery } from '@tanstack/react-query'
import { UserPlus } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { queryClient } from '@/services/queryClient'
import { apiService } from '@/services/apiService'
import { useAppStore } from '@/store/useAppStore'
import type { CampaignData, Recipient } from '@/types'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'

export const AddRecipientModal: React.FC<{ campaignId: string }> = ({
  campaignId,
}) => {
  const { showAddRecipientModal, setShowAddRecipientModal } = useAppStore()
  const { data } = useQuery<CampaignData>({
    queryKey: ['campaignData', campaignId],
  })
  const recipients = data?.recipients ?? []

  const availableColumns = useMemo(() => {
    if (recipients.length > 0)
      return Object.keys(recipients[0]).filter(
        (key) => key !== 'Status' && key !== 'SentTimestamp',
      )
    return ['Name', 'Email', 'AttachmentFile']
  }, [recipients])

  const [formState, setFormState] = useState<Record<string, string>>(() =>
    availableColumns.reduce((acc, key) => ({ ...acc, [key]: '' }), {}),
  )

  const handleClose = () => setShowAddRecipientModal(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formState.Email || !formState.Name) {
      toast.error('Name and Email are required fields.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formState.Email)) {
      toast.error('Please enter a valid email address.')
      return
    }

    const newRecipientData: { [key: string]: string } = {}
    availableColumns.forEach((col) => {
      newRecipientData[col] = formState[col] || ''
    })
    const newRecipient = { ...newRecipientData, Status: 'PENDING' } as Recipient

    const newRecipients = [...recipients, newRecipient]
    queryClient.setQueryData<CampaignData>(
      ['campaignData', campaignId],
      (old) => (old ? { ...old, recipients: newRecipients } : old),
    )

    apiService.saveRecipients(campaignId, newRecipients)
    toast.success(`Recipient "${formState.Name}" added.`)
    handleClose()
  }

  return (
    <Modal
      isOpen={showAddRecipientModal}
      onClose={handleClose}
      title="Add New Recipient"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {availableColumns.map((column) => (
          <div key={column}>
            <label className="text-sm font-medium text-text-secondary mb-1 block">
              {column}{' '}
              {column === 'Name' || column === 'Email' ? (
                <span className="text-status-danger-text">*</span>
              ) : (
                ''
              )}
            </label>
            <input
              type={column.toLowerCase() === 'email' ? 'email' : 'text'}
              name={column}
              value={formState[column] || ''}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  [e.target.name]: e.target.value,
                }))
              }
              placeholder={`Enter ${column}...`}
              className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-colors"
              required={column === 'Name' || column === 'Email'}
            />
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            <UserPlus size={16} />
            Add Recipient
          </Button>
        </div>
      </form>
    </Modal>
  )
}
