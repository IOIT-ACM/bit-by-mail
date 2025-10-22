import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Settings, TestTube, Send, Loader } from 'lucide-react';

interface HeaderProps {
  onToggleSettings: () => void;
  sendMessage: (action: string, payload?: any) => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSettings, sendMessage }) => {
  const { config, recipients, isSending, clearLogs, setIsSending, sender_password } = useAppStore();

  const handleSend = () => {
    if (isSending || recipients.length === 0) return;
    clearLogs();
    setIsSending(true);
    const fullConfig = { ...config, sender_password };
    sendMessage('start_mailing', { config: fullConfig, recipients });
  };

  const handlePreflight = () => {
    clearLogs();
    const fullConfig = { ...config, sender_password };
    sendMessage('preflight_check', fullConfig);
  };

  const ActionButton: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode; className?: string }> = ({
    onClick,
    disabled,
    children,
    className,
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 h-10 px-4 rounded-button text-sm font-medium transition-colors duration-200
        ${className}
        disabled:bg-surface-element disabled:text-text-tertiary disabled:cursor-not-allowed
      `}
    >
      {children}
    </button>
  );

  return (
    <header className="sticky top-0 z-30 bg-surface-header backdrop-blur-xl border-b border-borders-primary">
      <div className="max-w-[2000px] w-full mx-auto flex justify-between items-center h-20 px-4 md:px-6 lg:px-8">
        <h1 className="text-heading-2 font-bold text-text-primary tracking-tight flex items-center gap-3">
          <img src="https://ioit-acm.github.io/planner/acm.png" height={40} width={40} />
          bit-by-mail
        </h1>
        <div className="flex items-center gap-3">
          <ActionButton
            onClick={onToggleSettings}
            className="bg-surface-element hover:bg-surface-element-hover text-text-secondary"
          >
            <Settings size={16} />
            <span className="hidden sm:inline">Settings</span>
          </ActionButton>
          <ActionButton
            onClick={handlePreflight}
            disabled={isSending}
            className="bg-accent-orange/20 hover:bg-accent-orange/30 text-accent-orange"
          >
            <TestTube size={16} />
            <span className="hidden sm:inline">Preflight</span>
          </ActionButton>
          <ActionButton
            onClick={handleSend}
            disabled={isSending}
            className="bg-accent-blue hover:bg-accent-blue/80 text-white"
          >
            {isSending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
            <span>{isSending ? 'Sending...' : 'Start Sending'}</span>
          </ActionButton>
        </div>
      </div>
    </header>
  );
};

export default Header;
