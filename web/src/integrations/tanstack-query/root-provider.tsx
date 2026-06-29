import { queryClient } from '@/services/queryClient'

export function getContext() {
  return {
    queryClient,
  }
}

export default function TanstackQueryProvider() {}
