import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Paperclip } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import type { Campaign, CampaignData, Config, Recipient } from '@/types'
import { Modal } from '@/components/common/Modal'

interface EmailPreviewModalProps {
  onClose: () => void
}

const replacePlaceholders = (template: string, data: Recipient): string => {
  if (!template) return ''
  let result = template
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, String(data[key]))
    }
  }
  return result
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  onClose,
}) => {
  const { campaignId } = useParams({ strict: false }) as Record<
    string,
    string | undefined
  >
  const previewRecipient = useAppStore((state) => state.previewRecipient)
  const setPreviewRecipient = useAppStore((state) => state.setPreviewRecipient)

  const { data: config } = useQuery<Config>({ queryKey: ['config'] })
  const { data: campaigns } = useQuery<Campaign[]>({ queryKey: ['campaigns'] })
  const { data: campaignData } = useQuery<CampaignData>({
    queryKey: ['campaignData', campaignId],
    enabled: !!campaignId,
  })

  const recipients = campaignData?.recipients ?? []
  const emailBody = campaignData?.emailBody ?? ''
  const activeCampaign = campaigns?.find((c) => c.id === campaignId)
  const subjectTemplate = activeCampaign?.subject ?? ''

  const accounts = config?.accounts || []
  let senderEmail = 'Not configured'
  if (accounts.length > 0) {
    let acc = accounts.find((a) => a.id === activeCampaign?.sender_account_id)
    if (!acc) acc = accounts.find((a) => a.is_default)
    if (!acc) acc = accounts[0]
    senderEmail = acc.sender_email
  }

  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(
    null,
  )

  const currentIndex = useMemo(() => {
    if (!previewRecipient) return -1
    return recipients.findIndex((r) => r === previewRecipient)
  }, [recipients, previewRecipient])

  const attachmentFiles = useMemo(() => {
    if (!previewRecipient?.AttachmentFile) return []
    return previewRecipient.AttachmentFile.split(';')
      .map((f) => f.trim())
      .filter(Boolean)
  }, [previewRecipient])

  useEffect(() => {
    if (attachmentFiles.length > 0) setSelectedAttachment(attachmentFiles[0])
    else setSelectedAttachment(null)
  }, [attachmentFiles])

  const goToRecipient = (index: number) => {
    if (index >= 0 && index < recipients.length)
      setPreviewRecipient(recipients[index])
  }

  const goToNext = () => goToRecipient(currentIndex + 1)
  const goToPrevious = () => goToRecipient(currentIndex - 1)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPrevious()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, recipients.length])

  if (!previewRecipient) return null

  const finalSubject = replacePlaceholders(subjectTemplate, previewRecipient)
  let finalBody = replacePlaceholders(emailBody, previewRecipient)

  if (activeCampaign && !activeCampaign.is_html) {
    finalBody = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head><body style="margin:0;padding:16px;background:#fff;"><pre style="white-space:pre-wrap;font-family:sans-serif;font-size:14px;margin:0;color:#000;">${finalBody.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`
  }

  const showAttachment =
    activeCampaign?.send_attachments && attachmentFiles.length > 0
  const attachmentUrl =
    showAttachment && selectedAttachment && campaignId
      ? `/attachments/${campaignId}/${currentIndex}?file=${encodeURIComponent(selectedAttachment)}`
      : ''

  return (
    <>
      <button
        onClick={goToPrevious}
        aria-label="Previous Recipient"
        disabled={currentIndex <= 0}
        className="fixed left-4 md:left-8 top-1/2 -translate-y-1/2 z-[60] p-2 rounded-full bg-surface-card/80 border border-borders-primary shadow-lg hover:bg-surface-element hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft size={32} className="text-text-primary" />
      </button>
      <button
        onClick={goToNext}
        aria-label="Next Recipient"
        disabled={currentIndex >= recipients.length - 1}
        className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-[60] p-2 rounded-full bg-surface-card/80 border border-borders-primary shadow-lg hover:bg-surface-element hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight size={32} className="text-text-primary" />
      </button>

      <Modal
        isOpen={!!previewRecipient}
        onClose={onClose}
        title={`Preview for ${previewRecipient.Name}`}
        maxWidth="max-w-6xl"
      >
        <div className="flex flex-col h-[75vh]">
          <div className="flex-shrink-0 space-y-2 mb-4 bg-surface-element p-4 rounded-lg border border-borders-primary">
            <p className="text-sm text-text-secondary">
              <strong>From:</strong>{' '}
              <span className="text-text-primary">{senderEmail}</span>
            </p>
            <p className="text-sm text-text-secondary">
              <strong>To:</strong>{' '}
              <span className="text-text-primary">
                {previewRecipient.Email}
              </span>
            </p>
            <p className="text-sm text-text-secondary">
              <strong>Subject:</strong>{' '}
              <span className="text-text-primary">{finalSubject}</span>
            </p>
            {showAttachment && (
              <div className="text-sm text-text-secondary flex flex-wrap items-center gap-2 pt-1 border-t border-borders-primary mt-2">
                <strong>Attachments:</strong>
                <div className="flex flex-wrap gap-2 mt-1">
                  {attachmentFiles.map((file, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedAttachment(file)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${selectedAttachment === file ? 'bg-accent-blue/20 text-accent-blue font-medium' : 'bg-surface-card border border-borders-primary hover:bg-surface-element-hover text-text-secondary'}`}
                    >
                      <Paperclip size={14} />
                      <span>{file}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={`flex-grow min-h-0 flex flex-col md:flex-row gap-4`}>
            <div
              className={`w-full ${showAttachment ? 'md:w-1/2' : ''} h-full min-h-0 border border-borders-primary rounded-lg overflow-hidden bg-white`}
            >
              <iframe
                key={`${currentIndex}-email`}
                srcDoc={finalBody}
                title="Email Preview"
                className="w-full h-full"
                sandbox="allow-same-origin"
              />
            </div>

            {showAttachment && (
              <div className="w-full md:w-1/2 h-full min-h-0 flex flex-col">
                <div className="mb-2 text-sm text-text-secondary bg-surface-element px-3 py-1.5 rounded-md border border-borders-primary truncate">
                  Previewing:{' '}
                  <span className="text-text-primary font-medium">
                    {selectedAttachment}
                  </span>
                </div>
                <div className="flex-grow min-h-0 border border-borders-primary rounded-lg overflow-hidden bg-white">
                  <iframe
                    key={`${currentIndex}-attachment-${selectedAttachment}`}
                    src={attachmentUrl}
                    title="Attachment Preview"
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-surface-header border border-borders-primary rounded-full text-sm text-text-primary font-mono shadow-lg">
            {currentIndex + 1} of {recipients.length}
          </div>
        </div>
      </Modal>
    </>
  )
}
