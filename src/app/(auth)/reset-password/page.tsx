'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('პაროლები არ ემთხვევა'); return }
    if (password.length < 6) { setError('პაროლი მინიმუმ 6 სიმბოლო'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'შეცდომა')
    } else {
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    }
    setLoading(false)
  }

  if (!token) {
    return (
      <div className="card p-8 text-center">
        <p className="text-4xl mb-4">❌</p>
        <p className="text-[var(--muted-foreground)]">ლინკი არასწორია</p>
        <Link href="/forgot-password" className="text-primary-600 hover:underline text-sm mt-4 block">
          ხელახლა სცადე
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="card p-8 text-center animate-fade-in">
        <p className="text-4xl mb-4">✅</p>
        <h2 className="text-xl font-semibold mb-2">პაროლი შეიცვალა!</h2>
        <p className="text-[var(--muted-foreground)] text-sm">შესვლის გვერდზე გადაგამისამართებთ...</p>
      </div>
    )
  }

  return (
    <div className="card p-8 animate-fade-in">
      <h2 className="text-xl font-semibold mb-6 text-center">ახალი პაროლი</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="password"
          label="ახალი პაროლი"
          placeholder="მინიმუმ 6 სიმბოლო"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <Input
          type="password"
          label="გაიმეორე პაროლი"
          placeholder="••••••••"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
        />
        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
        <Button type="submit" loading={loading} className="w-full">
          პაროლის შეცვლა
        </Button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="card p-8 text-center text-[var(--muted-foreground)]">იტვირთება...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
