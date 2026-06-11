import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { openaiClient } from '@/lib/openai/client'
import { buildNutritionAnalysisPrompt } from '@/lib/openai/prompts'
import { connectDB } from '@/lib/mongodb/mongoose'
import { Profile } from '@/lib/mongodb/models/Profile'
import { FoodDiary } from '@/lib/mongodb/models/FoodDiary'
import type { Profile as ProfileType } from '@/types/profile'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  await connectDB()
  const userId = session.user.id

  const [profile, entries] = await Promise.all([
    Profile.findOne({ userId }).lean(),
    FoodDiary.find({ userId, date }).lean(),
  ])

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(entries as any[]).length) return NextResponse.json({ analysis: 'დღიური ცარიელია — დაამატე საკვები პირველ რიგში!' })

  try {
    const prompt = buildNutritionAnalysisPrompt(
      profile as unknown as ProfileType,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      entries as any[]
    )
    const completion = await openaiClient.chat.completions.create({
      model: 'google/gemini-2.5-flash-lite',
      messages: [
        { role: 'system', content: 'შენ ხარ AI კვების სპეციალისტი. პასუხობ ქართულად.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 400,
    })
    const analysis = completion.choices[0]?.message?.content || 'ვერ ვაანალიზე.'
    return NextResponse.json({ analysis })
  } catch (err) {
    console.error('Nutrition analysis error:', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
