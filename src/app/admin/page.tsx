import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

async function getStats() {
  const supabase = await createClient()
  const [
    { count: totalUsers },
    { count: proUsers },
    { count: mealPlans },
    { count: workoutPrograms },
    { count: chatMessages },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('plan', 'free'),
    supabase.from('meal_plans').select('*', { count: 'exact', head: true }),
    supabase.from('workout_programs').select('*', { count: 'exact', head: true }),
    supabase.from('chat_messages').select('*', { count: 'exact', head: true }),
  ])
  return { totalUsers, proUsers, mealPlans, workoutPrograms, chatMessages }
}

export default async function AdminPage() {
  const stats = await getStats()

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="სულ მომხმარებელი" value={stats.totalUsers || 0} icon="👥" />
        <StatCard label="Pro / Premium" value={stats.proUsers || 0} icon="⭐" />
        <StatCard label="კვების გეგმა" value={stats.mealPlans || 0} icon="🥗" />
        <StatCard label="ვარჯიშის გეგმა" value={stats.workoutPrograms || 0} icon="💪" />
        <StatCard label="AI შეტყობინება" value={stats.chatMessages || 0} icon="🤖" />
      </div>

      {/* Nav */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/admin/users">
          <Card className="hover:border-primary-500 transition-colors cursor-pointer">
            <CardContent className="pt-6 flex items-center gap-4">
              <span className="text-4xl">👥</span>
              <div>
                <h3 className="font-semibold">მომხმარებლების მართვა</h3>
                <p className="text-sm text-[var(--muted-foreground)]">სია, გამოწერები, ადმინ უფლებები</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="card p-4">
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-xs text-[var(--muted-foreground)] mb-1">{label}</p>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
    </div>
  )
}
