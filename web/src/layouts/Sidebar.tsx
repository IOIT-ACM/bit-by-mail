import React, { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Plus,
  Home,
  Settings,
  Wifi,
  WifiOff,
  Loader,
  BookOpen,
  PanelLeftClose,
  PanelLeft,
  Database,
  LayoutTemplate,
  Image as ImageIcon,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import type {
  Campaign,
  Database as DatabaseType,
  EmailTemplate,
  Asset,
} from '@/types'
import { apiService } from '@/services/apiService'

declare const __APP_VERSION__: string

export const Sidebar: React.FC = () => {
  const isCollapsed = useAppStore((state) => state.isSidebarCollapsed)
  const setIsCollapsed = useAppStore((state) => state.setIsSidebarCollapsed)
  const connectionStatus = useAppStore((state) => state.connectionStatus)
  const routerState = useRouterState()

  const [isHovered, setIsHovered] = useState(false)
  const isVisuallyExpanded = !isCollapsed || isHovered

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: () =>
      apiService
        .request('get_campaigns', null, 'initial_data')
        .then((d) => d.campaigns),
  })

  const { data: databases = [] } = useQuery<DatabaseType[]>({
    queryKey: ['databases'],
  })

  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ['templates'],
  })

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ['assets'],
  })

  const recentCampaigns = campaigns.slice(0, 5)
  const recentDatabases = databases.slice(0, 3)
  const recentTemplates = templates.slice(0, 3)

  return (
    <div
      className={`${isCollapsed ? 'w-20' : 'w-64'} flex-shrink-0  ease-in-out relative z-30`}
    >
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`${isVisuallyExpanded ? 'w-64' : 'w-20'} ${
          isCollapsed && isHovered ? 'shadow-2xl' : ''
        } absolute top-0 left-0 h-full bg-surface-header border-r border-borders-primary flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b border-borders-primary flex-shrink-0 w-full">
          <Link
            to="/"
            className={`flex items-center gap-3 transition-opacity overflow-hidden ${
              !isVisuallyExpanded
                ? 'opacity-0 w-0 hidden'
                : 'opacity-100 w-auto'
            }`}
          >
            <img
              src="https://ioit.acm.org/static/img/assets/acm.png"
              alt="ACM Logo"
              className="h-8 w-8 flex-shrink-0"
            />
            <h1 className="text-heading-3 font-bold text-text-primary tracking-tight whitespace-nowrap">
              bit-by-mail
            </h1>
          </Link>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`${
              !isVisuallyExpanded && 'mx-auto'
            } py-2 text-text-secondary hover:text-text-primary hover:bg-surface-element rounded-lg transition-colors flex-shrink-0`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isVisuallyExpanded ? (
              <PanelLeftClose size={20} />
            ) : (
              <PanelLeft size={20} />
            )}
          </button>
        </div>

        <div className="p-4 flex-shrink-0 flex justify-center">
          <Link to="/campaigns/new" className="w-full">
            <button
              className={`w-full flex items-center justify-center gap-2 h-10 rounded-button text-sm font-medium transition-colors duration-200 bg-accent-blue hover:bg-accent-blue/80 text-white ${
                !isVisuallyExpanded ? 'px-0' : 'px-4'
              }`}
              title="New Campaign"
            >
              <Plus size={18} />
              {isVisuallyExpanded && <span>New Campaign</span>}
            </button>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 space-y-6 custom-scrollbar mt-2">
          <div className="space-y-2">
            <Link
              to="/campaigns"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                routerState.location.pathname === '/campaigns' ||
                routerState.location.pathname === '/'
                  ? 'bg-accent-blue/10 text-accent-blue border-l-4 border-accent-blue'
                  : 'text-text-secondary hover:bg-surface-element hover:text-text-primary border-l-4 border-transparent'
              } ${!isVisuallyExpanded ? 'justify-center' : ''}`}
              title="Campaigns"
            >
              <Home size={20} />
              {isVisuallyExpanded && (
                <span>Campaigns ({campaigns.length})</span>
              )}
            </Link>
            <Link
              to="/databases"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                routerState.location.pathname.startsWith('/databases')
                  ? 'bg-accent-blue/10 text-accent-blue border-l-4 border-accent-blue'
                  : 'text-text-secondary hover:bg-surface-element hover:text-text-primary border-l-4 border-transparent'
              } ${!isVisuallyExpanded ? 'justify-center' : ''}`}
              title="Databases"
            >
              <Database size={20} />
              {isVisuallyExpanded && (
                <span>Databases ({databases.length})</span>
              )}
            </Link>
            <Link
              to="/templates"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                routerState.location.pathname.startsWith('/templates')
                  ? 'bg-accent-blue/10 text-accent-blue border-l-4 border-accent-blue'
                  : 'text-text-secondary hover:bg-surface-element hover:text-text-primary border-l-4 border-transparent'
              } ${!isVisuallyExpanded ? 'justify-center' : ''}`}
              title="Templates"
            >
              <LayoutTemplate size={20} />
              {isVisuallyExpanded && (
                <span>Templates ({templates.length})</span>
              )}
            </Link>
            <Link
              to="/assets"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                routerState.location.pathname.startsWith('/assets')
                  ? 'bg-accent-blue/10 text-accent-blue border-l-4 border-accent-blue'
                  : 'text-text-secondary hover:bg-surface-element hover:text-text-primary border-l-4 border-transparent'
              } ${!isVisuallyExpanded ? 'justify-center' : ''}`}
              title="Image Library"
            >
              <ImageIcon size={20} />
              {isVisuallyExpanded && (
                <span>Image Library ({assets.length})</span>
              )}
            </Link>
            <Link
              to="/docs"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                routerState.location.pathname === '/docs'
                  ? 'bg-accent-blue/10 text-accent-blue border-l-4 border-accent-blue'
                  : 'text-text-secondary hover:bg-surface-element hover:text-text-primary border-l-4 border-transparent'
              } ${!isVisuallyExpanded ? 'justify-center' : ''}`}
              title="Documentation"
            >
              <BookOpen size={20} />
              {isVisuallyExpanded && <span>Documentation</span>}
            </Link>
          </div>

          {isVisuallyExpanded && recentCampaigns.length > 0 && (
            <div className="pt-2 border-t border-borders-primary/50">
              <h3 className="px-3 my-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Recent Campaigns
              </h3>
              <div className="space-y-1">
                {recentCampaigns.map((c) => (
                  <Link
                    key={c.id}
                    to="/campaigns/$campaignId"
                    params={{ campaignId: c.id }}
                    className={`block px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                      routerState.location.pathname === `/campaigns/${c.id}`
                        ? 'bg-surface-element-hover text-text-primary font-medium'
                        : 'text-text-secondary hover:bg-surface-element hover:text-text-primary'
                    }`}
                    title={c.name}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {isVisuallyExpanded && recentDatabases.length > 0 && (
            <div className="pt-2 border-t border-borders-primary/50">
              <h3 className="px-3 my-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Recent Databases
              </h3>
              <div className="space-y-1">
                {recentDatabases.map((db) => (
                  <Link
                    key={db.id}
                    to="/databases/$databaseId"
                    params={{ databaseId: db.id }}
                    className={`block px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                      routerState.location.pathname === `/databases/${db.id}`
                        ? 'bg-surface-element-hover text-text-primary font-medium'
                        : 'text-text-secondary hover:bg-surface-element hover:text-text-primary'
                    }`}
                    title={db.name}
                  >
                    {db.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {isVisuallyExpanded && recentTemplates.length > 0 && (
            <div className="pt-2 border-t border-borders-primary/50">
              <h3 className="px-3 my-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Recent Templates
              </h3>
              <div className="space-y-1">
                {recentTemplates.map((t) => (
                  <Link
                    key={t.id}
                    to="/templates/$templateId"
                    params={{ templateId: t.id }}
                    className={`block px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                      routerState.location.pathname === `/templates/${t.id}`
                        ? 'bg-surface-element-hover text-text-primary font-medium'
                        : 'text-text-secondary hover:bg-surface-element hover:text-text-primary'
                    }`}
                    title={t.name}
                  >
                    {t.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        <Link
          to="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 mx-3 mb-2 rounded-lg text-sm font-medium transition-colors ${
            routerState.location.pathname === '/settings'
              ? 'bg-accent-blue/10 text-accent-blue border-l-4 border-accent-blue'
              : 'text-text-secondary hover:bg-surface-element hover:text-text-primary border-l-4 border-transparent'
          } ${!isVisuallyExpanded ? 'justify-center' : ''}`}
          title="Settings"
        >
          <Settings size={20} />
          {isVisuallyExpanded && <span>Settings</span>}
        </Link>

        <div
          className={`p-4 border-t border-borders-primary flex-shrink-0 flex items-center ${
            !isVisuallyExpanded ? 'justify-center' : 'justify-between'
          }`}
        >
          <div
            className="flex items-center gap-2 text-sm text-text-secondary"
            title={
              connectionStatus === 'open'
                ? 'Connected'
                : connectionStatus === 'closed'
                  ? 'Disconnected'
                  : 'Connecting'
            }
          >
            {connectionStatus === 'open' && (
              <Wifi size={18} className="text-status-success-text" />
            )}
            {connectionStatus === 'closed' && (
              <WifiOff size={18} className="text-status-danger-text" />
            )}
            {connectionStatus === 'connecting' && (
              <Loader size={18} className="animate-spin text-text-tertiary" />
            )}
            {isVisuallyExpanded && (
              <span>
                {connectionStatus === 'open'
                  ? 'Connected'
                  : connectionStatus === 'closed'
                    ? 'Disconnected'
                    : 'Connecting'}
              </span>
            )}
          </div>
          {isVisuallyExpanded && (
            <span className="text-xs text-text-tertiary font-mono">
              v{__APP_VERSION__}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
