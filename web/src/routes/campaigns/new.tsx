import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import { apiService } from '@/services/apiService'
import { Button } from '@/components/common/Button'
import {
  Plus,
  Database as DatabaseIcon,
  LayoutTemplate,
  CheckCircle,
  Server,
  FileText,
  Code,
  AlertCircle,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type {
  Database,
  DatabaseData,
  EmailTemplate,
  EmailTemplateData,
  Config,
} from '@/types'

export const Route = createFileRoute('/campaigns/new')({
  component: CreateCampaign,
})

function CreateCampaign() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [databaseId, setDatabaseId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [senderAccountId, setSenderAccountId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: databases = [] } = useQuery<Database[]>({
    queryKey: ['databases'],
  })

  const { data: selectedDatabaseData } = useQuery<DatabaseData>({
    queryKey: ['databaseData', databaseId],
    enabled: !!databaseId,
  })

  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ['templates'],
  })

  const { data: config } = useQuery<Config>({ queryKey: ['config'] })
  const accounts = config?.accounts || []

  const { data: selectedTemplateData } = useQuery<EmailTemplateData>({
    queryKey: ['templateData', templateId],
    enabled: !!templateId,
  })

  const hasDefaultAccount = accounts.some((a) => a.is_default)

  useEffect(() => {
    if (!senderAccountId && !hasDefaultAccount && accounts.length > 0) {
      setSenderAccountId(accounts[0].id)
    }
  }, [senderAccountId, hasDefaultAccount, accounts])

  useEffect(() => {
    if (templateId) {
      apiService.getGlobalTemplateData(templateId)
    }
  }, [templateId])

  useEffect(() => {
    if (databaseId) {
      apiService.getDatabaseData(databaseId)
    }
  }, [databaseId])

  const sortedDatabases = useMemo(() => {
    return [...databases].sort((a, b) => a.name.localeCompare(b.name))
  }, [databases])

  const sortedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => a.name.localeCompare(b.name))
  }, [templates])

  const selectedAccount = senderAccountId
    ? accounts.find((a) => a.id === senderAccountId)
    : accounts.find((a) => a.is_default)

  const preparePreviewContent = (content: string, isHtml: boolean) => {
    if (!isHtml) {
      return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:16px;background:#fff;"><pre style="white-space:pre-wrap;font-family:sans-serif;font-size:14px;margin:0;color:#000;">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`
    }
    if (/<html/i.test(content)) return content
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 16px;
      font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
      font-size: 14px;
      color: #000;
      line-height: 1.5;
    }
    p { margin-top: 0; margin-bottom: 1em; }
    p:empty::before { content: "\\00a0"; }
    ul { list-style-type: disc; padding-left: 1.5em; margin-top: 0; margin-bottom: 1em; }
    ol { list-style-type: decimal; padding-left: 1.5em; margin-top: 0; margin-bottom: 1em; }
    a { color: #3b82f6; text-decoration: underline; }
    img { max-width: 100%; height: auto; border-radius: 0.375rem; margin-bottom: 1em; }
    strong { font-weight: 700; }
    em { font-style: italic; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`
  }

  const previewContent = selectedTemplateData?.body
    ? preparePreviewContent(
        selectedTemplateData.body,
        selectedTemplateData.is_html ?? true,
      )
    : ''

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)

    let isHtml = true
    if (templateId) {
      const t = templates.find((t) => t.id === templateId)
      if (t && t.is_html !== undefined) {
        isHtml = t.is_html
      }
    }

    apiService.createCampaign(
      name.trim(),
      databaseId || undefined,
      templateId || undefined,
      senderAccountId || undefined,
      isHtml,
    )
  }

  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar flex flex-col items-center">
      <div className="w-full max-w-7xl">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Create New Campaign
          </h1>
          <p className="text-sm text-text-secondary mb-8">
            Give your campaign a descriptive name and optionally select a
            database, template, and sender account to start with.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-text-secondary">
                    Sender Account
                  </label>
                </div>
                {accounts.length > 0 ? (
                  <>
                    <select
                      value={senderAccountId}
                      onChange={(e) => setSenderAccountId(e.target.value)}
                      className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue transition-colors outline-none"
                      disabled={isSubmitting}
                    >
                      {hasDefaultAccount && (
                        <option value="">Default Account</option>
                      )}
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name || acc.sender_email}{' '}
                          {acc.is_default && senderAccountId !== ''
                            ? '(Default)'
                            : ''}
                        </option>
                      ))}
                    </select>

                    {selectedAccount ? (
                      <div className="mt-3 p-3 bg-background-base rounded-lg border border-borders-primary/50 text-sm space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-text-secondary">Email</span>
                          <span className="text-text-primary font-medium">
                            {selectedAccount.sender_email}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-text-secondary">Server</span>
                          <span className="text-text-primary font-mono text-xs bg-surface-element px-2 py-0.5 rounded">
                            {selectedAccount.smtp_server}:
                            {selectedAccount.smtp_port}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-text-secondary">SSL/TLS</span>
                          <span
                            className={
                              selectedAccount.use_ssl
                                ? 'text-status-success-text'
                                : 'text-text-secondary'
                            }
                          >
                            {selectedAccount.use_ssl ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center gap-2 p-3 bg-status-danger-bg/10 border border-status-danger-text/20 rounded-lg text-sm text-status-danger-text">
                        <AlertCircle size={16} />
                        Selected account not found.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-status-danger-bg/10 border border-status-danger-text/20 rounded-lg text-sm text-status-danger-text">
                    <Server size={16} />
                    No accounts configured in Global Settings.
                  </div>
                )}
              </div>
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
                <div className="flex flex-col lg:flex-row gap-6 mt-3">
                  <div className="w-full lg:w-1/3 flex flex-col gap-3 max-h-[500px] overflow-y-auto p-1 custom-scrollbar">
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

                  <div className="w-full lg:w-2/3 border border-borders-primary rounded-lg bg-surface-element overflow-hidden flex flex-col max-h-[500px] min-h-[400px]">
                    {databaseId === '' ? (
                      <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">
                        No database selected
                      </div>
                    ) : !selectedDatabaseData ? (
                      <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">
                        Loading preview...
                      </div>
                    ) : selectedDatabaseData.recipients.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">
                        Database is empty
                      </div>
                    ) : (
                      <div className="flex flex-col h-full overflow-hidden">
                        <div className="p-3 border-b border-borders-primary bg-surface-element-hover flex-shrink-0">
                          <p className="text-sm text-text-primary">
                            <strong>Preview:</strong> Showing top 5 records
                          </p>
                        </div>
                        <div className="overflow-auto flex-grow custom-scrollbar bg-surface-card">
                          <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="text-xs text-text-secondary uppercase sticky top-0 bg-surface-element border-b border-borders-primary">
                              <tr>
                                {Object.keys(selectedDatabaseData.recipients[0])
                                  .filter(
                                    (k) =>
                                      k !== 'Status' && k !== 'SentTimestamp',
                                  )
                                  .map((k) => (
                                    <th
                                      key={k}
                                      className="px-4 py-2 font-medium"
                                    >
                                      {k}
                                    </th>
                                  ))}
                              </tr>
                            </thead>
                            <tbody>
                              {selectedDatabaseData.recipients
                                .slice(0, 5)
                                .map((r, i) => (
                                  <tr
                                    key={i}
                                    className="border-b border-borders-primary/50 last:border-0 hover:bg-surface-element/50"
                                  >
                                    {Object.keys(
                                      selectedDatabaseData.recipients[0],
                                    )
                                      .filter(
                                        (k) =>
                                          k !== 'Status' &&
                                          k !== 'SentTimestamp',
                                      )
                                      .map((k) => (
                                        <td
                                          key={k}
                                          className="px-4 py-2 text-text-secondary"
                                        >
                                          {r[k]}
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
                  <div className="w-full lg:w-1/3 flex flex-col gap-3 max-h-[500px] overflow-y-auto p-1 custom-scrollbar">
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
                          <span className="text-sm font-medium text-text-primary truncate flex items-center gap-2">
                            {t.name}
                            {t.is_html === false ? (
                              <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-text-secondary bg-background-base px-1.5 py-0.5 rounded border border-borders-primary">
                                <FileText size={10} /> Text
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-accent-blue bg-accent-blue/10 px-1.5 py-0.5 rounded border border-accent-blue/20">
                                <Code size={10} /> HTML
                              </span>
                            )}
                          </span>
                          {t.category && (
                            <span className="text-xs text-text-secondary truncate mt-1">
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

                  <div className="w-full lg:w-2/3 border border-borders-primary rounded-lg bg-surface-element overflow-hidden flex flex-col max-h-[500px] min-h-[400px]">
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
