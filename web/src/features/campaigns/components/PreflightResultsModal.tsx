import React from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Send,
  Server,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { apiService } from '@/services/apiService'
import { useQuery } from '@tanstack/react-query'
import type { Config, Campaign } from '@/types'
import { toast } from 'sonner'

export const PreflightResultsModal: React.FC<{ campaignId: string }> = ({
  campaignId,
}) => {
  const showPreflightModal = useAppStore((state) => state.showPreflightModal)
  const setShowPreflightModal = useAppStore(
    (state) => state.setShowPreflightModal,
  )
  const preflightResult = useAppStore((state) => state.preflightResult)
  const isSending = useAppStore((state) => state.isSending)

  const { data: config } = useQuery<Config>({ queryKey: ['config'] })
  const { data: campaigns } = useQuery<Campaign[]>({ queryKey: ['campaigns'] })

  const activeCampaign = campaigns?.find((c) => c.id === campaignId)
  const accounts = config?.accounts || []
  const senderAccount =
    accounts.find((a) => a.id === activeCampaign?.sender_account_id) ||
    accounts.find((a) => a.is_default) ||
    accounts[0]

  if (!preflightResult) return null

  const handleClose = () => setShowPreflightModal(false)

  const handleProceed = () => {
    handleClose()
    if (!isSending) {
      apiService.flushQueue()
      apiService.getCampaignSummary(campaignId)
    }
  }

  const handleTestSmtp = () => {
    if (senderAccount) {
      toast.promise(
        apiService.testSmtpConnection(senderAccount).then((res: any) => {
          if (!res.success) throw new Error(res.message)
          return res
        }),
        {
          loading: 'Testing connection...',
          success: (data) => data.message,
          error: (err) => `Connection failed: ${err.message}`,
        },
      )
    }
  }

  return (
    <Modal
      isOpen={showPreflightModal}
      onClose={handleClose}
      title="Preflight Check Results"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {preflightResult.ok ? (
          <div className="flex items-center gap-3 p-4 bg-status-success-bg/10 border border-status-success-bg/30 rounded-lg">
            <CheckCircle2 size={24} className="text-status-success-text" />
            <div>
              <h3 className="font-semibold text-status-success-text">
                All Checks Passed
              </h3>
              <p className="text-sm text-text-secondary">
                Your campaign is ready to be sent.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-status-danger-bg/10 border border-status-danger-bg/30 rounded-lg">
            <XCircle size={24} className="text-status-danger-text" />
            <div>
              <h3 className="font-semibold text-status-danger-text">
                Errors Detected
              </h3>
              <p className="text-sm text-text-secondary">
                Please resolve the issues below before sending.
              </p>
            </div>
          </div>
        )}

        {preflightResult.successes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-text-primary flex items-center gap-2">
              <CheckCircle2 size={16} className="text-status-success-text" />{' '}
              Successes
            </h4>
            <ul className="list-disc pl-8 text-sm text-text-secondary space-y-1">
              {preflightResult.successes.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        {preflightResult.warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-text-primary flex items-center gap-2">
              <AlertTriangle size={16} className="text-accent-orange" />{' '}
              Warnings
            </h4>
            <ul className="list-disc pl-8 text-sm text-text-secondary space-y-1">
              {preflightResult.warnings.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        {preflightResult.errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-text-primary flex items-center gap-2">
              <XCircle size={16} className="text-status-danger-text" /> Errors
            </h4>
            <ul className="list-disc pl-8 text-sm text-status-danger-text space-y-1">
              {preflightResult.errors.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-borders-primary">
          <Button
            variant="secondary"
            onClick={handleTestSmtp}
            disabled={!senderAccount}
          >
            <Server size={16} /> Test Account
          </Button>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          {preflightResult.ok && (
            <Button variant="primary" onClick={handleProceed}>
              <Send size={16} /> Proceed to Send
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
