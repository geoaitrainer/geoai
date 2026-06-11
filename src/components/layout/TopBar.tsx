import { ThemeToggle } from './ThemeToggle'
import Link from 'next/link'

interface TopBarProps {
  title: string
  subtitle?: string
}

export function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-[var(--border)] bg-[var(--card)]">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {subtitle && <p className="text-xs text-[var(--muted-foreground)]">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Link href="/profile" className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium hover:bg-primary-700 transition-colors">
          P
        </Link>
      </div>
    </header>
  )
}
