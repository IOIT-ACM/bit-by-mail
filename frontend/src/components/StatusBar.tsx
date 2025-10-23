import React from 'react';
import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Maximize, Minimize } from 'lucide-react';
import { LogEntry } from '../types';
import { MaximizableView } from './shared/MaximizableView';

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

const LogViewerContent: React.FC<{ onToggleFullScreen: () => void; isFullScreen: boolean }> = ({
  onToggleFullScreen,
  isFullScreen,
}) => {
  const { logs, isSending, progress } = useAppStore((state) => ({
    logs: state.logs,
    isSending: state.isSending,
    progress: state.progress,
  }));
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <>
      <div className="flex justify-between items-center mb-2 px-2">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-medium text-text-secondary">Live Logs</h3>
          {isSending && (
            <div className="flex items-center gap-2 w-64">
              <div className="w-full bg-surface-element rounded-full h-2">
                <div
                  className="bg-accent-blue h-2 rounded-full transition-all duration-300 ease-linear"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-xs text-text-secondary font-mono w-12 text-right">
                {Math.round(progress)}%
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggleFullScreen}
          className="p-1 rounded-full text-text-secondary hover:bg-surface-element-hover hover:text-text-primary transition-colors"
        >
          {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
      </div>
      <div className={`overflow-y-auto bg-surface-element rounded-lg p-3 font-mono text-xs ${isFullScreen ? 'flex-grow' : 'h-52'}`}>
        {logs.map(renderLog)}
        <div ref={logsEndRef} />
      </div>
    </>
  );
};

const StatusBar: React.FC = () => {
  return (
    <MaximizableView layoutId="log-viewer-container">
      {({ isMaximized, onToggle }) => (
        <LogViewerContent isFullScreen={isMaximized} onToggleFullScreen={onToggle} />
      )}
    </MaximizableView>
  );
};

export default StatusBar;
