import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI პირადი ტრენერი და კვების სპეციალისტი',
  description: 'პერსონალური AI ფიტნეს და კვების ასისტენტი ქართულ ენაზე',
  keywords: 'ფიტნეს, კვება, დიეტა, ვარჯიში, AI, ქართული',
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
      </body>
    </html>
  )
}
