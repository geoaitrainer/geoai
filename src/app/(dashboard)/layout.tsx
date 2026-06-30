import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { DashboardClientWrapper } from '@/app/(dashboard)/DashboardClientWrapper'
import { PageTransition } from '@/components/layout/PageTransition'
import { PhoneFrameLayout } from '@/components/layout/PhoneFrameLayout'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <PhoneFrameLayout>
      <DashboardClientWrapper>
        <PageTransition>
          {children}
        </PageTransition>
      </DashboardClientWrapper>
    </PhoneFrameLayout>
  )
}
