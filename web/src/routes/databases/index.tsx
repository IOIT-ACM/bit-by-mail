import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { Database } from '@/types'
import { Button } from '@/components/common/Button'
import { Database as DbIcon, Plus, Loader } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { DatabaseSelectionPopup } from '@/features/databases/components/DatabaseSelectionPopup'

export const Route = createFileRoute('/databases/')({
  component: DatabasesList,
})

function DatabasesList() {
  const { data: databases, isLoading } = useQuery<Database[]>({
    queryKey: ['databases'],
  })

  const { toggleDatabaseSelection, selectedDatabaseIds } = useAppStore()

  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar relative">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Reusable Databases</h1>
        <Link to="/databases/new">
          <Button variant="primary">
            <Plus size={18} />
            Create Database
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 mt-12 text-text-secondary">
          <Loader size={32} className="animate-spin mb-4 text-accent-blue" />
          <p>Loading databases...</p>
        </div>
      ) : !databases || databases.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-surface-card border border-borders-primary border-dashed rounded-card mt-12">
          <DbIcon size={48} className="text-text-tertiary mb-4" />
          <h2 className="text-xl font-semibold mb-2">No databases yet</h2>
          <p className="text-text-secondary mb-6">
            Create your first database to store a reusable list of recipients.
          </p>
          <Link to="/databases/new">
            <Button variant="primary">
              <Plus size={18} />
              Create Database
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {databases.map((db) => {
            const isSelected = selectedDatabaseIds.has(db.id)
            return (
              <div
                key={db.id}
                className={`bg-surface-card p-6 rounded-card border shadow-card flex flex-col h-full transition-colors relative ${isSelected ? 'border-accent-blue bg-accent-blue/5' : 'border-borders-primary hover:border-accent-blue/50'}`}
              >
                <div className="absolute top-4 right-4">
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={isSelected}
                    onChange={() => toggleDatabaseSelection(db.id)}
                  />
                </div>

                <h2
                  className="text-xl font-semibold mb-1 truncate pr-8"
                  title={db.name}
                >
                  {db.name}
                </h2>
                <p className="text-xs text-text-tertiary mb-4 font-mono">
                  {new Date(db.createdAt).toLocaleDateString()}
                </p>
                <div className="flex-grow">
                  <p className="text-text-secondary mb-6 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-accent-blue"></span>
                    {db.recipientCount || 0} Records
                  </p>
                </div>
                <Link
                  to="/databases/$databaseId"
                  params={{ databaseId: db.id }}
                >
                  <Button variant="secondary" className="w-full">
                    Manage Data
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>
      )}

      <DatabaseSelectionPopup />
    </div>
  )
}
