import React from 'react'
import { Modal } from '@/components/common/Modal'
import { useAppStore } from '@/store/useAppStore'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

export const PreflightModal: React.FC = () => {
  const { showPreflightModal, setShowPreflightModal, preflightResult } =
    useAppStore()

  if (!preflightResult) return null

  return (
    <Modal
      isOpen={showPreflightModal}
      onClose={() => setShowPreflightModal(false)}
      title="Preflight Check Results"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        <div
          className={`p-4 rounded-lg flex items-center gap-4 border ${preflightResult.ok ? 'bg-status-success-bg/20 border-status-success-text/50' : 'bg-status-danger-bg/20 border-status-danger-text/50'}`}
        >
          {preflightResult.ok ? (
            <CheckCircle className="text-status-success-text w-8 h-8 flex-shrink-0" />
          ) : (
            <XCircle className="text-status-danger-text w-8 h-8 flex-shrink-0" />
          )}
          <div>
            <h3 className="text-lg font-bold text-text-primary">
              {preflightResult.ok ? 'System is Ready' : 'Preflight Failed'}
            </h3>
            <p className="text-sm text-text-secondary">
              {preflightResult.ok
                ? 'All critical checks passed. You can start sending emails.'
                : 'Please resolve the errors below before starting the campaign.'}
            </p>
          </div>
        </div>

        {preflightResult.errors && preflightResult.errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-status-danger-text uppercase flex items-center gap-2">
              <XCircle size={16} /> Critical Errors
            </h4>
            <ul className="list-none space-y-1 bg-surface-element p-3 rounded-lg border border-borders-primary">
              {preflightResult.errors.map((err, i) => (
                <li
                  key={i}
                  className="text-sm text-text-primary flex items-start gap-2"
                >
                  <span className="text-status-danger-text mt-0.5">•</span>
                  <span>{err}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {preflightResult.warnings && preflightResult.warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-accent-orange uppercase flex items-center gap-2">
              <AlertTriangle size={16} /> Warnings
            </h4>
            <ul className="list-none space-y-1 bg-surface-element p-3 rounded-lg border border-borders-primary">
              {preflightResult.warnings.map((warn, i) => (
                <li
                  key={i}
                  className="text-sm text-text-primary flex items-start gap-2"
                >
                  <span className="text-accent-orange mt-0.5">•</span>
                  <span>{warn}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {preflightResult.successes && preflightResult.successes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-status-success-text uppercase flex items-center gap-2">
              <CheckCircle size={16} /> Checks Passed
            </h4>
            <ul className="list-none space-y-1 bg-surface-element p-3 rounded-lg border border-borders-primary">
              {preflightResult.successes.map((succ, i) => (
                <li
                  key={i}
                  className="text-sm text-text-primary flex items-start gap-2"
                >
                  <span className="text-status-success-text mt-0.5 flex-shrink-0">
                    <CheckCircle size={14} />
                  </span>
                  <span>{succ}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  )
}
