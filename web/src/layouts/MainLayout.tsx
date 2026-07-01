import React from 'react'
import { Sidebar } from './Sidebar'
import { useWebSocket } from '@/hooks/useWebSocket'
import { RecipientActionPopup } from '@/features/campaigns/components/RecipientActionPopup'
import { useAppStore } from '@/store/useAppStore'
import { WifiOff } from 'lucide-react'

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useWebSocket()
  const connectionStatus = useAppStore((state) => state.connectionStatus)

  return (
    <div className="flex h-screen bg-background-base text-text-primary font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 h-full overflow-hidden relative">
        {children}
      </main>
      <RecipientActionPopup />

      {connectionStatus === 'closed' && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-surface-card p-6 rounded-lg text-center border border-status-danger-bg/50 shadow-lg">
            <WifiOff
              size={48}
              className="mx-auto text-status-danger-text mb-4"
            />
            <h2 className="text-xl font-bold mb-2">Connection Lost</h2>
            <p className="text-text-secondary text-sm">
              Attempting to reconnect to the server...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default MainLayout
