'use client'

import { ReactNode } from 'react'
import { MobileNav } from '@/components/layout/MobileNav'
import { Sidebar } from '@/components/layout/Sidebar'

export function PhoneFrameLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Desktop: sidebar + scrollable content area */}
      <div className="hidden md:flex min-h-screen bg-[var(--background)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto min-h-screen">
          {children}
        </main>
      </div>

      {/* Mobile: full-screen with bottom nav */}
      <div className="md:hidden flex flex-col min-h-screen bg-[var(--background)]">
        <main className="flex-1 pb-16">
          {children}
        </main>
        <MobileNav />
      </div>
    </>
  )
}
