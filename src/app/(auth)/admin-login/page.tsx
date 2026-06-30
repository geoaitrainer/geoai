'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const dynamic = 'force-dynamic'

export default function AdminLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/admin-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'შეცდომა')
    } else {
      setStep('otp')
    }
    setLoading(false)
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', {
      email,
      adminOtp: otp,
      redirect: false,
    })
    if (result?.error) {
      setError('კოდი არასწორია ან ვადა გაუვიდა')
    } else {
      router.push('/admin')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="card p-8 animate-fade-in">
      <div className="text-center mb-6">
        <p className="text-3xl mb-2">🔑</p>
        <h2 className="text-xl font-semibold">ადმინ შესვლა</h2>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">
          {step === 'email' ? 'ელფოსტა → OTP კოდი ელფოსტაზე' : `კოდი გაიგზავნა ${email}-ზე`}
        </p>
      </div>

      {step === 'email' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <Input
            type="email"
            label="ადმინ ელფოსტა"
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
            კოდის გაგზავნა
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="label">6-ნიშნა კოდი</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              required
              className="input-field text-center text-2xl tracking-[0.5em] font-bold"
            />
          </div>
          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
          <Button type="submit" loading={loading} className="w-full">
            შესვლა
          </Button>
          <button
            type="button"
            onClick={() => { setStep('email'); setOtp(''); setError('') }}
            className="w-full text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            სხვა ელფოსტა
          </button>
        </form>
      )}

      <p className="text-center text-sm text-[var(--muted-foreground)] mt-6">
        <Link href="/login" className="text-primary-600 hover:underline font-medium">
          ← ჩვეულებრივი შესვლა
        </Link>
      </p>
    </div>
  )
}
