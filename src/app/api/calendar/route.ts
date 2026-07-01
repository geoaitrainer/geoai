import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/mongoose'
import { MealPlan } from '@/lib/mongodb/models/MealPlan'
import { WorkoutProgram } from '@/lib/mongodb/models/WorkoutProgram'
import { FoodDiary } from '@/lib/mongodb/models/FoodDiary'
import { ProgressEntry } from '@/lib/mongodb/models/ProgressEntry'

interface LeanDoc {
  type?: string
  createdAt?: Date
  content?: {
    days_per_week?: number
    days?: unknown[]
  }
}

interface DateDoc { date: string }

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rawMonth = request.nextUrl.searchParams.get('month') || new Date().toISOString().slice(0, 7)
  const month = rawMonth.replace(/[^0-9-]/g, '').slice(0, 7)
  await connectDB()
  const userId = session.user.id

  const [mealPlan, workout, diaryEntries, progressEntries] = await Promise.all([
    MealPlan.findOne({ userId, is_active: true }).sort({ createdAt: -1 }).lean() as Promise<LeanDoc | null>,
    WorkoutProgram.findOne({ userId, is_active: true }).sort({ createdAt: -1 }).lean() as Promise<LeanDoc | null>,
    FoodDiary.find({ userId, date: { $regex: `^${month}` } }).select('date').lean() as Promise<DateDoc[]>,
    ProgressEntry.find({ userId, date: { $regex: `^${month}` } }).select('date').lean() as Promise<DateDoc[]>,
  ])

  const diaryDates = Array.from(new Set(diaryEntries.map(e => e.date)))
  const progressDates = Array.from(new Set(progressEntries.map(e => e.date)))

  return NextResponse.json({
    meal_plan: mealPlan ? {
      type: mealPlan.type,
      created_at: mealPlan.createdAt,
      days: mealPlan.content?.days || [],
    } : null,
    workout: workout ? {
      days_per_week: workout.content?.days_per_week || 4,
      created_at: workout.createdAt,
      days: workout.content?.days || [],
    } : null,
    diary_dates: diaryDates,
    progress_dates: progressDates,
  })
}
