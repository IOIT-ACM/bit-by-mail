import React, { useEffect, useMemo } from 'react';
import { Recipient } from '../../types';
import { Paperclip, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';

interface EmailPreviewModalProps {
  onClose: () => void;
}

const replacePlaceholders = (template: string, data: Recipient): string => {
  if (!template) return '';
  let result = template;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(data[key]));
    }
  }
  return result;
};

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({ onClose }) => {
  const {
    activeCampaignData,
    previewRecipient,
    setPreviewRecipient,
    config,
    campaigns,
    activeCampaignId,
  } = useAppStore();

  const recipients = activeCampaignData?.recipients ?? [];
  const emailBody = activeCampaignData?.emailBody ?? '';
  const activeCampaign = campaigns.find(c => c.id === activeCampaignId);
  const subjectTemplate = activeCampaign?.subject ?? '';

  const currentIndex = useMemo(() => {
    if (!previewRecipient) return -1;
    return recipients.findIndex(r => r === previewRecipient);
  }, [recipients, previewRecipient]);

  const goToRecipient = (index: number) => {
    if (index >= 0 && index < recipients.length) {
      setPreviewRecipient(recipients[index]);
    }
  };

  const goToNext = () => goToRecipient(currentIndex + 1);
  const goToPrevious = () => goToRecipient(currentIndex - 1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, recipients.length]);

  if (!previewRecipient) {
    return null;
  }

  const finalSubject = replacePlaceholders(subjectTemplate, previewRecipient);
  const finalBody = replacePlaceholders(emailBody, previewRecipient);
  const showAttachment = config.send_attachments && previewRecipient.AttachmentFile;
  const attachmentUrl = showAttachment ? `/attachments/${previewRecipient.AttachmentFile}` : '';

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.15, ease: 'easeIn' } },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8" role="dialog" aria-modal="true">
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={onClose}
      />

      <button
        onClick={goToPrevious}
        disabled={currentIndex <= 0}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full bg-surface-card/50 hover:bg-surface-card/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        aria-label="Previous recipient"
      >
        <ChevronLeft size={24} className="text-text-primary" />
      </button>
      <button
        onClick={goToNext}
        disabled={currentIndex >= recipients.length - 1}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full bg-surface-card/50 hover:bg-surface-card/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        aria-label="Next recipient"
      >
        <ChevronRight size={24} className="text-text-primary" />
      </button>

      <motion.div
        className="relative w-full h-full max-w-7xl bg-surface-card border border-borders-primary rounded-card shadow-card flex flex-col"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="p-4 border-b border-borders-primary flex justify-between items-center flex-shrink-0">
          <h2 className="text-heading-3 font-medium text-text-primary truncate pr-4">
            Email Preview for {previewRecipient.Name}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-text-secondary hover:bg-surface-element-hover hover:text-text-primary transition-colors flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 flex-shrink-0 space-y-1">
          <p className="text-sm text-text-secondary">
            <strong>From:</strong> {config.sender_email || 'Not configured'}
          </p>
          <p className="text-sm text-text-secondary">
            <strong>To:</strong> {previewRecipient.Email}
          </p>
          <p className="text-sm text-text-primary">
            <strong>Subject:</strong> {finalSubject}
          </p>
          {showAttachment && (
            <p className="text-sm text-text-secondary flex items-center gap-2 pt-1">
              <strong>Attachment:</strong>
              <a
                href={attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-accent-blue hover:underline"
              >
                <Paperclip size={14} />
                <span>{previewRecipient.AttachmentFile}</span>
              </a>
            </p>
          )}
        </div>
        <div className={`flex-grow p-4 pt-0 min-h-0 ${showAttachment ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}`}>
          <div className="w-full h-full min-h-0">
            <iframe
              key={`${currentIndex}-email`}
              srcDoc={finalBody}
              title="Email Preview"
              className="w-full h-full bg-white border border-borders-primary rounded-lg"
              sandbox="allow-same-origin"
            />
          </div>
          {showAttachment && (
            <div className="w-full h-full min-h-0 hidden md:block">
              <iframe
                key={`${currentIndex}-attachment`}
                src={attachmentUrl}
                title="Attachment Preview"
                className="w-full h-full bg-white border border-borders-primary rounded-lg"
              />
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-2 px-4 py-1.5 bg-surface-header/80 backdrop-blur-sm rounded-full text-sm text-text-secondary font-mono">
          {currentIndex + 1} / {recipients.length}
        </div>
      </motion.div>
    </div>
  );
};
