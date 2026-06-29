import React, { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { ChevronDown, ChevronUp, Maximize, Minimize } from 'lucide-react'
import type { LogEntry } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { MaximizableView } from '@/components/common/MaximizableView'

const getLogColor = (level: string) => {
  switch (level.toLowerCase()) {
    case 'success':
      return 'text-status-success-text'
    case 'error':
      return 'text-status-danger-text'
    case 'warn':
      return 'text-accent-orange'
    case 'info':
      return 'text-status-info-text'
    default:
      return 'text-text-secondary'
  }
}

const renderLog = (log: LogEntry, index: number) => (
  <div
    key={index}
    className="whitespace-pre-wrap leading-relaxed flex items-start"
  >
    <span
      className={`font-medium w-24 flex-shrink-0 ${getLogColor(log.level)}`}
    >
      [{log.level.toUpperCase()}]
    </span>
    <span className={`flex-1 ${getLogColor(log.level)}`}>{log.message}</span>
  </div>
)

const LogViewerContent: React.FC<{
  isMaximized: boolean
  onToggleMaximize: () => void
}> = ({ isMaximized, onToggleMaximize }) => {
  const logs = useAppStore((state) => state.logs)
  const isSending = useAppStore((state) => state.isSending)
  const progress = useAppStore((state) => state.progress)
  const isLogCollapsed = useAppStore((state) => state.isLogCollapsed)
  const setIsLogCollapsed = useAppStore((state) => state.setIsLogCollapsed)

  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isMaximized) {
      setIsLogCollapsed(false)
    }
  }, [isMaximized, setIsLogCollapsed])

  useEffect(() => {
    if (!isLogCollapsed) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, isLogCollapsed])

  const percentage =
    progress.total > 0 ? (progress.sent / progress.total) * 100 : 0

  return (
    <div
      className={`flex flex-col w-full bg-surface-header transition-all duration-300 ${isLogCollapsed && !isMaximized ? 'h-12' : isMaximized ? 'h-full' : 'h-64'}`}
    >
      <div className="flex justify-between items-center p-2 ">
        <div
          className="flex items-center gap-4 flex-grow cursor-pointer"
          onClick={() => !isMaximized && setIsLogCollapsed(!isLogCollapsed)}
        >
          <h3 className="text-sm font-medium text-text-secondary">Live Logs</h3>
          {isSending && progress.total > 0 && (
            <div className="flex items-center gap-2 w-64">
              <div className="w-full bg-surface-element rounded-full h-2">
                <div
                  className="bg-accent-blue h-2 rounded-full transition-all duration-300 ease-linear"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="text-xs text-text-secondary font-mono w-24 text-right">
                {progress.sent} / {progress.total}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isMaximized && (
            <button
              onClick={() => setIsLogCollapsed(!isLogCollapsed)}
              aria-label={isLogCollapsed ? 'Expand logs' : 'Collapse logs'}
              className="p-1 rounded-full text-text-secondary hover:bg-surface-element-hover hover:text-text-primary transition-colors"
            >
              {isLogCollapsed ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
          )}
          <button
            onClick={onToggleMaximize}
            aria-label={isMaximized ? 'Minimize logs' : 'Maximize logs'}
            className="p-1 rounded-full text-text-secondary hover:bg-surface-element-hover hover:text-text-primary transition-colors"
          >
            {isMaximized ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {!isLogCollapsed && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: 'auto' },
              collapsed: { opacity: 0, height: 0 },
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="flex-grow flex overflow-hidden min-h-0"
          >
            <div className="overflow-y-auto bg-surface-element p-3 font-mono text-xs w-full h-full custom-scrollbar">
              {logs.length > 0 ? (
                logs.map(renderLog)
              ) : (
                <span className="text-text-tertiary">No logs yet...</span>
              )}
              <div ref={logsEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const StatusBar: React.FC = () => {
  return (
    <MaximizableView layoutId="log-viewer-container">
      {({ isMaximized, onToggle }) => (
        <LogViewerContent
          isMaximized={isMaximized}
          onToggleMaximize={onToggle}
        />
      )}
    </MaximizableView>
  )
}

export default StatusBar
