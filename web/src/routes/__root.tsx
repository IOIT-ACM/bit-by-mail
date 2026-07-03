import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import MainLayout from '@/layouts/MainLayout'
import { Toaster } from 'sonner'
import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootDocument,
})

function RootDocument() {
  return (
    <>
      <MainLayout>
        <Outlet />
      </MainLayout>
      <Toaster position="bottom-right" theme="dark" richColors closeButton />
    </>
  )
}
