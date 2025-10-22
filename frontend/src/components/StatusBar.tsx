import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

const StatusBar: React.FC = () => {
  const logs = useAppStore((state) => state.logs);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <footer className="bg-white border-t border-gray-200 p-4 mt-auto">
      <div className="container mx-auto h-40 overflow-y-auto bg-gray-900 text-gray-200 rounded p-2 font-mono text-xs">
        {logs.map((log, index) => (
          <div key={index} className="whitespace-pre-wrap">{log}</div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </footer>
  );
};

export default StatusBar;
