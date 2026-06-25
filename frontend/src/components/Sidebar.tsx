import React, { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Home, Settings, Wifi, WifiOff, Loader, BookOpen, PanelLeftClose, PanelLeft } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { Campaign } from "../types";
import { apiService } from "../services/apiService";

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const connectionStatus = useAppStore((state) => state.connectionStatus);
  const routerState = useRouterState();

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: () => apiService.request("get_campaigns", null, "initial_data").then(d => d.campaigns)
  });

  const recentCampaigns = campaigns.slice(0, 5);

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-surface-header border-r border-borders-primary flex flex-col h-full flex-shrink-0 z-20 transition-all duration-300 ease-in-out`}>
      <div className="flex items-center justify-between p-4 border-b border-borders-primary flex-shrink-0">
        <Link to="/" className={`flex items-center gap-3 transition-opacity overflow-hidden ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'}`}>
          <img src="https://ioit.acm.org/static/img/assets/acm.png" alt="ACM Logo" className="h-8 w-8 flex-shrink-0" />
          <h1 className="text-heading-3 font-bold text-text-primary tracking-tight whitespace-nowrap">bit-by-mail</h1>
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-element rounded-lg transition-colors flex-shrink-0 mx-auto"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <div className="p-4 flex-shrink-0 flex justify-center">
        <Link to="/campaigns" search={{ new: true }} className="w-full">
          <button className={`w-full flex items-center justify-center gap-2 h-10 rounded-button text-sm font-medium transition-colors duration-200 bg-accent-blue hover:bg-accent-blue/80 text-white ${isCollapsed ? 'px-0' : 'px-4'}`} title="New Campaign">
            <Plus size={18} />
            {!isCollapsed && <span>New Campaign</span>}
          </button>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-6 custom-scrollbar mt-2">
        <div className="space-y-2">
          <Link
            to="/campaigns"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              routerState.location.pathname === '/campaigns' || routerState.location.pathname === '/'
                ? 'bg-accent-blue/10 text-accent-blue'
                : 'text-text-secondary hover:bg-surface-element hover:text-text-primary'
            } ${isCollapsed ? 'justify-center' : ''}`}
            title="Dashboard"
          >
            <Home size={20} />
            {!isCollapsed && <span>Dashboard</span>}
          </Link>
          <Link
            to="/docs"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              routerState.location.pathname === '/docs'
                ? 'bg-accent-blue/10 text-accent-blue'
                : 'text-text-secondary hover:bg-surface-element hover:text-text-primary'
            } ${isCollapsed ? 'justify-center' : ''}`}
            title="Documentation"
          >
            <BookOpen size={20} />
            {!isCollapsed && <span>Documentation</span>}
          </Link>
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              routerState.location.pathname === '/settings'
                ? 'bg-accent-blue/10 text-accent-blue'
                : 'text-text-secondary hover:bg-surface-element hover:text-text-primary'
            } ${isCollapsed ? 'justify-center' : ''}`}
            title="Global Settings"
          >
            <Settings size={20} />
            {!isCollapsed && <span>Global Settings</span>}
          </Link>
        </div>

        {!isCollapsed && recentCampaigns.length > 0 && (
          <div className="pt-2 border-t border-borders-primary/50">
            <h3 className="px-3 mb-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
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
      </nav>

      <div className={`p-4 border-t border-borders-primary flex-shrink-0 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-2 text-sm text-text-secondary" title={connectionStatus === 'open' ? 'Connected' : connectionStatus === 'closed' ? 'Disconnected' : 'Connecting'}>
          {connectionStatus === 'open' && <Wifi size={18} className="text-status-success-text" />}
          {connectionStatus === 'closed' && <WifiOff size={18} className="text-status-danger-text" />}
          {connectionStatus === 'connecting' && <Loader size={18} className="animate-spin text-text-tertiary" />}
          {!isCollapsed && <span>{connectionStatus === 'open' ? 'Connected' : connectionStatus === 'closed' ? 'Disconnected' : 'Connecting'}</span>}
        </div>
        {!isCollapsed && <span className="text-xs text-text-tertiary font-mono">v1.1.0</span>}
      </div>
    </div>
  );
};

