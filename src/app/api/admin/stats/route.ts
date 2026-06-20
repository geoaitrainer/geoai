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

  // Last 14 days registration trend
  const since = new Date()
  since.setDate(since.getDate() - 13)
  const recentUsers = await Profile.find({ createdAt: { $gte: since } })
    .select('createdAt').lean() as { createdAt: Date }[]

  const dayMap: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dayMap[d.toISOString().split('T')[0]] = 0
  }
  recentUsers.forEach(u => {
    const key = new Date(u.createdAt).toISOString().split('T')[0]
    if (key in dayMap) dayMap[key]++
  })
  const registrationTrend = Object.entries(dayMap).map(([date, count]) => ({ date, count }))

  // Last 14 days AI chat messages
  const recentChats = await ChatMessage.find({ createdAt: { $gte: since }, role: 'user' })
    .select('createdAt').lean() as { createdAt: Date }[]
  const chatMap: Record<string, number> = {}
  Object.keys(dayMap).forEach(k => { chatMap[k] = 0 })
  recentChats.forEach(m => {
    const key = new Date(m.createdAt).toISOString().split('T')[0]
    if (key in chatMap) chatMap[key]++
  })
  const chatTrend = Object.entries(chatMap).map(([date, count]) => ({ date, count }))

  // Plan distribution
  const planDist = await Profile.aggregate([
    { $group: { _id: '$plan', count: { $sum: 1 } } }
  ])

  return NextResponse.json({
    totalUsers, proUsers, mealPlans, workoutPrograms, diaryEntries, chatMessages,
    registrationTrend, chatTrend, planDist,
  })
}
