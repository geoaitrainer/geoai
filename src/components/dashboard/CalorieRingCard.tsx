'use client'

import { useEffect, useRef } from 'react'
import { motion, animate } from 'framer-motion'
import { Flame, Zap, Droplets } from 'lucide-react'

interface CalorieRingCardProps {
  consumed: number
  goal: number
  protein: number
  proteinGoal: number
  fat: number
  fatGoal: number
  carbs: number
  carbsGoal: number
  water?: number
  waterGoal?: number
}

const R = 72
const CIRCUMFERENCE = 2 * Math.PI * R
const STROKE = 10

function AnimatedNumber({ value }: { value: number }) {
  const displayRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const controls = animate(0, Math.round(value), {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) {
        if (displayRef.current) displayRef.current.textContent = String(Math.round(v))
      },
    })
    return () => controls.stop()
  }, [value])

  return <span ref={displayRef}>0</span>
}

interface MacroBarProps {
  label: string
  current: number
  target: number
  color: string
  delay?: number
}

function MacroBar({ label, current, target, color, delay = 0 }: MacroBarProps) {
  const pct = Math.min((current / Math.max(target, 1)) * 100, 100)
  return (
    <div>
      <div className="flex justify-between mb-1" style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>
        <span className="font-medium">{label}</span>
        <span>{Math.round(current)}<span style={{ opacity: 0.5 }}>/{target}გ</span></span>
      </div>
      <div
        className="rounded-full overflow-hidden"
        style={{ height: 4, background: 'rgba(255,255,255,0.07)' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay: 0.4 + delay, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  )
}

export function CalorieRingCard({
  consumed, goal,
  protein, proteinGoal,
  fat, fatGoal,
  carbs, carbsGoal,
  water = 0, waterGoal = 2500,
}: CalorieRingCardProps) {
  const pct = Math.min(consumed / Math.max(goal, 1), 1)
  const dashOffset = CIRCUMFERENCE * (1 - pct)
  const remaining = Math.max(goal - consumed, 0)

  return (
    <div
      className="mx-4 mt-2 mb-0 rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(30,32,42,0.9) 0%, rgba(20,22,30,0.95) 100%)',
        border: '0.5px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {/* Top row: ring + stats */}
      <div className="flex items-center gap-4 px-5 pt-5 pb-4">
        {/* SVG calorie ring */}
        <div className="relative flex-shrink-0" style={{ width: R * 2 + STROKE, height: R * 2 + STROKE }}>
          <svg
            width={R * 2 + STROKE}
            height={R * 2 + STROKE}
            style={{ transform: 'rotate(-90deg)' }}
          >
            {/* Track */}
            <circle
              cx={R + STROKE / 2}
              cy={R + STROKE / 2}
              r={R}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={STROKE}
            />
            {/* Progress arc */}
            <motion.circle
              cx={R + STROKE / 2}
              cy={R + STROKE / 2}
              r={R}
              fill="none"
              stroke="url(#lime-gradient)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            />
            <defs>
              <linearGradient id="lime-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#A8F020" />
                <stop offset="100%" stopColor="#D4FF60" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center label */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ gap: 1 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Flame size={12} style={{ color: '#C8FA5F' }} />
              <span className="font-bold" style={{ fontSize: 20, lineHeight: 1, color: 'var(--foreground)' }}>
                <AnimatedNumber value={Math.round(consumed)} />
              </span>
            </div>
            <span style={{ fontSize: 9, color: 'var(--muted-foreground)', fontWeight: 500 }}>კკალ</span>
          </div>
        </div>

        {/* Right stats */}
        <div className="flex-1 flex flex-col gap-2.5">
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted-foreground)', fontWeight: 500, marginBottom: 1 }}>
              მიზანი
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: 'var(--foreground)', letterSpacing: '-0.5px' }}>
              {goal}
              <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted-foreground)', marginLeft: 2 }}>კკალ</span>
            </div>
          </div>

          <div
            className="rounded-xl px-3 py-2 flex items-center gap-2"
            style={{ background: 'rgba(200,250,95,0.08)', border: '0.5px solid rgba(200,250,95,0.15)' }}
          >
            <Zap size={12} style={{ color: '#C8FA5F', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 9, color: 'rgba(200,250,95,0.7)', fontWeight: 500 }}>დარჩენილი</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#C8FA5F', lineHeight: 1, letterSpacing: '-0.3px' }}>
                {remaining} <span style={{ fontSize: 9, fontWeight: 400 }}>კკალ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Macro bars */}
      <div
        className="px-5 py-3 flex flex-col gap-2.5"
        style={{ borderTop: '0.5px solid rgba(255,255,255,0.05)' }}
      >
        <MacroBar label="ცილა" current={protein} target={proteinGoal} color="linear-gradient(to right, #3B82F6, #60A5FA)" delay={0} />
        <MacroBar label="ცხიმი" current={fat} target={fatGoal} color="linear-gradient(to right, #F59E0B, #FBBF24)" delay={0.05} />
        <MacroBar label="ნახ-ი" current={carbs} target={carbsGoal} color="linear-gradient(to right, #FF6B35, #FF8C5A)" delay={0.1} />
      </div>

      {/* Water row */}
      <div
        className="px-5 py-3 flex items-center gap-3"
        style={{ borderTop: '0.5px solid rgba(255,255,255,0.05)' }}
      >
        <Droplets size={14} style={{ color: '#3B82F6', flexShrink: 0 }} />
        <div className="flex-1">
          <div
            className="rounded-full overflow-hidden"
            style={{ height: 4, background: 'rgba(255,255,255,0.07)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(to right, #3B82F6, #60A5FA)' }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((water / Math.max(waterGoal, 1)) * 100, 100)}%` }}
              transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
        <span style={{ fontSize: 10, color: 'var(--muted-foreground)', fontWeight: 500, flexShrink: 0 }}>
          {water}<span style={{ opacity: 0.5 }}>/{waterGoal}მლ</span>
        </span>
      </div>
    </div>
  )
}
