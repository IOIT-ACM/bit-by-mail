import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, ArrowRight, Copy } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { apiService } from '@/services/apiService'
import { Button } from '@/components/common/Button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import type { EmailTemplate } from '@/types'
import { useRouter } from '@tanstack/react-router'

export const TemplateSelectionPopup: React.FC = () => {
  const router = useRouter()
  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ['templates'],
  })
  const selectedTemplateIds = useAppStore((state) => state.selectedTemplateIds)
  const clearTemplateSelection = useAppStore(
    (state) => state.clearTemplateSelection,
  )
  const selectedCount = selectedTemplateIds.size

  const [showConfirm, setShowConfirm] = useState(false)

  const handleOpen = () => {
    if (selectedCount !== 1) return
    const id = selectedTemplateIds.values().next().value
    router.navigate({
      to: '/templates/$templateId',
      params: { templateId: id ?? 'undefined' },
    })
    clearTemplateSelection()
  }

  const handleDuplicate = () => {
    if (selectedCount !== 1) return
    const id = selectedTemplateIds.values().next().value
    if (id) {
      apiService.duplicateGlobalTemplate(id)
      toast.success('Template duplicated')
    }
    clearTemplateSelection()
  }

  const confirmDelete = () => {
    apiService.deleteGlobalTemplates(Array.from(selectedTemplateIds))
    toast.success(
      selectedCount === 1
        ? `Template deleted successfully`
        : `${selectedCount} templates deleted successfully`,
    )
    clearTemplateSelection()
  }

  const templateNames = Array.from(selectedTemplateIds)
    .map((id) => templates.find((t) => t.id === id)?.name)
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
                {selectedCount} {selectedCount === 1 ? 'template' : 'templates'}{' '}
                selected
              </p>
              <div className="flex flex-col gap-2">
                {selectedCount === 1 && (
                  <>
                    <Button onClick={handleOpen} variant="secondary">
                      <ArrowRight size={16} />
                      <span>Edit Template</span>
                    </Button>
                    <Button onClick={handleDuplicate} variant="secondary">
                      <Copy size={16} />
                      <span>Duplicate</span>
                    </Button>
                  </>
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
        title="Delete Templates"
        message={
          selectedCount === 1
            ? `Are you sure you want to delete the template "${templateNames}"? This action cannot be undone.`
            : `Are you sure you want to delete ${selectedCount} templates? This action cannot be undone.`
        }
        confirmText="Delete"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  )
}
