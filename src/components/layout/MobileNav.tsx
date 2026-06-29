'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Salad, Dumbbell, TrendingUp, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'სახლი', Icon: Home },
  { href: '/nutrition', label: 'კვება', Icon: Salad },
  { href: '/workout', label: 'ვარჯიში', Icon: Dumbbell },
  { href: '/progress', label: 'პროგრესი', Icon: TrendingUp },
  { href: '/chat', label: 'AI', Icon: Bot },
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
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0 w-full h-full relative"
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-0.5 bg-primary-500 rounded-b-full" />
              )}
              <Icon
                size={20}
                className={cn(
                  'transition-all duration-200',
                  active ? 'text-primary-500 scale-110' : 'text-[var(--muted-foreground)] scale-100 opacity-55'
                )}
              />
              <span
                className={cn(
                  'text-[9px] font-medium mt-0.5 leading-none transition-colors',
                  active ? 'text-primary-500' : 'text-[var(--muted-foreground)]'
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
