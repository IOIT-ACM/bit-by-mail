import { Download, Upload, Pencil, Check } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'
import { apiService } from '@/services/apiService'
import type { Database } from '@/types'
import { Button } from '@/components/common/Button'
import { ImportCsvModal } from './ImportCsvModal'
import { toast } from 'sonner'
import { queryClient } from '@/services/queryClient'

interface DatabaseViewHeaderProps {
  database: Database
  databaseId: string
}

export const DatabaseViewHeader: React.FC<DatabaseViewHeaderProps> = ({
  database,
  databaseId,
}) => {
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(database.name)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditedName(database.name)
  }, [database.name])

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditingName])

  const handleSaveName = () => {
    if (editedName.trim() && editedName !== database.name) {
      apiService.updateDatabase(databaseId, { name: editedName.trim() })
    } else {
      setEditedName(database.name)
    }
    setIsEditingName(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveName()
    if (e.key === 'Escape') {
      setEditedName(database.name)
      setIsEditingName(false)
    }
  }

  const handleDownloadSample = () => {
    const csvContent =
      'Name,Email,AttachmentFile\nJohn Doe,john.doe@example.com,certificate_john.pdf;brochure.pdf\nJane Smith,jane.smith@example.com,certificate_jane.pdf'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'sample_recipients.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && databaseId) {
      if (database.recipientCount === 0) {
        apiService
          .uploadDatabaseHttp(databaseId, file, 'replace')
          .then((res) => {
            queryClient.setQueryData(
              ['databaseData', databaseId],
              (old: any) =>
                old ? { ...old, recipients: res.recipients } : old,
            )
            toast.success(
              `${res.recipients.length} recipients imported successfully`,
            )
            apiService.getDatabases()
          })
          .catch(() => toast.error('Upload failed. Check file format.'))
      } else {
        setPendingFile(file)
      }
    }
    if (event.target) event.target.value = ''
  }

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
        <div className="flex items-center gap-2 group max-w-full">
          {isEditingName ? (
            <div className="flex items-center gap-2 w-full max-w-md">
              <input
                ref={inputRef}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={handleKeyDown}
                className="text-2xl font-bold bg-surface-element border border-accent-blue rounded-md px-2 py-1 outline-none w-full"
              />
              <button
                onMouseDown={handleSaveName}
                className="p-1.5 text-accent-blue hover:bg-surface-element rounded-md"
              >
                <Check size={18} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingName(true)}
              className="flex items-center gap-3 cursor-pointer rounded-md p-1 -ml-1 border border-transparent hover:border-borders-primary hover:bg-surface-element transition-all"
              title="Click to rename"
            >
              <h1 className="text-2xl font-bold text-text-primary tracking-tight truncate max-w-sm md:max-w-md lg:max-w-xl">
                {database.name}
              </h1>
              <Pencil
                size={16}
                className="text-text-tertiary group-hover:text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          <Button onClick={handleDownloadSample} variant="secondary">
            <Download size={16} />
            <span className="hidden lg:inline">Sample</span>
          </Button>

          <input
            type="file"
            id="csv-upload"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            as="label"
            htmlFor="csv-upload"
            variant="success"
            className="cursor-pointer"
          >
            <Upload size={16} />
            <span className="hidden lg:inline">Import CSV</span>
          </Button>
        </div>
      </div>

      {pendingFile && (
        <ImportCsvModal
          databaseId={databaseId}
          pendingFile={pendingFile}
          onClose={() => setPendingFile(null)}
        />
      )}
    </>
  )
}
