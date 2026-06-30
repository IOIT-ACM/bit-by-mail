import React, { useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '@/services/apiService'
import { queryClient } from '@/services/queryClient'
import { toast } from 'sonner'
import type { Database, CampaignData } from '@/types'
import { Plus } from 'lucide-react'

export const ImportFromDbModal: React.FC<{
  campaignId: string
  onClose: () => void
}> = ({ campaignId, onClose }) => {
  const { data: databases = [] } = useQuery<Database[]>({
    queryKey: ['databases'],
  })
  const [selectedDb, setSelectedDb] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  const handleImport = async () => {
    if (!selectedDb) return
    setIsImporting(true)
    try {
      const res = await apiService.request(
        'get_database_data',
        { database_id: selectedDb },
        'database_data',
      )
      const currentData = queryClient.getQueryData<CampaignData>([
        'campaignData',
        campaignId,
      ])
      const newRecipients = res.recipients.map((r: any) => ({
        ...r,
        Status: 'PENDING',
      }))
      const merged = [...(currentData?.recipients || []), ...newRecipients]

      queryClient.setQueryData<CampaignData>(
        ['campaignData', campaignId],
        (old) => (old ? { ...old, recipients: merged } : old),
      )
      apiService.saveRecipients(campaignId, merged)
      apiService.updateCampaign(campaignId, { sourceDbId: selectedDb })
      toast.success(`Imported ${newRecipients.length} recipients successfully.`)
      onClose()
    } catch (e) {
      toast.error('Failed to import database')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Import from Saved Database">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Select a saved database to import its recipients into this campaign.
        </p>
        <select
          value={selectedDb}
          onChange={(e) => setSelectedDb(e.target.value)}
          className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
        >
          <option value="" disabled>
            Select a Database...
          </option>
          {databases.map((db) => (
            <option key={db.id} value={db.id}>
              {db.name} ({db.recipientCount} records)
            </option>
          ))}
        </select>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={!selectedDb || isImporting}
          >
            <Plus size={16} /> Import Records
          </Button>
        </div>
      </div>
    </Modal>
  )
}
