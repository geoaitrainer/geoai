'use client'

import { useEffect, useState, useCallback } from 'react'

interface Exercise {
  name: string
  sets: number | string
  reps: number | string
  rest_seconds?: number
  weight_suggestion?: string
  is_compound?: boolean
  rpe?: number
  tempo?: string
}

interface WorkoutTask {
  _id: string
  title: string
  completed: boolean
  meta: {
    day_index: number
    sets?: number | string
    reps?: number | string
    weight_used?: string
  }
}

interface Props {
  dayIndex: number
  exercises: Exercise[]
  dayName: string
}

export function WorkoutChecklist({ dayIndex, exercises, dayName }: Props) {
  const [tasks, setTasks] = useState<WorkoutTask[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [editingWeight, setEditingWeight] = useState<string | null>(null)
  const [weightInput, setWeightInput] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const loadTasks = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/tasks?type=workout&date=${today}`)
    const data = await res.json()
    const filtered = Array.isArray(data)
      ? (data as WorkoutTask[]).filter(t => t.meta?.day_index === dayIndex)
      : []
    setTasks(filtered)
    setLoading(false)
  }, [today, dayIndex])

  useEffect(() => { loadTasks() }, [loadTasks])

  async function seedTasks() {
    setSeeding(true)
    await Promise.all(tasks.map(t => fetch(`/api/tasks?id=${t._id}`, { method: 'DELETE' })))
    const created: WorkoutTask[] = []
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i]
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'workout',
          title: ex.name,
          date: today,
          order: i,
          meta: { day_index: dayIndex, sets: ex.sets, reps: ex.reps },
        }),
      })
      if (res.ok) created.push(await res.json())
    }
    setTasks(created)
    setSeeding(false)
  }

  async function toggle(task: WorkoutTask) {
    const res = await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task._id, completed: !task.completed }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTasks(prev => prev.map(t => t._id === task._id ? updated : t))
    }
  }

  async function saveWeight(task: WorkoutTask, weight: string) {
    const res = await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task._id, meta: { ...task.meta, weight_used: weight } }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTasks(prev => prev.map(t => t._id === task._id ? updated : t))
    }
    setEditingWeight(null)
  }

  const doneCount = tasks.filter(t => t.completed).length
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0
  const allDone = tasks.length > 0 && doneCount === tasks.length

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{allDone ? '🏆' : '✅'}</span>
          <div>
            <p className="font-semibold text-sm">{dayName} — ვარჯიშის ტასკები</p>
            {tasks.length > 0 && (
              <p className="text-xs text-[var(--muted-foreground)]">{doneCount}/{tasks.length} სავარჯიშო</p>
            )}
          </div>
        </div>
        <button
          onClick={seedTasks}
          disabled={seeding || exercises.length === 0}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium px-2 py-1 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
        >
          {seeding ? '...' : tasks.length > 0 ? '🔄 გადატვირთვა' : '+ ტასკების დამატება'}
        </button>
      </div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <div className="h-2 flex-1 bg-[var(--muted)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-green-500' : 'bg-primary-600'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`text-xs font-bold ml-2 min-w-[2.5rem] text-right ${allDone ? 'text-green-500' : 'text-primary-600'}`}>
              {pct}%
            </span>
          </div>
          {allDone && (
            <p className="text-xs text-green-600 dark:text-green-400 font-medium text-center">
              🎉 ყველა სავარჯიშო შესრულებულია!
            </p>
          )}
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <p className="text-sm text-[var(--muted-foreground)] text-center py-2">იტვირთება...</p>
      ) : tasks.length === 0 ? (
        <p className="text-xs text-[var(--muted-foreground)] text-center py-3">
          {exercises.length === 0
            ? 'ამ დღეს სავარჯიშოები არ არის'
            : 'დააჭირე "+ ტასკების დამატება" სავარჯიშოების სიის შესაქმნელად'}
        </p>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task._id} className={`rounded-xl border transition-all ${
              task.completed
                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                : 'bg-[var(--muted)] border-[var(--border)]'
            }`}>
              {/* Main row */}
              <button
                onClick={() => toggle(task)}
                className="w-full flex items-center gap-3 p-2.5 text-left"
              >
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  task.completed ? 'bg-primary-600 border-primary-600' : 'border-[var(--border)]'
                }`}>
                  {task.completed && <span className="text-white text-[10px] leading-none font-bold">✓</span>}
                </div>
                <span className={`text-sm flex-1 ${task.completed ? 'line-through text-[var(--muted-foreground)]' : ''}`}>
                  {task.title}
                </span>
                {task.meta?.sets && (
                  <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0">
                    {task.meta.sets} × {task.meta.reps}
                  </span>
                )}
              </button>

              {/* Weight logging row */}
              <div className="px-2.5 pb-2 flex items-center gap-2">
                <span className="text-xs text-[var(--muted-foreground)]">🏋️</span>
                {editingWeight === task._id ? (
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      autoFocus
                      type="text"
                      value={weightInput}
                      onChange={e => setWeightInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveWeight(task, weightInput)
                        if (e.key === 'Escape') setEditingWeight(null)
                      }}
                      placeholder="მაგ: 80კგ / სხეული"
                      className="flex-1 text-xs bg-[var(--background)] border border-[var(--border)] rounded px-2 py-1 outline-none focus:border-primary-500"
                    />
                    <button
                      onClick={() => saveWeight(task, weightInput)}
                      className="text-xs text-primary-600 font-semibold px-2 py-1 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    >
                      შენახვა
                    </button>
                    <button
                      onClick={() => setEditingWeight(null)}
                      className="text-xs text-[var(--muted-foreground)] px-1"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingWeight(task._id); setWeightInput(task.meta?.weight_used ?? '') }}
                    className="text-xs text-[var(--muted-foreground)] hover:text-primary-600 transition-colors"
                  >
                    {task.meta?.weight_used
                      ? <span className="font-medium text-primary-600">{task.meta.weight_used}</span>
                      : '+ წონის ჩაწერა'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
