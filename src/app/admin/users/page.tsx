'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GOAL_LABELS } from '@/lib/utils'

interface UserRow {
  id: string
  userId: string
  name: string
  email: string
  goal: string
  plan: string
  is_admin: boolean
  created_at: string
  weight_kg: number
  calorie_goal: number
}

const PLAN_OPTIONS = ['free', 'pro', 'premium']
const PLAN_COLORS: Record<string, 'default' | 'success' | 'calories'> = {
  free: 'default',
  pro: 'success',
  premium: 'calories',
}

const defaultForm = {
  name: '', email: '', password: '',
  age: '25', gender: 'male', height_cm: '170', weight_kg: '70',
  goal: 'maintain', activity_level: 'moderate',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function changePlan(id: string, plan: string) {
    setUpdating(id)
    await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, plan }),
    })
    await loadUsers()
    setUpdating(null)
  }

  async function createUser() {
    setCreating(true)
    setFormError('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        age: Number(form.age),
        height_cm: Number(form.height_cm),
        weight_kg: Number(form.weight_kg),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setFormError(data.error || 'შეცდომა')
      setCreating(false)
      return
    }
    setForm(defaultForm)
    setShowForm(false)
    await loadUsers()
    setCreating(false)
  }

  async function deleteUser(user: UserRow) {
    setDeleting(user.userId)
    await fetch(`/api/admin/users?userId=${user.userId}`, { method: 'DELETE' })
    setConfirmDelete(null)
    await loadUsers()
    setDeleting(null)
  }

  function upd(field: string, val: string) {
    setForm(f => ({ ...f, [field]: val }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">👥 მომხმარებლები ({users.length})</h2>
        <Button onClick={() => { setShowForm(s => !s); setFormError('') }}>
          {showForm ? '✕ გაუქმება' : '+ იუზერის დამატება'}
        </Button>
      </div>

      {/* Add user form */}
      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">ახალი მომხმარებლის დამატება</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input id="name" label="სახელი" value={form.name} onChange={e => upd('name', e.target.value)} placeholder="სახელი გვარი" required />
              <Input id="email" type="email" label="ელ-ფოსტა" value={form.email} onChange={e => upd('email', e.target.value)} placeholder="user@example.com" required />
              <Input id="password" type="password" label="პაროლი (მინ. 6)" value={form.password} onChange={e => upd('password', e.target.value)} placeholder="••••••••" required />
              <div className="space-y-1">
                <label className="label">სქესი</label>
                <select className="input-field" value={form.gender} onChange={e => upd('gender', e.target.value)}>
                  <option value="male">კაცი</option>
                  <option value="female">ქალი</option>
                </select>
              </div>
              <Input id="age" type="number" label="ასაკი" value={form.age} onChange={e => upd('age', e.target.value)} min="10" max="120" />
              <Input id="height" type="number" label="სიმაღლე (სმ)" value={form.height_cm} onChange={e => upd('height_cm', e.target.value)} />
              <Input id="weight" type="number" label="წონა (კგ)" value={form.weight_kg} onChange={e => upd('weight_kg', e.target.value)} />
              <div className="space-y-1">
                <label className="label">მიზანი</label>
                <select className="input-field" value={form.goal} onChange={e => upd('goal', e.target.value)}>
                  <option value="lose_weight">წონის კლება</option>
                  <option value="maintain">შენარჩუნება</option>
                  <option value="gain_muscle">კუნთის ზრდა</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="label">აქტივობა</label>
                <select className="input-field" value={form.activity_level} onChange={e => upd('activity_level', e.target.value)}>
                  <option value="sedentary">უმოძრაო</option>
                  <option value="light">მსუბუქი</option>
                  <option value="moderate">ზომიერი</option>
                  <option value="active">აქტიური</option>
                  <option value="very_active">ძალიან აქტიური</option>
                </select>
              </div>
            </div>
            {formError && (
              <p className="mt-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{formError}</p>
            )}
            <div className="flex gap-3 mt-4">
              <Button onClick={createUser} loading={creating}>✓ შექმნა</Button>
              <Button variant="secondary" onClick={() => { setShowForm(false); setFormError('') }}>გაუქმება</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="card p-6 max-w-sm w-full">
            <h3 className="font-semibold text-lg mb-2">⚠️ წაშლის დადასტურება</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              მომხმარებელი <strong>{confirmDelete.name}</strong> ({confirmDelete.email}) და მისი ყველა მონაცემი სამუდამოდ წაიშლება.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
                loading={deleting === confirmDelete.userId}
                onClick={() => deleteUser(confirmDelete)}
              >
                წაშლა
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(null)}>
                გაუქმება
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center text-[var(--muted-foreground)] py-8">იტვირთება...</p>
      ) : users.length === 0 ? (
        <p className="text-center text-[var(--muted-foreground)] py-8">მომხმარებლები არ არის</p>
      ) : (
        <Card>
          <CardContent className="pt-0 overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">სახელი / ელ-ფოსტა</th>
                  <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">მიზანი</th>
                  <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">წონა</th>
                  <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">გეგმა</th>
                  <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">თარიღი</th>
                  <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">მოქმედება</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)] transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{user.name}</p>
                          <p className="text-xs text-[var(--muted-foreground)] truncate">{user.email}</p>
                          {user.is_admin && <Badge variant="warning" className="text-xs">ადმინ</Badge>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-[var(--muted-foreground)]">{GOAL_LABELS[user.goal] || user.goal || '—'}</td>
                    <td className="py-3 px-2">{user.weight_kg ? `${user.weight_kg} კგ` : '—'}</td>
                    <td className="py-3 px-2">
                      <Badge variant={PLAN_COLORS[user.plan] || 'default'}>{user.plan || 'free'}</Badge>
                    </td>
                    <td className="py-3 px-2 text-[var(--muted-foreground)] text-xs">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('ka-GE') : '—'}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={user.plan || 'free'}
                          onChange={e => changePlan(user.userId, e.target.value)}
                          disabled={updating === user.userId}
                          className="input-field w-auto text-xs py-1 px-2"
                        >
                          {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        {!user.is_admin && (
                          <button
                            onClick={() => setConfirmDelete(user)}
                            disabled={deleting === user.userId}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded p-1.5 transition-colors text-xs flex-shrink-0"
                            title="წაშლა"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
