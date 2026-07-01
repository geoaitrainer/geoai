import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/mongoose'
import { Profile } from '@/lib/mongodb/models/Profile'
import { User } from '@/lib/mongodb/models/User'
import { MealPlan } from '@/lib/mongodb/models/MealPlan'
import { WorkoutProgram } from '@/lib/mongodb/models/WorkoutProgram'
import { FoodDiary } from '@/lib/mongodb/models/FoodDiary'
import { ProgressEntry } from '@/lib/mongodb/models/ProgressEntry'
import { ChatMessage } from '@/lib/mongodb/models/ChatMessage'
import { calculateBMR } from '@/lib/calculations/bmr'
import { calculateTDEE } from '@/lib/calculations/tdee'
import { calculateMacros } from '@/lib/calculations/macros'
import bcrypt from 'bcryptjs'
import type { ActivityLevel, Goal, Gender } from '@/types/profile'

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
    created_at: p.createdAt,
  }))

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const isAdmin = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await request.json()
  const {
    name, email, password,
    age = 25, gender = 'male', height_cm = 170, weight_kg = 70,
    goal = 'maintain', activity_level = 'moderate',
  } = body

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: 'სახელი, ელ-ფოსტა და პაროლი აუცილებელია' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'პაროლი მინიმუმ 6 სიმბოლო' }, { status: 400 })
  }

  await connectDB()

  const existing = await User.findOne({ email: email.trim().toLowerCase() })
  if (existing) return NextResponse.json({ error: 'ელ-ფოსტა უკვე გამოყენებულია' }, { status: 409 })

  const hashedPassword = await bcrypt.hash(password, 12)
  const newUser = await User.create({
    email: email.trim().toLowerCase(),
    name: name.trim(),
    hashedPassword,
  })

  const userId = newUser._id.toString()
  const bmr = calculateBMR({ weight_kg: Number(weight_kg), height_cm: Number(height_cm), age: Number(age), gender: gender as Gender })
  const tdee = calculateTDEE(bmr, activity_level as ActivityLevel)
  const macros = calculateMacros(tdee, goal as Goal, gender as Gender)

  await Profile.create({
    userId,
    name: name.trim(),
    age: Number(age),
    gender,
    height_cm: Number(height_cm),
    weight_kg: Number(weight_kg),
    goal,
    activity_level,
    experience: 'beginner',
    work_type: 'desk',
    plan: 'free',
    bmr,
    tdee,
    ...macros,
  })

  return NextResponse.json({ success: true, userId }, { status: 201 })
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

export async function DELETE(request: NextRequest) {
  const isAdmin = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  await connectDB()
  const { isValidObjectId } = await import('mongoose')
  if (!isValidObjectId(userId)) return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })

  // Prevent self-deletion
  const session = await auth()
  if (session?.user?.id === userId) {
    return NextResponse.json({ error: 'საკუთარი ანგარიშის წაშლა შეუძლებელია' }, { status: 400 })
  }

  await Promise.all([
    User.deleteOne({ _id: userId }),
    Profile.deleteOne({ userId }),
    MealPlan.deleteMany({ userId }),
    WorkoutProgram.deleteMany({ userId }),
    FoodDiary.deleteMany({ userId }),
    ProgressEntry.deleteMany({ userId }),
    ChatMessage.deleteMany({ userId }),
  ])

  return NextResponse.json({ success: true })
}
