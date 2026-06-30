import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, ArrowRight } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { apiService } from '@/services/apiService'
import { Button } from '@/components/common/Button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import type { Database } from '@/types'
import { useRouter } from '@tanstack/react-router'

export const DatabaseSelectionPopup: React.FC = () => {
  const router = useRouter()
  const { data: databases = [] } = useQuery<Database[]>({
    queryKey: ['databases'],
  })
  const { selectedDatabaseIds, clearDatabaseSelection } = useAppStore()
  const selectedCount = selectedDatabaseIds.size

  const [showConfirm, setShowConfirm] = useState(false)

  const handleOpen = () => {
    if (selectedCount !== 1) return
    const id = selectedDatabaseIds.values().next().value
    router.navigate({
      to: '/databases/$databaseId',
      params: { databaseId: id ?? 'undefined' },
    })
    clearDatabaseSelection()
  }

  const confirmDelete = () => {
    apiService.deleteDatabases(Array.from(selectedDatabaseIds))
    toast.success(
      selectedCount === 1
        ? `Database deleted successfully`
        : `${selectedCount} databases deleted successfully`,
    )
    clearDatabaseSelection()
  }

  const dbNames = Array.from(selectedDatabaseIds)
    .map((id) => databases.find((db) => db.id === id)?.name)
    .filter(Boolean)
    .join(', ')

  return (
    <>
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-6 bottom-20 z-40 bg-surface-card backdrop-blur-xl border border-borders-primary rounded-card shadow-card p-4 w-64"
          >
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-text-primary text-center">
                {selectedCount} {selectedCount === 1 ? 'database' : 'databases'}{' '}
                selected
              </p>
              <div className="flex flex-col gap-2">
                {selectedCount === 1 && (
                  <Button onClick={handleOpen} variant="secondary">
                    <ArrowRight size={16} />
                    <span>Open Database</span>
                  </Button>
                )}
                <Button onClick={() => setShowConfirm(true)} variant="danger">
                  <Trash2 size={16} />
                  <span>Delete Selected</span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Delete Databases"
        message={
          selectedCount === 1
            ? `Are you sure you want to delete the database "${dbNames}"? This action cannot be undone.`
            : `Are you sure you want to delete ${selectedCount} databases? This action cannot be undone.`
        }
        confirmText="Delete"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
}
