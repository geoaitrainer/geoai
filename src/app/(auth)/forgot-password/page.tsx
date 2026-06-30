'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'შეცდომა')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="card p-8 animate-fade-in text-center">
        <p className="text-4xl mb-4">📧</p>
        <h2 className="text-xl font-semibold mb-2">ელფოსტა გაიგზავნა</h2>
        <p className="text-[var(--muted-foreground)] text-sm mb-6">
          პაროლის შეცვლის ლინკი გაიგზავნა <strong>{email}</strong>-ზე.<br />
          ლინკი მოქმედებს 1 საათი.
        </p>
        <Link href="/login" className="text-primary-600 hover:underline text-sm font-medium">
          ← შესვლაზე დაბრუნება
        </Link>
      </div>
    )
  }

  return (
    <div className="card p-8 animate-fade-in">
      <h2 className="text-xl font-semibold mb-2 text-center">პაროლის აღდგენა</h2>
      <p className="text-[var(--muted-foreground)] text-sm text-center mb-6">
        შეიყვანე შენი ელფოსტა — გამოგიგზავნით შეცვლის ლინკს
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          label="ელფოსტა"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
        <Button type="submit" loading={loading} className="w-full">
          ლინკის გაგზავნა
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--muted-foreground)] mt-6">
        <Link href="/login" className="text-primary-600 hover:underline font-medium">
          ← შესვლაზე დაბრუნება
        </Link>
      </p>
    </div>
  )
}
