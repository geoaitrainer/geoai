'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Task {
  _id: string
  title: string
  completed: boolean
  meta?: Record<string, unknown>
}

interface MealInfo {
  type: string
  name: string
  calories: number
  icon: string
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function apiToggle(id: string, completed: boolean): Promise<Task | null> {
  const res = await fetch('/api/tasks', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, completed }),
  })
  return res.ok ? res.json() : null
}

async function apiDelete(id: string) {
  await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' })
}

async function apiCreate(payload: object): Promise<Task | null> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.ok ? res.json() : null
}

function CheckCircle({ done }: { done: boolean }) {
  return (
    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
      done ? 'bg-primary-600 border-primary-600' : 'border-[var(--border)]'
    }`}>
      {done && <span className="text-white text-[10px] leading-none font-bold">✓</span>}
    </div>
  )
}

// ─── Nutrition tasks ──────────────────────────────────────────────────────────

function NutritionTab() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [meals, setMeals] = useState<MealInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const month = today.slice(0, 7)

  const load = useCallback(async () => {
    setLoading(true)
    const [taskRes, calRes] = await Promise.all([
      fetch(`/api/tasks?type=nutrition&date=${today}`).then(r => r.json()),
      fetch(`/api/calendar?month=${month}`).then(r => r.json()),
    ])
    setTasks(Array.isArray(taskRes) ? taskRes : [])

    if (calRes?.meal_plan?.days?.length) {
      const { days, created_at } = calRes.meal_plan
      const daysSince = Math.floor((new Date(today).getTime() - new Date(created_at).getTime()) / 86400000)
      const planDay = days[daysSince % days.length] || days[0]
      const MEAL_TYPES = [
        { key: 'breakfast', icon: '☀️' },
        { key: 'lunch', icon: '🌞' },
        { key: 'dinner', icon: '🌙' },
        { key: 'snack', icon: '🍎' },
      ]
      const info: MealInfo[] = []
      for (const mt of MEAL_TYPES) {
        const meal = planDay?.meals?.[mt.key]
        if (meal) info.push({ type: mt.key, name: meal.name, calories: meal.calories, icon: mt.icon })
      }
      setMeals(info)
    }
    setLoading(false)
  }, [today, month])

  useEffect(() => { load() }, [load])

  async function seedFromPlan() {
    setSeeding(true)
    const created: Task[] = []
    for (let i = 0; i < meals.length; i++) {
      const m = meals[i]
      const t = await apiCreate({
        type: 'nutrition', title: `${m.icon} ${m.name}`,
        date: today, order: i,
        meta: { meal_type: m.type, calories: m.calories },
      })
      if (t) created.push(t)
    }
    const water = await apiCreate({
      type: 'nutrition', title: '💧 2.5 ლ წყლის დალევა',
      date: today, order: meals.length, meta: { meal_type: 'water' },
    })
    if (water) created.push(water)
    setTasks(created)
    setSeeding(false)
  }

  async function toggle(task: Task) {
    const updated = await apiToggle(task._id, !task.completed)
    if (updated) setTasks(prev => prev.map(t => t._id === task._id ? updated : t))
  }

  const done = tasks.filter(t => t.completed).length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  if (loading) return <p className="text-center text-sm text-[var(--muted-foreground)] py-6">იტვირთება...</p>

  if (tasks.length > 0) return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] mb-1">
        <span>შესრულებული</span>
        <span className="font-semibold text-[var(--foreground)]">{done}/{tasks.length}</span>
      </div>
      <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden mb-3">
        <div className="h-full bg-primary-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      {tasks.map(task => (
        <button key={task._id} onClick={() => toggle(task)}
          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
            task.completed
              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
              : 'bg-[var(--muted)] border-[var(--border)] hover:border-primary-400'
          }`}>
          <CheckCircle done={task.completed} />
          <span className={`text-sm flex-1 ${task.completed ? 'line-through text-[var(--muted-foreground)]' : ''}`}>
            {task.title}
          </span>
          {(task.meta?.calories as number) > 0 && (
            <span className="text-xs text-[var(--muted-foreground)]">{task.meta?.calories as number} კ</span>
          )}
        </button>
      ))}
    </div>
  )

  if (meals.length > 0) return (
    <div className="text-center py-6 space-y-3">
      <p className="text-sm text-[var(--muted-foreground)]">დღის კვების გეგმის ტასკებად გადაყვანა</p>
      <div className="flex flex-wrap justify-center gap-1 mb-3">
        {meals.map(m => (
          <span key={m.type} className="text-xs bg-[var(--muted)] px-2 py-1 rounded-full">{m.icon} {m.name}</span>
        ))}
      </div>
      <button onClick={seedFromPlan} disabled={seeding} className="btn-primary text-sm px-5 py-2">
        {seeding ? '...' : '🥗 ტასკების შექმნა'}
      </button>
    </div>
  )

  return (
    <div className="text-center py-6 space-y-2">
      <p className="text-sm text-[var(--muted-foreground)]">კვების გეგმა არ არის</p>
      <Link href="/nutrition" className="text-primary-600 text-sm hover:underline">კვების გეგმის შექმნა →</Link>
    </div>
  )
}

// ─── Shopping list ────────────────────────────────────────────────────────────

function ShoppingTab() {
  const [items, setItems] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetch('/api/tasks?type=shopping')
      .then(r => r.json())
      .then(data => { setItems(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  async function add() {
    if (!text.trim() || adding) return
    setAdding(true)
    const t = await apiCreate({ type: 'shopping', title: text.trim() })
    if (t) { setItems(prev => [...prev, t]); setText('') }
    setAdding(false)
  }

  async function toggle(item: Task) {
    const updated = await apiToggle(item._id, !item.completed)
    if (updated) setItems(prev => prev.map(i => i._id === item._id ? updated : i))
  }

  async function del(id: string) {
    await apiDelete(id)
    setItems(prev => prev.filter(i => i._id !== id))
  }

  async function clearDone() {
    const done = items.filter(i => i.completed)
    await Promise.all(done.map(i => apiDelete(i._id)))
    setItems(prev => prev.filter(i => !i.completed))
  }

  const pending = items.filter(i => !i.completed)
  const done = items.filter(i => i.completed)

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="პროდუქტის დამატება..."
          className="input-field flex-1 text-sm"
        />
        <button onClick={add} disabled={adding || !text.trim()}
          className="btn-primary px-4 text-sm flex-shrink-0">+</button>
      </div>

      {loading ? (
        <p className="text-center text-sm text-[var(--muted-foreground)] py-4">იტვირთება...</p>
      ) : items.length === 0 ? (
        <p className="text-center text-sm text-[var(--muted-foreground)] py-4">სია ცარიელია — დაამატე პროდუქტი</p>
      ) : (
        <div className="space-y-1">
          {pending.map(item => (
            <ShopItem key={item._id} item={item} onToggle={toggle} onDelete={del} />
          ))}
          {done.length > 0 && (
            <>
              <div className="flex items-center justify-between pt-1 pb-0.5">
                <span className="text-xs text-[var(--muted-foreground)]">შეძენილი ({done.length})</span>
                <button onClick={clearDone} className="text-xs text-red-500 hover:text-red-700">წაშლა</button>
              </div>
              {done.map(item => (
                <ShopItem key={item._id} item={item} onToggle={toggle} onDelete={del} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ShopItem({ item, onToggle, onDelete }: { item: Task; onToggle: (i: Task) => void; onDelete: (id: string) => void }) {
  return (
    <div className={`flex items-center gap-2 px-2 py-2 rounded-lg group hover:bg-[var(--muted)] transition-colors ${item.completed ? 'opacity-60' : ''}`}>
      <button onClick={() => onToggle(item)}
        className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          item.completed ? 'bg-primary-600 border-primary-600' : 'border-[var(--border)] hover:border-primary-400'
        }`}>
        {item.completed && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
      </button>
      <span className={`text-sm flex-1 ${item.completed ? 'line-through text-[var(--muted-foreground)]' : ''}`}>
        {item.title}
      </span>
      <button onClick={() => onDelete(item._id)}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity text-xs px-1">
        ✕
      </button>
    </div>
  )
}

// ─── Main card ────────────────────────────────────────────────────────────────

type Tab = 'nutrition' | 'shopping'

export function TaskManagerCard() {
  const [tab, setTab] = useState<Tab>('nutrition')

  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'nutrition', icon: '🥗', label: 'კვების ტასკები' },
    { key: 'shopping', icon: '🛒', label: 'საყიდლები' },
  ]

  return (
    <div className="card p-0 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-0">
        <h3 className="font-semibold text-base mb-3">📋 ტასკ მენეჯერი</h3>
        <div className="flex gap-1 border-b border-[var(--border)]">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-5">
        {tab === 'nutrition' && <NutritionTab />}
        {tab === 'shopping' && <ShoppingTab />}
      </div>
    </div>
  )
}
