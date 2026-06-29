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

  const {
    showCampaignSummaryModal,
    previewRecipient,
    showAddRecipientModal,
    setPreviewRecipient,
  } = useAppStore()

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

      <div className="flex-1 flex flex-col md:flex-row gap-4 px-4 pb-4 min-h-0">
        <div className="w-full md:w-1/2 flex flex-col min-h-0">
          <Editor campaignId={campaignId} subject={campaign.subject} />
        </div>
        <div className="w-full md:w-1/2 flex flex-col min-h-0">
          <RecipientTable campaignId={campaignId} />
        </div>
      </div>

      <div className="flex-shrink-0 relative">
        <StatusBar />
      </div>

      {showCampaignSummaryModal && <CampaignSummaryModal />}
      {previewRecipient && (
        <EmailPreviewModal onClose={() => setPreviewRecipient(null)} />
      )}
      {showAddRecipientModal && <AddRecipientModal campaignId={campaignId} />}
    </div>
  )
}
