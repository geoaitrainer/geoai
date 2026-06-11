import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { openaiClient } from '@/lib/openai/client'
import { buildWorkoutPlanPrompt } from '@/lib/openai/prompts'
import { connectDB } from '@/lib/mongodb/mongoose'
import { Profile } from '@/lib/mongodb/models/Profile'
import { WorkoutProgram } from '@/lib/mongodb/models/WorkoutProgram'
import type { Profile as ProfileType } from '@/types/profile'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type } = await request.json()

  await connectDB()
  const userId = session.user.id
  const profile = await Profile.findOne({ userId }).lean()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  try {
    const prompt = buildWorkoutPlanPrompt(profile as unknown as ProfileType, type)
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'შენ ხარ პერსონალური ტრენერი. პასუხობ JSON ფორმატით.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) return NextResponse.json({ error: 'AI error' }, { status: 500 })

    const programData = JSON.parse(content)

    await WorkoutProgram.updateMany({ userId, type }, { is_active: false })
    const saved = await WorkoutProgram.create({
      userId, type,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      level: (profile as any).experience,
      content: programData,
      is_active: true,
    })

    return NextResponse.json(JSON.parse(JSON.stringify(saved)))
  } catch (err) {
    console.error('Workout plan error:', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const program = await WorkoutProgram.findOne({ userId: session.user.id, is_active: true })
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json(program ? JSON.parse(JSON.stringify(program)) : null)
}
