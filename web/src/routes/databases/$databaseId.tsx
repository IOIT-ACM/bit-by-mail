import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { Database } from '@/types'
import { DatabaseViewHeader } from '@/features/databases/components/DatabaseViewHeader'
import RecipientTable from '@/features/campaigns/components/RecipientTable'
import { AddRecipientModal } from '@/features/campaigns/components/AddRecipientModal'
import { useAppStore } from '@/store/useAppStore'
import { useEffect } from 'react'
import { apiService } from '@/services/apiService'
import { Loader } from 'lucide-react'

export const Route = createFileRoute('/databases/$databaseId')({
  component: DatabaseDetail,
})

function DatabaseDetail() {
  const { databaseId } = Route.useParams()
  const { data: databases } = useQuery<Database[]>({ queryKey: ['databases'] })
  const database = databases?.find((d) => d.id === databaseId)

  useEffect(() => {
    if (databaseId) {
      apiService.getDatabaseData(databaseId)
    }
  }, [databaseId])

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

  const { showAddRecipientModal } = useAppStore()

  if (!database)
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-secondary">
        <Loader size={32} className="animate-spin mb-4 text-accent-blue" />
        <p>Loading database...</p>
      </div>
    )

  return (
    <div className="flex flex-col h-full bg-background-base overflow-hidden">
      <div className="p-4 pb-2 flex-shrink-0">
        <DatabaseViewHeader database={database} databaseId={databaseId} />
      </div>

      <div className="flex-1 px-4 pb-4 min-h-0">
        <RecipientTable contextId={databaseId} contextType="database" />
      </div>

      {showAddRecipientModal && (
        <AddRecipientModal contextId={databaseId} contextType="database" />
      )}
    </div>
  )
}
