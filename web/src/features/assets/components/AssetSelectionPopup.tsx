import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { apiService } from '@/services/apiService'
import { Button } from '@/components/common/Button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import type { Asset } from '@/types'

export const AssetSelectionPopup: React.FC = () => {
  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ['assets'],
  })
  const selectedAssetIds = useAppStore((state) => state.selectedAssetIds)
  const clearAssetSelection = useAppStore((state) => state.clearAssetSelection)
  const selectedCount = selectedAssetIds.size

  const [showConfirm, setShowConfirm] = useState(false)

  const confirmDelete = () => {
    apiService.deleteAssets(Array.from(selectedAssetIds))
    toast.success(
      selectedCount === 1
        ? `Image deleted successfully`
        : `${selectedCount} images deleted successfully`,
    )
    clearAssetSelection()
  }

  const assetNames = Array.from(selectedAssetIds)
    .map((id) => assets.find((a) => a.id === id)?.name)
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
                {selectedCount} {selectedCount === 1 ? 'image' : 'images'}{' '}
                selected
              </p>
              <div className="flex flex-col gap-2">
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
        title="Delete Images"
        message={
          selectedCount === 1
            ? `Are you sure you want to delete the image "${assetNames}"? This action cannot be undone.`
            : `Are you sure you want to delete ${selectedCount} images? This action cannot be undone.`
        }
        confirmText="Delete"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
}
