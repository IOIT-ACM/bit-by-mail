import {
  Send,
  TestTube,
  Upload,
  XCircle,
  Pencil,
  Check,
  Database,
  RefreshCw,
  Settings,
} from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { apiService } from '@/services/apiService'
import { useAppStore } from '@/store/useAppStore'
import { queryClient } from '@/services/queryClient'
import type { Campaign, CampaignData } from '@/types'
import { Button } from '@/components/common/Button'
import { ImportFromDbModal } from './ImportFromDbModal'
import { SyncDbModal } from './SyncDbModal'

interface CampaignViewHeaderProps {
  campaign: Campaign
  campaignId: string
}

export const CampaignViewHeader: React.FC<CampaignViewHeaderProps> = ({
  campaign,
  campaignId,
}) => {
  const isSending = useAppStore((state) => state.isSending)
  const isStopping = useAppStore((state) => state.isStopping)
  const setIsStopping = useAppStore((state) => state.setIsStopping)
  const clearRecipientSelection = useAppStore(
    (state) => state.clearRecipientSelection,
  )
  const setShowCampaignSettingsModal = useAppStore(
    (state) => state.setShowCampaignSettingsModal,
  )

  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(campaign.name)
  const [showImportDbModal, setShowImportDbModal] = useState(false)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditedName(campaign.name)
  }, [campaign.name])

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditingName])

  const handleSaveName = () => {
    if (editedName.trim() && editedName !== campaign.name) {
      apiService.updateCampaign(campaignId, { name: editedName.trim() })
    } else {
      setEditedName(campaign.name)
    }
    setIsEditingName(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveName()
    if (e.key === 'Escape') {
      setEditedName(campaign.name)
      setIsEditingName(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && campaignId) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const lines = text.split('\n')
        const header = lines[0].toLowerCase()
        if (!header.includes('email') || !header.includes('name')) {
          toast.error(
            'Invalid CSV: Must contain at least "Name" and "Email" columns.',
          )
          if (event.target) event.target.value = ''
          return
        }
        const base64Content = btoa(text)
        apiService.uploadRecipients(campaignId, base64Content)
      }
      reader.readAsText(file)
    }
  }

  const handlePreflight = () => {
    if (!campaign.subject?.trim()) {
      toast.error('Email subject cannot be empty.')
      return
    }
    const currentData = queryClient.getQueryData<CampaignData>([
      'campaignData',
      campaignId,
    ])
    if (!currentData?.emailBody?.trim()) {
      toast.error('Email body cannot be empty.')
      return
    }
    apiService.flushQueue()
    apiService.runPreflightCheck(campaignId)
  }

  const handleSend = () => {
    if (isSending) return
    if (!campaign.subject?.trim()) {
      toast.error('Email subject cannot be empty.')
      return
    }
    const currentData = queryClient.getQueryData<CampaignData>([
      'campaignData',
      campaignId,
    ])
    if (!currentData?.emailBody?.trim()) {
      toast.error('Email body cannot be empty.')
      return
    }
    apiService.flushQueue()
    clearRecipientSelection()
    apiService.getCampaignSummary(campaignId)
  }

  const handleStop = () => {
    if (!isSending || isStopping) return
    setIsStopping(true)
    apiService.stopMailing()
    toast.warning(
      'Stop request sent. The process will halt after the current email.',
    )
  }

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
        <div className="flex items-center gap-2 group max-w-full">
          {isEditingName ? (
            <div className="flex items-center gap-2 w-full max-w-md">
              <input
                ref={inputRef}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={handleKeyDown}
                className="text-2xl font-bold bg-surface-element border border-accent-blue rounded-md px-2 py-1 outline-none w-full"
              />
              <button
                onMouseDown={handleSaveName}
                className="p-1.5 text-accent-blue hover:bg-surface-element rounded-md"
              >
                <Check size={18} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingName(true)}
              className="flex items-center gap-3 cursor-pointer rounded-md p-1 -ml-1 border border-transparent hover:border-borders-primary hover:bg-surface-element transition-all"
              title="Click to rename"
            >
              <h1 className="text-2xl font-bold text-text-primary tracking-tight truncate max-w-sm md:max-w-md lg:max-w-xl">
                {campaign.name}
              </h1>
              <Pencil
                size={16}
                className="text-text-tertiary group-hover:text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          <Button
            onClick={() => setShowCampaignSettingsModal(true)}
            variant="secondary"
          >
            <Settings size={16} />
            <span className="hidden lg:inline">Settings</span>
          </Button>

          {campaign.sourceDbId && (
            <Button onClick={() => setShowSyncModal(true)} variant="secondary">
              <RefreshCw size={16} />
              <span className="hidden lg:inline">Sync DB</span>
            </Button>
          )}

          <Button
            onClick={() => setShowImportDbModal(true)}
            variant="secondary"
          >
            <Database size={16} />
            <span className="hidden lg:inline">Import</span>
          </Button>

          <input
            type="file"
            id="csv-upload"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            as="label"
            htmlFor="csv-upload"
            variant="success"
            className="cursor-pointer"
          >
            <Upload size={16} />
            <span className="hidden lg:inline">Upload CSV</span>
          </Button>

          <div className="h-6 w-px bg-borders-primary mx-1"></div>

          <Button
            onClick={handlePreflight}
            disabled={isSending}
            variant="warning"
          >
            <TestTube size={16} />
            <span className="hidden md:inline">Preflight</span>
          </Button>
          {isSending ? (
            <Button onClick={handleStop} variant="danger" disabled={isStopping}>
              {isStopping ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <XCircle size={16} />
              )}
              <span>{isStopping ? 'Stopping...' : 'Stop Sending'}</span>
            </Button>
          ) : (
            <Button onClick={handleSend} variant="primary">
              <Send size={16} />
              <span>Start Sending</span>
            </Button>
          )}
        </div>
      </div>

      {showImportDbModal && (
        <ImportFromDbModal
          campaignId={campaignId}
          onClose={() => setShowImportDbModal(false)}
        />
      )}

      {showSyncModal && campaign.sourceDbId && (
        <SyncDbModal
          campaignId={campaignId}
          sourceDbId={campaign.sourceDbId}
          onClose={() => setShowSyncModal(false)}
        />
      )}
    </>
  )
}

function Loader({ size, className }: { size: number; className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
