import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Settings, TestTube, Send, Loader, Wifi, WifiOff } from 'lucide-react';
import { Button } from './shared/Button';
import { apiService } from '../services/apiService';

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
  const { isSending } = useAppStore();

  const handleSend = () => {
    if (isSending) return;
    apiService.startMailing();
  };

  const handlePreflight = () => {
    apiService.runPreflightCheck();
  };

  return (
    <header className="sticky top-0 z-30 bg-surface-header backdrop-blur-xl border-b border-borders-primary">
      <div className="max-w-[2000px] w-full mx-auto flex justify-between items-center h-20 px-4 md:px-6 lg:px-8">
        <h1 className="text-heading-2 font-bold text-text-primary tracking-tight flex items-center gap-3">
          <img src="https://ioit-acm.github.io/planner/acm.png" height={40} width={40} alt="Logo" />
          bit-by-mail
        </h1>
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
          <Button
            onClick={handleSend}
            disabled={isSending}
            variant="primary"
          >
            {isSending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
            <span>{isSending ? 'Sending...' : 'Start Sending'}</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
