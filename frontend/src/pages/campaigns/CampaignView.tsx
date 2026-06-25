import React, { useState, useRef, useCallback, useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/apiService";
import { CampaignData, Campaign } from "@/types";
import { CampaignViewHeader } from "@/features/campaigns/components/CampaignViewHeader";
import Editor from "@/features/campaigns/components/Editor";
import RecipientTable from "@/features/campaigns/components/RecipientTable";
import StatusBar from "@/layouts/StatusBar";
import { AnimatePresence } from "framer-motion";
import { EmailPreviewModal } from "@/features/campaigns/components/EmailPreviewModal";
import { CampaignSummaryModal } from "@/features/campaigns/components/CampaignSummaryModal";
import { AddRecipientModal } from "@/features/campaigns/components/AddRecipientModal";
import { useAppStore } from "@/store/useAppStore";

export const CampaignView: React.FC = () => {
  const { campaignId } = useParams({ from: '/campaigns/$campaignId' });
  const [editorWidth, setEditorWidth] = useState(40);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);

  const { previewRecipient, setPreviewRecipient, showCampaignSummaryModal, showAddRecipientModal, clearLogs } = useAppStore();

  const { data: campaigns = [] } = useQuery<Campaign[]>({ queryKey: ['campaigns'] });
  const campaign = campaigns.find(c => c.id === campaignId);

  useQuery<CampaignData>({
    queryKey: ['campaignData', campaignId],
    queryFn: () => apiService.request('get_campaign_data', { campaign_id: campaignId }, 'campaign_data')
  });

  useEffect(() => {
    clearLogs();
  }, [campaignId, clearLogs]);

  useEffect(() => {
    const handleResize = () => setIsLargeScreen(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (window.innerWidth < 1024) return;
    e.preventDefault();
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // Direct DOM manipulation - no React state updates here!
      if (!mainContentRef.current || !leftPanelRef.current) return;
      const container = mainContentRef.current;
      const containerRect = container.getBoundingClientRect();
      const newEditorPixelWidth = moveEvent.clientX - containerRect.left;
      let newEditorWidthPercent = (newEditorPixelWidth / containerRect.width) * 100;
      if (newEditorWidthPercent < 25) newEditorWidthPercent = 25;
      if (newEditorWidthPercent > 75) newEditorWidthPercent = 75;
      
      // Update DOM instantly without freezing the thread
      leftPanelRef.current.style.width = `${newEditorWidthPercent}%`;
    };

    const handleMouseUp = () => {
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      
      // Sync the final width to React state when dragging is DONE
      if (leftPanelRef.current) {
        const finalWidth = parseFloat(leftPanelRef.current.style.width);
        if (!isNaN(finalWidth)) setEditorWidth(finalWidth);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, []);

  if (!campaign) return <div className="p-8 text-text-secondary">Loading campaign...</div>;

  return (
    <div className="h-full flex flex-col p-4 md:p-6 lg:p-8 max-w-[2000px] w-full mx-auto relative overflow-hidden">
      <CampaignViewHeader campaign={campaign} campaignId={campaignId} />
      <div ref={mainContentRef} className="flex-grow flex flex-col lg:flex-row items-stretch min-h-0">
        
        {/* ADD leftPanelRef HERE */}
        <div ref={leftPanelRef} className="min-w-0 lg:pr-4 mb-8 lg:mb-0 flex flex-col" style={isLargeScreen ? { width: `${editorWidth}%` } : {}}>
          <Editor campaignId={campaignId} subject={campaign.subject} />
        </div>

        <div onMouseDown={handleMouseDown} className="hidden lg:flex w-2 flex-shrink-0 items-center justify-center cursor-col-resize group z-10">
          <div className="w-1 h-16 bg-borders-primary rounded-full group-hover:bg-accent-blue transition-colors"></div>
        </div>
        <div className="flex-1 min-w-0 lg:pl-4 flex flex-col">
          <RecipientTable campaignId={campaignId} />
        </div>
      </div>
      <div className="flex-shrink-0 mt-6">
        <StatusBar />
      </div>

      <AnimatePresence>
        {previewRecipient && <EmailPreviewModal onClose={() => setPreviewRecipient(null)} />}
        {showCampaignSummaryModal && <CampaignSummaryModal />}
        {showAddRecipientModal && <AddRecipientModal campaignId={campaignId} />}
      </AnimatePresence>
    </div>
  );
};
