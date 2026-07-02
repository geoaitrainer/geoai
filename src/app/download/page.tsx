import QRCode from 'qrcode'
import Image from 'next/image'

export const metadata = {
  title: 'აპლიკაციის დაყენება — AI ტრენერი',
  description: 'დააყენე AI ტრენერი შენს ტელეფონზე',
}

// Public page (not in the protected-paths list) — anyone can reach it to install.
export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://geotraener.vercel.app'

export default async function DownloadPage() {
  const qrSvg = await QRCode.toString(APP_URL, {
    type: 'svg',
    margin: 1,
    color: { dark: '#0f1117', light: '#ffffff' },
  })

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] px-4 py-10">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl overflow-hidden shadow-lg">
            <Image src="/icon-192.png" alt="AI ტრენერი" width={80} height={80} priority />
          </div>
          <h1 className="text-2xl font-bold">AI ტრენერი</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            დააყენე აპლიკაცია — Play Store არ არის საჭირო
          </p>
        </div>

        {/* QR */}
        <div className="card p-6 text-center">
          <p className="text-sm font-semibold mb-3">📱 გახსენი ტელეფონზე</p>
          <div
            className="w-44 h-44 mx-auto bg-white rounded-xl p-2"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <p className="text-xs text-[var(--muted-foreground)] mt-3">
            დაასკანერე კამერით ან გახსენი{' '}
            <span className="font-medium text-[var(--foreground)]">{APP_URL.replace(/^https?:\/\//, '')}</span>
          </p>
        </div>

        {/* Method A — PWA install */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold bg-primary-600 text-white px-2 py-0.5 rounded">უფასო</span>
            <h2 className="font-semibold">ვარიანტი 1 — მთავარ ეკრანზე დამატება</h2>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            ყველაზე მარტივი. აპლიკაცია სრულ ეკრანზე, აიქონით — ჩვეულებრივი app-ივით.
          </p>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--muted)] flex items-center justify-center text-xs font-bold">🤖</span>
              <div>
                <p className="font-medium">Android (Chrome)</p>
                <p className="text-[var(--muted-foreground)] text-xs">მენიუ ⋮ → &ldquo;Add to Home screen&rdquo; / &ldquo;აპლიკაციის დაყენება&rdquo;</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--muted)] flex items-center justify-center text-xs font-bold"></span>
              <div>
                <p className="font-medium">iPhone (Safari)</p>
                <p className="text-[var(--muted-foreground)] text-xs">გაზიარება ⬆️ → &ldquo;Add to Home Screen&rdquo;</p>
              </div>
            </div>
          </div>
        </div>

        {/* Method B — APK */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold bg-primary-600 text-white px-2 py-0.5 rounded">უფასო</span>
            <h2 className="font-semibold">ვარიანტი 2 — APK ფაილი</h2>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Android-ისთვის. ჩამოტვირთე და დააინსტალირე პირდაპირ.
          </p>
          <a
            href="/app.apk"
            className="block w-full text-center btn-primary py-3 rounded-xl font-semibold"
          >
            ⬇️ APK ჩამოტვირთვა
          </a>
          <p className="text-[10px] text-[var(--muted-foreground)] mt-2 text-center">
            დაინსტალირებისას ჩართე &ldquo;უცნობი წყაროები&rdquo; (Install from unknown sources)
          </p>
        </div>

        <a href="/dashboard" className="block text-center text-sm text-primary-600 dark:text-primary-400">
          ← აპლიკაციაში დაბრუნება
        </a>
      </div>
    </div>
  )
}
