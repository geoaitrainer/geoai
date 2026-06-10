'use client'

import { useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { ProgressEntry } from '@/types/progress'
import { WeightChartWrapper } from '@/components/dashboard/WeightChartWrapper'

export default function ProgressPage() {
  const [entries, setEntries] = useState<ProgressEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight_kg: '',
    waist_cm: '',
    chest_cm: '',
    biceps_cm: '',
  })

  useEffect(() => { loadEntries() }, [])

  async function loadEntries() {
    setLoading(true)
    const res = await fetch('/api/progress')
    const data = await res.json()
    setEntries(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload: Record<string, string | number> = { date: form.date }
    if (form.weight_kg) payload.weight_kg = parseFloat(form.weight_kg)
    if (form.waist_cm) payload.waist_cm = parseFloat(form.waist_cm)
    if (form.chest_cm) payload.chest_cm = parseFloat(form.chest_cm)
    if (form.biceps_cm) payload.biceps_cm = parseFloat(form.biceps_cm)

    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    setShowForm(false)
    setForm({ date: new Date().toISOString().split('T')[0], weight_kg: '', waist_cm: '', chest_cm: '', biceps_cm: '' })
    await loadEntries()
  }

  const chartData = [...entries].reverse()
  const latest = entries[0]
  const previous = entries[1]

  return (
    <div className="animate-fade-in">
      <TopBar title="პროგრესის კონტროლი" subtitle="ყოველკვირეული AI შეფასება" />

      <div className="p-6 space-y-6">
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ გაუქმება' : '➕ გაზომვის დამატება'}
        </Button>

        {showForm && (
          <Card className="animate-slide-up">
            <CardHeader><CardTitle>ახალი გაზომვა</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <Input label="თარიღი" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="წონა (კგ)" type="number" step="0.1" placeholder="70.5" value={form.weight_kg} onChange={e => setForm(p => ({ ...p, weight_kg: e.target.value }))} />
                  <Input label="წელი (სმ)" type="number" step="0.1" placeholder="80" value={form.waist_cm} onChange={e => setForm(p => ({ ...p, waist_cm: e.target.value }))} />
                  <Input label="მკერდი (სმ)" type="number" step="0.1" placeholder="95" value={form.chest_cm} onChange={e => setForm(p => ({ ...p, chest_cm: e.target.value }))} />
                  <Input label="ბიცეფსი (სმ)" type="number" step="0.1" placeholder="35" value={form.biceps_cm} onChange={e => setForm(p => ({ ...p, biceps_cm: e.target.value }))} />
                </div>
                <Button type="submit" loading={saving}>შენახვა</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {latest && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'წონა', current: latest.weight_kg, prev: previous?.weight_kg, unit: 'კგ', icon: '⚖️' },
              { label: 'წელი', current: latest.waist_cm, prev: previous?.waist_cm, unit: 'სმ', icon: '📏' },
              { label: 'მკერდი', current: latest.chest_cm, prev: previous?.chest_cm, unit: 'სმ', icon: '💪' },
              { label: 'ბიცეფსი', current: latest.biceps_cm, prev: previous?.biceps_cm, unit: 'სმ', icon: '💪' },
            ].map(metric => {
              if (!metric.current) return null
              const diff = metric.prev ? metric.current - metric.prev : null
              return (
                <div key={metric.label} className="card p-4">
                  <p className="text-2xl mb-1">{metric.icon}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{metric.label}</p>
                  <p className="text-xl font-bold">{metric.current} <span className="text-sm font-normal text-[var(--muted-foreground)]">{metric.unit}</span></p>
                  {diff !== null && (
                    <Badge variant={
                      metric.label === 'წონა' ? (diff < 0 ? 'success' : 'warning') :
                      diff > 0 ? 'success' : 'warning'
                    } className="mt-1 text-xs">
                      {diff > 0 ? '+' : ''}{diff.toFixed(1)}{metric.unit}
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Weight chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader><CardTitle>წონის ისტორია</CardTitle></CardHeader>
            <CardContent>
              <WeightChartWrapper data={chartData} />
            </CardContent>
          </Card>
        )}

        {/* AI reviews */}
        {entries.filter(e => e.ai_review).length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">🤖 AI შეფასებები</h3>
            {entries.filter(e => e.ai_review).slice(0, 3).map(e => (
              <Card key={e.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="success">{new Date(e.date).toLocaleDateString('ka-GE')}</Badge>
                    {e.weight_kg && <Badge variant="default">{e.weight_kg} კგ</Badge>}
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">{e.ai_review}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* History table */}
        {loading ? (
          <p className="text-center text-[var(--muted-foreground)] py-8">იტვირთება...</p>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-sm">ჩანაწერი არ არის. დაიწყე გაზომვების ფიქსაცია!</p>
          </div>
        ) : (
          <Card>
            <CardHeader><CardTitle>ისტორია</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--muted-foreground)] border-b border-[var(--border)]">
                      <th className="pb-2 font-medium">თარიღი</th>
                      <th className="pb-2 font-medium">წონა</th>
                      <th className="pb-2 font-medium">წელი</th>
                      <th className="pb-2 font-medium">მკერდი</th>
                      <th className="pb-2 font-medium">ბიცეფსი</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.slice(0, 20).map(e => (
                      <tr key={e.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-2">{new Date(e.date).toLocaleDateString('ka-GE')}</td>
                        <td className="py-2">{e.weight_kg ? `${e.weight_kg} კგ` : '—'}</td>
                        <td className="py-2">{e.waist_cm ? `${e.waist_cm} სმ` : '—'}</td>
                        <td className="py-2">{e.chest_cm ? `${e.chest_cm} სმ` : '—'}</td>
                        <td className="py-2">{e.biceps_cm ? `${e.biceps_cm} სმ` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
