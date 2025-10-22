import React, { useState, useRef, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Settings from './components/Settings';
import Editor from './components/Editor';
import RecipientTable from './components/RecipientTable';
import StatusBar from './components/StatusBar';
import { useWebSocket } from './hooks/useWebSocket';

const App: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const { sendMessage } = useWebSocket();
  const [editorWidth, setEditorWidth] = useState(40);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header onToggleSettings={() => setShowSettings(true)} sendMessage={sendMessage} />
      <main className="flex-grow max-w-[2000px] w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col">
        <div ref={mainContentRef} className="flex-grow flex flex-col lg:flex-row items-stretch">
          <div className="min-w-0 lg:pr-4 mb-8 lg:mb-0" style={isLargeScreen ? { width: `${editorWidth}%` } : {}}>
            <Editor sendMessage={sendMessage} />
          </div>
          <div
            onMouseDown={handleMouseDown}
            className="hidden lg:flex w-2 flex-shrink-0 items-center justify-center cursor-col-resize group"
          >
            <div className="w-1 h-16 bg-borders-primary rounded-full group-hover:bg-accent-blue transition-colors"></div>
          </div>
          <div className="flex-1 min-w-0 lg:pl-4">
            <RecipientTable sendMessage={sendMessage} />
          </div>
        </div>
        <div className="mt-8">
          <StatusBar />
        </div>
      </main>
      {showSettings && <Settings sendMessage={sendMessage} onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default App;
