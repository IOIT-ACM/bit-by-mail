import { useQuery } from '@tanstack/react-query'
import {
  Expand,
  Maximize,
  Minimize,
  Download,
  Save,
  Image as ImageIcon,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'
import React, { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect'
import { apiService } from '@/services/apiService'
import { queryClient } from '@/services/queryClient'
import type {
  CampaignData,
  Campaign,
  EmailTemplateData,
  EmailTemplate,
} from '@/types'
import { MaximizableView } from '@/components/common/MaximizableView'
import { MonacoEditorWrapper } from '@/components/common/MonacoEditorWrapper'
import { LoadTemplateModal } from './LoadTemplateModal'
import { SaveTemplateModal } from './SaveTemplateModal'
import { AssetPickerModal } from '@/features/assets/components/AssetPickerModal'
import { useAppStore } from '@/store/useAppStore'

const PlaceholderList: React.FC<{ entityId: string }> = ({ entityId }) => {
  const { data } = useQuery<CampaignData>({
    queryKey: ['campaignData', entityId],
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
  entityId: string
  initialSubject: string
  type: 'campaign' | 'template'
}> = ({ isMaximized, onToggleMaximize, entityId, initialSubject, type }) => {
  const { data: campaignData } = useQuery<CampaignData>({
    queryKey: ['campaignData', entityId],
    enabled: type === 'campaign',
  })
  const { data: templateData } = useQuery<EmailTemplateData>({
    queryKey: ['templateData', entityId],
    enabled: type === 'template',
  })
  const { data: campaigns } = useQuery<Campaign[]>({ queryKey: ['campaigns'] })
  const campaign = campaigns?.find((c) => c.id === entityId)

  const { data: templates } = useQuery<EmailTemplate[]>({
    queryKey: ['templates'],
  })
  const template = templates?.find((t) => t.id === entityId)

  const remoteBody =
    type === 'campaign' ? campaignData?.emailBody : templateData?.body

  const initialIsHtml =
    type === 'campaign'
      ? (campaign?.is_html ?? true)
      : (template?.is_html ?? true)

  const [localSubject, setLocalSubject] = useState(initialSubject)
  const [localBody, setLocalBody] = useState('')
  const [localIsHtml, setLocalIsHtml] = useState(initialIsHtml)
  const [editorInstance, setEditorInstance] = useState<any>(null)

  const [showLoadModal, setShowLoadModal] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showAssetPicker, setShowAssetPicker] = useState(false)
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false)

  const setSaveStatus = useAppStore((state) => state.setSaveStatus)
  const saveStatus = useAppStore((state) => state.saveStatus)
  const connectionStatus = useAppStore((state) => state.connectionStatus)

  useEffect(() => {
    setLocalIsHtml(initialIsHtml)
  }, [initialIsHtml])

  useEffect(() => {
    if (remoteBody !== undefined) {
      setLocalBody((prev) => (prev !== remoteBody ? remoteBody : prev))
    }
  }, [remoteBody])
  useEffect(() => {
    setLocalSubject((prev) => (prev !== initialSubject ? initialSubject : prev))
  }, [initialSubject])
  useEffect(() => {
    if (connectionStatus === 'closed') {
      setSaveStatus('error')
    } else if (saveStatus === 'error' && connectionStatus === 'open') {
      setSaveStatus('saved')
    }
  }, [connectionStatus, setSaveStatus, saveStatus])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'saving') {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saveStatus])

  const handleBodyChange = (newBody: string) => {
    if (newBody === localBody) return
    setSaveStatus('saving')
    setLocalBody(newBody)
    if (type === 'campaign') {
      queryClient.setQueryData<CampaignData>(
        ['campaignData', entityId],
        (old) => (old ? { ...old, emailBody: newBody } : old),
      )
    } else {
      queryClient.setQueryData<EmailTemplateData>(
        ['templateData', entityId],
        (old) => (old ? { ...old, body: newBody } : old),
      )
    }
  }

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSubject = e.target.value
    if (newSubject === localSubject) return
    setSaveStatus('saving')
    setLocalSubject(newSubject)
    if (type === 'campaign') {
      queryClient.setQueryData<Campaign[]>(['campaigns'], (old) =>
        old
          ? old.map((c) =>
              c.id === entityId ? { ...c, subject: newSubject } : c,
            )
          : old,
      )
    } else {
      queryClient.setQueryData<EmailTemplateData>(
        ['templateData', entityId],
        (old) => (old ? { ...old, subject: newSubject } : old),
      )
    }
  }

  const handleIsHtmlChange = (newIsHtml: boolean) => {
    setLocalIsHtml(newIsHtml)
    setSaveStatus('saving')
    if (type === 'campaign') {
      apiService.updateCampaign(entityId, { is_html: newIsHtml })
    } else {
      apiService.updateGlobalTemplate(entityId, { is_html: newIsHtml })
    }
    setSaveStatus('saved')
  }

  const handleInsertAsset = (url: string, name: string) => {
    const tag = localIsHtml ? `<img src="${url}" alt="${name}" />` : url
    if (editorInstance) {
      const selection = editorInstance.getSelection()
      const op = { range: selection, text: tag, forceMoveMarkers: true }
      editorInstance.executeEdits('source', [op])
    } else {
      handleBodyChange(localBody + tag)
    }
    setShowAssetPicker(false)
  }

  const lastSavedBody = useRef(remoteBody || '')
  const lastSavedSubject = useRef(initialSubject)

  useDebouncedEffect(
    () => {
      const bodyChanged = localBody !== lastSavedBody.current
      const subjectChanged = localSubject !== lastSavedSubject.current

      if (bodyChanged || subjectChanged) {
        if (type === 'campaign') {
          if (bodyChanged) apiService.saveTemplate(entityId, localBody)
          if (subjectChanged)
            apiService.updateCampaign(entityId, { subject: localSubject })
        } else {
          const updates: any = {}
          if (subjectChanged) updates.subject = localSubject
          apiService.updateGlobalTemplate(
            entityId,
            updates,
            bodyChanged ? localBody : undefined,
          )
        }
        lastSavedBody.current = localBody
        lastSavedSubject.current = localSubject
        setSaveStatus('saved')
      }
    },
    1500,
    [localBody, localSubject, entityId, type],
  )

  const preparePreviewContent = (content: string, isHtml: boolean) => {
    if (isHtml) return content
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:16px;background:#fff;"><pre style="white-space:pre-wrap;font-family:sans-serif;font-size:14px;margin:0;color:#000;">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`
  }

  const previewContent = preparePreviewContent(localBody, localIsHtml)

  const handleFullscreenPreview = () => {
    const blob = new Blob([previewContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  const handleLoadTemplate = (
    subject: string,
    body: string,
    isHtml: boolean,
  ) => {
    handleSubjectChange({
      target: { value: subject },
    } as React.ChangeEvent<HTMLInputElement>)
    handleBodyChange(body)
    handleIsHtmlChange(isHtml)
    apiService.saveTemplate(entityId, body)
    apiService.updateCampaign(entityId, { subject, is_html: isHtml })
    toast.success('Template loaded successfully.')
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h2 className="text-heading-3 font-medium text-text-primary">
              Email Content
            </h2>
            <div className="h-4">
              {saveStatus === 'saving' && (
                <span className="text-[10px] uppercase tracking-widest font-bold text-accent-orange animate-pulse">
                  ● Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-[10px] uppercase tracking-widest font-bold text-status-success-text">
                  ✓ Saved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-[10px] uppercase tracking-widest font-bold text-status-danger-text">
                  ⚠ Save Failed
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {localIsHtml && (
              <button
                onClick={() => setShowAssetPicker(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-surface-element hover:bg-surface-element-hover text-text-secondary hover:text-text-primary transition-colors border border-borders-primary"
              >
                <ImageIcon size={14} /> Insert Asset
              </button>
            )}
            {type === 'campaign' && (
              <>
                <button
                  onClick={() => setShowLoadModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-surface-element hover:bg-surface-element-hover text-text-secondary hover:text-text-primary transition-colors border border-borders-primary"
                >
                  <Download size={14} /> Load Template
                </button>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-surface-element hover:bg-surface-element-hover text-text-secondary hover:text-text-primary transition-colors border border-borders-primary"
                >
                  <Save size={14} /> Save as Template
                </button>
              </>
            )}
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

      <div className="flex-shrink-0 mb-4 flex items-end gap-4">
        <div className="flex-grow">
          <label
            htmlFor="subject-input"
            className="block text-sm font-medium text-text-secondary mb-1 px-1"
          >
            {type === 'campaign' ? 'Email Subject' : 'Template Subject Line'}
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

        <div className="flex items-center gap-3 bg-surface-element px-4 h-11 rounded-lg border border-borders-primary">
          <span
            className={`text-xs font-medium ${!localIsHtml ? 'text-text-primary' : 'text-text-secondary'}`}
          >
            Text
          </span>
          <button
            onClick={() => handleIsHtmlChange(!localIsHtml)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${localIsHtml ? 'bg-accent-blue' : 'bg-borders-primary'}`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${localIsHtml ? 'translate-x-5' : 'translate-x-1'}`}
            />
          </button>
          <span
            className={`text-xs font-medium ${localIsHtml ? 'text-text-primary' : 'text-text-secondary'}`}
          >
            HTML
          </span>
        </div>
      </div>

      <div className="flex-grow flex flex-col md:flex-row gap-4 min-h-0">
        <div className="flex-1 flex flex-col min-h-0 gap-4">
          <div className="flex-grow flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-sm font-medium text-text-secondary">
                {localIsHtml ? 'HTML' : 'Text'}
              </h3>
            </div>
            <div className="w-full flex-grow bg-surface-element border border-borders-primary rounded-lg overflow-hidden flex">
              {!localIsHtml ? (
                <textarea
                  value={localBody}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  className="w-full h-full bg-[#1e1e2a] text-text-primary p-4 resize-none outline-none font-mono text-sm custom-scrollbar"
                  spellCheck={false}
                />
              ) : (
                <MonacoEditorWrapper
                  value={localBody}
                  onChange={handleBodyChange}
                  onMount={setEditorInstance}
                  language="html"
                />
              )}
            </div>
          </div>
          {type === 'campaign' && (
            <div className="flex-shrink-0 p-3 bg-surface-element border border-borders-primary rounded-lg max-h-40 overflow-auto custom-scrollbar">
              <h4 className="text-sm font-medium text-text-secondary mb-2">
                Available Placeholders
              </h4>
              <PlaceholderList entityId={entityId} />
            </div>
          )}
        </div>

        <div
          className={`${
            isPreviewCollapsed
              ? 'w-12 flex-shrink-0 cursor-pointer bg-surface-element hover:bg-surface-element-hover border border-borders-primary rounded-lg flex flex-col items-center py-4 gap-4 transition-colors'
              : 'flex-1'
          } flex flex-col min-h-0 transition-all duration-300`}
          onClick={() => {
            if (isPreviewCollapsed) setIsPreviewCollapsed(false)
          }}
        >
          {isPreviewCollapsed ? (
            <>
              <PanelRightOpen size={20} className="text-text-secondary" />
              <span
                className="text-sm font-medium text-text-secondary uppercase tracking-widest mt-4"
                style={{ writingMode: 'vertical-rl' }}
              >
                Preview
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-sm font-medium text-text-secondary">
                  Preview
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFullscreenPreview}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md text-text-secondary bg-surface-element hover:bg-surface-element-hover hover:text-text-primary transition-colors border border-borders-primary"
                  >
                    <Expand size={14} />
                    Fullscreen
                  </button>
                  <button
                    onClick={() => setIsPreviewCollapsed(true)}
                    className="flex items-center justify-center w-8 h-8 rounded-md text-text-secondary bg-surface-element hover:bg-surface-element-hover hover:text-text-primary transition-colors border border-borders-primary"
                  >
                    <PanelRightClose size={16} />
                  </button>
                </div>
              </div>
              <iframe
                srcDoc={previewContent}
                title="Email Preview"
                className="w-full h-full bg-white border border-borders-primary rounded-lg"
                sandbox="allow-same-origin"
              />
            </>
          )}
        </div>
      </div>

      {showAssetPicker && (
        <AssetPickerModal
          onClose={() => setShowAssetPicker(false)}
          onSelect={handleInsertAsset}
        />
      )}
      {showLoadModal && type === 'campaign' && (
        <LoadTemplateModal
          onClose={() => setShowLoadModal(false)}
          onLoad={handleLoadTemplate}
        />
      )}
      {showSaveModal && type === 'campaign' && (
        <SaveTemplateModal
          onClose={() => setShowSaveModal(false)}
          currentSubject={localSubject}
          currentBody={localBody}
          currentIsHtml={localIsHtml}
        />
      )}
    </>
  )
}

export default function Editor({
  entityId,
  subject,
  type,
}: {
  entityId: string
  subject: string
  type: 'campaign' | 'template'
}) {
  return (
    <MaximizableView
      layoutId="editor-container"
      className="bg-[#1a1a24] backdrop-blur-xl border border-borders-primary/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-accent-blue/20 p-5 flex flex-col h-full"
    >
      {({ isMaximized, onToggle }) => (
        <EditorContent
          isMaximized={isMaximized}
          onToggleMaximize={onToggle}
          entityId={entityId}
          initialSubject={subject}
          type={type}
        />
      )}
    </MaximizableView>
  )
}
