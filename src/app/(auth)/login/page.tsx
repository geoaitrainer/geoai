'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) {
      setError('ელ-ფოსტა ან პაროლი არასწორია')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="card p-8 animate-fade-in">
      <h2 className="text-xl font-semibold mb-6 text-center">შესვლა</h2>

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          id="email"
          type="email"
          label="ელ-ფოსტა"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Input
          id="password"
          type="password"
          label="პაროლი"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
        <Button type="submit" loading={loading} className="w-full">
          შესვლა
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--muted-foreground)] mt-6">
        ანგარიში არ გაქვს?{' '}
        <Link href="/register" className="text-primary-600 hover:underline font-medium">
          რეგისტრაცია
        </Link>
      </p>
    </div>
  )
}
