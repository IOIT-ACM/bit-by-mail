import React from 'react';
import { Recipient } from '../../types';
import { Paperclip, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmailPreviewModalProps {
  recipient: Recipient;
  emailBody: string;
  emailSubject: string;
  senderEmail: string;
  onClose: () => void;
  showAttachment: boolean;
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

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  recipient,
  emailBody,
  emailSubject,
  senderEmail,
  onClose,
  showAttachment,
}) => {
  const finalSubject = replacePlaceholders(emailSubject, recipient);
  const finalBody = replacePlaceholders(emailBody, recipient);

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
      <motion.div
        className="relative w-full h-full max-w-5xl bg-surface-card border border-borders-primary rounded-card shadow-card flex flex-col"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="p-4 border-b border-borders-primary flex justify-between items-center flex-shrink-0">
          <h2 className="text-heading-3 font-medium text-text-primary">Email Preview for {recipient.Name}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-text-secondary hover:bg-surface-element-hover hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 flex-shrink-0 space-y-1">
          <p className="text-sm text-text-secondary">
            <strong>From:</strong> {senderEmail || 'Not configured'}
          </p>
          <p className="text-sm text-text-secondary">
            <strong>To:</strong> {recipient.Email}
          </p>
          <p className="text-sm text-text-primary">
            <strong>Subject:</strong> {finalSubject}
          </p>
          {showAttachment && recipient.AttachmentFile && (
            <p className="text-sm text-text-secondary flex items-center gap-2 pt-1">
              <strong>Attachment:</strong>
              <a
                href={`/attachments/${recipient.AttachmentFile}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-accent-blue hover:underline"
              >
                <Paperclip size={14} />
                <span>{recipient.AttachmentFile}</span>
              </a>
            </p>
          )}
        </div>
        <div className="flex-grow p-4 pt-0 min-h-0">
          <iframe
            srcDoc={finalBody}
            title="Email Preview"
            className="w-full h-full bg-white border border-borders-primary rounded-lg"
            sandbox="allow-same-origin"
          />
        </div>
      </motion.div>
    </div>
  );
};
