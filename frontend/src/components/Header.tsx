import React from 'react';
import { useAppStore } from '../store/useAppStore';

interface HeaderProps {
  onToggleSettings: () => void;
  sendMessage: (action: string, payload?: any) => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSettings, sendMessage }) => {
  const { config, recipients, isSending, clearLogs, setIsSending, sender_password } = useAppStore();

  const handleSend = () => {
    if (isSending || recipients.length === 0) {
      return;
    }
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

  return (
    <header className="bg-white p-4 shadow-md sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">bit-by-mail</h1>
        <div className="space-x-2">
          <button onClick={onToggleSettings} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">
            Settings
          </button>
          <button onClick={handlePreflight} disabled={isSending} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400 disabled:cursor-not-allowed">
            Preflight
          </button>
          <button onClick={handleSend} disabled={isSending} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400 disabled:cursor-not-allowed">
            {isSending ? 'Sending...' : 'Start Sending'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
