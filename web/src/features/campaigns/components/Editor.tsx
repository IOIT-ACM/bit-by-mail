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
import React, { useEffect, useState, useRef, useMemo } from 'react'
import { toast } from 'sonner'
import morphdom from 'morphdom'
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect'
import { apiService } from '@/services/apiService'
import { queryClient } from '@/services/queryClient'
import type { CampaignData, Campaign, EmailTemplateData } from '@/types'
import { MaximizableView } from '@/components/common/MaximizableView'
import { MonacoEditorWrapper } from '@/components/common/MonacoEditorWrapper'
import { RichTextEditorWrapper } from '@/components/common/RichTextEditorWrapper'
import { LoadTemplateModal } from './LoadTemplateModal'
import { SaveTemplateModal } from './SaveTemplateModal'
import { AssetPickerModal } from '@/features/assets/components/AssetPickerModal'
import { useAppStore } from '@/store/useAppStore'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import js_beautify from 'js-beautify'

const PlaceholderList: React.FC<{
  entityId: string
  onInsert: (placeholderTag: string) => void
}> = ({ entityId, onInsert }) => {
  const { data } = useQuery<CampaignData>({
    queryKey: ['campaignData', entityId],
  })
  const recipients = data?.recipients ?? []
  const availablePlaceholders =
    recipients.length > 0 ? Object.keys(recipients[0]) : []

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
          title={`Click to insert {{${placeholder}}}`}
          onClick={() => onInsert(`{{${placeholder}}}`)}
        >
          {`{{${placeholder}}}`}
        </code>
      ))}
    </div>
  )
}

const preparePreviewContent = (content: string) => {
  if (/<html/i.test(content)) return content
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 16px;
      font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
      font-size: 14px;
      color: #000;
      line-height: 1.5;
    }
    p { margin-top: 0; margin-bottom: 1em; }
    p:empty::before { content: "\\00a0"; }
    ul { list-style-type: disc; padding-left: 1.5em; margin-top: 0; margin-bottom: 1em; }
    ol { list-style-type: decimal; padding-left: 1.5em; margin-top: 0; margin-bottom: 1em; }
    a { color: #3b82f6; text-decoration: underline; }
    img { max-width: 100%; height: auto; border-radius: 0.375rem; margin-bottom: 1em; }
    strong { font-weight: 700; }
    em { font-style: italic; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`
}

const LiveIframe: React.FC<{ content: string; shellHtml: string }> = ({
  content,
  shellHtml,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!isLoaded || !iframeRef.current) return
    const doc = iframeRef.current.contentDocument
    const win = iframeRef.current.contentWindow
    if (!doc || !win) return

    const scrollY = win.scrollY

    if (/<html/i.test(content)) {
      doc.open()
      doc.write(content)
      doc.close()
    } else {
      try {
        morphdom(doc.body, `<body>${content}</body>`)
      } catch (e) {
        doc.body.innerHTML = content
      }
    }

    win.scrollTo(0, scrollY)
  }, [content, isLoaded])

  return (
    <iframe
      ref={iframeRef}
      srcDoc={/<html/i.test(content) ? content : shellHtml}
      onLoad={() => setIsLoaded(true)}
      title="Email Preview"
      className="w-full h-full bg-white border border-borders-primary rounded-lg"
      sandbox="allow-same-origin"
    />
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

  const remoteBody =
    type === 'campaign' ? campaignData?.emailBody : templateData?.body

  const [localSubject, setLocalSubject] = useState(initialSubject)
  const [localBody, setLocalBody] = useState('')
  const [previewBody, setPreviewBody] = useState('')
  const [editorMode, setEditorMode] = useState<'text' | 'html'>('text')
  const [editorInstance, setEditorInstance] = useState<any>(null)

  const [showLoadModal, setShowLoadModal] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showAssetPicker, setShowAssetPicker] = useState(false)
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false)
  const [showHtmlToTextWarning, setShowHtmlToTextWarning] = useState(false)

  const setSaveStatus = useAppStore((state) => state.setSaveStatus)
  const saveStatus = useAppStore((state) => state.saveStatus)
  const connectionStatus = useAppStore((state) => state.connectionStatus)

  const subjectInputRef = useRef<HTMLInputElement>(null)
  const lastFocus = useRef<'subject' | 'body'>('body')
  const subjectSelection = useRef({ start: 0, end: 0 })

  useEffect(() => {
    if (remoteBody !== undefined) {
      setLocalBody((prev) => (prev !== remoteBody ? remoteBody : prev))
    }
  }, [remoteBody])

  useEffect(() => {
    setLocalSubject((prev) => (prev !== initialSubject ? initialSubject : prev))
  }, [initialSubject])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPreviewBody(localBody)
    }, 50)
    return () => clearTimeout(timer)
  }, [localBody])

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

  const handleInsertAsset = (url: string, name: string) => {
    if (editorMode === 'text') {
      if (editorInstance) {
        editorInstance.chain().focus().setImage({ src: url, alt: name }).run()
      }
    } else {
      const tag = `<img src="${url}" alt="${name}" />`
      if (editorInstance) {
        const selection = editorInstance.getSelection()
        const op = { range: selection, text: tag, forceMoveMarkers: true }
        editorInstance.executeEdits('source', [op])
      } else {
        handleBodyChange(localBody + tag)
      }
    }
    setShowAssetPicker(false)
  }

  const handleInsertPlaceholder = (tag: string) => {
    if (lastFocus.current === 'subject' && subjectInputRef.current) {
      const start = subjectSelection.current.start || 0
      const end = subjectSelection.current.end || 0
      const newSubject =
        localSubject.substring(0, start) + tag + localSubject.substring(end)

      handleSubjectChange({
        target: { value: newSubject },
      } as React.ChangeEvent<HTMLInputElement>)

      setTimeout(() => {
        if (subjectInputRef.current) {
          subjectInputRef.current.focus()
          const newPos = start + tag.length
          subjectInputRef.current.setSelectionRange(newPos, newPos)
          subjectSelection.current = { start: newPos, end: newPos }
        }
      }, 0)
    } else {
      if (editorMode === 'text') {
        if (editorInstance) {
          editorInstance.chain().focus().insertContent(tag).run()
        }
      } else {
        if (editorInstance) {
          const selection = editorInstance.getSelection()
          const op = { range: selection, text: tag, forceMoveMarkers: true }
          editorInstance.executeEdits('source', [op])
          editorInstance.focus()
        } else {
          handleBodyChange(localBody + tag)
        }
      }
    }
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

          apiService.updateCampaign(entityId, { is_html: true })
        } else {
          const updates: any = { is_html: true }
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

  const shellHtml = useMemo(() => preparePreviewContent(''), [])

  const handleFullscreenPreview = () => {
    const fullHtml = preparePreviewContent(localBody)
    const blob = new Blob([fullHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  const handleLoadTemplate = (subject: string, body: string) => {
    handleSubjectChange({
      target: { value: subject },
    } as React.ChangeEvent<HTMLInputElement>)
    handleBodyChange(body)
    apiService.saveTemplate(entityId, body)
    apiService.updateCampaign(entityId, { subject, is_html: true })
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
            <button
              onClick={() => setShowAssetPicker(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-surface-element hover:bg-surface-element-hover text-text-secondary hover:text-text-primary transition-colors border border-borders-primary"
            >
              <ImageIcon size={14} /> Insert Asset
            </button>
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
            ref={subjectInputRef}
            type="text"
            value={localSubject}
            onChange={handleSubjectChange}
            onFocus={() => {
              lastFocus.current = 'subject'
            }}
            onBlur={(e) => {
              subjectSelection.current = {
                start: e.target.selectionStart || 0,
                end: e.target.selectionEnd || 0,
              }
            }}
            placeholder="Email Subject Template"
            className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-colors"
            maxLength={150}
          />
        </div>

        <div className="flex items-center gap-1 bg-surface-element p-1 h-11 rounded-lg border border-borders-primary">
          <button
            onClick={() => {
              if (editorMode === 'text') return
              setShowHtmlToTextWarning(true)
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${editorMode === 'text' ? 'bg-surface-card text-text-primary shadow border border-borders-primary/50' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Text
          </button>
          <button
            onClick={() => {
              if (editorMode === 'html') return
              const formattedHtml = js_beautify.html(localBody, {
                indent_size: 2,
                wrap_line_length: 0,
                preserve_newlines: true,
              })
              handleBodyChange(formattedHtml)
              setEditorMode('html')
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${editorMode === 'html' ? 'bg-surface-card text-text-primary shadow border border-borders-primary/50' : 'text-text-secondary hover:text-text-primary'}`}
          >
            HTML
          </button>
        </div>
      </div>

      <div className="flex-grow flex flex-col md:flex-row gap-4 min-h-0">
        <div className="flex-1 flex flex-col min-h-0 gap-4">
          <div className="flex-grow flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-sm font-medium text-text-secondary">
                {editorMode === 'text' ? 'Rich Text Editor' : 'HTML Code'}
              </h3>
            </div>
            <div
              className="w-full flex-grow bg-surface-element border border-borders-primary rounded-lg overflow-hidden flex"
              onFocusCapture={() => {
                lastFocus.current = 'body'
              }}
            >
              {editorMode === 'text' && (
                <RichTextEditorWrapper
                  value={localBody}
                  onChange={handleBodyChange}
                  onMount={setEditorInstance}
                />
              )}
              {editorMode === 'html' && (
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
              <PlaceholderList
                entityId={entityId}
                onInsert={handleInsertPlaceholder}
              />
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
              <LiveIframe content={previewBody} shellHtml={shellHtml} />
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showHtmlToTextWarning}
        title="Switch to Rich Text Mode?"
        message="Switching to the Rich Text editor will remove any unsupported custom HTML, CSS classes, or <style> tags. Do you want to continue?"
        confirmText="Switch Mode"
        cancelText="Cancel"
        onConfirm={() => {
          setEditorMode('text')
          setShowHtmlToTextWarning(false)
        }}
        onCancel={() => setShowHtmlToTextWarning(false)}
        isDestructive={true}
      />

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
          currentIsHtml={true}
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
