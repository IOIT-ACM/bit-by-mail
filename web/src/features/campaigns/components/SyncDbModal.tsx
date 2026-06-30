import React, { useEffect, useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '@/services/apiService'
import { queryClient } from '@/services/queryClient'
import { toast } from 'sonner'
import type { CampaignData, DatabaseData, Database } from '@/types'
import { ArrowDownToLine } from 'lucide-react'

export const SyncDbModal: React.FC<{
  campaignId: string
  sourceDbId: string
  onClose: () => void
}> = ({ campaignId, sourceDbId, onClose }) => {
  const [isSyncing, setIsSyncing] = useState(false)
  const { data: databases } = useQuery<Database[]>({ queryKey: ['databases'] })
  const dbName = databases?.find((d) => d.id === sourceDbId)?.name || 'Database'

  useEffect(() => {
    apiService.getDatabaseData(sourceDbId)
  }, [sourceDbId])

  const handlePull = () => {
    setIsSyncing(true)
    const campaignData = queryClient.getQueryData<CampaignData>([
      'campaignData',
      campaignId,
    ])
    const dbData = queryClient.getQueryData<DatabaseData>([
      'databaseData',
      sourceDbId,
    ])

    if (campaignData && dbData) {
      const existingByEmail = new Map(
        campaignData.recipients.map((r) => [r.Email, r]),
      )
      const newRecipients = dbData.recipients.map((r) => {
        const existing = existingByEmail.get(r.Email)
        if (existing) {
          return {
            ...r,
            Status: existing.Status,
            SentTimestamp: existing.SentTimestamp,
          }
        }
        return { ...r, Status: 'PENDING' }
      })

      queryClient.setQueryData<CampaignData>(
        ['campaignData', campaignId],
        (old) => (old ? { ...old, recipients: newRecipients } : old),
      )
      apiService.saveRecipients(campaignId, newRecipients)
      toast.success('Pulled data from database successfully.')
    }
    setIsSyncing(false)
    onClose()
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={`Sync with "${dbName}"`}>
      <div className="space-y-6">
        <div className="grid gap-4">
          <h3 className="font-semibold text-text-primary">
            Pull from Database
          </h3>
          <p className="text-xs text-text-secondary flex-grow">
            Update campaign recipients with the latest data from the database.
            Existing statuses are preserved by Email.
          </p>
          <Button
            variant="primary"
            onClick={handlePull}
            disabled={isSyncing}
            className="w-full"
          >
            <ArrowDownToLine size={16} /> Pull
          </Button>
        </div>
      </div>
    </Modal>
  )
}
