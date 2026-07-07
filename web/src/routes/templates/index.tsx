import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { EmailTemplate } from '@/types'
import { Button } from '@/components/common/Button'
import {
  LayoutTemplate,
  Plus,
  Loader,
  Code,
  FileText,
  Mail,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { TemplateSelectionPopup } from '@/features/templates/components/TemplateSelectionPopup'
import { useState, useMemo } from 'react'

export const Route = createFileRoute('/templates/')({
  component: TemplatesList,
})

const categoryColors = [
  'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'bg-green-500/10 text-green-400 border-green-500/20',
  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'bg-teal-500/10 text-teal-400 border-teal-500/20',
]

const getCategoryColor = (category: string) => {
  if (!category)
    return 'bg-surface-element text-text-secondary border-borders-primary'
  let hash = 0
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % categoryColors.length
  return categoryColors[index]
}

const PreviewBox = ({
  content,
  isHtml,
}: {
  content: string
  isHtml: boolean
}) => {
  if (!isHtml) {
    return (
      <div className="w-full h-full bg-[#1e1e2a] p-3 overflow-hidden">
        <pre className="text-[10px] text-text-secondary font-mono whitespace-pre-wrap leading-relaxed">
          {content}
        </pre>
      </div>
    )
  }

  const wrappedContent = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>body{margin:0;padding:12px;font-family:sans-serif;}</style></head><body>${content}</body></html>`

  return (
    <div className="w-full h-full bg-white relative overflow-hidden pointer-events-none">
      <iframe
        srcDoc={wrappedContent}
        className="absolute top-0 left-0 border-0 origin-top-left"
        style={{ width: '400%', height: '400%', transform: 'scale(0.25)' }}
        tabIndex={-1}
        sandbox="allow-same-origin"
      />
    </div>
  )
}

function TemplatesList() {
  const navigate = useNavigate()
  const { data: templates, isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ['templates'],
  })

  const toggleTemplateSelection = useAppStore(
    (state) => state.toggleTemplateSelection,
  )
  const selectedTemplateIds = useAppStore((state) => state.selectedTemplateIds)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const categories = useMemo(() => {
    if (!templates) return []
    const cats = new Set(templates.map((t) => t.category).filter(Boolean))
    return Array.from(cats)
  }, [templates])

  const filteredTemplates = useMemo(() => {
    if (!templates) return []
    return templates.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.subject.toLowerCase().includes(search.toLowerCase())
      const matchCategory =
        categoryFilter === '' || t.category === categoryFilter
      return matchSearch && matchCategory
    })
  }, [templates, search, categoryFilter])

  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Template Library</h1>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 px-3 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 px-3 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Link to="/templates/new">
            <Button variant="primary">
              <Plus size={18} />
              Create Template
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 mt-12 text-text-secondary">
          <Loader size={32} className="animate-spin mb-4 text-accent-blue" />
          <p>Loading templates...</p>
        </div>
      ) : !templates || templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-surface-card border border-borders-primary border-dashed rounded-card mt-12">
          <LayoutTemplate size={48} className="text-text-tertiary mb-4" />
          <h2 className="text-xl font-semibold mb-2">No templates yet</h2>
          <p className="text-text-secondary mb-6">
            Create your first reusable email template.
          </p>
          <Link to="/templates/new">
            <Button variant="primary">
              <Plus size={18} />
              Create Template
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTemplates.map((t) => {
            const isSelected = selectedTemplateIds.has(t.id)
            return (
              <div
                key={t.id}
                className={`bg-surface-card rounded-xl border flex flex-col h-[360px] transition-all overflow-hidden relative group ${isSelected ? 'border-accent-blue ring-1 ring-accent-blue' : 'border-borders-primary hover:border-borders-primary/80 shadow-sm'}`}
              >
                <div className="h-[220px] w-full relative border-b border-borders-primary/50 overflow-hidden bg-surface-element flex-shrink-0">
                  <PreviewBox
                    content={t.body || ''}
                    isHtml={t.is_html ?? true}
                  />

                  <div className="absolute top-3 left-3 z-10">
                    {t.is_html !== false ? (
                      <div className="flex items-center gap-1.5 bg-accent-blue/90 backdrop-blur text-white px-2 py-1 rounded shadow-sm text-[10px] font-bold uppercase tracking-wider">
                        <Code size={12} /> HTML
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-surface-element/90 backdrop-blur border border-borders-primary text-text-primary px-2 py-1 rounded shadow-sm text-[10px] font-bold uppercase tracking-wider">
                        <FileText size={12} /> TEXT
                      </div>
                    )}
                  </div>

                  <div
                    className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 z-20 flex flex-col items-center justify-center gap-3 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  >
                    <div className="absolute top-3 right-3">
                      <input
                        type="checkbox"
                        className="custom-checkbox w-5 h-5"
                        checked={isSelected}
                        onChange={() => toggleTemplateSelection(t.id)}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate({
                            to: '/campaigns/new',
                            search: { templateId: t.id },
                          })
                        }}
                      >
                        Use this
                      </Button>
                      <Button
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate({
                            to: '/templates/$templateId',
                            params: { templateId: t.id },
                          })
                        }}
                      >
                        Edit Template
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-grow min-h-0 bg-surface-card">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h2
                      className="text-base font-semibold text-text-primary truncate"
                      title={t.name}
                    >
                      {t.name}
                    </h2>
                    {t.category && (
                      <span
                        className={`flex-shrink-0 border px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide truncate max-w-[100px] ${getCategoryColor(t.category)}`}
                      >
                        {t.category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-2 text-text-secondary mt-1 min-h-0">
                    <Mail
                      size={14}
                      className="flex-shrink-0 mt-0.5 opacity-70"
                    />
                    <p className="text-sm line-clamp-2" title={t.subject}>
                      {t.subject || (
                        <span className="italic opacity-50">No subject</span>
                      )}
                    </p>
                  </div>

                  <div className="mt-auto pt-3 flex justify-between items-center text-xs text-text-tertiary">
                    <span className="font-mono">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <TemplateSelectionPopup />
    </div>
  )
}
