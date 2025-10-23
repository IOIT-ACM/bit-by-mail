import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MaximizableViewProps {
  children: (props: { isMaximized: boolean; onToggle: () => void }) => React.ReactNode;
  layoutId: string;
}

export const MaximizableView: React.FC<MaximizableViewProps> = ({ children, layoutId }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const onToggle = () => setIsMaximized(!isMaximized);

  return (
    <>
      <motion.div
        layoutId={layoutId}
        className="bg-surface-card backdrop-blur-xl border border-borders-primary rounded-card shadow-card p-4 flex flex-col h-full"
        style={{ visibility: isMaximized ? 'hidden' : 'visible' }}
      >
        {children({ isMaximized: false, onToggle })}
      </motion.div>

      <AnimatePresence>
        {isMaximized && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
            />
            <motion.div
              layoutId={layoutId}
              className="relative w-full h-full bg-surface-card border border-borders-primary rounded-card shadow-card p-4 flex flex-col"
            >
              {children({ isMaximized: true, onToggle })}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
