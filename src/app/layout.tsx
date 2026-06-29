import type { Metadata, Viewport } from 'next'
import './globals.css'
import { InstallBanner } from '@/components/pwa/InstallBanner'

export const metadata: Metadata = {
  title: 'AI ტრენერი',
  description: 'პერსონალური AI ფიტნეს და კვების ასისტენტი ქართულ ენაზე',
  keywords: 'ფიტნეს, კვება, დიეტა, ვარჯიში, AI, ქართული',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AI ტრენერი',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0f1117' },
    { media: '(prefers-color-scheme: light)', color: '#22c55e' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('theme')||'dark';document.documentElement.classList.toggle('dark',t==='dark')}catch(e){document.documentElement.classList.add('dark')}`,
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        {children}
        <InstallBanner />
      </body>
    </html>
  )
}
