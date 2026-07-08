import React, { useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { apiService } from '@/services/apiService'
import { Copy, Trash2, Save } from 'lucide-react'
import { toast } from 'sonner'
import type { Asset } from '@/types'

export const AssetDetailModal: React.FC<{
  asset: Asset
  onClose: () => void
}> = ({ asset, onClose }) => {
  const [name, setName] = useState(asset.name)

  const handleCopy = () => {
    navigator.clipboard.writeText(asset.url)
    toast.success('URL copied to clipboard')
  }

  const handleDelete = () => {
    apiService.deleteAssets([asset.id])
    toast.success('Image deleted')
    onClose()
  }

  const handleSave = () => {
    if (name.trim() && name !== asset.name) {
      apiService.updateAsset(asset.id, { name: name.trim() })
      toast.success('Image updated')
    }
    onClose()
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Image Details"
      maxWidth="max-w-3xl"
    >
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2 flex items-center justify-center bg-surface-element rounded-lg p-4 border border-borders-primary">
          <img
            src={asset.url}
            alt={asset.name}
            className="max-w-full max-h-[40vh] object-contain rounded"
          />
        </div>
        <div className="w-full md:w-1/2 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Image Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Image URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={asset.url}
                  className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-tertiary"
                />
                <Button
                  variant="secondary"
                  onClick={handleCopy}
                  className="flex-shrink-0"
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-xs text-text-secondary">Added</p>
                <p className="text-sm text-text-primary font-mono">
                  {new Date(asset.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-borders-primary">
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={16} /> Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave}>
                <Save size={16} /> Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
