import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/mongoose'
import { Profile } from '@/lib/mongodb/models/Profile'
import { calculateBMR } from '@/lib/calculations/bmr'
import { calculateTDEE } from '@/lib/calculations/tdee'
import { calculateMacros } from '@/lib/calculations/macros'
import type { Profile as ProfileType } from '@/types/profile'

export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = await Profile.findOne({ userId: session.user.id }).lean() as any
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const bmr = calculateBMR(profile as ProfileType)
  const tdee = calculateTDEE(bmr, profile.activity_level)
  const macros = calculateMacros(tdee, profile.goal, profile.gender)

  await Profile.findOneAndUpdate({ userId: session.user.id }, { bmr, tdee, ...macros })

  return NextResponse.json({ bmr, tdee, ...macros })
}
