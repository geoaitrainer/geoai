'use client'

import { useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { Profile } from '@/types/profile'
import { GOAL_LABELS, ACTIVITY_LABELS, EXPERIENCE_LABELS, WORK_TYPE_LABELS } from '@/lib/utils'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const res = await fetch('/api/profile')
    const data = await res.json()
    setProfile(data)
    setLoading(false)
  }

  function update(field: string, value: string | number | string[]) {
    setProfile(prev => prev ? { ...prev, [field]: value } : null)
  }

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    const updated = await res.json()
    setProfile(updated)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return (
    <div>
      <TopBar title="პროფილი" />
      <div className="p-6 text-center text-[var(--muted-foreground)]">იტვირთება...</div>
    </div>
  )

  if (!profile) return null

  return (
    <div className="animate-fade-in">
      <TopBar title="ჩემი პროფილი" subtitle="პერსონალური მონაცემები" />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-2xl">
        {/* Calculated values */}
        <Card>
          <CardHeader><CardTitle>📊 გამოთვლილი ნორმები</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl">
                <p className="text-xs text-[var(--muted-foreground)]">BMR</p>
                <p className="text-lg font-bold">{profile.bmr || '—'}</p>
                <p className="text-xs">კკალ</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl">
                <p className="text-xs text-[var(--muted-foreground)]">TDEE</p>
                <p className="text-lg font-bold">{profile.tdee || '—'}</p>
                <p className="text-xs">კკალ</p>
              </div>
              <div className="text-center p-3 bg-primary-50 dark:bg-primary-900/10 rounded-xl">
                <p className="text-xs text-[var(--muted-foreground)]">მიზანი</p>
                <p className="text-lg font-bold">{profile.calorie_goal || '—'}</p>
                <p className="text-xs">კკალ</p>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                <p className="text-xs text-[var(--muted-foreground)]">გეგმა</p>
                <p className="text-sm font-bold">{GOAL_LABELS[profile.goal]}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              <Badge variant="protein">ც: {profile.protein_g}გ</Badge>
              <Badge variant="fat">ც: {profile.fat_g}გ</Badge>
              <Badge variant="carbs">ნ: {profile.carbs_g}გ</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Basic info */}
        <Card>
          <CardHeader><CardTitle>👤 პირადი ინფორმაცია</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="სახელი" value={profile.name} onChange={e => update('name', e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="ასაკი" type="number" value={String(profile.age)} onChange={e => update('age', parseInt(e.target.value))} min="10" max="120" />
              <Select label="სქესი" value={profile.gender} onChange={e => update('gender', e.target.value)}
                options={[{ value: 'male', label: 'კაცი' }, { value: 'female', label: 'ქალი' }]} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="სიმაღლე (სმ)" type="number" value={String(profile.height_cm)} onChange={e => update('height_cm', parseFloat(e.target.value))} />
              <Input label="წონა (კგ)" type="number" step="0.1" value={String(profile.weight_kg)} onChange={e => update('weight_kg', parseFloat(e.target.value))} />
            </div>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card>
          <CardHeader><CardTitle>🎯 მიზნები</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Select label="მიზანი" value={profile.goal} onChange={e => update('goal', e.target.value)}
              options={Object.entries(GOAL_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
            <Select label="აქტივობის დონე" value={profile.activity_level} onChange={e => update('activity_level', e.target.value)}
              options={Object.entries(ACTIVITY_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
            <Select label="სამუშაოს ტიპი" value={profile.work_type} onChange={e => update('work_type', e.target.value)}
              options={Object.entries(WORK_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
            <Select label="ვარჯიშის გამოცდილება" value={profile.experience} onChange={e => update('experience', e.target.value)}
              options={Object.entries(EXPERIENCE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          </CardContent>
        </Card>

        {/* Food preferences */}
        <Card>
          <CardHeader><CardTitle>🥗 კვებითი პრეფერენციები</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="label">ალერგიები (მძიმით)</label>
              <input
                className="input-field"
                value={profile.allergies?.join(', ') || ''}
                onChange={e => update('allergies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="რძე, კვერცხი"
              />
            </div>
            <div>
              <label className="label">ჯანმრთელობის შეზღუდვები (სურვილისამებრ)</label>
              <input
                className="input-field"
                value={profile.conditions?.join(', ') || ''}
                onChange={e => update('conditions', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="დიაბეტი"
              />
            </div>
            <div>
              <label className="label">საყვარელი პროდუქტები (მძიმით)</label>
              <input
                className="input-field"
                value={profile.liked_foods?.join(', ') || ''}
                onChange={e => update('liked_foods', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="ქათამი, ხილი"
              />
            </div>
            <div>
              <label className="label">არასასურველი პროდუქტები (მძიმით)</label>
              <input
                className="input-field"
                value={profile.disliked_foods?.join(', ') || ''}
                onChange={e => update('disliked_foods', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="ღვიძლი"
              />
            </div>
            <Input label="დღიური ბიუჯეტი კვებაზე (₾)" type="number" value={String(profile.daily_budget || '')} onChange={e => update('daily_budget', parseFloat(e.target.value))} />
          </CardContent>
        </Card>

        {saved && (
          <div className="p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-xl text-sm text-center">
            ✅ პროფილი შენახულია! ნორმები გადაანგარიშდა.
          </div>
        )}

        <Button onClick={handleSave} loading={saving} size="lg" className="w-full">
          შენახვა და გადაანგარიშება
        </Button>
      </div>
    </div>
  )
}
