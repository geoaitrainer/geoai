import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { openaiClient } from '@/lib/openai/client'
import { buildMealPlanPrompt } from '@/lib/openai/prompts'
import { connectDB } from '@/lib/mongodb/mongoose'
import { Profile } from '@/lib/mongodb/models/Profile'
import { MealPlan } from '@/lib/mongodb/models/MealPlan'
import type { Profile as ProfileType } from '@/types/profile'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type } = await request.json()
  const days = type === '30day' ? 30 : 7

  await connectDB()
  const userId = session.user.id
  const profile = await Profile.findOne({ userId }).lean()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  try {
    const prompt = buildMealPlanPrompt(profile as unknown as ProfileType, days)
    const completion = await openaiClient.chat.completions.create({
      model: 'google/gemini-2.5-flash-lite',
      messages: [
        { role: 'system', content: 'შენ ხარ კვების სპეციალისტი. პასუხობ მხოლოდ ვალიდური JSON ფორმატით.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: days === 7 ? 4000 : 8000,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) return NextResponse.json({ error: 'AI error' }, { status: 500 })

    const planData = JSON.parse(content)

    await MealPlan.updateMany({ userId, type }, { is_active: false })
    const saved = await MealPlan.create({ userId, type, content: planData, is_active: true })

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
