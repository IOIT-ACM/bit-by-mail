import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { apiService } from '@/services/apiService'
import { Button } from '@/components/common/Button'
import { Plus } from 'lucide-react'

export const Route = createFileRoute('/templates/new')({
  component: CreateTemplate,
})

function CreateTemplate() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    apiService.createGlobalTemplate(name.trim(), category.trim(), '', '', true)
  }

  return (
    <div className="p-8 h-full overflow-y-auto flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Create Reusable Template
          </h1>
          <p className="text-sm text-text-secondary mb-6">
            Provide a name and optional category for your new email template.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="templateName"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Template Name
              </label>
              <input
                id="templateName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Welcome Email"
                className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-colors"
                required
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label
                htmlFor="templateCategory"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Category (Optional)
              </label>
              <input
                id="templateCategory"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Onboarding, Newsletters"
                className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-colors"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => navigate({ to: '/templates' })}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={!name.trim() || isSubmitting}
              >
                <Plus size={18} />
                <span>Create Template</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
