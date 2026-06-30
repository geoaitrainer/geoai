import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/mongoose'
import { User } from '@/lib/mongodb/models/User'
import { Profile } from '@/lib/mongodb/models/Profile'
import { MealPlan } from '@/lib/mongodb/models/MealPlan'
import { WorkoutProgram } from '@/lib/mongodb/models/WorkoutProgram'
import { sendDailyPlanEmail } from '@/lib/email/nodemailer'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  const activePlans = await MealPlan.find({ is_active: true }).lean() as Array<{
    userId: string
    content: { days: DayMeals[] }
    createdAt: Date
  }>

  let sent = 0
  const errors: string[] = []
  const today = new Date()

  for (const plan of activePlans) {
    try {
      const userId = plan.userId
      const [user, profile, workout] = await Promise.all([
        User.findOne({ _id: userId }).lean() as Promise<{ email: string; name?: string } | null>,
        Profile.findOne({ userId }).lean() as Promise<ProfileLean | null>,
        WorkoutProgram.findOne({ userId, is_active: true }).lean() as Promise<WorkoutLean | null>,
      ])

      if (!user?.email) continue

      const days = plan.content?.days ?? []
      if (!days.length) continue

      const planCreatedAt = new Date(plan.createdAt)
      const daysSince = Math.floor((today.getTime() - planCreatedAt.getTime()) / (24 * 60 * 60 * 1000))
      const mealDay = days[daysSince % days.length]

      let workoutDay: WorkoutDayResult = null
      if (workout?.content) {
        const daysPerWeek = workout.content.days_per_week ?? 3
        const workoutDays = workout.content.days ?? []
        const wDaysSince = Math.floor((today.getTime() - new Date(workout.createdAt).getTime()) / (24 * 60 * 60 * 1000))
        const cycleDay = wDaysSince % 7
        workoutDay = cycleDay < daysPerWeek && workoutDays[cycleDay]
          ? { isRest: false, day: workoutDays[cycleDay] }
          : { isRest: true, day: null }
      }

      await sendDailyPlanEmail(user.email, user.name ?? 'მომხმარებელი', mealDay, workoutDay, profile)
      sent++
    } catch (err) {
      errors.push(String(err))
    }
  }

  return NextResponse.json({ ok: true, sent, errors: errors.length ? errors : undefined })
}

// ── Local types ───────────────────────────────────────────────────────────────

type WorkoutDayResult = { isRest: boolean; day: WorkoutDay | null } | null

interface DayMeals {
  day: number
  day_name: string
  meals: {
    breakfast: Meal
    lunch: Meal
    dinner: Meal
    snack: Meal
  }
  total_calories: number
  total_protein_g: number
  total_fat_g: number
  total_carbs_g: number
}

interface Meal {
  name: string
  calories: number
  protein_g: number
  fat_g: number
  carbs_g: number
  recipe?: string
}

interface WorkoutDay {
  day_number: number
  day_name: string
  exercises: Exercise[]
  warmup?: string
  cooldown?: string
  duration_minutes?: number
}

interface Exercise {
  name: string
  sets: number
  reps: string
  rest_seconds?: number
  notes?: string
  weight_suggestion?: string
}

interface ProfileLean {
  name?: string
  calorie_goal?: number
  protein_g?: number
  fat_g?: number
  carbs_g?: number
}

interface WorkoutLean {
  createdAt: Date
  content: {
    name: string
    days_per_week: number
    days: WorkoutDay[]
  }
}
