'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface StatsData {
  totalUsers: number
  proUsers: number
  mealPlans: number
  workoutPrograms: number
  diaryEntries: number
  chatMessages: number
  registrationTrend: { date: string; count: number }[]
  chatTrend: { date: string; count: number }[]
  planDist: { _id: string; count: number }[]
}

const PLAN_COLORS: Record<string, string> = {
  free: '#94a3b8',
  pro: '#22c55e',
  premium: '#f59e0b',
}

export function AnalyticsCharts() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-8 text-[var(--muted-foreground)]">📊 იტვირთება...</div>
  if (!stats) return null

  const fmt = (d: string) => {
    const dt = new Date(d)
    return `${dt.getDate()}/${dt.getMonth() + 1}`
  }

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'სულ მომხმარებელი', value: stats.totalUsers, icon: '👥' },
          { label: 'Pro / Premium', value: stats.proUsers, icon: '⭐' },
          { label: 'კვების გეგმა', value: stats.mealPlans, icon: '🥗' },
          { label: 'ვარჯიშის გეგმა', value: stats.workoutPrograms, icon: '💪' },
          { label: 'დღიური ჩანაწერი', value: stats.diaryEntries, icon: '📋' },
          { label: 'AI შეტყობინება', value: stats.chatMessages, icon: '🤖' },
        ].map(kpi => (
          <div key={kpi.label} className="card p-4">
            <p className="text-2xl mb-1">{kpi.icon}</p>
            <p className="text-xs text-[var(--muted-foreground)] mb-1">{kpi.label}</p>
            <p className="text-2xl font-bold">{kpi.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Registration trend */}
        <Card>
          <CardHeader><CardTitle className="text-base">📈 რეგისტრაცია (14 დღე)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.registrationTrend}>
                <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={25} />
                <Tooltip labelFormatter={(d) => fmt(String(d))} />
                <Bar dataKey="count" fill="#22c55e" radius={[3, 3, 0, 0]} name="მომხმარებელი" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chat trend */}
        <Card>
          <CardHeader><CardTitle className="text-base">💬 AI ჩატი (14 დღე)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={stats.chatTrend}>
                <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={25} />
                <Tooltip labelFormatter={(d) => fmt(String(d))} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} name="შეტყობინება" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Plan distribution */}
      {stats.planDist?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">🎯 გამოწერების განაწილება</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <PieChart width={140} height={140}>
                <Pie data={stats.planDist} dataKey="count" nameKey="_id" cx={70} cy={70} outerRadius={60}>
                  {stats.planDist.map((entry, i) => (
                    <Cell key={i} fill={PLAN_COLORS[entry._id] || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
              </PieChart>
              <div className="space-y-2">
                {stats.planDist.map(p => (
                  <div key={p._id} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: PLAN_COLORS[p._id] || '#6366f1' }} />
                    <span className="capitalize">{p._id}</span>
                    <span className="font-bold ml-2">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
