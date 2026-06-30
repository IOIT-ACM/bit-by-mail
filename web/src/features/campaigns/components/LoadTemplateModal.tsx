import React, { useState, useMemo } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '@/services/apiService'
import type { EmailTemplate } from '@/types'
import { Download } from 'lucide-react'

export const LoadTemplateModal: React.FC<{
  onClose: () => void
  onLoad: (subject: string, body: string) => void
}> = ({ onClose, onLoad }) => {
  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ['templates'],
  })

  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')

  const filteredTemplates = useMemo(() => {
    if (!search) return templates
    return templates.filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase()),
    )
  }, [templates, search])

  const handleLoad = async () => {
    if (!selectedTemplate) return
    setIsLoading(true)
    try {
      const res = await apiService.request(
        'get_global_template_data',
        { template_id: selectedTemplate },
        'global_template_data',
      )
      onLoad(res.subject || '', res.body || '')
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Load from Template Library">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Select a template from your library to override the current campaign
          content.
        </p>

        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 px-3 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />

        <div className="border border-borders-primary rounded-lg max-h-60 overflow-y-auto custom-scrollbar bg-surface-element">
          {filteredTemplates.length === 0 ? (
            <div className="p-4 text-center text-sm text-text-tertiary">
              No templates found.
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredTemplates.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-3 p-3 hover:bg-surface-element-hover cursor-pointer border-b border-borders-primary/50 last:border-0"
                >
                  <input
                    type="radio"
                    name="templateSelection"
                    value={t.id}
                    checked={selectedTemplate === t.id}
                    onChange={() => setSelectedTemplate(t.id)}
                    className="custom-checkbox rounded-full"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-text-primary">
                      {t.name}
                    </span>
                    {t.subject && (
                      <span className="text-xs text-text-secondary truncate max-w-[400px]">
                        {t.subject}
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleLoad}
            disabled={!selectedTemplate || isLoading}
          >
            <Download size={16} /> Load Content
          </Button>
        </div>
      </div>
    </Modal>
  )
}
