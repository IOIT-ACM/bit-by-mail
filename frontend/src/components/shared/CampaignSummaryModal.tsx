import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { motion } from 'framer-motion';
import { X, Users, Send, FileStack, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { apiService } from '../../services/apiService';

const formatBytes = (bytes: number, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const SummaryItem: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-start gap-4 p-3 bg-surface-element rounded-lg">
    <div className="text-accent-blue flex-shrink-0 mt-1">{icon}</div>
    <div>
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="text-lg font-medium text-text-primary">{value}</p>
    </div>
  </div>
);

export const CampaignSummaryModal: React.FC = () => {
  const { campaignSummary, setShowCampaignSummaryModal, activeCampaignId } = useAppStore();

  if (!campaignSummary) return null;

  const handleClose = () => {
    setShowCampaignSummaryModal(false);
  };

  const handleConfirmSend = () => {
    if (activeCampaignId) {
      apiService.startMailing(activeCampaignId);
    }
    handleClose();
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.15, ease: 'easeIn' } },
  };

  const hasRecipientsToSend = campaignSummary.recipients_to_send > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8" role="dialog" aria-modal="true">
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={handleClose}
      />

      <motion.div
        className="relative w-full h-full max-w-6xl bg-surface-card border border-borders-primary rounded-card shadow-card flex flex-col"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="p-4 border-b border-borders-primary flex justify-between items-center flex-shrink-0">
          <h2 className="text-heading-3 font-medium text-text-primary">Campaign Summary & Confirmation</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-text-secondary hover:bg-surface-element-hover hover:text-text-primary transition-colors flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-grow p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
          <div className="lg:col-span-1 flex flex-col gap-4">
            <h3 className="text-lg font-medium text-text-primary px-1">Summary</h3>
            <SummaryItem icon={<Users size={20} />} label="Total Recipients" value={campaignSummary.total_recipients} />
            <SummaryItem icon={<Send size={20} />} label="Emails to be Sent" value={campaignSummary.recipients_to_send} />
            <SummaryItem
              icon={<FileStack size={20} />}
              label="Total Attachment Size"
              value={formatBytes(campaignSummary.total_attachment_size_bytes)}
            />

            <div className="mt-auto pt-4">
              {!hasRecipientsToSend && (
                <div className="flex items-center gap-3 p-3 bg-accent-orange/10 border border-accent-orange/20 rounded-lg text-accent-orange mb-4">
                  <AlertTriangle size={24} />
                  <p className="text-sm">There are no pending recipients. All emails have already been marked as 'SENT'.</p>
                </div>
              )}
              <div className="flex items-center justify-end gap-3">
                <Button variant="secondary" onClick={handleClose}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleConfirmSend} disabled={!hasRecipientsToSend}>
                  <Send size={16} />
                  Confirm & Send
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col min-h-0">
            <h3 className="text-lg font-medium text-text-primary px-1 mb-2">Preview for First Recipient</h3>
            <div className="p-3 bg-surface-element rounded-lg mb-4">
              <p className="text-sm text-text-primary">
                <strong>Subject:</strong> {campaignSummary.preview_subject}
              </p>
            </div>
            <div className="flex-grow min-h-0">
              <iframe
                srcDoc={campaignSummary.preview_body}
                title="Email Preview"
                className="w-full h-full bg-white border border-borders-primary rounded-lg"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
