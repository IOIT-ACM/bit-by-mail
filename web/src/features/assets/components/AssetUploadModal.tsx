import React, { useState, useMemo, useEffect } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { apiService } from '@/services/apiService'
import { Link as LinkIcon, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export const AssetUploadModal: React.FC<{
  onClose: () => void
}> = ({ onClose }) => {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    setName(
      `Image-${Math.floor(Date.now() / 1000)
        .toString()
        .slice(-6)}`,
    )
  }, [])

  const isValidUrl = useMemo(() => {
    try {
      const parsedUrl = new URL(url.trim())
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
    } catch {
      return false
    }
  }, [url])

  const isGDrive = useMemo(() => {
    return /(?:drive\.google\.com|drive\.usercontent\.google\.com)/i.test(url)
  }, [url])

  const handleImport = () => {
    if (!name.trim() || !isValidUrl) {
      toast.error('Name and a valid URL are required')
      return
    }
    setIsUploading(true)
    apiService.createAsset(name.trim(), url.trim(), isGDrive)
    toast.success('Image added successfully')
    onClose()
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Add New Image">
      <div className="space-y-6">
        <p className="text-sm text-text-secondary leading-relaxed">
          To send images in your emails, they must first be hosted online. You
          can use any static hosting provider or simply upload your images to
          Google Drive and paste the sharing link here.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Image Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Company Logo"
              className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Image URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste direct URL or Google Drive link..."
              className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
              autoFocus
            />

            <div className="mt-2 min-h-[20px]">
              {isGDrive ? (
                <p className="text-xs text-status-success-text flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  Valid Google Drive link detected. Ensure sharing is "Anyone
                  with the link".
                </p>
              ) : isValidUrl ? (
                <p className="text-xs text-text-tertiary">
                  Direct URL format detected.
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              onClick={handleImport}
              disabled={!isValidUrl || !name.trim() || isUploading}
            >
              <LinkIcon size={16} />
              <span>Add Image</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
