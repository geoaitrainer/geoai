'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const GOAL_ML = 2500
const QUICK_AMOUNTS = [200, 250, 300, 500]

export function WaterTracker() {
  const [totalMl, setTotalMl] = useState(0)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const pct = Math.min((totalMl / GOAL_ML) * 100, 100)
  const glasses = Math.floor(totalMl / 250)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/water?date=${today}`)
    const data = await res.json()
    setTotalMl(data.total_ml || 0)
    setLoading(false)
  }

  async function addWater(ml: number) {
    setAdding(true)
    await fetch('/api/water', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today, amount_ml: ml }),
    })
    await load()
    setAdding(false)
  }

  async function reset() {
    await fetch(`/api/water?date=${today}`, { method: 'DELETE' })
    await load()
  }

  const circumference = 2 * Math.PI * 36
  const dashOffset = circumference - (pct / 100) * circumference

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>💧 წყლის ტრეკინგი</CardTitle>
          {totalMl > 0 && (
            <button onClick={reset} className="text-xs text-[var(--muted-foreground)] hover:text-red-500 transition-colors">
              გასუფთავება
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-[var(--muted-foreground)] text-sm">იტვირთება...</div>
        ) : (
          <div className="flex items-center gap-6">
            {/* Ring */}
            <div className="relative flex-shrink-0">
              <svg width="88" height="88" className="-rotate-90">
                <circle cx="44" cy="44" r="36" fill="none" stroke="var(--muted)" strokeWidth="7" />
                <circle
                  cx="44" cy="44" r="36" fill="none"
                  stroke="#3b82f6" strokeWidth="7"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold leading-none">{glasses}</span>
                <span className="text-[10px] text-[var(--muted-foreground)]">ჭიქა</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="text-sm text-[var(--muted-foreground)] mb-1">
                {Math.round(totalMl)}მლ / {GOAL_ML}მლ
              </div>
              {pct >= 100 ? (
                <div className="text-sm font-medium text-blue-500 mb-3">✅ მიზანი მიღწეულია!</div>
              ) : (
                <div className="text-sm text-[var(--muted-foreground)] mb-3">
                  კიდევ {GOAL_ML - totalMl}მლ
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                {QUICK_AMOUNTS.map(ml => (
                  <button
                    key={ml}
                    onClick={() => addWater(ml)}
                    disabled={adding}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium disabled:opacity-50"
                  >
                    +{ml}მლ
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
