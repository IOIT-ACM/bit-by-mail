import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiService } from '@/services/apiService';
import { Button } from '@/components/common/Button';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Campaign } from '@/types';
import { useRouter } from '@tanstack/react-router';

export const SelectionPopup: React.FC = () => {
  const router = useRouter();
  const { data: campaigns = [] } = useQuery<Campaign[]>({ queryKey: ['campaigns'] });
  const { selectedCampaignIds, clearCampaignSelection } = useAppStore();
  const selectedCount = selectedCampaignIds.size;

  const handleOpen = () => {
    if (selectedCount !== 1) return;
    const id = selectedCampaignIds.values().next().value;
    router.navigate({ to: '/campaigns/$campaignId', params: { campaignId: id ?? "undefined" } });
    clearCampaignSelection();
  };

  const handleDelete = () => {
    const campaignNames = Array.from(selectedCampaignIds).map(id => campaigns.find(c => c.id === id)?.name).filter(Boolean).join(', ');
    const confirmationMessage = selectedCount === 1 ? `Are you sure you want to delete the campaign "${campaignNames}"?` : `Are you sure you want to delete ${selectedCount} campaigns?`;
    if (window.confirm(confirmationMessage)) {
      apiService.deleteCampaigns(Array.from(selectedCampaignIds));
      toast.success(selectedCount === 1 ? `Campaign "${campaignNames}" deleted` : `${selectedCount} campaigns deleted`);
      clearCampaignSelection();
    }
  };

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed right-6 bottom-20 z-50 bg-surface-card backdrop-blur-xl border border-borders-primary rounded-card shadow-card p-4 w-64">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-text-primary">{selectedCount} {selectedCount === 1 ? 'campaign' : 'campaigns'} selected</p>
            <div className="flex flex-col gap-2">
              {selectedCount === 1 && <Button onClick={handleOpen} variant="secondary"><ArrowRight size={16} /><span>Open Campaign</span></Button>}
              <Button onClick={handleDelete} variant="secondary" className="bg-status-danger-bg/50 hover:bg-status-danger-bg/80 text-status-danger-text"><Trash2 size={16} /><span>Delete</span></Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

