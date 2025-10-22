import React, { useState } from 'react';
import Header from './components/Header';
import Settings from './components/Settings';
import Editor from './components/Editor';
import RecipientTable from './components/RecipientTable';
import StatusBar from './components/StatusBar';
import { useWebSocket } from './hooks/useWebSocket';

const App: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const { sendMessage } = useWebSocket();

  return (
    <div className="min-h-screen flex flex-col">
      <Header onToggleSettings={() => setShowSettings(s => !s)} sendMessage={sendMessage} />
      <main className="flex-grow container mx-auto py-4 space-y-6">
        {showSettings && <Settings sendMessage={sendMessage} />}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Editor sendMessage={sendMessage} />
          <RecipientTable sendMessage={sendMessage} />
        </div>
      </main>
      <StatusBar />
    </div>
  );
};

export default App;
