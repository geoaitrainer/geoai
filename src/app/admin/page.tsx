import { connectDB } from '@/lib/mongodb/mongoose'
import { Profile } from '@/lib/mongodb/models/Profile'
import { MealPlan } from '@/lib/mongodb/models/MealPlan'
import { WorkoutProgram } from '@/lib/mongodb/models/WorkoutProgram'
import { ChatMessage } from '@/lib/mongodb/models/ChatMessage'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

async function getStats() {
  await connectDB()
  const [totalUsers, proUsers, mealPlans, workoutPrograms, chatMessages] = await Promise.all([
    Profile.countDocuments(),
    Profile.countDocuments({ plan: { $ne: 'free' } }),
    MealPlan.countDocuments(),
    WorkoutProgram.countDocuments(),
    ChatMessage.countDocuments(),
  ])
  return { totalUsers, proUsers, mealPlans, workoutPrograms, chatMessages }
}

export default async function AdminPage() {
  const stats = await getStats()

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="სულ მომხმარებელი" value={stats.totalUsers} icon="👥" />
        <StatCard label="Pro / Premium" value={stats.proUsers} icon="⭐" />
        <StatCard label="კვების გეგმა" value={stats.mealPlans} icon="🥗" />
        <StatCard label="ვარჯიშის გეგმა" value={stats.workoutPrograms} icon="💪" />
        <StatCard label="AI შეტყობინება" value={stats.chatMessages} icon="🤖" />
      </div>

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
