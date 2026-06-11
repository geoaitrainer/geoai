'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { GOAL_LABELS, ACTIVITY_LABELS, EXPERIENCE_LABELS, WORK_TYPE_LABELS } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const STEPS = [
  { title: 'ანგარიშის შექმნა', icon: '👤' },
  { title: 'ფიზიკური მონაცემები', icon: '📏' },
  { title: 'მიზნები და გამოცდილება', icon: '🎯' },
  { title: 'კვებითი პრეფერენციები', icon: '🥗' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    gender: 'male',
    height_cm: '',
    weight_kg: '',
    goal: 'lose_weight',
    activity_level: 'moderate',
    work_type: 'desk',
    experience: 'beginner',
    allergies: '',
    conditions: '',
    liked_foods: '',
    disliked_foods: '',
    daily_budget: '50',
  })

  function update(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        age: formData.age,
        gender: formData.gender,
        height_cm: formData.height_cm,
        weight_kg: formData.weight_kg,
        goal: formData.goal,
        activity_level: formData.activity_level,
        work_type: formData.work_type,
        experience: formData.experience,
        allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        conditions: formData.conditions ? formData.conditions.split(',').map(s => s.trim()).filter(Boolean) : [],
        liked_foods: formData.liked_foods ? formData.liked_foods.split(',').map(s => s.trim()).filter(Boolean) : [],
        disliked_foods: formData.disliked_foods ? formData.disliked_foods.split(',').map(s => s.trim()).filter(Boolean) : [],
        daily_budget: formData.daily_budget,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'შეცდომა რეგისტრაციისას')
      setLoading(false)
      return
    }

    const result = await signIn('credentials', {
      email: formData.email,
      password: formData.password,
      redirect: false,
    })

    if (result?.error) {
      setError('რეგისტრაცია დასრულდა, გთხოვთ შეხვიდეთ')
      router.push('/login')
      return
    }

    await fetch('/api/profile/calculate', { method: 'POST' })
    router.push('/dashboard')
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="card p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
              i <= step ? 'bg-primary-600 text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-8 mx-1 transition-colors ${i < step ? 'bg-primary-600' : 'bg-[var(--border)]'}`} />
            )}
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-1">{STEPS[step].icon} {STEPS[step].title}</h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">ნაბიჯი {step + 1} / {STEPS.length}</p>

      {step === 0 && (
        <div className="space-y-4">
          <Input id="name" label="სახელი" placeholder="თქვენი სახელი" value={formData.name} onChange={e => update('name', e.target.value)} required />
          <Input id="email" type="email" label="ელ-ფოსტა" placeholder="you@example.com" value={formData.email} onChange={e => update('email', e.target.value)} required />
          <Input id="password" type="password" label="პაროლი (მინ. 8 სიმბოლო)" placeholder="••••••••" value={formData.password} onChange={e => update('password', e.target.value)} required />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input id="age" type="number" label="ასაკი" placeholder="25" value={formData.age} onChange={e => update('age', e.target.value)} min="10" max="120" required />
            <Select id="gender" label="სქესი" value={formData.gender} onChange={e => update('gender', e.target.value)}
              options={[{ value: 'male', label: 'კაცი' }, { value: 'female', label: 'ქალი' }]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="height" type="number" label="სიმაღლე (სმ)" placeholder="175" value={formData.height_cm} onChange={e => update('height_cm', e.target.value)} min="100" max="250" required />
            <Input id="weight" type="number" label="წონა (კგ)" placeholder="70" value={formData.weight_kg} onChange={e => update('weight_kg', e.target.value)} min="30" max="300" required />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Select id="goal" label="მიზანი" value={formData.goal} onChange={e => update('goal', e.target.value)}
            options={Object.entries(GOAL_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          <Select id="activity" label="აქტივობის დონე" value={formData.activity_level} onChange={e => update('activity_level', e.target.value)}
            options={Object.entries(ACTIVITY_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          <Select id="work" label="სამუშაოს ტიპი" value={formData.work_type} onChange={e => update('work_type', e.target.value)}
            options={Object.entries(WORK_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          <Select id="exp" label="ვარჯიშის გამოცდილება" value={formData.experience} onChange={e => update('experience', e.target.value)}
            options={Object.entries(EXPERIENCE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Input id="allergies" label="ალერგიები (მძიმით გამოყავით)" placeholder="რძე, კვერცხი, თხილი" value={formData.allergies} onChange={e => update('allergies', e.target.value)} />
          <Input id="conditions" label="ჯანმრთელობის პრობლემები (სურვილისამებრ)" placeholder="დიაბეტი, ჰიპერტენზია" value={formData.conditions} onChange={e => update('conditions', e.target.value)} />
          <Input id="liked" label="საყვარელი პროდუქტები (მძიმით)" placeholder="ქათამი, ბოსტნეული, ხილი" value={formData.liked_foods} onChange={e => update('liked_foods', e.target.value)} />
          <Input id="disliked" label="არასასურველი პროდუქტები (მძიმით)" placeholder="ღვიძლი, ქინძი" value={formData.disliked_foods} onChange={e => update('disliked_foods', e.target.value)} />
          <Input id="budget" type="number" label="დღიური ბიუჯეტი კვებაზე (₾)" placeholder="50" value={formData.daily_budget} onChange={e => update('daily_budget', e.target.value)} min="10" />
        </div>
      )}

      {error && (
        <div className="mt-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep(s => s - 1)} className="flex-1">
            უკან
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(s => s + 1)} className="flex-1">
            შემდეგი
          </Button>
        ) : (
          <Button onClick={handleSubmit} loading={loading} className="flex-1">
            რეგისტრაცია
          </Button>
        )}
      </div>

      {step === 0 && (
        <p className="text-center text-sm text-[var(--muted-foreground)] mt-4">
          უკვე გაქვს ანგარიში?{' '}
          <Link href="/login" className="text-primary-600 hover:underline font-medium">შესვლა</Link>
        </p>
      )}
    </div>
  )
}
