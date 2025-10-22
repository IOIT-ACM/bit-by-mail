import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize, Minimize } from 'lucide-react';
import { LogEntry } from '../types';

const StatusBar: React.FC = () => {
  const logs = useAppStore((state) => state.logs);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, isFullScreen]);

  const getLogColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'success':
        return 'text-status-success-text';
      case 'error':
        return 'text-status-danger-text';
      case 'warn':
        return 'text-accent-orange';
      case 'info':
        return 'text-status-info-text';
      default:
        return 'text-text-secondary';
    }
  };

  const renderLog = (log: LogEntry, index: number) => (
    <div key={index} className="whitespace-pre-wrap leading-relaxed flex items-start">
      <span className={`font-medium w-24 flex-shrink-0 ${getLogColor(log.level)}`}>
        [{log.level.toUpperCase()}]
      </span>
      <span className={`flex-1 ${getLogColor(log.level)}`}>{log.message}</span>
    </div>
  );

  return (
    <>
      <motion.div
        layoutId="log-viewer-container"
        className="bg-surface-card backdrop-blur-xl border border-borders-primary rounded-card shadow-card p-4 flex flex-col"
        style={{ visibility: isFullScreen ? 'hidden' : 'visible' }}
      >
        <div className="flex justify-between items-center mb-2 px-2">
          <h3 className="text-sm font-medium text-text-secondary">Live Logs</h3>
          <button
            onClick={() => setIsFullScreen(true)}
            className="p-1 rounded-full text-text-secondary hover:bg-surface-element-hover hover:text-text-primary transition-colors"
          >
            <Maximize size={16} />
          </button>
        </div>
        <div className="h-52 overflow-y-auto bg-surface-element rounded-lg p-3 font-mono text-xs">
          {logs.map(renderLog)}
          <div ref={logsEndRef} />
        </div>
      </motion.div>

      <AnimatePresence>
        {isFullScreen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFullScreen(false)}
            />
            <motion.div
              layoutId="log-viewer-container"
              className="relative w-full h-full bg-surface-card border border-borders-primary rounded-card shadow-card p-4 flex flex-col"
            >
              <div className="flex justify-between items-center mb-2 px-2">
                <h3 className="text-sm font-medium text-text-secondary">Live Logs</h3>
                <button
                  onClick={() => setIsFullScreen(false)}
                  className="p-1 rounded-full text-text-secondary hover:bg-surface-element-hover hover:text-text-primary transition-colors"
                >
                  <Minimize size={16} />
                </button>
              </div>
              <div className="flex-grow overflow-y-auto bg-surface-element rounded-lg p-3 font-mono text-xs">
                {logs.map(renderLog)}
                <div ref={logsEndRef} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StatusBar;
