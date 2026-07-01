import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { Campaign } from '@/types'
import { Button } from '@/components/common/Button'
import { Mail, Plus, Loader } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { SelectionPopup } from '@/features/campaigns/components/SelectionPopup'

export const Route = createFileRoute('/campaigns/')({
  component: CampaignsList,
})

function CampaignsList() {
  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
  })

  const toggleCampaignSelection = useAppStore(
    (state) => state.toggleCampaignSelection,
  )
  const selectedCampaignIds = useAppStore((state) => state.selectedCampaignIds)

  return (
    <div className="p-8 h-full overflow-y-auto custom-scrollbar relative">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Campaigns</h1>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 mt-12 text-text-secondary">
          <Loader size={32} className="animate-spin mb-4 text-accent-blue" />
          <p>Loading campaigns...</p>
        </div>
      ) : !campaigns || campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-surface-card border border-borders-primary border-dashed rounded-card mt-12">
          <Mail size={48} className="text-text-tertiary mb-4" />
          <h2 className="text-xl font-semibold mb-2">No campaigns yet</h2>
          <p className="text-text-secondary mb-6">
            Create your first campaign to start sending bulk emails.
          </p>
          <Link to="/campaigns/new">
            <Button variant="primary">
              <Plus size={18} />
              Create Campaign
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((c) => {
            const isSelected = selectedCampaignIds.has(c.id)
            return (
              <div
                key={c.id}
                className={`bg-surface-card p-6 rounded-card border shadow-card flex flex-col h-full transition-colors relative ${isSelected ? 'border-accent-blue bg-accent-blue/5' : 'border-borders-primary hover:border-accent-blue/50'}`}
              >
                <div className="absolute top-4 right-4">
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={isSelected}
                    onChange={() => toggleCampaignSelection(c.id)}
                  />
                </div>
                <h2
                  className="text-xl font-semibold mb-1 truncate pr-8"
                  title={c.name}
                >
                  {c.name}
                </h2>
                <p className="text-xs text-text-tertiary mb-4 font-mono">
                  {new Date(c.createdAt).toLocaleDateString()}
                </p>
                <div className="flex-grow">
                  <p className="text-text-secondary mb-6 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-accent-blue"></span>
                    {c.recipientCount || 0} Recipients
                  </p>
                </div>
                <Link to="/campaigns/$campaignId" params={{ campaignId: c.id }}>
                  <Button variant="secondary" className="w-full">
                    Open Campaign
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>
      )}

      <SelectionPopup />
    </div>
  )
}
