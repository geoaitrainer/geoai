import Link from 'next/link'

const FEATURES = [
  { icon: '🥗', title: 'AI კვების გეგმა', desc: '7 და 30 დღიანი პერსონალური რაციონი ქართული კერძებით. BMR/TDEE-ზე დაფუძნებული კალორიების გეგმა.' },
  { icon: '💪', title: 'AI ვარჯიშის პროგრამა', desc: 'დარბაზის და სახლის პროგრამები. დამწყებიდან პროფესიონალამდე. სეტები, გამეორებები, დასვენება.' },
  { icon: '🤖', title: 'AI ჩატი', desc: 'პირადი ტრენერი ყოველთვის ქართულ ენაზე გვპასუხობს. კვება, ვარჯიში, პროგრესი — ყველა კითხვაზე.' },
  { icon: '📊', title: 'პროგრესის კონტროლი', desc: 'წონის, ზომების ფიქსაცია. AI ყოველ კვირას შეაფასებს პროგრესს და მოგცემს რეკომენდაციებს.' },
  { icon: '📅', title: 'კვების დღიური', desc: 'საკვების ჩაწერა და კალორიების, ცილების, ცხიმების, ნახშირწყლების ავტომატური გამოთვლა.' },
  { icon: '🇬🇪', title: 'ქართული ენა', desc: 'მთელი სისტემა ქართულ ენაზე. AI-ც ქართულ კერძებს გთავაზობს და ქართულ ენაზე პასუხობს.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
            <span className="text-white text-lg">⚡</span>
          </div>
          <span className="font-bold text-lg">AI ტრენერი</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="btn-secondary text-sm">შესვლა</Link>
          <Link href="/register" className="btn-primary text-sm">უფასოდ დაწყება</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm mb-8">
          <span>✨</span>
          <span>ქართული AI ფიტნეს ასისტენტი</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          AI <span className="text-primary-600">პირადი ტრენერი</span><br />
          და კვების სპეციალისტი
        </h1>

        <p className="text-xl text-[var(--muted-foreground)] mb-10 max-w-2xl mx-auto">
          პერსონალური კვების რაციონი, სავარჯიშო გეგმა და AI მწვრთნელი — ყველაფერი ქართულ ენაზე.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="btn-primary text-lg px-8 py-4">
            უფასოდ დაწყება →
          </Link>
          <Link href="/login" className="btn-secondary text-lg px-8 py-4">
            შესვლა
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-center mb-12">რას გაძლევთ</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="card p-6 hover:border-primary-500 transition-colors">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-[var(--muted-foreground)] text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-primary-600 text-white py-16 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">დაიწყე დღესვე</h2>
        <p className="text-primary-100 mb-8">რეგისტრაცია 2 წუთში. არანაირი ბარათი არ სჭირდება.</p>
        <Link href="/register" className="inline-block bg-white text-primary-600 font-bold px-8 py-4 rounded-xl hover:bg-primary-50 transition-colors">
          უფასოდ შექმენი ანგარიში →
        </Link>
      </div>

      <footer className="text-center py-8 text-[var(--muted-foreground)] text-sm border-t border-[var(--border)]">
        © 2026 შექმნილია გიორგი ქავთარაძის მიერ
      </footer>
    </div>
  )
}
