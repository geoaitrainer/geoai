'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'სახლი', icon: '🏠' },
  { href: '/nutrition', label: 'კვება', icon: '🥗' },
  { href: '/calendar', label: 'კალენდარი', icon: '📅' },
  { href: '/workout', label: 'ვარჯიში', icon: '💪' },
  { href: '/recipes', label: 'რეცეპტი', icon: '👨‍🍳' },
  { href: '/chat', label: 'AI', icon: '🤖' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)]"
      style={{
        background: 'color-mix(in srgb, var(--card) 90%, transparent)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex justify-around items-end h-14">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0 w-full h-full relative"
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-0.5 bg-primary-500 rounded-b-full" />
              )}
              <span
                className={cn(
                  'text-lg leading-none transition-all duration-200',
                  active ? 'scale-110' : 'scale-100 opacity-55'
                )}
              >
                {item.icon}
              </span>
              <span
                className={cn(
                  'text-[9px] font-medium mt-0.5 leading-none transition-colors',
                  active ? 'text-primary-500' : 'text-[var(--muted-foreground)]'
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
