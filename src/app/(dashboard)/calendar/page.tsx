'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'

interface MealInfo {
  name: string
  calories: number
}

interface DayPlan {
  day: number
  day_name: string
  meals: {
    breakfast: MealInfo
    lunch: MealInfo
    dinner: MealInfo
    snack?: MealInfo
  }
  total_calories: number
  total_protein_g: number
  total_fat_g: number
  total_carbs_g: number
}

interface WorkoutDay {
  day_number: number
  day_name: string
  muscle_groups: string[]
  exercises: { name: string; sets: number; reps: string }[]
  duration_minutes: number
}

interface CalendarData {
  meal_plan: {
    type: '7day' | '30day'
    created_at: string
    days: DayPlan[]
  } | null
  workout: {
    days_per_week: number
    created_at: string
    days: WorkoutDay[]
  } | null
  diary_dates: string[]
  progress_dates: string[]
}

const GEO_MONTHS = [
  'იანვარი','თებერვალი','მარტი','აპრილი','მაისი','ივნისი',
  'ივლისი','აგვისტო','სექტემბერი','ოქტომბერი','ნოემბერი','დეკემბერი',
]

const GEO_WEEKDAYS = ['ორ','სა','ოთ','ხუ','პა','შა','კვ']

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startOffset = (first.getDay() + 6) % 7 // Monday = 0
  const cells: (Date | null)[] = Array(startOffset).fill(null)
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function getMealDay(date: Date, mp: CalendarData['meal_plan']): DayPlan | null {
  if (!mp?.days?.length) return null
  const start = new Date(mp.created_at)
  start.setHours(0, 0, 0, 0)
  const target = new Date(date); target.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - start.getTime()) / 86400000)
  if (diff < 0) return null
  return mp.days[diff % mp.days.length]
}

function getWorkoutDay(date: Date, wo: CalendarData['workout']): WorkoutDay | null {
  if (!wo?.days?.length) return null
  const start = new Date(wo.created_at)
  start.setHours(0, 0, 0, 0)
  const target = new Date(date); target.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - start.getTime()) / 86400000)
  if (diff < 0) return null
  const weekDay = diff % 7
  if (weekDay < wo.days_per_week && weekDay < wo.days.length) return wo.days[weekDay]
  return null
}

export default function CalendarPage() {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [data, setData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const loadData = useCallback(async () => {
    setLoading(true)
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
    const res = await fetch(`/api/calendar?month=${monthStr}`)
    setData(await res.json())
    setLoading(false)
  }, [year, month])

  useEffect(() => { loadData() }, [loadData])

  const grid = buildGrid(year, month)
  const todayKey = dateKey(today)
  const diarySet = new Set(data?.diary_dates || [])
  const progressSet = new Set(data?.progress_dates || [])

  function prevMonth() { setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); setSelectedDate(null) }
  function nextMonth() { setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); setSelectedDate(null) }

  const sel = {
    mealDay: selectedDate ? getMealDay(selectedDate, data?.meal_plan ?? null) : null,
    workoutDay: selectedDate ? getWorkoutDay(selectedDate, data?.workout ?? null) : null,
    key: selectedDate ? dateKey(selectedDate) : null,
  }
  const selHasDiary = sel.key ? diarySet.has(sel.key) : false
  const selHasProgress = sel.key ? progressSet.has(sel.key) : false

  return (
    <div className="flex flex-col min-h-full animate-fade-in">
      <TopBar title="კალენდარი" subtitle="კვება და ვარჯიშის გეგმა" />

      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[var(--muted)] text-2xl font-light transition-colors"
          >‹</button>
          <h2 className="text-lg font-bold">{GEO_MONTHS[month]} {year}</h2>
          <button
            onClick={nextMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[var(--muted)] text-2xl font-light transition-colors"
          >›</button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7">
          {GEO_WEEKDAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-[var(--muted-foreground)] py-1">{d}</div>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-16 text-[var(--muted-foreground)]">
            <div className="animate-spin text-3xl mb-2">🔄</div>
            <p className="text-sm">იტვირთება...</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {grid.map((date, i) => {
              if (!date) return <div key={`e${i}`} />
              const key = dateKey(date)
              const isToday = key === todayKey
              const isSelected = selectedDate ? dateKey(selectedDate) === key : false
              const hasMeal = !!getMealDay(date, data?.meal_plan ?? null)
              const hasWorkout = !!getWorkoutDay(date, data?.workout ?? null)
              const hasDiary = diarySet.has(key)
              const hasProgress = progressSet.has(key)

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(isSelected ? null : date)}
                  className={[
                    'relative flex flex-col items-center justify-start pt-1 pb-1.5 px-0.5 rounded-xl min-h-[64px] transition-all',
                    isSelected
                      ? 'bg-primary-600 text-white shadow-lg scale-[0.97]'
                      : isToday
                      ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500'
                      : 'hover:bg-[var(--muted)]',
                  ].join(' ')}
                >
                  <span className={[
                    'text-sm font-bold leading-none mb-1',
                    isSelected ? 'text-white' : isToday ? 'text-primary-600 dark:text-primary-400' : '',
                  ].join(' ')}>
                    {date.getDate()}
                  </span>

                  {/* Plan icons */}
                  <div className="flex gap-px">
                    {hasMeal && (
                      <span className="text-[10px] leading-none">🥗</span>
                    )}
                    {hasWorkout && (
                      <span className="text-[10px] leading-none">💪</span>
                    )}
                  </div>

                  {/* Diary / progress dots */}
                  {(hasDiary || hasProgress) && (
                    <div className="flex gap-0.5 mt-0.5">
                      {hasDiary && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/80' : 'bg-green-500'}`} />
                      )}
                      {hasProgress && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/80' : 'bg-blue-500'}`} />
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
          <span>🥗 კვების გეგმა</span>
          <span>💪 ვარჯიში</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-green-500" /> კვების დღიური</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-blue-500" /> პროგრესი</span>
        </div>

        {/* Selected day detail */}
        {selectedDate && (
          <div className="card p-4 space-y-4 animate-slide-up">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base">
                {selectedDate.getDate()} {GEO_MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </h3>
              {dateKey(selectedDate) === todayKey && (
                <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full">დღეს</span>
              )}
            </div>

            {/* Meal plan section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">🥗 კვების გეგმა</p>
                <Link href="/nutrition" className="text-xs text-primary-600 hover:underline">ნახვა →</Link>
              </div>
              {sel.mealDay ? (
                <div className="space-y-1">
                  <p className="text-xs text-[var(--muted-foreground)] mb-2">
                    {sel.mealDay.day_name} · {sel.mealDay.total_calories} კკალ · ც:{sel.mealDay.total_protein_g}გ
                  </p>
                  {([
                    { key: 'breakfast', icon: '☀️', label: 'საუზმე' },
                    { key: 'lunch', icon: '🌞', label: 'სადილი' },
                    { key: 'dinner', icon: '🌙', label: 'ვახშამი' },
                    { key: 'snack', icon: '🍎', label: 'სნეკი' },
                  ] as const).map(({ key, icon }) => {
                    const meal = sel.mealDay!.meals[key]
                    if (!meal) return null
                    return (
                      <div key={key} className="flex items-center justify-between bg-[var(--muted)] rounded-lg px-3 py-2 text-sm">
                        <span className="flex items-center gap-1.5 min-w-0">
                          <span>{icon}</span>
                          <span className="truncate">{meal.name}</span>
                        </span>
                        <span className="text-xs text-[var(--muted-foreground)] ml-2 flex-shrink-0">{meal.calories} კ</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">
                  {data?.meal_plan ? 'გეგმა ამ თარიღს არ ფარავს' : <>გეგმა არ არის · <Link href="/nutrition" className="text-primary-600 hover:underline">შექმნა</Link></>}
                </p>
              )}
            </div>

            <hr className="border-[var(--border)]" />

            {/* Workout section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">💪 ვარჯიში</p>
                <Link href="/workout" className="text-xs text-primary-600 hover:underline">ნახვა →</Link>
              </div>
              {sel.workoutDay ? (
                <div className="bg-[var(--muted)] rounded-lg px-3 py-2">
                  <p className="text-sm font-medium mb-1">{sel.workoutDay.day_name}</p>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {sel.workoutDay.muscle_groups.map(mg => (
                      <span key={mg} className="text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">{mg}</span>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {sel.workoutDay.exercises.length} სავარჯიშო · ⏱ {sel.workoutDay.duration_minutes} წთ
                  </p>
                </div>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">
                  {data?.workout ? '🛌 დასვენების დღე' : <>გეგმა არ არის · <Link href="/workout" className="text-primary-600 hover:underline">შექმნა</Link></>}
                </p>
              )}
            </div>

            <hr className="border-[var(--border)]" />

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/nutrition/diary?date=${sel.key}`}
                className={[
                  'flex items-center justify-between p-3 rounded-xl border text-sm transition-colors',
                  selHasDiary
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-[var(--border)] hover:bg-[var(--muted)]',
                ].join(' ')}
              >
                <span>🗒️ დღიური</span>
                <span>{selHasDiary ? '✅' : '+'}</span>
              </Link>
              <Link
                href="/progress"
                className={[
                  'flex items-center justify-between p-3 rounded-xl border text-sm transition-colors',
                  selHasProgress
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-[var(--border)] hover:bg-[var(--muted)]',
                ].join(' ')}
              >
                <span>📊 პროგრესი</span>
                <span>{selHasProgress ? '✅' : '+'}</span>
              </Link>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !data?.meal_plan && !data?.workout && !selectedDate && (
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            <p className="text-5xl mb-3">📅</p>
            <p className="text-sm mb-4">კვების ან ვარჯიშის გეგმა ჯერ არ გაქვს</p>
            <div className="flex gap-4 justify-center">
              <Link href="/nutrition" className="text-sm text-primary-600 hover:underline font-medium">🥗 კვების გეგმა</Link>
              <Link href="/workout" className="text-sm text-primary-600 hover:underline font-medium">💪 ვარჯიშის გეგმა</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
