import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { openaiClient } from '@/lib/openai/client'
import { buildMealPlanPrompt } from '@/lib/openai/prompts'
import { connectDB } from '@/lib/mongodb/mongoose'
import { Profile } from '@/lib/mongodb/models/Profile'
import { MealPlan } from '@/lib/mongodb/models/MealPlan'
import { WorkoutProgram } from '@/lib/mongodb/models/WorkoutProgram'
import type { Profile as ProfileType } from '@/types/profile'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type } = await request.json()
  const days = type === '30day' ? 30 : 7

  await connectDB()
  const userId = session.user.id
  const [profile, workout] = await Promise.all([
    Profile.findOne({ userId }).lean(),
    WorkoutProgram.findOne({ userId, is_active: true }).lean(),
  ])
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const workoutRoutine = workout
    ? `${(workout as any).content?.name} — ${(workout as any).content?.split_type}, ${(workout as any).content?.days_per_week} ვარჯიში/კვირა`
    : undefined

  try {
    const prompt = buildMealPlanPrompt(profile as unknown as ProfileType, days, workoutRoutine)
    const completion = await openaiClient.chat.completions.create({
      model: 'google/gemini-2.5-flash-lite',
      messages: [
        {
          role: 'system',
          content: 'შენ ხარ კლინიკური დიეტოლოგი ISSN სერტიფიკატით. სპეციალიზაცია: სპორტული კვება, ჰორმონალური ოპტიმიზაცია, ქართული სამზარეულო. პასუხობ მხოლოდ ვალიდური JSON ფორმატით — არანაირი ტექსტი JSON-ის გარეთ.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: days === 7 ? 6000 : 12000,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) return NextResponse.json({ error: 'AI error' }, { status: 500 })

    let planData
    try {
      planData = JSON.parse(content)
    } catch {
      return NextResponse.json({ error: 'AI returned invalid format' }, { status: 502 })
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
