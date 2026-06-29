'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Salad,
  Dumbbell,
  Calendar,
  TrendingUp,
  ChefHat,
  Bot,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'დეშბორდი', Icon: LayoutDashboard },
  { href: '/nutrition', label: 'კვება', Icon: Salad },
  { href: '/workout', label: 'ვარჯიში', Icon: Dumbbell },
  { href: '/calendar', label: 'კალენდარი', Icon: Calendar },
  { href: '/progress', label: 'პროგრესი', Icon: TrendingUp },
  { href: '/recipes', label: 'რეცეპტები', Icon: ChefHat },
  { href: '/chat', label: 'AI ჩატი', Icon: Bot },
  { href: '/profile', label: 'პროფილი', Icon: Settings },
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
          <Dumbbell size={20} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-sm">AI ტრენერი</p>
          <p className="text-xs text-[var(--muted-foreground)]">კვებისტი & ფიტნეს</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-primary-600 text-white'
                : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors mt-4"
      >
        <LogOut size={16} />
        გასვლა
      </button>
    </aside>
  )
}
