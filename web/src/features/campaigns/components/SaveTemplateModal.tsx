import React, { useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { apiService } from '@/services/apiService'
import { Save } from 'lucide-react'

export const SaveTemplateModal: React.FC<{
  currentSubject: string
  currentBody: string
  currentIsHtml: boolean
  onClose: () => void
}> = ({ currentSubject, currentBody, currentIsHtml, onClose }) => {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = () => {
    if (!name.trim()) return
    setIsSubmitting(true)
    apiService.createGlobalTemplate(
      name.trim(),
      category.trim(),
      currentSubject,
      currentBody,
      currentIsHtml,
      false,
    )
    onClose()
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Save to Template Library">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Save the current subject and body as a reusable template in your
          library.
        </p>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Template Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Campaign Q1 Follow-up"
            className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Category (Optional)
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Follow-ups"
            className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!name.trim() || isSubmitting}
          >
            <Save size={16} /> Save Template
          </Button>
        </div>
      </div>
    </Modal>
  )
}
