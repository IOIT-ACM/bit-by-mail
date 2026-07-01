import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MaximizableViewProps {
  children: (props: {
    isMaximized: boolean
    onToggle: () => void
  }) => React.ReactNode
  layoutId: string
  className?: string
}

export const MaximizableView: React.FC<MaximizableViewProps> = ({
  children,
  layoutId,
  className,
}) => {
  const [isMaximized, setIsMaximized] = useState(false)
  const onToggle = () => setIsMaximized(!isMaximized)

  const defaultClasses =
    'bg-surface-card backdrop-blur-xl border border-borders-primary rounded-card shadow-card p-4 flex flex-col h-full'
  const appliedClasses = className || defaultClasses

  return (
    <>
      <motion.div
        layoutId={layoutId}
        className={appliedClasses}
        style={{ visibility: isMaximized ? 'hidden' : 'visible' }}
      >
        {children({ isMaximized: false, onToggle })}
      </motion.div>

      <AnimatePresence>
        {isMaximized && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
            />
            <motion.div
              layoutId={layoutId}
              className={`relative w-full h-full ${appliedClasses}`}
            >
              {children({ isMaximized: true, onToggle })}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
