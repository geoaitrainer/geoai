import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/mongoose'
import { Profile } from '@/lib/mongodb/models/Profile'
import { MealPlan } from '@/lib/mongodb/models/MealPlan'
import { WorkoutProgram } from '@/lib/mongodb/models/WorkoutProgram'
import { FoodDiary } from '@/lib/mongodb/models/FoodDiary'
import { ChatMessage } from '@/lib/mongodb/models/ChatMessage'

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

  const [totalUsers, proUsers, mealPlans, workoutPrograms, diaryEntries, chatMessages] =
    await Promise.all([
      Profile.countDocuments(),
      Profile.countDocuments({ plan: { $ne: 'free' } }),
      MealPlan.countDocuments(),
      WorkoutProgram.countDocuments(),
      FoodDiary.countDocuments(),
      ChatMessage.countDocuments(),
    ])

  return NextResponse.json({ totalUsers, proUsers, mealPlans, workoutPrograms, diaryEntries, chatMessages })
}
