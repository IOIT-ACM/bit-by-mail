import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { apiService } from '@/services/apiService'
import { Button } from '@/components/common/Button'
import { Plus } from 'lucide-react'

export const Route = createFileRoute('/databases/new')({
  component: CreateDatabase,
})

function CreateDatabase() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    apiService.createDatabase(name.trim())
  }

  return (
    <div className="p-8 h-full overflow-y-auto flex flex-col items-center">
      <div className="w-full">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Create Reusable Database
          </h1>
          <p className="text-sm text-text-secondary mb-6">
            Give your database a descriptive name to manage its recipient data
            easily.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => navigate({ to: '/databases' })}
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
                <span>Create</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
