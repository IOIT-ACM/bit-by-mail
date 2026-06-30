import React, { useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { apiService } from '@/services/apiService'

export const ImportCsvModal: React.FC<{
  databaseId: string
  base64Content: string
  onClose: () => void
}> = ({ databaseId, base64Content, onClose }) => {
  const [isImporting, setIsImporting] = useState(false)

  const handleImport = (mode: 'merge' | 'replace') => {
    setIsImporting(true)
    apiService.importCsvToDatabase(databaseId, base64Content, mode)
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
