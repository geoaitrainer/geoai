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
  const isDev = process.env.NODE_ENV === 'development'
  if (!isDev && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  // Iterate all registered users
  const users = await User.find({}).lean() as Array<{ _id: unknown; email: string; name?: string }>

  let sent = 0
  const errors: string[] = []
  const today = new Date()

  for (const user of users) {
    try {
      if (!user.email) continue

      const userId = String(user._id)

      const [profile, mealPlan, workout] = await Promise.all([
        Profile.findOne({ userId }).lean() as Promise<ProfileLean | null>,
        MealPlan.findOne({ userId, is_active: true }).lean() as Promise<MealPlanLean | null>,
        WorkoutProgram.findOne({ userId, is_active: true }).lean() as Promise<WorkoutLean | null>,
      ])

      // Resolve today's meal
      let mealDay: DayMeals | null = null
      if (mealPlan?.content?.days?.length) {
        const daysSince = Math.floor(
          (today.getTime() - new Date(mealPlan.createdAt).getTime()) / (24 * 60 * 60 * 1000)
        )
        mealDay = mealPlan.content.days[daysSince % mealPlan.content.days.length] ?? null
      }

      // Resolve today's workout
      let workoutDay: WorkoutDayResult = null
      if (workout?.content) {
        const daysPerWeek = workout.content.days_per_week ?? 3
        const workoutDays = workout.content.days ?? []
        const wDaysSince = Math.floor(
          (today.getTime() - new Date(workout.createdAt).getTime()) / (24 * 60 * 60 * 1000)
        )
        const cycleDay = wDaysSince % 7
        workoutDay = cycleDay < daysPerWeek && workoutDays[cycleDay]
          ? { isRest: false, day: workoutDays[cycleDay] }
          : { isRest: true, day: null }
      }

      // Send even if no plan yet (welcome / reminder email)
      await sendDailyPlanEmail(user.email, user.name ?? profile?.name ?? 'მომხმარებელი', mealDay, workoutDay, profile)
      sent++
    } catch (err) {
      errors.push(`${user.email}: ${String(err)}`)
    }
  }

  return NextResponse.json({ ok: true, sent, errors: errors.length ? errors : undefined })
}

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface MealPlanLean {
  createdAt: Date
  content: { days: DayMeals[] }
}

interface WorkoutLean {
  createdAt: Date
  content: {
    name: string
    days_per_week: number
    days: WorkoutDay[]
  }
}
