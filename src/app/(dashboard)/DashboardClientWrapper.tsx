'use client'

import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/ui/PullToRefresh'

export function DashboardClientWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  async function handleRefresh() {
    router.refresh()
    await new Promise(resolve => setTimeout(resolve, 600))
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      {children}
    </PullToRefresh>
  )
}
