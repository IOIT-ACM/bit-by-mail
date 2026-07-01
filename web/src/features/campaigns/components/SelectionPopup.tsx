import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { apiService } from '@/services/apiService'
import { Button } from '@/components/common/Button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import type { Campaign } from '@/types'

export const SelectionPopup: React.FC = () => {
  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
  })
  const selectedCampaignIds = useAppStore((state) => state.selectedCampaignIds)
  const clearCampaignSelection = useAppStore(
    (state) => state.clearCampaignSelection,
  )
  const selectedCount = selectedCampaignIds.size

  const [showConfirm, setShowConfirm] = useState(false)

  const confirmDelete = () => {
    apiService.deleteCampaigns(Array.from(selectedCampaignIds))
    toast.success(
      selectedCount === 1
        ? `Campaign deleted successfully`
        : `${selectedCount} campaigns deleted successfully`,
    )
    clearCampaignSelection()
  }

  const campaignNames = Array.from(selectedCampaignIds)
    .map((id) => campaigns.find((c) => c.id === id)?.name)
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
                {selectedCount} {selectedCount === 1 ? 'campaign' : 'campaigns'}{' '}
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
        title="Delete Campaigns"
        message={
          selectedCount === 1
            ? `Are you sure you want to delete the campaign "${campaignNames}"? This action cannot be undone.`
            : `Are you sure you want to delete ${selectedCount} campaigns? This action cannot be undone.`
        }
        confirmText="Delete"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
}
