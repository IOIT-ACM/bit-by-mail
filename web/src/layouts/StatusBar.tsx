import React, { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import {
  ChevronDown,
  ChevronUp,
  Maximize,
  Minimize,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FastForward,
} from 'lucide-react'
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
  const statusCounts = useAppStore((state) => state.statusCounts)
  const isLogCollapsed = useAppStore((state) => state.isLogCollapsed)
  const setIsLogCollapsed = useAppStore((state) => state.setIsLogCollapsed)
  const clearLogs = useAppStore((state) => state.clearLogs)

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
  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null

  return (
    <div
      className={`flex flex-col w-full bg-surface-header transition-all duration-300 ${isLogCollapsed && !isMaximized ? 'h-[60px] border-t border-borders-primary' : isMaximized ? 'h-full' : 'h-64 border-t border-borders-primary'}`}
    >
      <div
        className="flex justify-between items-center p-2 h-[60px] flex-shrink-0 cursor-pointer"
        onClick={() => !isMaximized && setIsLogCollapsed(!isLogCollapsed)}
      >
        <div className="flex items-center gap-6 px-2 flex-grow overflow-hidden">
          <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="4"
                className="text-surface-element"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="100.53"
                strokeDashoffset={100.53 - (100.53 * percentage) / 100}
                className="text-accent-blue transition-all duration-300"
              />
            </svg>
            <span className="absolute text-[10px] font-bold">
              {Math.round(percentage)}%
            </span>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-2 bg-status-success-bg/10 border border-status-success-bg/30 px-3 py-1.5 rounded-full">
              <CheckCircle2 size={14} className="text-status-success-text" />
              <span className="text-xs font-medium text-status-success-text">
                Sent: {statusCounts.sent}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-status-danger-bg/10 border border-status-danger-bg/30 px-3 py-1.5 rounded-full">
              <AlertCircle size={14} className="text-status-danger-text" />
              <span className="text-xs font-medium text-status-danger-text">
                Failed: {statusCounts.error}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-accent-orange/10 border border-accent-orange/30 px-3 py-1.5 rounded-full">
              <FastForward size={14} className="text-accent-orange" />
              <span className="text-xs font-medium text-accent-orange">
                Skipped: {statusCounts.skipped}
              </span>
            </div>
          </div>

          {isLogCollapsed && !isMaximized && lastLog && !isSending && (
            <div className="flex items-center gap-2 truncate opacity-80 border-l border-borders-primary pl-4 ml-2">
              <span
                className={`text-xs font-medium ${getLogColor(lastLog.level)} uppercase`}
              >
                [{lastLog.level}]
              </span>
              <span
                className={`text-xs truncate ${getLogColor(lastLog.level)}`}
              >
                {lastLog.message}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isSending && (
            <span className="text-xs text-text-secondary mr-4 animate-pulse">
              Processing...
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              clearLogs()
            }}
            title="Clear Logs"
            className="p-1 rounded-full text-text-secondary hover:bg-surface-element-hover hover:text-status-danger-text transition-colors"
          >
            <Trash2 size={16} />
          </button>
          {!isMaximized && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsLogCollapsed(!isLogCollapsed)
              }}
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
            onClick={(e) => {
              e.stopPropagation()
              onToggleMaximize()
            }}
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
    <MaximizableView
      layoutId="log-viewer-container"
      className="flex flex-col h-full bg-surface-header"
    >
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
