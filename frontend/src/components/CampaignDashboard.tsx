import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useAppStore } from '../store/useAppStore';
import { apiService } from '../services/apiService';
import { Button } from './shared/Button';
import { Plus, Mail, Users, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Campaign } from '../types';

export const CampaignDashboard: React.FC = () => {
  const router = useRouter();
  const searchParams = new URLSearchParams(window.location.search);
  const [showCreateModal, setShowCreateModal] = useState(searchParams.get('new') === 'true');
  const [newCampaignName, setNewCampaignName] = useState('');

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: () => apiService.request('get_campaigns', null, 'initial_data').then((d) => d.campaigns)
  });

  const {
    selectedCampaignIds,
    selectSingleCampaign,
    toggleCampaignSelection,
    setSelectedCampaignIds,
    clearCampaignSelection,
    selectAllCampaigns,
  } = useAppStore();

  const gridRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const startPoint = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      window.history.replaceState({}, '', '/campaigns');
    }
  }, []);

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    const campaignName = newCampaignName.trim();
    if (campaignName) {
      apiService.createCampaign(campaignName);
      toast.success(`Campaign "${campaignName}" created`);
      setNewCampaignName('');
      setShowCreateModal(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== gridRef.current) return;
    e.preventDefault();
    hasDragged.current = false;
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;
    startPoint.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setSelectionBox({ x: startPoint.current.x, y: startPoint.current.y, width: 0, height: 0 });
    setIsSelecting(true);
  };

  useEffect(() => {
    if (!isSelecting) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!gridRef.current) return;
      hasDragged.current = true;
      const gridRect = gridRef.current.getBoundingClientRect();
      const currentX = e.clientX - gridRect.left;
      const currentY = e.clientY - gridRect.top;
      const newSelectionBox = {
        x: Math.min(startPoint.current.x, currentX),
        y: Math.min(startPoint.current.y, currentY),
        width: Math.abs(currentX - startPoint.current.x),
        height: Math.abs(currentY - startPoint.current.y),
      };
      setSelectionBox(newSelectionBox);
      const newlySelectedIds = new Set<string>();
      itemRefs.current.forEach((item, id) => {
        if (item) {
          const itemRect = item.getBoundingClientRect();
          const relativeItemRect = {
            left: itemRect.left - gridRect.left,
            top: itemRect.top - gridRect.top,
            right: itemRect.right - gridRect.left,
            bottom: itemRect.bottom - gridRect.top,
          };
          const selectionRect = {
            left: newSelectionBox.x,
            top: newSelectionBox.y,
            right: newSelectionBox.x + newSelectionBox.width,
            bottom: newSelectionBox.y + newSelectionBox.height,
          };
          if (
            selectionRect.left < relativeItemRect.right &&
            selectionRect.right > relativeItemRect.left &&
            selectionRect.top < relativeItemRect.bottom &&
            selectionRect.bottom > relativeItemRect.top
          ) {
            newlySelectedIds.add(id);
          }
        }
      });
      setSelectedCampaignIds(newlySelectedIds);
    };
    const handleMouseUp = () => {
      if (!hasDragged.current) clearCampaignSelection();
      setIsSelecting(false);
      setSelectionBox({ x: 0, y: 0, width: 0, height: 0 });
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isSelecting, setSelectedCampaignIds, clearCampaignSelection]);

  const handleCardClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) toggleCampaignSelection(id);
    else selectSingleCampaign(id);
  };

  const handleCardDoubleClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    router.navigate({ to: '/campaigns/$campaignId', params: { campaignId: id } });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearCampaignSelection();
      else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAllCampaigns(campaigns.map(c => c.id));
      } else if (e.key === 'Enter' && selectedCampaignIds.size === 1) {
        e.preventDefault();
        const id = selectedCampaignIds.values().next().value;
        router.navigate({ to: '/campaigns/$campaignId', params: { campaignId: id } });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearCampaignSelection, selectAllCampaigns, selectedCampaignIds, campaigns, router]);

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 lg:p-12">
      <main className="w-full max-w-7xl mx-auto flex flex-col gap-8">

        <section className="w-full select-none">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-heading-1 font-bold text-text-primary tracking-tight">Campaigns Dashboard</h2>
            <Button onClick={() => setShowCreateModal(true)} variant="primary">
              <Plus size={16} />
              <span>New Campaign</span>
            </Button>
          </div>

          {campaigns.length > 0 ? (
            <div ref={gridRef} onMouseDown={handleMouseDown} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative select-none" style={{ userSelect: isSelecting ? 'none' : 'auto' }}>
              {isSelecting && (
                <div className="absolute border-2 border-dashed border-accent-blue bg-accent-blue/10 pointer-events-none z-10 select-none" style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.width, height: selectionBox.height }} />
              )}
              {campaigns.map((campaign, index) => {
                const isSelected = selectedCampaignIds.has(campaign.id);
                return (
                  <motion.div
                    ref={node => { if (node) itemRefs.current.set(campaign.id, node); else itemRefs.current.delete(campaign.id); }}
                    key={campaign.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={(e) => handleCardClick(e, campaign.id)}
                    onDoubleClick={(e) => handleCardDoubleClick(e, campaign.id)}
                    className={`bg-surface-card backdrop-blur-xl border rounded-card p-6 cursor-pointer hover:bg-surface-card/80 transition-all duration-200 flex flex-col ${isSelected ? 'border-accent-blue ring-2 ring-accent-blue/50' : 'border-borders-primary hover:border-accent-blue/50'}`}
                  >
                    <div className="flex-grow">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 flex items-center justify-center bg-accent-blue/10 rounded-full text-accent-blue flex-shrink-0">
                          <Mail size={20} />
                        </div>
                        <h2 className="text-lg font-medium text-text-primary truncate">{campaign.name}</h2>
                      </div>
                      <p className="text-sm text-text-secondary truncate mt-3"><strong>Subject:</strong> {campaign.subject}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-borders-primary/50 flex flex-col gap-3 text-xs text-text-tertiary">
                      {campaign.latestReportUrl && (
                        <a href={campaign.latestReportUrl} download onClick={(e) => e.stopPropagation()} className="w-full flex items-center justify-center gap-2 h-9 px-4 rounded-button text-xs font-medium transition-colors duration-200 bg-surface-element hover:bg-surface-element-hover text-text-secondary">
                          <Download size={14} />
                          <span>Download Latest Report</span>
                        </a>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="font-medium flex items-center gap-1.5">
                          <Users size={14} />
                          {campaign.recipientCount > 0 ? `${campaign.recipientCount} Recipients` : 'No active recipients'}
                        </span>
                        <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-borders-primary rounded-card mt-10">
              <Mail size={48} className="text-text-tertiary mb-4" />
              <h3 className="text-lg font-medium text-text-primary">No Campaigns Yet</h3>
              <p className="text-text-secondary mt-1 max-w-xs">Click the "New Campaign" button above to create your first email campaign.</p>
            </div>
          )}
        </section>
      </main>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md bg-surface-card border border-borders-primary rounded-card shadow-card p-6">
              <h2 className="text-heading-3 font-medium text-text-primary mb-4">Create New Campaign</h2>
              <form onSubmit={handleCreateCampaign}>
                <input type="text" value={newCampaignName} onChange={(e) => setNewCampaignName(e.target.value)} placeholder="Enter campaign name..." className="w-full h-11 px-4 bg-surface-element border border-borders-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-colors mb-6" autoFocus maxLength={60} />
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" disabled={!newCampaignName.trim()}>Create</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

