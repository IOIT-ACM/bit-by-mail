import React, { useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { apiService } from '@/services/apiService'
import { toast } from 'sonner'
import { queryClient } from '@/services/queryClient'

export const ImportCsvModal: React.FC<{
  databaseId: string
  pendingFile: File
  onClose: () => void
}> = ({ databaseId, pendingFile, onClose }) => {
  const [isImporting, setIsImporting] = useState(false)

  const handleImport = async (mode: 'merge' | 'replace') => {
    setIsImporting(true)
    try {
      const res = await apiService.uploadDatabaseHttp(
        databaseId,
        pendingFile,
        mode,
      )
      queryClient.setQueryData(['databaseData', databaseId], (old: any) =>
        old ? { ...old, recipients: res.recipients } : old,
      )
      toast.success(`${res.recipients.length} recipients imported successfully`)
      apiService.getDatabases()
    } catch (e) {
      toast.error('Upload failed. Check file format.')
    }
    setIsImporting(false)
    onClose()
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Import CSV Data">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          How would you like to import this data into the database?
        </p>
        <div className="flex flex-col gap-3 pt-2">
          <Button
            variant="primary"
            onClick={() => handleImport('merge')}
            disabled={isImporting}
          >
            Merge (Add to existing records)
          </Button>
          <Button
            variant="danger"
            onClick={() => handleImport('replace')}
            disabled={isImporting}
          >
            Replace All (Overwrite existing)
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={isImporting}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
