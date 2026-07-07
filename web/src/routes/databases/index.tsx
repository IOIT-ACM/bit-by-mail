import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import type { Database } from '@/types'
import { Button } from '@/components/common/Button'
import {
  Database as DbIcon,
  Plus,
  Loader,
  Users,
  Calendar,
  AlertTriangle,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { DatabaseSelectionPopup } from '@/features/databases/components/DatabaseSelectionPopup'

export const Route = createFileRoute('/databases/')({
  component: DatabasesList,
})

const dbGradients = [
  'bg-gradient-to-br from-indigo-500/20 to-purple-600/40 border-b border-purple-500/30',
  'bg-gradient-to-br from-emerald-500/20 to-teal-600/40 border-b border-teal-500/30',
  'bg-gradient-to-br from-blue-500/20 to-cyan-600/40 border-b border-cyan-500/30',
  'bg-gradient-to-br from-orange-500/20 to-red-600/40 border-b border-red-500/30',
  'bg-gradient-to-br from-pink-500/20 to-rose-600/40 border-b border-rose-500/30',
]

const getDbGradient = (name: string) => {
  if (!name) return dbGradients[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % dbGradients.length
  return dbGradients[index]
}

function DatabasesList() {
  const navigate = useNavigate()
  const { data: databases, isLoading } = useQuery<Database[]>({
    queryKey: ['databases'],
  })

  const [search, setSearch] = useState('')

  const toggleDatabaseSelection = useAppStore(
    (state) => state.toggleDatabaseSelection,
  )
  const selectedDatabaseIds = useAppStore((state) => state.selectedDatabaseIds)

  const filteredDatabases = useMemo(() => {
    if (!databases) return []
    if (!search) return databases
    return databases.filter((db) =>
      db.name.toLowerCase().includes(search.toLowerCase()),
    )
  }, [databases, search])

  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Reusable Databases</h1>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search databases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 px-3 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
          />
          <Link to="/databases/new">
            <Button variant="primary">
              <Plus size={18} />
              Create Database
            </Button>
          </Link>
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredDatabases.map((db) => {
            const isSelected = selectedDatabaseIds.has(db.id)
            return (
              <div
                key={db.id}
                className={`bg-surface-card rounded-xl border flex flex-col transition-all overflow-hidden relative group ${isSelected ? 'border-accent-blue ring-1 ring-accent-blue' : 'border-borders-primary hover:border-borders-primary/80 shadow-sm'}`}
              >
                <div
                  className={`h-[140px] w-full relative flex-shrink-0 overflow-hidden ${getDbGradient(db.name)}`}
                >
                  <DbIcon
                    size={140}
                    className="absolute -bottom-8 -right-8 opacity-10 text-white transform -rotate-12"
                    strokeWidth={1}
                  />

                  {db.recipientCount === 0 && (
                    <div className="absolute top-4 left-4 z-10">
                      <div className="flex items-center gap-1.5 bg-accent-orange/90 backdrop-blur border border-accent-orange/50 text-white px-2.5 py-1 rounded-full shadow-sm text-[10px] font-bold uppercase tracking-wider">
                        <AlertTriangle size={12} /> Empty Database
                      </div>
                    </div>
                  )}

                  <div
                    className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 z-20 flex items-center justify-center gap-3 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  >
                    <div className="absolute top-4 right-4">
                      <input
                        type="checkbox"
                        className="custom-checkbox w-5 h-5"
                        checked={isSelected}
                        onChange={() => toggleDatabaseSelection(db.id)}
                      />
                    </div>
                    <Button
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate({
                          to: '/databases/$databaseId',
                          params: { databaseId: db.id },
                        })
                      }}
                    >
                      Manage Data
                    </Button>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-grow bg-surface-card">
                  <h2
                    className="text-lg font-bold text-text-primary truncate mb-4"
                    title={db.name}
                  >
                    {db.name}
                  </h2>

                  <div className="flex items-end gap-3 mb-6 text-text-primary">
                    <Users
                      size={28}
                      className="text-accent-blue opacity-80 pb-1"
                    />
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black leading-none">
                        {db.recipientCount || 0}
                      </span>
                      <span className="text-sm font-medium text-text-secondary">
                        Records
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-borders-primary/30 flex items-center gap-2 text-xs text-text-tertiary">
                    <Calendar size={14} className="opacity-70" />
                    <span className="font-mono uppercase tracking-wider">
                      Created {new Date(db.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <DatabaseSelectionPopup />
    </div>
  )
}
