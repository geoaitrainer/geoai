import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/mongodb/mongoose'
import { Profile } from '@/lib/mongodb/models/Profile'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  await connectDB()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = await Profile.findOne({ userId: session.user.id }).lean() as any
  if (!profile?.is_admin) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/dashboard" className="btn-secondary text-sm">← დეშბორდი</a>
          <h1 className="text-2xl font-bold">⚙️ ადმინისტრატორის პანელი</h1>
        </div>
        {children}
      </div>
    </div>
  )
}
