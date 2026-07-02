import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { apiService } from '@/services/apiService'
import { Button } from '@/components/common/Button'
import { Plus, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/databases/new')({
  component: CreateDatabase,
})

function CreateDatabase() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<string[][]>([])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPendingFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        const lines = text.split('\n').filter((l) => l.trim() !== '')
        const rows = lines.slice(0, 6).map((l) => l.split(','))
        setPreviewRows(rows)
      }
      reader.readAsText(file)
    }
  }

  const clearFile = () => {
    setPendingFile(null)
    setPreviewRows([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)

    try {
      const res = await apiService.request(
        'create_database',
        { name: name.trim(), navigate: false },
        'database_created',
      )
      const dbId = res.id

      if (pendingFile) {
        await apiService.uploadDatabaseHttp(dbId, pendingFile, 'replace')
      }

      navigate({ to: '/databases/$databaseId', params: { databaseId: dbId } })
    } catch (err) {
      toast.error('Failed to create database')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 h-full overflow-y-auto flex flex-col items-center custom-scrollbar">
      <div className="w-full max-w-4xl">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Create Reusable Database
          </h1>
          <p className="text-sm text-text-secondary mb-8">
            Give your database a descriptive name and optionally upload a CSV to
            populate it immediately.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label
                htmlFor="dbName"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Database Name
              </label>
              <input
                id="dbName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Master Leads 2025"
                className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-colors"
                required
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Initial Data (Optional)
              </label>

              {!pendingFile ? (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-borders-primary rounded-lg bg-surface-element">
                  <Upload size={32} className="text-text-tertiary mb-4" />
                  <p className="text-sm text-text-secondary mb-4 text-center">
                    Select a CSV file to pre-populate this database.
                  </p>
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
                    variant="secondary"
                    disabled={isSubmitting}
                  >
                    Choose File
                  </Button>
                </div>
              ) : (
                <div className="border border-borders-primary rounded-lg overflow-hidden bg-surface-element flex flex-col">
                  <div className="flex items-center justify-between p-3 border-b border-borders-primary bg-surface-card">
                    <span className="text-sm font-medium text-text-primary">
                      Data Preview
                    </span>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="p-1 rounded text-text-secondary hover:text-status-danger-text hover:bg-surface-element transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-text-secondary uppercase bg-surface-element border-b border-borders-primary">
                        <tr>
                          {previewRows[0]?.map((header, i) => (
                            <th key={i} className="px-4 py-2 font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-surface-card">
                        {previewRows.slice(1).map((row, i) => (
                          <tr
                            key={i}
                            className="border-b border-borders-primary/50 last:border-0"
                          >
                            {row.map((cell, j) => (
                              <td
                                key={j}
                                className="px-4 py-2 whitespace-nowrap text-text-secondary"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6 border-t border-borders-primary/50">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate({ to: '/databases' })}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!name.trim() || isSubmitting}
              >
                <Plus size={18} />
                <span>Create Database</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
