import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Send, CheckCircle, XCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { apiService } from '../../services/apiService';
import { Button } from './Button';
import { toast } from 'sonner';

export const RecipientActionPopup: React.FC = () => {
  const {
    selectedRecipientIndices,
    activeCampaignId,
    deleteSelectedRecipients,
    updateStatusForSelectedRecipients,
  } = useAppStore();
  const selectedCount = selectedRecipientIndices.size;

  const handleSend = () => {
    if (!activeCampaignId) return;
    apiService.getCampaignSummary(activeCampaignId, Array.from(selectedRecipientIndices));
  };

  const handleDelete = () => {
    const confirmationMessage = `Are you sure you want to delete ${selectedCount} selected recipient(s)? This action cannot be undone.`;
    if (window.confirm(confirmationMessage)) {
      deleteSelectedRecipients();
      toast.success(`${selectedCount} recipient(s) deleted`);
    }
  };

  const handleMarkAsSent = () => {
    updateStatusForSelectedRecipients('SENT');
    toast.success(`${selectedCount} recipient(s) marked as SENT`);
  };

  const handleMarkAsPending = () => {
    updateStatusForSelectedRecipients('PENDING');
    toast.success(`${selectedCount} recipient(s) marked as PENDING`);
  };

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed right-4 bottom-4 z-50 bg-surface-card backdrop-blur-xl border border-borders-primary rounded-card shadow-card p-4 w-64"
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-text-primary text-center">
              {selectedCount} {selectedCount === 1 ? 'recipient' : 'recipients'} selected
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleSend} variant="primary">
                <Send size={16} />
                <span>Send Email to {selectedCount}</span>
              </Button>
              <Button onClick={handleDelete} variant="danger">
                <Trash2 size={16} />
                <span>Delete</span>
              </Button>
              <Button onClick={handleMarkAsSent} variant="success">
                <CheckCircle size={16} />
                <span>Mark as Sent</span>
              </Button>
              <Button onClick={handleMarkAsPending} variant="warning">
                <XCircle size={16} />
                <span>Mark as Pending</span>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
