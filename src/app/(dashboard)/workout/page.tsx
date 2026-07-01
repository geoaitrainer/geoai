'use client'

import { useEffect, useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { WorkoutProgram, WorkoutDay } from '@/types/workout'
import { EXPERIENCE_LABELS } from '@/lib/utils'
import { WorkoutChecklist } from '@/components/tasks/WorkoutChecklist'
import { RestTimer } from '@/components/workout/RestTimer'
import { haptic } from '@/lib/haptic'

export default function WorkoutPage() {
  const [program, setProgram] = useState<WorkoutProgram | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [type, setType] = useState<'gym' | 'home'>('gym')
  const [activeDay, setActiveDay] = useState(0)
  const [restTimer, setRestTimer] = useState<{ seconds: number; name: string } | null>(null)

  function startRest(name: string, rest_seconds?: number) {
    haptic('medium')
    setRestTimer({ seconds: rest_seconds || 60, name })
  }

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
                  {program.content.split_type && <Badge variant="protein">⚡ {program.content.split_type}</Badge>}
                  <Badge variant="default">📅 {program.content.duration_weeks} კვირა</Badge>
                  <Badge variant="default">🗓 {program.content.days_per_week} ვარჯიში/კვირა</Badge>
                  {program.content.deload_week && <Badge variant="default">💤 Deload კვ.{program.content.deload_week}</Badge>}
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
                    activeDay === i
                      ? d.is_rest ? 'bg-blue-500 text-white' : 'bg-primary-600 text-white'
                      : 'bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--muted)]'
                  }`}
                >
                  <div className="text-xs opacity-70">დღე {d.day_number}</div>
                  <div className="text-xs">{d.is_rest ? '💤 დასვენება' : d.day_name}</div>
                </button>
              ))}
            </div>

            {day && (
              <div className="space-y-4">
                {day.is_rest ? (
                  /* ── Rest day ── */
                  <>
                    <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6 text-center">
                      <p className="text-4xl mb-3">💤</p>
                      <h3 className="font-semibold text-lg mb-1">{day.day_name}</h3>
                      {day.rest_notes && (
                        <p className="text-sm text-[var(--muted-foreground)]">{day.rest_notes}</p>
                      )}
                    </div>

                    {day.rest_activities && day.rest_activities.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-[var(--muted-foreground)] uppercase tracking-wide">დღის აქტივობები</h4>
                        {day.rest_activities.map((act, i) => {
                          const icons: Record<string, string> = {
                            'ცურვა': '🏊',
                            'სეირნობა': '🚶',
                            'განტვირთვა': '🛁',
                            'წიგნის კითხვა': '📚',
                            'მედიტაცია': '🧘',
                            'გაჭიმვა': '🤸',
                          }
                          const icon = Object.entries(icons).find(([k]) => act.name.includes(k))?.[1] ?? '✨'
                          return (
                            <Card key={i}>
                              <CardContent className="pt-4">
                                <div className="flex items-start gap-3">
                                  <span className="text-2xl">{icon}</span>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-semibold">{act.name}</h4>
                                      {act.duration && <Badge variant="default">⏱ {act.duration}</Badge>}
                                    </div>
                                    {act.notes && (
                                      <p className="text-sm text-[var(--muted-foreground)] mt-1">{act.notes}</p>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  /* ── Workout day ── */
                  <>
                    <div className="flex flex-wrap gap-2">
                      {day.muscle_groups?.map(mg => <Badge key={mg} variant="protein">{mg}</Badge>)}
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
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              {ex.is_compound && (
                                <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">
                                  COMPOUND
                                </span>
                              )}
                              <h4 className="font-semibold">{i + 1}. {ex.name}</h4>
                            </div>
                            <div className="flex gap-1 flex-wrap justify-end">
                              <Badge variant="success">{ex.sets} სეტი</Badge>
                              <Badge variant="protein">{ex.reps} გამ</Badge>
                              {ex.rpe && <Badge variant="default">RPE {ex.rpe}</Badge>}
                              {ex.rir !== undefined && <Badge variant="default">RIR {ex.rir}</Badge>}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)] mb-3">
                            <span>⏸ {ex.rest_seconds || 60}წმ</span>
                            {ex.tempo && <span>🎯 Tempo: {ex.tempo}</span>}
                            {ex.weight_suggestion && <span>🏋️ {ex.weight_suggestion}</span>}
                          </div>

                          {ex.notes && (
                            <p className="text-xs text-[var(--muted-foreground)] mb-3 bg-[var(--muted)] rounded p-2">
                              💡 {ex.notes}
                            </p>
                          )}

                          {ex.execution_details && (
                            <details className="mb-3 group">
                              <summary className="cursor-pointer text-xs font-semibold text-primary-600 dark:text-primary-400 select-none list-none flex items-center gap-1 py-1">
                                <span className="transition-transform duration-200 group-open:rotate-90 inline-block">▶</span>
                                ტექნიკის სახელმძღვანელო
                              </summary>
                              <div className="mt-2 space-y-2 text-xs text-[var(--muted-foreground)]">
                                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3">
                                  <p className="font-semibold text-[var(--foreground)] mb-1">📐 საწყისი პოზიცია</p>
                                  <p>{ex.execution_details.setup}</p>
                                </div>
                                <div className="bg-[var(--muted)] rounded-lg p-3">
                                  <p className="font-semibold text-[var(--foreground)] mb-1">🔄 შესრულება</p>
                                  <ol className="space-y-1 list-decimal list-inside">
                                    {ex.execution_details.technique_steps.map((step, si) => (
                                      <li key={si}>{step}</li>
                                    ))}
                                  </ol>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3">
                                  <p className="font-semibold text-[var(--foreground)] mb-1">✅ სად უნდა იგრძნობოდეს</p>
                                  <p>{ex.execution_details.target_sensation}</p>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-3">
                                  <p className="font-semibold text-[var(--foreground)] mb-1">⚠️ გავრცელებული შეცდომები</p>
                                  <p>{ex.execution_details.safety_errors}</p>
                                </div>
                              </div>
                            </details>
                          )}

                          <button
                            onClick={() => startRest(ex.name, ex.rest_seconds)}
                            className="w-full py-2.5 text-sm font-semibold rounded-xl bg-workout/10 hover:bg-workout/20 active:bg-workout/30 text-workout border border-workout/30 transition-colors flex items-center justify-center gap-2"
                          >
                            ✓ სეტი დასრულდა — დასვენება {ex.rest_seconds || 60}წმ
                          </button>
                        </CardContent>
                      </Card>
                    ))}

                    {day.cooldown && (
                      <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 text-sm">
                        <span className="font-medium">🧘 გაგრილება: </span>{day.cooldown}
                      </div>
                    )}
                  </>
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

      {restTimer && (
        <RestTimer
          seconds={restTimer.seconds}
          exerciseName={restTimer.name}
          onClose={() => setRestTimer(null)}
        />
      )}
    </div>
  )
}
