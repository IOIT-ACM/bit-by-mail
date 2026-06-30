import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { EmailTemplate, EmailTemplateData } from '@/types'
import { useState, useRef, useEffect } from 'react'
import { apiService } from '@/services/apiService'
import { Loader, Pencil, Check } from 'lucide-react'
import GlobalEditor from '@/features/templates/components/GlobalEditor'

export const Route = createFileRoute('/templates/$templateId')({
  component: TemplateDetail,
})

function TemplateDetail() {
  const { templateId } = Route.useParams()
  const { data: templates } = useQuery<EmailTemplate[]>({
    queryKey: ['templates'],
  })
  const template = templates?.find((t) => t.id === templateId)

  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(template?.name || '')

  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const [editedCategory, setEditedCategory] = useState(template?.category || '')

  const inputNameRef = useRef<HTMLInputElement>(null)
  const inputCatRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (templateId) {
      apiService.getGlobalTemplateData(templateId)
    }
  }, [templateId])

  useEffect(() => {
    if (template) {
      setEditedName(template.name)
      setEditedCategory(template.category || '')
    }
  }, [template])

  useEffect(() => {
    if (isEditingName && inputNameRef.current) inputNameRef.current.focus()
  }, [isEditingName])

  useEffect(() => {
    if (isEditingCategory && inputCatRef.current) inputCatRef.current.focus()
  }, [isEditingCategory])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        apiService.flushQueue()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSaveName = () => {
    if (template && editedName.trim() && editedName !== template.name) {
      apiService.updateGlobalTemplate(templateId, { name: editedName.trim() })
    } else if (template) {
      setEditedName(template.name)
    }
    setIsEditingName(false)
  }

  const handleSaveCategory = () => {
    if (template && editedCategory.trim() !== (template.category || '')) {
      apiService.updateGlobalTemplate(templateId, {
        category: editedCategory.trim(),
      })
    } else if (template) {
      setEditedCategory(template.category || '')
    }
    setIsEditingCategory(false)
  }

  const handleKeyDownName = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveName()
    if (e.key === 'Escape' && template) {
      setEditedName(template.name)
      setIsEditingName(false)
    }
  }

  const handleKeyDownCategory = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveCategory()
    if (e.key === 'Escape' && template) {
      setEditedCategory(template.category || '')
      setIsEditingCategory(false)
    }
  }

  if (!template)
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-secondary">
        <Loader size={32} className="animate-spin mb-4 text-accent-blue" />
        <p>Loading template...</p>
      </div>
    )

  return (
    <div className="flex flex-col h-full bg-background-base overflow-hidden">
      <div className="p-4 pb-2 flex-shrink-0 border-b border-borders-primary flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 group max-w-full">
            {isEditingName ? (
              <div className="flex items-center gap-2 w-full max-w-md">
                <input
                  ref={inputNameRef}
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={handleKeyDownName}
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
                title="Click to rename template"
              >
                <h1 className="text-2xl font-bold text-text-primary tracking-tight truncate max-w-sm md:max-w-md lg:max-w-xl">
                  {template.name}
                </h1>
                <Pencil
                  size={16}
                  className="text-text-tertiary group-hover:text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 group ml-1">
            {isEditingCategory ? (
              <div className="flex items-center gap-2 w-48">
                <input
                  ref={inputCatRef}
                  type="text"
                  value={editedCategory}
                  onChange={(e) => setEditedCategory(e.target.value)}
                  onBlur={handleSaveCategory}
                  onKeyDown={handleKeyDownCategory}
                  placeholder="Category..."
                  className="text-sm bg-surface-element border border-accent-blue rounded-md px-2 py-0.5 outline-none w-full"
                />
                <button
                  onMouseDown={handleSaveCategory}
                  className="p-1 text-accent-blue hover:bg-surface-element rounded-md"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingCategory(true)}
                className="flex items-center gap-2 cursor-pointer rounded-md px-1 -ml-1 border border-transparent hover:border-borders-primary hover:bg-surface-element transition-all"
                title="Click to edit category"
              >
                <span className="text-sm text-text-secondary">
                  {template.category || 'No Category'}
                </span>
                <Pencil
                  size={12}
                  className="text-text-tertiary group-hover:text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 min-h-0 flex flex-col">
        <GlobalEditor templateId={templateId} subject={template.subject} />
      </div>
    </div>
  )
}
