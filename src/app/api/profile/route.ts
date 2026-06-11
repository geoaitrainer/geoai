import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/mongoose'
import { Profile } from '@/lib/mongodb/models/Profile'
import { calculateBMR } from '@/lib/calculations/bmr'
import { calculateTDEE } from '@/lib/calculations/tdee'
import { calculateMacros } from '@/lib/calculations/macros'
import type { Profile as ProfileType } from '@/types/profile'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const profile = await Profile.findOne({ userId: session.user.id }).lean()
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(JSON.parse(JSON.stringify(profile)))
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const bmr = calculateBMR(body as ProfileType)
  const tdee = calculateTDEE(bmr, body.activity_level)
  const macros = calculateMacros(tdee, body.goal, body.gender)

  await connectDB()
  const profile = await Profile.findOneAndUpdate(
    { userId: session.user.id },
    { ...body, bmr, tdee, ...macros },
    { new: true, upsert: true }
  ).lean()

  return NextResponse.json(JSON.parse(JSON.stringify(profile)))
}
