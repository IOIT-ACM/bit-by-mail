import { useQuery } from '@tanstack/react-query'
import {
  Braces,
  Code,
  Expand,
  Eye,
  Maximize,
  Minimize,
  Download,
  Save,
  Image as ImageIcon,
} from 'lucide-react'
import React, { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect'
import { apiService } from '@/services/apiService'
import { queryClient } from '@/services/queryClient'
import type { CampaignData, Campaign } from '@/types'
import { MaximizableView } from '@/components/common/MaximizableView'
import { MonacoEditorWrapper } from '@/components/common/MonacoEditorWrapper'
import { LoadTemplateModal } from './LoadTemplateModal'
import { SaveTemplateModal } from './SaveTemplateModal'
import { AssetPickerModal } from '@/features/assets/components/AssetPickerModal'

const TabButton: React.FC<{
  label: string
  icon: React.ReactNode
  isActive: boolean
  onClick: () => void
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    aria-label={`${label} tab`}
    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${isActive ? 'text-text-primary border-accent-blue' : 'text-text-secondary border-transparent hover:text-text-primary'}`}
  >
    {icon}
    {label}
  </button>
)

const PlaceholderList: React.FC<{ campaignId: string }> = ({ campaignId }) => {
  const { data } = useQuery<CampaignData>({
    queryKey: ['campaignData', campaignId],
  })
  const recipients = data?.recipients ?? []
  const availablePlaceholders =
    recipients.length > 0 ? Object.keys(recipients[0]) : []

  const handleCopy = (placeholderName: string) => {
    navigator.clipboard.writeText(`{{${placeholderName}}}`)
    toast.success(`Placeholder "${placeholderName}" copied to clipboard`)
  }

  if (availablePlaceholders.length === 0)
    return (
      <p className="text-sm text-text-tertiary italic">
        No recipients uploaded yet.
      </p>
    )

  return (
    <div className="flex flex-wrap gap-2">
      {availablePlaceholders.map((placeholder) => (
        <code
          key={placeholder}
          className="text-xs bg-black/30 px-2 py-1 rounded cursor-pointer hover:bg-accent-blue/50 transition-colors"
          title={`Click to copy {{${placeholder}}}`}
          onClick={() => handleCopy(placeholder)}
        >
          {`{{${placeholder}}}`}
        </code>
      ))}
    </div>
  )
}

const EditorContent: React.FC<{
  isMaximized: boolean
  onToggleMaximize: () => void
  campaignId: string
  initialSubject: string
}> = ({ isMaximized, onToggleMaximize, campaignId, initialSubject }) => {
  const { data } = useQuery<CampaignData>({
    queryKey: ['campaignData', campaignId],
  })
  const [activeTab, setActiveTab] = useState<
    'code' | 'preview' | 'placeholders'
  >('code')

  const [localSubject, setLocalSubject] = useState(initialSubject)
  const [localBody, setLocalBody] = useState('')
  const [editorInstance, setEditorInstance] = useState<any>(null)

  const [showLoadModal, setShowLoadModal] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showAssetPicker, setShowAssetPicker] = useState(false)

  useEffect(() => {
    if (data?.emailBody !== undefined) {
      setLocalBody((prev) => (prev !== data.emailBody ? data.emailBody : prev))
    }
  }, [data?.emailBody])

  useEffect(() => {
    setLocalSubject((prev) => (prev !== initialSubject ? initialSubject : prev))
  }, [initialSubject])

  const handleBodyChange = (newBody: string) => {
    if (newBody === localBody) return
    setLocalBody(newBody)
    queryClient.setQueryData<CampaignData>(
      ['campaignData', campaignId],
      (old) => (old ? { ...old, emailBody: newBody } : old),
    )
  }

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSubject = e.target.value
    if (newSubject === localSubject) return
    setLocalSubject(newSubject)
    queryClient.setQueryData<Campaign[]>(['campaigns'], (old) =>
      old
        ? old.map((c) =>
            c.id === campaignId ? { ...c, subject: newSubject } : c,
          )
        : old,
    )
  }

  const handleInsertAsset = (url: string, name: string) => {
    const tag = `<img src="${url}" alt="${name}" />`
    if (editorInstance) {
      const selection = editorInstance.getSelection()
      const op = { range: selection, text: tag, forceMoveMarkers: true }
      editorInstance.executeEdits('source', [op])
    } else {
      handleBodyChange(localBody + tag)
    }
    setShowAssetPicker(false)
  }

  const lastSavedBody = useRef(data?.emailBody || '')
  useDebouncedEffect(
    () => {
      if (localBody !== lastSavedBody.current) {
        apiService.saveTemplate(campaignId, localBody)
        lastSavedBody.current = localBody
      }
    },
    1500,
    [localBody, campaignId],
  )

  const lastSavedSubject = useRef(initialSubject)
  useDebouncedEffect(
    () => {
      if (localSubject !== lastSavedSubject.current) {
        apiService.updateCampaign(campaignId, { subject: localSubject })
        lastSavedSubject.current = localSubject
      }
    },
    1500,
    [localSubject, campaignId],
  )

  const handleFullscreenPreview = () => {
    const blob = new Blob([localBody], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  const handleLoadTemplate = (subject: string, body: string) => {
    handleSubjectChange({
      target: { value: subject },
    } as React.ChangeEvent<HTMLInputElement>)
    handleBodyChange(body)
    apiService.saveTemplate(campaignId, body)
    apiService.updateCampaign(campaignId, { subject })
    toast.success('Template loaded successfully.')
  }

  const isLikelyHtml = (text: string) =>
    /<\s*\/?\s*(html|body|div|p|h[1-6]|table|ul|ol|a|img|br)\b/i.test(text)

  const preparePreviewContent = (content: string) => {
    if (isLikelyHtml(content)) return content
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;margin:20px;color:#333;word-wrap:break-word}pre{white-space:pre-wrap;word-wrap:break-word;margin:0;font-family:inherit;font-size:inherit}</style></head><body><pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`
  }

  const previewContent = preparePreviewContent(localBody)

  return (
    <>
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-heading-3 font-medium text-text-primary">
            Email Content
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAssetPicker(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-surface-element hover:bg-surface-element-hover text-text-secondary hover:text-text-primary transition-colors border border-borders-primary"
            >
              <ImageIcon size={14} /> Insert Asset
            </button>
            <button
              onClick={() => setShowLoadModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-surface-element hover:bg-surface-element-hover text-text-secondary hover:text-text-primary transition-colors border border-borders-primary"
            >
              <Download size={14} /> Load Library
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-surface-element hover:bg-surface-element-hover text-text-secondary hover:text-text-primary transition-colors border border-borders-primary"
            >
              <Save size={14} /> Save Library
            </button>
          </div>
        </div>
        <button
          onClick={onToggleMaximize}
          aria-label={isMaximized ? 'Minimize Editor' : 'Maximize Editor'}
          className="p-1 rounded-full text-text-secondary hover:bg-surface-element-hover hover:text-text-primary transition-colors"
        >
          {isMaximized ? <Minimize size={20} /> : <Maximize size={16} />}
        </button>
      </div>
      <div className="flex-shrink-0 mb-4">
        <label
          htmlFor="subject-input"
          className="block text-sm font-medium text-text-secondary mb-1 px-1"
        >
          Email Subject
        </label>
        <input
          id="subject-input"
          type="text"
          value={localSubject}
          onChange={handleSubjectChange}
          placeholder="Email Subject Template"
          className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-colors"
          maxLength={150}
        />
      </div>
      <div className="flex-grow flex flex-col md:flex-row gap-4 min-h-0">
        {isMaximized ? (
          <>
            <div className="flex-1 flex flex-col min-h-0 gap-4">
              <div className="flex-grow flex flex-col min-h-0">
                <h3 className="text-sm font-medium text-text-secondary mb-2 px-1">
                  Code
                </h3>
                <div className="w-full flex-grow bg-surface-element border border-borders-primary rounded-lg overflow-hidden">
                  <MonacoEditorWrapper
                    value={localBody}
                    onChange={handleBodyChange}
                    onMount={setEditorInstance}
                  />
                </div>
              </div>
              <div className="flex-shrink-0 p-3 bg-surface-element border border-borders-primary rounded-lg">
                <h4 className="text-sm font-medium text-text-secondary mb-2">
                  Available Placeholders
                </h4>
                <PlaceholderList campaignId={campaignId} />
              </div>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-sm font-medium text-text-secondary mb-2 px-1">
                Preview
              </h3>
              <iframe
                srcDoc={previewContent}
                title="Email Preview"
                className="w-full h-full bg-white border border-borders-primary rounded-lg"
                sandbox="allow-same-origin"
              />
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col min-h-0">
            <div className="flex items-center border-b border-borders-primary flex-shrink-0">
              <TabButton
                label="Code"
                icon={<Code size={16} />}
                isActive={activeTab === 'code'}
                onClick={() => setActiveTab('code')}
              />
              <TabButton
                label="Preview"
                icon={<Eye size={16} />}
                isActive={activeTab === 'preview'}
                onClick={() => setActiveTab('preview')}
              />
              <TabButton
                label="Vars"
                icon={<Braces size={16} />}
                isActive={activeTab === 'placeholders'}
                onClick={() => setActiveTab('placeholders')}
              />
            </div>
            <div className="flex-grow relative mt-4">
              {activeTab === 'code' && (
                <div className="absolute inset-0 bg-surface-element border border-borders-primary rounded-b-lg rounded-tr-lg overflow-hidden">
                  <MonacoEditorWrapper
                    value={localBody}
                    onChange={handleBodyChange}
                    onMount={setEditorInstance}
                  />
                </div>
              )}
              {activeTab === 'preview' && (
                <div className="absolute inset-0 flex flex-col bg-surface-element border border-borders-primary rounded-b-lg rounded-tr-lg overflow-hidden">
                  <div className="flex justify-end p-2 border-b border-borders-primary bg-surface-element-hover/50">
                    <button
                      onClick={handleFullscreenPreview}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md text-text-secondary bg-surface-element hover:bg-black/30 hover:text-text-primary transition-colors"
                    >
                      <Expand size={14} />
                      Fullscreen
                    </button>
                  </div>
                  <iframe
                    srcDoc={previewContent}
                    title="Email Preview"
                    className="w-full h-full flex-grow bg-white"
                    sandbox="allow-same-origin"
                  />
                </div>
              )}
              {activeTab === 'placeholders' && (
                <div className="absolute inset-0 bg-surface-element border border-borders-primary rounded-b-lg rounded-tr-lg overflow-auto p-4 custom-scrollbar">
                  <h4 className="text-sm font-medium text-text-secondary mb-3">
                    Available Placeholders
                  </h4>
                  <PlaceholderList campaignId={campaignId} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showAssetPicker && (
        <AssetPickerModal
          onClose={() => setShowAssetPicker(false)}
          onSelect={handleInsertAsset}
        />
      )}
      {showLoadModal && (
        <LoadTemplateModal
          onClose={() => setShowLoadModal(false)}
          onLoad={handleLoadTemplate}
        />
      )}
      {showSaveModal && (
        <SaveTemplateModal
          onClose={() => setShowSaveModal(false)}
          currentSubject={localSubject}
          currentBody={localBody}
        />
      )}
    </>
  )
}

export default function Editor({
  campaignId,
  subject,
}: {
  campaignId: string
  subject: string
}) {
  return (
    <MaximizableView layoutId="editor-container">
      {({ isMaximized, onToggle }) => (
        <EditorContent
          isMaximized={isMaximized}
          onToggleMaximize={onToggle}
          campaignId={campaignId}
          initialSubject={subject}
        />
      )}
    </MaximizableView>
  )
}
