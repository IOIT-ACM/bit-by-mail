import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import { apiService } from '@/services/apiService'
import { Button } from '@/components/common/Button'
import {
  Plus,
  Database as DatabaseIcon,
  LayoutTemplate,
  CheckCircle,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { Database, EmailTemplate, EmailTemplateData } from '@/types'

export const Route = createFileRoute('/campaigns/new')({
  component: CreateCampaign,
})

function CreateCampaign() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [databaseId, setDatabaseId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: databases = [] } = useQuery<Database[]>({
    queryKey: ['databases'],
  })

  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ['templates'],
  })

  const { data: selectedTemplateData } = useQuery<EmailTemplateData>({
    queryKey: ['templateData', templateId],
    enabled: !!templateId,
  })

  useEffect(() => {
    if (templateId) {
      apiService.getGlobalTemplateData(templateId)
    }
  }, [templateId])

  const sortedDatabases = useMemo(() => {
    return [...databases].sort((a, b) => a.name.localeCompare(b.name))
  }, [databases])

  const sortedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => a.name.localeCompare(b.name))
  }, [templates])

  const preparePreviewContent = (content: string) => {
    const isLikelyHtml =
      /<\s*\/?\s*(html|body|div|p|h[1-6]|table|ul|ol|a|img|br)\b/i.test(content)
    if (isLikelyHtml) return content
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;margin:20px;color:#333;word-wrap:break-word}pre{white-space:pre-wrap;word-wrap:break-word;margin:0;font-family:inherit;font-size:inherit}</style></head><body><pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`
  }

  const previewContent = selectedTemplateData?.body
    ? preparePreviewContent(selectedTemplateData.body)
    : ''

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    apiService.createCampaign(
      name.trim(),
      databaseId || undefined,
      templateId || undefined,
    )
  }

  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Create New Campaign
          </h1>
          <p className="text-sm text-text-secondary mb-8">
            Give your campaign a descriptive name and optionally select a
            database and template to start with.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label
                htmlFor="campaignName"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Campaign Name
              </label>
              <input
                id="campaignName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Q1 Newsletter"
                className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-colors"
                required
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-text-secondary">
                  Select Database (Optional)
                </label>
              </div>

              {databases.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 bg-surface-element border border-borders-primary border-dashed rounded-lg text-center">
                  <DatabaseIcon size={32} className="text-text-tertiary mb-3" />
                  <p className="text-sm text-text-secondary mb-4">
                    No reusable databases found.
                  </p>
                  <Link to="/databases/new">
                    <Button variant="secondary" type="button">
                      <Plus size={16} />
                      Create Database
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1 custom-scrollbar">
                  <div
                    onClick={() => !isSubmitting && setDatabaseId('')}
                    className={`cursor-pointer border rounded-lg p-4 flex items-center justify-between transition-colors ${databaseId === '' ? 'border-accent-blue bg-accent-blue/10' : 'border-borders-primary bg-surface-element hover:border-accent-blue/50'}`}
                  >
                    <span className="text-sm font-medium text-text-primary">
                      None (Start Empty)
                    </span>
                    {databaseId === '' && (
                      <CheckCircle size={18} className="text-accent-blue" />
                    )}
                  </div>
                  {sortedDatabases.map((db) => (
                    <div
                      key={db.id}
                      onClick={() => !isSubmitting && setDatabaseId(db.id)}
                      className={`cursor-pointer border rounded-lg p-4 flex items-center justify-between transition-colors ${databaseId === db.id ? 'border-accent-blue bg-accent-blue/10' : 'border-borders-primary bg-surface-element hover:border-accent-blue/50'}`}
                    >
                      <div className="flex flex-col overflow-hidden pr-2">
                        <span className="text-sm font-medium text-text-primary truncate">
                          {db.name}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {db.recipientCount} records
                        </span>
                      </div>
                      {databaseId === db.id && (
                        <CheckCircle
                          size={18}
                          className="text-accent-blue flex-shrink-0"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-text-secondary">
                  Select Template (Optional)
                </label>
              </div>

              {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 bg-surface-element border border-borders-primary border-dashed rounded-lg text-center">
                  <LayoutTemplate
                    size={32}
                    className="text-text-tertiary mb-3"
                  />
                  <p className="text-sm text-text-secondary mb-4">
                    No reusable templates found.
                  </p>
                  <Link to="/templates/new">
                    <Button variant="secondary" type="button">
                      <Plus size={16} />
                      Create Template
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-6 mt-3">
                  <div className="flex-1 flex flex-col gap-3 max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
                    <div
                      onClick={() => !isSubmitting && setTemplateId('')}
                      className={`cursor-pointer border rounded-lg p-4 flex items-center justify-between transition-colors ${templateId === '' ? 'border-accent-blue bg-accent-blue/10' : 'border-borders-primary bg-surface-element hover:border-accent-blue/50'}`}
                    >
                      <span className="text-sm font-medium text-text-primary">
                        None (Start Empty)
                      </span>
                      {templateId === '' && (
                        <CheckCircle size={18} className="text-accent-blue" />
                      )}
                    </div>
                    {sortedTemplates.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => !isSubmitting && setTemplateId(t.id)}
                        className={`cursor-pointer border rounded-lg p-4 flex items-center justify-between transition-colors ${templateId === t.id ? 'border-accent-blue bg-accent-blue/10' : 'border-borders-primary bg-surface-element hover:border-accent-blue/50'}`}
                      >
                        <div className="flex flex-col overflow-hidden pr-2">
                          <span className="text-sm font-medium text-text-primary truncate">
                            {t.name}
                          </span>
                          {t.category && (
                            <span className="text-xs text-text-secondary truncate">
                              {t.category}
                            </span>
                          )}
                        </div>
                        {templateId === t.id && (
                          <CheckCircle
                            size={18}
                            className="text-accent-blue flex-shrink-0"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 border border-borders-primary rounded-lg bg-surface-element overflow-hidden flex flex-col max-h-[400px] min-h-[300px]">
                    {templateId === '' ? (
                      <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">
                        No template selected
                      </div>
                    ) : !selectedTemplateData ? (
                      <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">
                        Loading preview...
                      </div>
                    ) : (
                      <div className="flex flex-col h-full">
                        <div className="p-3 border-b border-borders-primary bg-surface-element-hover flex-shrink-0">
                          <p className="text-sm text-text-primary truncate">
                            <strong>Subject:</strong>{' '}
                            {selectedTemplateData.subject || 'No subject'}
                          </p>
                        </div>
                        <iframe
                          srcDoc={previewContent}
                          title="Email Preview"
                          className="w-full h-full bg-white flex-grow"
                          sandbox="allow-same-origin"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6 border-t border-borders-primary/50">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate({ to: '/campaigns' })}
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
                <span>Create Campaign</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
