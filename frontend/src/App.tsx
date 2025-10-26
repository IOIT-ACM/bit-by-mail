import React, { useState, useRef, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Settings from './components/Settings';
import Editor from './components/Editor';
import RecipientTable from './components/RecipientTable';
import StatusBar from './components/StatusBar';
import { useWebSocket } from './hooks/useWebSocket';
import { useAppStore } from './store/useAppStore';
import { CampaignSummaryModal } from './components/shared/CampaignSummaryModal';
import { EmailPreviewModal } from './components/shared/EmailPreviewModal';
import { AnimatePresence } from 'framer-motion';
import { CampaignDashboard } from './components/CampaignDashboard';
import { apiService } from './services/apiService';
import { Button } from './components/shared/Button';
import { Download, Upload } from 'lucide-react';
import { RecipientActionPopup } from './components/shared/RecipientActionPopup';

const App: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  useWebSocket();
  const [editorWidth, setEditorWidth] = useState(40);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);
  const {
    previewRecipient,
    setPreviewRecipient,
    showCampaignSummaryModal,
    activeCampaignId,
    activeCampaignData,
    campaigns,
    setActiveCampaignId,
  } = useAppStore();
  const initialUrlCheckDone = useRef(false);
  const activeCampaign = campaigns.find(c => c.id === activeCampaignId);

  useEffect(() => {
    if (campaigns.length > 0 && !initialUrlCheckDone.current) {
      const params = new URLSearchParams(window.location.search);
      const campaignIdFromUrl = params.get('c');
      if (campaignIdFromUrl && campaigns.some(c => c.id === campaignIdFromUrl)) {
        setActiveCampaignId(campaignIdFromUrl);
        apiService.getCampaignData(campaignIdFromUrl);
      }
      initialUrlCheckDone.current = true;
    }
  }, [campaigns, setActiveCampaignId]);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (window.innerWidth < 1024) return;
    e.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!mainContentRef.current) return;

      const container = mainContentRef.current;
      const containerRect = container.getBoundingClientRect();

      const newEditorPixelWidth = moveEvent.clientX - containerRect.left;
      let newEditorWidthPercent = (newEditorPixelWidth / containerRect.width) * 100;

      if (newEditorWidthPercent < 25) newEditorWidthPercent = 25;
      if (newEditorWidthPercent > 75) newEditorWidthPercent = 75;

      setEditorWidth(newEditorWidthPercent);
    };

    const handleMouseUp = () => {
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && activeCampaignId) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const base64Content = btoa(text);
        apiService.uploadRecipients(activeCampaignId, base64Content);
      };
      reader.readAsText(file);
    }
  };

  const handleDownloadSample = () => {
    const csvContent =
      'Name,Email,AttachmentFile,Status\nJohn Doe,john.doe@example.com,certificate_john.pdf,PENDING\nJane Smith,jane.smith@example.com,certificate_jane.pdf,PENDING';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_recipients.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!activeCampaignId) {
    return <CampaignDashboard />;
  }

  if (!activeCampaignData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-secondary">
        Loading campaign data...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Header onToggleSettings={() => setShowSettings(true)} />
      <main className="flex-grow max-w-[2000px] w-full mx-auto p-4 flex flex-col min-h-0">
        <div className="flex-shrink-0 flex justify-between items-center mb-4 flex-wrap gap-4">
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            {activeCampaign?.name}
          </h1>
          <div className="flex items-center gap-2">
            <Button onClick={handleDownloadSample} variant="secondary">
              <Download size={16} />
              <span>Sample Data</span>
            </Button>
            <input type="file" id="csv-upload" accept=".csv" onChange={handleFileUpload} className="hidden" />
            <Button as="label" htmlFor="csv-upload" variant="success" className="cursor-pointer">
              <Upload size={16} />
              <span>Upload Data</span>
            </Button>
          </div>
        </div>

        <div ref={mainContentRef} className="flex-grow flex flex-col lg:flex-row items-stretch min-h-0">
          <div className="min-w-0 lg:pr-4 mb-8 lg:mb-0 flex flex-col" style={isLargeScreen ? { width: `${editorWidth}%` } : {}}>
            <Editor />
          </div>
          <div
            onMouseDown={handleMouseDown}
            className="hidden lg:flex w-2 flex-shrink-0 items-center justify-center cursor-col-resize group"
          >
            <div className="w-1 h-16 bg-borders-primary rounded-full group-hover:bg-accent-blue transition-colors"></div>
          </div>
          <div className="flex-1 min-w-0 lg:pl-4 flex flex-col">
            <RecipientTable />
          </div>
        </div>
        <div className="flex-shrink-0 mt-8">
          <StatusBar />
        </div>
      </main>
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}

      <AnimatePresence>
        {previewRecipient && <EmailPreviewModal onClose={() => setPreviewRecipient(null)} />}
        {showCampaignSummaryModal && <CampaignSummaryModal />}
      </AnimatePresence>
      <RecipientActionPopup />
    </div>
  );
};

export default App;
