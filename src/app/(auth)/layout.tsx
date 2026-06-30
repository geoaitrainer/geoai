export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900/20 via-[var(--background)] to-[var(--background)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-4">
            <img src="/icon.svg" alt="AI ტრენერი" className="w-full h-full rounded-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">AI ტრენერი</h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">პერსონალური ფიტნეს ასისტენტი</p>
        </div>
        {children}
      </div>
    </div>
  )
}
