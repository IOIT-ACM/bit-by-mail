import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Settings, TestTube, Send, Loader, Wifi, WifiOff, ArrowLeft, XCircle } from 'lucide-react';
import { Button } from './shared/Button';
import { apiService } from '../services/apiService';
import { toast } from 'sonner';

interface HeaderProps {
  onToggleSettings: () => void;
}

const ConnectionStatus: React.FC = () => {
  const connectionStatus = useAppStore((state) => state.connectionStatus);

  if (connectionStatus === 'open') {
    return (
      <span title="Connected">
        <Wifi size={16} className="text-status-success-text" />
      </span>
    );
  }
  if (connectionStatus === 'closed') {
    return (
      <span title="Disconnected">
        <WifiOff size={16} className="text-status-danger-text" />
      </span>
    );
  }
  return (
    <span title="Connecting...">
      <Loader size={16} className="animate-spin text-text-tertiary" />
    </span>
  );
};

const Header: React.FC<HeaderProps> = ({ onToggleSettings }) => {
  const { isSending, activeCampaignId, setActiveCampaignId, clearRecipientSelection } = useAppStore();

  const handleSend = () => {
    if (isSending || !activeCampaignId) return;
    clearRecipientSelection();
    apiService.getCampaignSummary(activeCampaignId);
  };

  const handlePreflight = () => {
    if (!activeCampaignId) return;
    toast.info('Running preflight check...');
    apiService.runPreflightCheck(activeCampaignId);
  };

  const handleStop = () => {
    if (!isSending) return;
    apiService.stopMailing();
    toast.warning('Stop request sent. The process will halt after the current email.');
  };

  const handleBackToCampaigns = () => {
    setActiveCampaignId(null);
    window.history.pushState({}, '', window.location.pathname);
  };

  return (
    <header className="sticky top-0 z-30 bg-surface-header backdrop-blur-xl border-b border-borders-primary">
      <div className="max-w-[2000px] w-full mx-auto flex justify-between items-center h-20 px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToCampaigns}
            className="p-2 rounded-full text-text-secondary hover:bg-surface-element-hover hover:text-text-primary transition-colors"
            title="Back to Campaigns"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <img
              src="https://ioit.acm.org/static/img/assets/acm.png"
              alt="ACM Logo"
              className="h-8 w-8"
            />
            <h1 className="text-heading-2 font-bold text-text-primary tracking-tight">
              bit-by-mail
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionStatus />
          <Button
            onClick={onToggleSettings}
            variant="secondary"
          >
            <Settings size={16} />
            <span className="hidden sm:inline">Settings</span>
          </Button>
          <Button
            onClick={handlePreflight}
            disabled={isSending}
            variant="warning"
          >
            <TestTube size={16} />
            <span className="hidden sm:inline">Preflight</span>
          </Button>
          {isSending ? (
            <Button onClick={handleStop} variant="danger">
              <XCircle size={16} />
              <span>Stop Sending</span>
            </Button>
          ) : (
            <Button onClick={handleSend} variant="primary">
              <Send size={16} />
              <span>Start Sending</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
