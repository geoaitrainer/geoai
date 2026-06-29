'use client'

import { useState, useRef, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'

const THRESHOLD = 80

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const pulling = pullY > 0

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY
    }
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startY.current) return
    const delta = e.touches[0].clientY - startY.current
    if (delta > 0) {
      setPullY(Math.min(delta, THRESHOLD + 24))
    }
  }, [])

  const onTouchEnd = useCallback(async () => {
    if (pullY >= THRESHOLD && !refreshing) {
      setRefreshing(true)
      setPullY(THRESHOLD)
      await onRefresh()
      setRefreshing(false)
    }
    setPullY(0)
    startY.current = 0
  }, [pullY, refreshing, onRefresh])

  const rotation = refreshing ? undefined : (pullY / THRESHOLD) * 360

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: pulling || refreshing ? Math.min(pullY, THRESHOLD + 24) : 0 }}
      >
        <RefreshCw
          size={20}
          className={`text-primary-500 transition-transform ${refreshing ? 'animate-spin' : ''}`}
          style={rotation !== undefined ? { transform: `rotate(${rotation}deg)` } : undefined}
        />
      </div>
      {children}
    </div>
  )
}
