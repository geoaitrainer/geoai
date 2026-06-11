'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'სახლი', icon: '🏠' },
  { href: '/nutrition', label: 'კვება', icon: '🥗' },
  { href: '/workout', label: 'ვარჯიში', icon: '💪' },
  { href: '/progress', label: 'პროგრესი', icon: '📊' },
  { href: '/chat', label: 'AI', icon: '🤖' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--card)] border-t border-[var(--border)] px-2" style={{ paddingBottom: 'env(safe-area-inset-bottom, 4px)' }}>
      <div className="flex justify-around">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors',
                active ? 'text-primary-600' : 'text-[var(--muted-foreground)]'
              )}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
