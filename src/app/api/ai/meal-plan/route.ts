import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { openaiClient } from '@/lib/openai/client'
import {
  buildSingleDayMealPrompt,
  buildMealSummaryPrompt,
  MEAL_WEEKDAYS,
} from '@/lib/openai/prompts'
import { connectDB } from '@/lib/mongodb/mongoose'
import { Profile } from '@/lib/mongodb/models/Profile'
import { MealPlan } from '@/lib/mongodb/models/MealPlan'
import { WorkoutProgram } from '@/lib/mongodb/models/WorkoutProgram'
import type { Profile as ProfileType } from '@/types/profile'
import type { DayPlan, Meal } from '@/types/nutrition'

// Day-by-day generation of a 30-day plan can take over a minute; allow room.
export const maxDuration = 300

const MODEL = 'google/gemini-2.5-flash-lite'
const SYSTEM = 'შენ ხარ კლინიკური დიეტოლოგი ISSN სერტიფიკატით. სპეციალიზაცია: სპორტული კვება, ჰორმონალური ოპტიმიზაცია, ქართული სამზარეულო. პასუხობ მხოლოდ ვალიდური JSON ფორმატით — არანაირი ტექსტი JSON-ის გარეთ.'
const CONCURRENCY = 6

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function jsonCall(prompt: string, maxTokens: number): Promise<any | null> {
  const completion = await openaiClient.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    max_tokens: maxTokens,
  })
  const content = completion.choices[0]?.message?.content
  if (!content || completion.choices[0]?.finish_reason === 'length') return null
  try {
    return JSON.parse(content)
  } catch {
    return null
  }
}

// Run tasks with a bounded concurrency so we don't hammer the provider.
async function pool<TItem, TOut>(
  items: TItem[],
  limit: number,
  worker: (item: TItem, index: number) => Promise<TOut>,
): Promise<TOut[]> {
  const out: TOut[] = new Array(items.length)
  let cursor = 0
  async function run() {
    while (cursor < items.length) {
      const i = cursor++
      out[i] = await worker(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run))
  return out
}

function collectIngredients(day: DayPlan): string[] {
  const meals = day.meals as Record<string, Meal | undefined>
  return Object.values(meals)
    .filter(Boolean)
    .flatMap(m => (m as Meal).ingredients ?? [])
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type } = await request.json()
  const days = type === '30day' ? 30 : 7

  await connectDB()
  const userId = session.user.id
  const [profileDoc, workout] = await Promise.all([
    Profile.findOne({ userId }).lean(),
    WorkoutProgram.findOne({ userId, is_active: true }).lean(),
  ])
  if (!profileDoc) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  const profile = profileDoc as unknown as ProfileType

  // Cooldown: reject rapid re-generation (double-click / spam) of the same type.
  const lastPlan = await MealPlan.findOne({ userId, type }).sort({ createdAt: -1 }).select('createdAt').lean()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (lastPlan && Date.now() - new Date((lastPlan as any).createdAt).getTime() < 20000) {
    return NextResponse.json({ error: 'ძალიან ხშირი მოთხოვნა — სცადე 20 წამში' }, { status: 429 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = workout as any
  const workoutRoutine = w?.content
    ? `${w.content.name} — ${w.content.split_type}, ${w.content.days_per_week} ვარჯიში/კვირა`
    : undefined

  try {
    // 1. Generate each day independently (bounded parallelism). One retry per day.
    const dayNumbers = Array.from({ length: days }, (_, i) => i + 1)
    const generated = await pool(dayNumbers, CONCURRENCY, async (dayNum) => {
      const dayName = MEAL_WEEKDAYS[(dayNum - 1) % 7]
      const prompt = buildSingleDayMealPrompt(profile, dayNum, dayName, workoutRoutine)
      let day = await jsonCall(prompt, 3000)
      if (!day) day = await jsonCall(prompt, 3000) // one retry
      return (day && day.meals) ? (day as DayPlan) : null
    })

    const validDays = generated.filter((d): d is DayPlan => d !== null)
    // If most days failed, treat as a generation failure rather than saving a stub.
    if (validDays.length < Math.ceil(days / 2)) {
      return NextResponse.json({ error: 'AI generation incomplete' }, { status: 502 })
    }

    // 2. Aggregate ingredients → shopping list + clinical notes (one small call).
    const allIngredients = validDays.flatMap(collectIngredients)
    const summary = await jsonCall(
      buildMealSummaryPrompt(profile, validDays.length, allIngredients, workoutRoutine),
      3000,
    )

    const planData = {
      days: validDays,
      shopping_list: summary?.shopping_list ?? [],
      clinical_and_lifestyle_notes: summary?.clinical_and_lifestyle_notes ?? '',
    }

    const saved = await MealPlan.create({ userId, type, content: planData, is_active: true })
    await MealPlan.updateMany({ userId, type, _id: { $ne: saved._id } }, { is_active: false })

    return NextResponse.json(JSON.parse(JSON.stringify(saved)))
  } catch (err) {
    console.error('Meal plan generation error:', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const plans = await MealPlan.find({ userId: session.user.id, is_active: true })
    .sort({ createdAt: -1 })
    .limit(2)
    .lean()

  return NextResponse.json(JSON.parse(JSON.stringify(plans)))
}
