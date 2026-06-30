import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { EmailTemplate } from '@/types'
import { Button } from '@/components/common/Button'
import { LayoutTemplate, Plus, Loader, FolderOpen } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { TemplateSelectionPopup } from '@/features/templates/components/TemplateSelectionPopup'
import { useState, useMemo } from 'react'

export const Route = createFileRoute('/templates/')({
  component: TemplatesList,
})

function TemplatesList() {
  const { data: templates, isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ['templates'],
  })

  const { toggleTemplateSelection, selectedTemplateIds } = useAppStore()

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((t) => {
            const isSelected = selectedTemplateIds.has(t.id)
            return (
              <div
                key={t.id}
                className={`bg-surface-card p-6 rounded-card border shadow-card flex flex-col h-full transition-colors relative ${isSelected ? 'border-accent-blue bg-accent-blue/5' : 'border-borders-primary hover:border-accent-blue/50'}`}
              >
                <div className="absolute top-4 right-4">
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={isSelected}
                    onChange={() => toggleTemplateSelection(t.id)}
                  />
                </div>

                <div className="pr-8 mb-4">
                  <h2
                    className="text-xl font-semibold mb-1 truncate"
                    title={t.name}
                  >
                    {t.name}
                  </h2>
                  {t.category && (
                    <span className="inline-block px-2 py-0.5 bg-surface-element text-text-secondary text-xs rounded-md">
                      {t.category}
                    </span>
                  )}
                </div>

                <div className="flex-grow mb-6">
                  <p
                    className="text-sm text-text-secondary line-clamp-2"
                    title={t.subject}
                  >
                    <span className="font-medium text-text-primary">
                      Subject:
                    </span>{' '}
                    {t.subject || 'No Subject'}
                  </p>
                  <p className="text-xs text-text-tertiary mt-2 font-mono">
                    Updated: {new Date(t.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <Link to="/templates/$templateId" params={{ templateId: t.id }}>
                  <Button variant="secondary" className="w-full">
                    <FolderOpen size={16} /> Edit Template
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>
      )}

      <TemplateSelectionPopup />
    </div>
  )
}
