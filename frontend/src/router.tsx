import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router';
import App from './App';
import { CampaignDashboard } from './components/CampaignDashboard';
import { CampaignView } from './components/CampaignView';
import Settings from './components/Settings';
import { Docs } from './components/Docs';

export const rootRoute = createRootRoute({
  component: App,
});

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/campaigns' });
  },
});

export const campaignsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/campaigns',
  component: CampaignDashboard,
  validateSearch: (search: Record<string, unknown>): { new?: boolean } => {
    return { new: Boolean(search.new) };
  },
});

export const campaignDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/campaigns/$campaignId',
  component: CampaignView,
});

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: Settings,
});

export const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/docs',
  component: Docs,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  campaignsRoute,
  campaignDetailRoute,
  settingsRoute,
  docsRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

