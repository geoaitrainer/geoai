'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, SkipForward } from 'lucide-react'
import { haptic } from '@/lib/haptic'

interface RestTimerProps {
  seconds: number
  exerciseName: string
  onClose: () => void
}

export function RestTimer({ seconds, exerciseName, onClose }: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds)
  const [totalSeconds, setTotalSeconds] = useState(seconds)
  const [flash, setFlash] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const closedRef = useRef(false)

  useEffect(() => {
    try {
      audioCtxRef.current = new AudioContext()
    } catch {}
    return () => {
      audioCtxRef.current?.close()
    }
  }, [])

  function playBeep(freq = 880, duration = 0.5) {
    const ctx = audioCtxRef.current
    if (!ctx) return
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.35, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duration)
    } catch {}
  }

  const finish = useCallback(() => {
    if (closedRef.current) return
    if (intervalRef.current) clearInterval(intervalRef.current)
    // triple beep
    playBeep(880, 0.15)
    setTimeout(() => playBeep(880, 0.15), 200)
    setTimeout(() => playBeep(1100, 0.4), 400)
    haptic('success')
    setFlash(true)
    setTimeout(() => setFlash(false), 700)
    setTimeout(() => {
      if (!closedRef.current) onClose()
    }, 1800)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current!)
          finish()
          return 0
        }
        if (t === 4) haptic('light')
        return t - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [finish])

  function handleClose() {
    closedRef.current = true
    if (intervalRef.current) clearInterval(intervalRef.current)
    onClose()
  }

  function adjustTime(delta: number) {
    setTimeLeft(t => {
      const next = Math.max(5, t + delta)
      setTotalSeconds(prev => Math.max(5, prev + delta))
      return next
    })
  }

  const pct = totalSeconds > 0 ? (timeLeft / totalSeconds) * 100 : 0
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const strokeDash = (pct / 100) * circumference
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const isUrgent = timeLeft <= 5

  return (
    <>
      {flash && (
        <div className="fixed inset-0 bg-green-500/25 z-50 pointer-events-none" />
      )}

      <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-40 w-[320px] max-w-[calc(100vw-2rem)]">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[var(--muted-foreground)] uppercase tracking-wide">დასვენება</p>
              <p className="text-sm font-semibold truncate">{exerciseName}</p>
            </div>
            <button
              onClick={handleClose}
              className="ml-2 flex-shrink-0 p-1.5 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
              aria-label="დახურვა"
            >
              <X size={16} />
            </button>
          </div>

          {/* Ring */}
          <div className="flex justify-center py-3">
            <div className="relative">
              <svg width="128" height="128" className="-rotate-90" style={{ display: 'block' }}>
                <circle
                  cx="64" cy="64" r={radius}
                  fill="none" stroke="var(--muted)" strokeWidth="9"
                />
                <circle
                  cx="64" cy="64" r={radius}
                  fill="none"
                  stroke={isUrgent ? '#ef4444' : '#22c55e'}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={circumference - strokeDash}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold tabular-nums leading-none ${isUrgent ? 'text-red-500' : ''}`}>
                  {mins > 0
                    ? `${mins}:${secs.toString().padStart(2, '0')}`
                    : secs.toString()
                  }
                </span>
                <span className="text-[10px] text-[var(--muted-foreground)] mt-0.5">წამი</span>
              </div>
            </div>
          </div>

          {/* Adjust */}
          <div className="flex gap-1.5 px-4 mb-3">
            {([-15, -10, +10, +15] as const).map(d => (
              <button
                key={d}
                onClick={() => adjustTime(d)}
                className="flex-1 py-1.5 text-xs rounded-lg bg-[var(--muted)] hover:bg-[var(--border)] font-semibold transition-colors"
              >
                {d > 0 ? '+' : ''}{d}წმ
              </button>
            ))}
          </div>

          {/* Skip */}
          <button
            onClick={handleClose}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium bg-[var(--muted)] hover:bg-[var(--border)] transition-colors border-t border-[var(--border)]"
          >
            <SkipForward size={14} />
            გამოტოვება
          </button>
        </div>
      </div>
    </>
  )
}
