'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Salad, Dumbbell, TrendingUp, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const navItems = [
  { href: '/dashboard', label: 'სახლი', Icon: Home },
  { href: '/nutrition', label: 'კვება', Icon: Salad },
  { href: '/workout', label: 'ვარჯიში', Icon: Dumbbell },
  { href: '/progress', label: 'პროგრესი', Icon: TrendingUp },
  { href: '/chat', label: 'AI', Icon: Bot },
]

interface MobileNavProps {
  insideFrame?: boolean
}

export function MobileNav({ insideFrame = false }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'z-50',
        !insideFrame && 'fixed bottom-0 left-0 right-0',
        insideFrame && 'relative',
      )}
      style={{
        background: insideFrame
          ? 'color-mix(in srgb, var(--card) 80%, transparent)'
          : 'color-mix(in srgb, var(--card) 88%, transparent)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderTop: '0.5px solid rgba(255,255,255,0.07)',
        paddingBottom: insideFrame ? 0 : 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex justify-around items-center px-1" style={{ height: 60 }}>
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center justify-center gap-[3px] flex-1 h-full py-2 rounded-xl"
            >
              {/* Sliding active pill */}
              {active && (
                <motion.div
                  layoutId="nav-active-pill"
                  className="absolute inset-x-1 inset-y-1 rounded-xl"
                  style={{ background: 'rgba(200,250,95,0.11)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}

              {/* Icon */}
              <motion.div
                animate={{
                  scale: active ? 1.08 : 1,
                  y: active ? -1 : 0,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="relative z-10"
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.2 : 1.8}
                  className={cn(
                    'transition-colors duration-150',
                    active ? 'text-[#C8FA5F]' : 'text-[var(--muted-foreground)] opacity-60'
                  )}
                />
              </motion.div>

              {/* Label */}
              <motion.span
                animate={{ opacity: active ? 1 : 0.5 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'relative z-10 leading-none font-medium',
                  active ? 'text-[#C8FA5F]' : 'text-[var(--muted-foreground)]'
                )}
                style={{ fontSize: 9 }}
              >
                {label}
              </motion.span>

              {/* Active dot */}
              {active && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute bottom-[6px] rounded-full"
                  style={{ width: 3, height: 3, background: '#C8FA5F' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
