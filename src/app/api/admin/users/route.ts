import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/mongoose'
import { Profile } from '@/lib/mongodb/models/Profile'
import { User } from '@/lib/mongodb/models/User'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) return false
  await connectDB()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = await Profile.findOne({ userId: session.user.id }).lean() as any
  return !!profile?.is_admin
}

export async function GET() {
  const isAdmin = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const profiles = await Profile.find().sort({ createdAt: -1 }).lean()
  const users = await User.find().select('email').lean()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emailMap = Object.fromEntries(users.map((u: any) => [u._id.toString(), u.email]))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = profiles.map((p: any) => ({
    id: p._id.toString(),
    userId: p.userId,
    name: p.name,
    email: emailMap[p.userId] || '',
    goal: p.goal,
    plan: p.plan,
    is_admin: p.is_admin,
    weight_kg: p.weight_kg,
    calorie_goal: p.calorie_goal,
    createdAt: p.createdAt,
  }))

  return NextResponse.json(result)
}

export async function PUT(request: NextRequest) {
  const isAdmin = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id, plan } = await request.json()
  if (!id || !plan) return NextResponse.json({ error: 'id and plan required' }, { status: 400 })

  const profile = await Profile.findOneAndUpdate({ userId: id }, { plan }, { new: true }).lean()
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(JSON.parse(JSON.stringify(profile)))
}
