'use client'

import { useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { WorkoutProgram, WorkoutDay } from '@/types/workout'
import { EXPERIENCE_LABELS } from '@/lib/utils'
import { WorkoutChecklist } from '@/components/tasks/WorkoutChecklist'

export default function WorkoutPage() {
  const [program, setProgram] = useState<WorkoutProgram | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [type, setType] = useState<'gym' | 'home'>('gym')
  const [activeDay, setActiveDay] = useState(0)

  useEffect(() => {
    loadProgram()
  }, [])

  async function loadProgram() {
    setLoading(true)
    const res = await fetch('/api/ai/workout-plan')
    const data = await res.json()
    setProgram(data)
    setLoading(false)
  }

  async function generateProgram() {
    setGenerating(true)
    const res = await fetch('/api/ai/workout-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
    if (res.ok) await loadProgram()
    setGenerating(false)
  }

  const days = program?.content?.days || []
  const day: WorkoutDay | undefined = days[activeDay]

  return (
    <div className="animate-fade-in">
      <TopBar title="ვარჯიშის პროგრამა" subtitle="AI-ით შედგენილი პერსონალური გეგმა" />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Generator */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h3 className="font-semibold">ვარჯიშის პროგრამის გენერაცია</h3>
                <p className="text-sm text-[var(--muted-foreground)]">AI შეადგენს გეგმას თქვენი მიზნის მიხედვით</p>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
                  <button onClick={() => setType('gym')} className={`px-3 py-1.5 text-sm font-medium transition-colors ${type === 'gym' ? 'bg-primary-600 text-white' : 'hover:bg-[var(--muted)]'}`}>🏋️ დარბაზი</button>
                  <button onClick={() => setType('home')} className={`px-3 py-1.5 text-sm font-medium transition-colors ${type === 'home' ? 'bg-primary-600 text-white' : 'hover:bg-[var(--muted)]'}`}>🏠 სახლი</button>
                </div>
                <Button onClick={generateProgram} loading={generating}>✨ გენერაცია</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            <div className="animate-spin text-4xl mb-4">🔄</div>
          </div>
        ) : !program ? (
          <div className="text-center py-16 text-[var(--muted-foreground)]">
            <p className="text-5xl mb-4">💪</p>
            <h3 className="text-lg font-medium mb-2">პროგრამა არ არის</h3>
            <p className="text-sm">დააჭირე &ldquo;გენერაცია&rdquo; ვარჯიშის პროგრამის შესაქმნელად</p>
          </div>
        ) : (
          <>
            {/* Program info */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="success">{program.type === 'gym' ? '🏋️ დარბაზი' : '🏠 სახლი'}</Badge>
                  <Badge variant="default">{EXPERIENCE_LABELS[program.level]}</Badge>
                  <Badge variant="default">📅 {program.content.duration_weeks} კვირა</Badge>
                  <Badge variant="default">🗓 {program.content.days_per_week} ვარჯიში/კვირა</Badge>
                </div>
                <h3 className="font-semibold text-lg">{program.content.name}</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">{program.content.description}</p>
              </CardContent>
            </Card>

            {/* Day tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {days.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setActiveDay(i)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeDay === i ? 'bg-primary-600 text-white' : 'bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--muted)]'
                  }`}
                >
                  <div className="text-xs opacity-70">დღე {d.day_number}</div>
                  <div className="text-xs">{d.day_name}</div>
                </button>
              ))}
            </div>

            {day && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {day.muscle_groups.map(mg => <Badge key={mg} variant="protein">{mg}</Badge>)}
                  <Badge variant="default">⏱ {day.duration_minutes} წუთი</Badge>
                </div>

                <WorkoutChecklist
                  dayIndex={activeDay}
                  exercises={day.exercises}
                  dayName={day.day_name}
                />

                {day.warmup && (
                  <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-4 text-sm">
                    <span className="font-medium">🔥 გახურება: </span>{day.warmup}
                  </div>
                )}

                {day.exercises.map((ex, i) => (
                  <Card key={i}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold">{i + 1}. {ex.name}</h4>
                        <div className="flex gap-1">
                          <Badge variant="success">{ex.sets} სეტი</Badge>
                          <Badge variant="protein">{ex.reps} გამ</Badge>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm text-[var(--muted-foreground)]">
                        <span>⏸ დასვენება: {ex.rest_seconds}წმ</span>
                        {ex.weight_suggestion && <span>🏋️ {ex.weight_suggestion}</span>}
                      </div>
                      {ex.notes && (
                        <p className="text-xs text-[var(--muted-foreground)] mt-2 bg-[var(--muted)] rounded p-2">
                          💡 {ex.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {day.cooldown && (
                  <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 text-sm">
                    <span className="font-medium">🧘 გაგრილება: </span>{day.cooldown}
                  </div>
                )}
              </div>
            )}

            {program.content.progression_notes && (
              <div className="bg-primary-50 dark:bg-primary-900/10 rounded-xl p-4 text-sm">
                <p className="font-medium mb-1">📈 პროგრესის რეკომენდაცია:</p>
                <p className="text-[var(--muted-foreground)]">{program.content.progression_notes}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
