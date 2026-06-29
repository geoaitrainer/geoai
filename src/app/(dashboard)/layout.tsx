import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { DashboardClientWrapper } from '@/app/(dashboard)/DashboardClientWrapper'
import { PageTransition } from '@/components/layout/PageTransition'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0 overflow-x-hidden">
        <DashboardClientWrapper>
          <PageTransition>
            {children}
          </PageTransition>
        </DashboardClientWrapper>
      </main>
      <MobileNav />
    </div>
  )
}
