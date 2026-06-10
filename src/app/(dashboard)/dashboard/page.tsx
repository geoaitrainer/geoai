import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GOAL_LABELS } from '@/lib/utils'
import Link from 'next/link'
import { WeightChartWrapper } from '@/components/dashboard/WeightChartWrapper'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/profile?onboarding=true')

  const { data: progress } = await supabase
    .from('progress_entries')
    .select('date, weight_kg')
    .eq('user_id', user.id)
    .order('date', { ascending: true })
    .limit(30)

  const { data: todayDiary } = await supabase
    .from('food_diary')
    .select('calories, protein_g, fat_g, carbs_g')
    .eq('user_id', user.id)
    .eq('date', new Date().toISOString().split('T')[0])

  const todayCalories = todayDiary?.reduce((sum, e) => sum + (e.calories || 0), 0) || 0
  const todayProtein = todayDiary?.reduce((sum, e) => sum + (e.protein_g || 0), 0) || 0
  const todayFat = todayDiary?.reduce((sum, e) => sum + (e.fat_g || 0), 0) || 0
  const todayCarbs = todayDiary?.reduce((sum, e) => sum + (e.carbs_g || 0), 0) || 0

  const caloriePct = Math.min((todayCalories / (profile.calorie_goal || 1)) * 100, 100)
  const latestWeight = progress?.[progress.length - 1]?.weight_kg || profile.weight_kg
  const startWeight = profile.weight_kg
  const weightDiff = latestWeight - startWeight

  return (
    <div className="animate-fade-in">
      <TopBar
        title={`გამარჯობა, ${profile.name}! 👋`}
        subtitle={`მიზანი: ${GOAL_LABELS[profile.goal]}`}
      />

      <div className="p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="🔥" label="BMR" value={`${profile.bmr || 0}`} unit="კკალ" color="orange" />
          <StatCard icon="⚡" label="TDEE" value={`${profile.tdee || 0}`} unit="კკალ" color="yellow" />
          <StatCard icon="🎯" label="მიზანი" value={`${profile.calorie_goal || 0}`} unit="კკალ" color="green" />
          <StatCard icon="⚖️" label="წონა" value={`${latestWeight}`} unit="კგ" color="blue" />
        </div>

        {/* Today's Progress */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>დღევანდელი კვება</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[var(--muted-foreground)]">კალორია</span>
                  <span className="font-medium">{Math.round(todayCalories)} / {profile.calorie_goal} კკალ</span>
                </div>
                <div className="h-3 bg-[var(--muted)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 rounded-full transition-all"
                    style={{ width: `${caloriePct}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <MacroMini label="ცილა" current={Math.round(todayProtein)} target={profile.protein_g} unit="გ" color="bg-blue-500" />
                <MacroMini label="ცხიმი" current={Math.round(todayFat)} target={profile.fat_g} unit="გ" color="bg-yellow-500" />
                <MacroMini label="ნახ-ი" current={Math.round(todayCarbs)} target={profile.carbs_g} unit="გ" color="bg-orange-500" />
              </div>
              <Link href="/nutrition/diary" className="mt-4 block text-center btn-primary text-sm py-2">
                ➕ კვების დამატება
              </Link>
            </CardContent>
          </Card>

          {/* Macro Targets */}
          <Card>
            <CardHeader>
              <CardTitle>დღიური ნორმები</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <MacroRow icon="🥩" label="ცილები" value={profile.protein_g} unit="გ" variant="protein" />
              <MacroRow icon="🧈" label="ცხიმები" value={profile.fat_g} unit="გ" variant="fat" />
              <MacroRow icon="🍞" label="ნახშირწყლები" value={profile.carbs_g} unit="გ" variant="carbs" />
              <div className="pt-2 border-t border-[var(--border)]">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--muted-foreground)]">წყალი</span>
                  <Badge variant="success">2.5 — 3 ლიტრი/დღე</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weight Chart */}
        {progress && progress.length > 0 && (
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
              <WeightChartWrapper data={progress} />
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction href="/nutrition" icon="🥗" label="კვების გეგმა" />
          <QuickAction href="/workout" icon="💪" label="დღის ვარჯიში" />
          <QuickAction href="/progress" icon="📸" label="პროგრესი" />
          <QuickAction href="/chat" icon="🤖" label="AI ჩატი" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, unit, color }: {
  icon: string; label: string; value: string; unit: string; color: string
}) {
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

function MacroMini({ label, current, target, unit, color }: {
  label: string; current: number; target: number; unit: string; color: string
}) {
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

function MacroRow({ icon, label, value, unit, variant }: {
  icon: string; label: string; value: number; unit: string; variant: 'protein' | 'fat' | 'carbs'
}) {
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
