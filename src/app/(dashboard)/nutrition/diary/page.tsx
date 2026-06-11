'use client'

import { useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { FoodDiaryEntry, MealType } from '@/types/nutrition'

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: '☀️ საუზმე',
  lunch: '🌞 სადილი',
  dinner: '🌙 ვახშამი',
  snack: '🍎 სნეკი',
}

const COMMON_FOODS = [
  { name: 'ქათმის ფილე (100გ)', calories: 165, protein_g: 31, fat_g: 3.6, carbs_g: 0 },
  { name: 'კვერცხი (1 ც)', calories: 70, protein_g: 6, fat_g: 5, carbs_g: 0.6 },
  { name: 'შვრიის ფაფა (100გ)', calories: 150, protein_g: 5, fat_g: 3, carbs_g: 25 },
  { name: 'ბანანი (1 ც)', calories: 89, protein_g: 1, fat_g: 0.3, carbs_g: 23 },
  { name: 'ხაჭო 0% (100გ)', calories: 57, protein_g: 10, fat_g: 0.1, carbs_g: 3.5 },
  { name: 'ბრინჯი მოხარშული (100გ)', calories: 130, protein_g: 2.7, fat_g: 0.3, carbs_g: 28 },
]

export default function FoodDiaryPage() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [entries, setEntries] = useState<FoodDiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    food_name: '',
    amount_g: '',
    meal_type: 'lunch' as MealType,
    calories: '',
    protein_g: '',
    fat_g: '',
    carbs_g: '',
  })
  const [saving, setSaving] = useState(false)

  const [aiSearch, setAiSearch] = useState('')
  const [aiSearching, setAiSearching] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    loadEntries() // eslint-disable-line react-hooks/exhaustive-deps
  }, [date]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadEntries() {
    setLoading(true)
    const res = await fetch(`/api/nutrition/diary?date=${date}`)
    const data = await res.json()
    setEntries(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function fillFromCommon(food: typeof COMMON_FOODS[0]) {
    setForm(prev => ({
      ...prev,
      food_name: food.name,
      calories: String(food.calories),
      protein_g: String(food.protein_g),
      fat_g: String(food.fat_g),
      carbs_g: String(food.carbs_g),
    }))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const factor = parseFloat(form.amount_g) / 100
    await fetch('/api/nutrition/diary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        food_name: form.food_name,
        amount_g: parseFloat(form.amount_g),
        meal_type: form.meal_type,
        calories: parseFloat(form.calories) * (form.amount_g ? factor : 1),
        protein_g: parseFloat(form.protein_g) * (form.amount_g ? factor : 1),
        fat_g: parseFloat(form.fat_g) * (form.amount_g ? factor : 1),
        carbs_g: parseFloat(form.carbs_g) * (form.amount_g ? factor : 1),
      }),
    })
    setForm({ food_name: '', amount_g: '', meal_type: 'lunch', calories: '', protein_g: '', fat_g: '', carbs_g: '' })
    setShowForm(false)
    setSaving(false)
    await loadEntries()
  }

  async function deleteEntry(id: string) {
    await fetch(`/api/nutrition/diary?id=${id}`, { method: 'DELETE' })
    await loadEntries()
  }

  async function handleAiSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!aiSearch.trim()) return
    setAiSearching(true)
    try {
      const res = await fetch('/api/ai/food-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food_name: aiSearch, amount_g: form.amount_g ? parseFloat(form.amount_g) : undefined }),
      })
      const data = await res.json()
      if (data.found !== false) {
        setForm(prev => ({
          ...prev,
          food_name: data.food_name || aiSearch,
          calories: String(data.calories || ''),
          protein_g: String(data.protein_g || ''),
          fat_g: String(data.fat_g || ''),
          carbs_g: String(data.carbs_g || ''),
        }))
        setAiSearch('')
      }
    } catch {}
    setAiSearching(false)
  }

  async function handleAnalyze() {
    setAnalyzing(true)
    setAnalysis('')
    try {
      const res = await fetch(`/api/ai/nutrition-analysis?date=${date}`)
      const data = await res.json()
      setAnalysis(data.analysis || '')
    } catch {}
    setAnalyzing(false)
  }

  const totals = entries.reduce((acc, e) => ({
    calories: acc.calories + (e.calories || 0),
    protein_g: acc.protein_g + (e.protein_g || 0),
    fat_g: acc.fat_g + (e.fat_g || 0),
    carbs_g: acc.carbs_g + (e.carbs_g || 0),
  }), { calories: 0, protein_g: 0, fat_g: 0, carbs_g: 0 })

  const grouped = entries.reduce<Record<string, FoodDiaryEntry[]>>((acc, e) => {
    if (!acc[e.meal_type]) acc[e.meal_type] = []
    acc[e.meal_type].push(e)
    return acc
  }, {})

  return (
    <div className="animate-fade-in">
      <TopBar title="კვების დღიური" />

      <div className="p-6 space-y-6">
        {/* Date + totals */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            max={today}
            className="input-field w-auto"
          />
          <div className="flex gap-2 flex-wrap">
            <Badge variant="calories">🔥 {Math.round(totals.calories)} კკალ</Badge>
            <Badge variant="protein">ც: {Math.round(totals.protein_g)}გ</Badge>
            <Badge variant="fat">ც: {Math.round(totals.fat_g)}გ</Badge>
            <Badge variant="carbs">ნ: {Math.round(totals.carbs_g)}გ</Badge>
          </div>
        </div>

        {/* Add food + AI analyze */}
        <div className="flex gap-3 flex-wrap">
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ გაუქმება' : '➕ საკვების დამატება'}
          </Button>
          <Button onClick={handleAnalyze} disabled={analyzing} className="btn-secondary">
            {analyzing ? '⏳ ვაანალიზებ...' : '🤖 AI ანალიზი'}
          </Button>
        </div>

        {analysis && (
          <div className="card p-4 border-l-4 border-primary-500 bg-primary-50 dark:bg-primary-900/20">
            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-2">🤖 AI კვების ანალიზი</p>
            <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">{analysis}</p>
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <Card className="animate-slide-up">
            <CardHeader><CardTitle>საკვების დამატება</CardTitle></CardHeader>
            <CardContent>
              {/* AI food search */}
              <div className="mb-4">
                <p className="text-xs text-[var(--muted-foreground)] mb-2">🤖 AI საკვების ძიება:</p>
                <form onSubmit={handleAiSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={aiSearch}
                    onChange={e => setAiSearch(e.target.value)}
                    placeholder="მაგ: ხინკალი 3 ცალი, ბასტურმა 50გ..."
                    className="input-field flex-1 text-sm"
                  />
                  <button type="submit" disabled={aiSearching}
                    className="btn-primary px-3 py-2 text-xs whitespace-nowrap">
                    {aiSearching ? '⏳' : '🔍 ძიება'}
                  </button>
                </form>
              </div>

              {/* Quick select */}
              <div className="mb-4">
                <p className="text-xs text-[var(--muted-foreground)] mb-2">სწრაფი არჩევა:</p>
                <div className="flex gap-2 flex-wrap">
                  {COMMON_FOODS.map(f => (
                    <button key={f.name} onClick={() => fillFromCommon(f)}
                      className="text-xs px-2 py-1 rounded bg-[var(--muted)] hover:bg-[var(--border)] transition-colors">
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAdd} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="საკვების სახელი" value={form.food_name} onChange={e => setForm(p => ({ ...p, food_name: e.target.value }))} required placeholder="კვერცხი" />
                  <Input label="რაოდენობა (გ)" type="number" value={form.amount_g} onChange={e => setForm(p => ({ ...p, amount_g: e.target.value }))} placeholder="100" />
                </div>
                <Select label="კვების დრო" value={form.meal_type} onChange={e => setForm(p => ({ ...p, meal_type: e.target.value as MealType }))}
                  options={Object.entries(MEAL_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Input label="კკალ" type="number" value={form.calories} onChange={e => setForm(p => ({ ...p, calories: e.target.value }))} required placeholder="100" />
                  <Input label="ცილა (გ)" type="number" value={form.protein_g} onChange={e => setForm(p => ({ ...p, protein_g: e.target.value }))} placeholder="10" />
                  <Input label="ცხიმი (გ)" type="number" value={form.fat_g} onChange={e => setForm(p => ({ ...p, fat_g: e.target.value }))} placeholder="5" />
                  <Input label="ნახ-ი (გ)" type="number" value={form.carbs_g} onChange={e => setForm(p => ({ ...p, carbs_g: e.target.value }))} placeholder="15" />
                </div>
                <Button type="submit" loading={saving}>შენახვა</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Entries */}
        {loading ? (
          <p className="text-center text-[var(--muted-foreground)] py-8">იტვირთება...</p>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm">ამ დღისთვის ჩანაწერი არ არის</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(Object.keys(MEAL_LABELS) as MealType[]).map(mealKey => {
              const mealEntries = grouped[mealKey]
              if (!mealEntries?.length) return null
              return (
                <Card key={mealKey}>
                  <CardHeader>
                    <CardTitle className="text-base">{MEAL_LABELS[mealKey]}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {mealEntries.map(entry => (
                        <li key={entry.id} className="flex items-center justify-between text-sm">
                          <div>
                            <span className="font-medium">{entry.food_name}</span>
                            {entry.amount_g && <span className="text-[var(--muted-foreground)] ml-1">{entry.amount_g}გ</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="calories">{Math.round(entry.calories)} კკალ</Badge>
                            <button onClick={() => deleteEntry(entry.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
