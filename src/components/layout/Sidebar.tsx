'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'დეშბორდი', icon: '🏠' },
  { href: '/nutrition', label: 'კვება', icon: '🥗' },
  { href: '/workout', label: 'ვარჯიში', icon: '💪' },
  { href: '/progress', label: 'პროგრესი', icon: '📊' },
  { href: '/chat', label: 'AI ჩატი', icon: '🤖' },
  { href: '/profile', label: 'პროფილი', icon: '⚙️' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await signOut({ redirect: false })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen border-r border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
          <span className="text-white text-lg">⚡</span>
        </div>
        <div>
          <p className="font-bold text-sm">AI ტრენერი</p>
          <p className="text-xs text-[var(--muted-foreground)]">კვებისტი & ფიტნეს</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-primary-600 text-white'
                : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
            )}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors mt-4"
      >
        <span className="text-base">🚪</span>
        გასვლა
      </button>
    </aside>
  )
}
