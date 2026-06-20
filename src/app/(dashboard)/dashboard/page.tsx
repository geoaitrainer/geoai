import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/mongodb/mongoose'
import { Profile } from '@/lib/mongodb/models/Profile'
import { ProgressEntry } from '@/lib/mongodb/models/ProgressEntry'
import { FoodDiary } from '@/lib/mongodb/models/FoodDiary'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GOAL_LABELS } from '@/lib/utils'
import Link from 'next/link'
import { WeightChartWrapper } from '@/components/dashboard/WeightChartWrapper'
import { TaskManagerCard } from '@/components/tasks/TaskManagerCard'
import { WaterTracker } from '@/components/dashboard/WaterTracker'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  await connectDB()
  const userId = session.user.id
  const today = new Date().toISOString().split('T')[0]

  const [profile, progress, todayDiary] = await Promise.all([
    Profile.findOne({ userId }).lean(),
    ProgressEntry.find({ userId }).sort({ date: 1 }).limit(30).select('date weight_kg').lean(),
    FoodDiary.find({ userId, date: today }).select('calories protein_g fat_g carbs_g').lean(),
  ])

  if (!profile) redirect('/profile?onboarding=true')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = profile as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const todayCalories = (todayDiary as any[]).reduce((s, e) => s + (e.calories || 0), 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const todayProtein = (todayDiary as any[]).reduce((s, e) => s + (e.protein_g || 0), 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const todayFat = (todayDiary as any[]).reduce((s, e) => s + (e.fat_g || 0), 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const todayCarbs = (todayDiary as any[]).reduce((s, e) => s + (e.carbs_g || 0), 0)
  const caloriePct = Math.min((todayCalories / (p.calorie_goal || 1)) * 100, 100)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const progressArr = progress as any[]
  const latestWeight = progressArr[progressArr.length - 1]?.weight_kg || p.weight_kg
  const weightDiff = latestWeight - p.weight_kg

  return (
    <div className="animate-fade-in">
      <TopBar
        title={`გამარჯობა, ${p.name}! 👋`}
        subtitle={`მიზანი: ${GOAL_LABELS[p.goal]}`}
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="🔥" label="BMR" value={`${p.bmr || 0}`} unit="კკალ" color="orange" />
          <StatCard icon="⚡" label="TDEE" value={`${p.tdee || 0}`} unit="კკალ" color="yellow" />
          <StatCard icon="🎯" label="მიზანი" value={`${p.calorie_goal || 0}`} unit="კკალ" color="green" />
          <StatCard icon="⚖️" label="წონა" value={`${latestWeight}`} unit="კგ" color="blue" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>დღევანდელი კვება</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[var(--muted-foreground)]">კალორია</span>
                  <span className="font-medium">{Math.round(todayCalories)} / {p.calorie_goal} კკალ</span>
                </div>
                <div className="h-3 bg-[var(--muted)] rounded-full overflow-hidden">
                  <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${caloriePct}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <MacroMini label="ცილა" current={Math.round(todayProtein)} target={p.protein_g} unit="გ" color="bg-blue-500" />
                <MacroMini label="ცხიმი" current={Math.round(todayFat)} target={p.fat_g} unit="გ" color="bg-yellow-500" />
                <MacroMini label="ნახ-ი" current={Math.round(todayCarbs)} target={p.carbs_g} unit="გ" color="bg-orange-500" />
              </div>
              <Link href="/nutrition/diary" className="mt-4 block text-center btn-primary text-sm py-2">
                ➕ კვების დამატება
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>დღიური ნორმები</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <MacroRow icon="🥩" label="ცილები" value={p.protein_g} unit="გ" variant="protein" />
              <MacroRow icon="🧈" label="ცხიმები" value={p.fat_g} unit="გ" variant="fat" />
              <MacroRow icon="🍞" label="ნახშირწყლები" value={p.carbs_g} unit="გ" variant="carbs" />
              <div className="pt-2 border-t border-[var(--border)]">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--muted-foreground)]">წყალი</span>
                  <Badge variant="success">2.5 — 3 ლიტრი/დღე</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {progressArr.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>წონის დინამიკა</CardTitle>
                {weightDiff !== 0 && (
                  <Badge variant={weightDiff < 0 ? 'success' : 'warning'}>
                    {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} კგ
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <WeightChartWrapper data={progressArr} />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction href="/nutrition" icon="🥗" label="კვების გეგმა" />
          <QuickAction href="/workout" icon="💪" label="დღის ვარჯიში" />
          <QuickAction href="/progress" icon="📸" label="პროგრესი" />
          <QuickAction href="/chat" icon="🤖" label="AI ჩატი" />
        </div>

        <WaterTracker />
        <TaskManagerCard />

        {p.is_admin && (
          <Link href="/admin" className="card p-4 flex items-center gap-3 hover:border-primary-500 transition-colors border-dashed border-2">
            <span className="text-2xl">🔑</span>
            <div>
              <p className="font-semibold text-sm">ადმინ პანელი</p>
              <p className="text-xs text-[var(--muted-foreground)]">მომხმარებლების მართვა</p>
            </div>
            <span className="ml-auto text-[var(--muted-foreground)]">→</span>
          </Link>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, unit, color }: { icon: string; label: string; value: string; unit: string; color: string }) {
  const colors: Record<string, string> = {
    orange: 'bg-orange-100 dark:bg-orange-900/20',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/20',
    green: 'bg-primary-100 dark:bg-primary-900/20',
    blue: 'bg-blue-100 dark:bg-blue-900/20',
  }
  return (
    <div className={`card p-4 ${colors[color]}`}>
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      <p className="text-xl font-bold">{value} <span className="text-sm font-normal text-[var(--muted-foreground)]">{unit}</span></p>
    </div>
  )
}

function MacroMini({ label, current, target, unit, color }: { label: string; current: number; target: number; unit: string; color: string }) {
  const pct = Math.min((current / (target || 1)) * 100, 100)
  return (
    <div className="text-center">
      <div className="text-xs text-[var(--muted-foreground)] mb-1">{label}</div>
      <div className="h-1.5 bg-[var(--muted)] rounded-full mb-1">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs font-medium">{current}/{target}{unit}</div>
    </div>
  )
}

function MacroRow({ icon, label, value, unit, variant }: { icon: string; label: string; value: number; unit: string; variant: 'protein' | 'fat' | 'carbs' }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <span>{icon}</span>
        <span className="text-[var(--muted-foreground)]">{label}</span>
      </div>
      <Badge variant={variant}>{value}{unit}</Badge>
    </div>
  )
}

function QuickAction({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} className="card p-4 flex flex-col items-center gap-2 hover:border-primary-500 transition-colors text-center">
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium text-[var(--foreground)]">{label}</span>
    </Link>
  )
}
