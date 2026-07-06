import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { Campaign } from '@/types'
import { CampaignViewHeader } from '@/features/campaigns/components/CampaignViewHeader'
import Editor from '@/features/campaigns/components/Editor'
import RecipientTable from '@/features/campaigns/components/RecipientTable'
import StatusBar from '@/layouts/StatusBar'
import { CampaignSummaryModal } from '@/features/campaigns/components/CampaignSummaryModal'
import { EmailPreviewModal } from '@/features/campaigns/components/EmailPreviewModal'
import { AddRecipientModal } from '@/features/campaigns/components/AddRecipientModal'
import { CampaignSettingsModal } from '@/features/campaigns/components/CampaignSettingsModal'
import { ActivityDashboard } from '@/features/campaigns/components/ActivityDashboard'
import { useAppStore } from '@/store/useAppStore'
import { useEffect } from 'react'
import { apiService } from '@/services/apiService'
import { Loader } from 'lucide-react'

export const Route = createFileRoute('/campaigns/$campaignId')({
  component: CampaignDetail,
})

function CampaignDetail() {
  const { campaignId } = Route.useParams()
  const { data: campaigns } = useQuery<Campaign[]>({ queryKey: ['campaigns'] })
  const campaign = campaigns?.find((c) => c.id === campaignId)

  const setIsSidebarCollapsed = useAppStore(
    (state) => state.setIsSidebarCollapsed,
  )

  useEffect(() => {
    setIsSidebarCollapsed(true)
  }, [setIsSidebarCollapsed])

  useEffect(() => {
    if (campaignId) {
      apiService.getCampaignData(campaignId)
    }
  }, [campaignId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        apiService.flushQueue()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const showCampaignSummaryModal = useAppStore(
    (state) => state.showCampaignSummaryModal,
  )
  const previewRecipient = useAppStore((state) => state.previewRecipient)
  const showAddRecipientModal = useAppStore(
    (state) => state.showAddRecipientModal,
  )
  const showCampaignSettingsModal = useAppStore(
    (state) => state.showCampaignSettingsModal,
  )
  const isRecipientsCollapsed = useAppStore(
    (state) => state.isRecipientsCollapsed,
  )
  const showActivityView = useAppStore((state) => state.showActivityView)
  const setPreviewRecipient = useAppStore((state) => state.setPreviewRecipient)

  if (!campaign)
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-secondary">
        <Loader size={32} className="animate-spin mb-4 text-accent-blue" />
        <p>Loading campaign...</p>
      </div>
    )

  return (
    <div className="flex flex-col h-full bg-background-base overflow-hidden">
      <div className="p-4 pb-2 flex-shrink-0">
        <CampaignViewHeader campaign={campaign} campaignId={campaignId} />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 px-4 pb-4 min-h-0 relative">
        {showActivityView ? (
          <div className="w-full flex flex-col min-h-0 transition-all duration-300 ease-in-out">
            <ActivityDashboard campaignId={campaignId} />
          </div>
        ) : (
          <>
            <div
              className={`flex flex-col min-h-0 transition-all duration-300 ease-in-out ${isRecipientsCollapsed ? 'w-full' : 'w-full lg:w-1/2 xl:w-2/3'}`}
            >
              <Editor
                entityId={campaignId}
                subject={campaign.subject}
                initialIsHtml={campaign.is_html ?? true}
                type="campaign"
              />
            </div>
            {!isRecipientsCollapsed && (
              <div className="w-full lg:w-1/2 xl:w-1/3 flex flex-col min-h-0 transition-all duration-300 ease-in-out">
                <RecipientTable contextId={campaignId} contextType="campaign" />
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex-shrink-0 relative">
        <StatusBar />
      </div>

      {showCampaignSummaryModal && <CampaignSummaryModal />}
      {showCampaignSettingsModal && (
        <CampaignSettingsModal campaign={campaign} />
      )}
      {previewRecipient && (
        <EmailPreviewModal onClose={() => setPreviewRecipient(null)} />
      )}
      {showAddRecipientModal && (
        <AddRecipientModal contextId={campaignId} contextType="campaign" />
      )}
    </div>
  )
}
