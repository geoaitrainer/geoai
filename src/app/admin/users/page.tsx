'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GOAL_LABELS } from '@/lib/utils'

interface UserRow {
  id: string
  name: string
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

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

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">👥 მომხმარებლები ({users.length})</h2>

      {loading ? (
        <p className="text-center text-[var(--muted-foreground)] py-8">იტვირთება...</p>
      ) : (
        <Card>
          <CardContent className="pt-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">სახელი</th>
                  <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">მიზანი</th>
                  <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">წონა</th>
                  <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">გეგმა</th>
                  <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">რეგ. თარიღი</th>
                  <th className="text-left py-3 px-2 font-medium text-[var(--muted-foreground)]">მოქმედება</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)] transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          {user.is_admin && <Badge variant="warning" className="text-xs">ადმინ</Badge>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-[var(--muted-foreground)]">{GOAL_LABELS[user.goal] || user.goal}</td>
                    <td className="py-3 px-2">{user.weight_kg ? `${user.weight_kg} კგ` : '—'}</td>
                    <td className="py-3 px-2">
                      <Badge variant={PLAN_COLORS[user.plan] || 'default'}>
                        {user.plan}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-[var(--muted-foreground)]">
                      {new Date(user.created_at).toLocaleDateString('ka-GE')}
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={user.plan}
                        onChange={e => changePlan(user.id, e.target.value)}
                        disabled={updating === user.id}
                        className="input-field w-auto text-xs py-1 px-2"
                      >
                        {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
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
