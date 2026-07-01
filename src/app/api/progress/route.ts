import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/mongoose'
import { Profile } from '@/lib/mongodb/models/Profile'
import { ProgressEntry } from '@/lib/mongodb/models/ProgressEntry'
import { openaiClient } from '@/lib/openai/client'
import { buildProgressReviewPrompt } from '@/lib/openai/prompts'
import type { Profile as ProfileType } from '@/types/profile'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const entries = await ProgressEntry.find({ userId: session.user.id })
    .sort({ date: -1 })
    .limit(50)
    .lean()

  return NextResponse.json(JSON.parse(JSON.stringify(entries)))
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  await connectDB()
  const userId = session.user.id
  const { date, weight_kg, body_fat_percent, muscle_mass_kg, notes, chest_cm, waist_cm, hips_cm, bicep_cm } = body
  const saved = await ProgressEntry.create({
    userId,
    date,
    weight_kg: weight_kg !== undefined ? Number(weight_kg) : undefined,
    body_fat_percent: body_fat_percent !== undefined ? Number(body_fat_percent) : undefined,
    muscle_mass_kg: muscle_mass_kg !== undefined ? Number(muscle_mass_kg) : undefined,
    chest_cm: chest_cm !== undefined ? Number(chest_cm) : undefined,
    waist_cm: waist_cm !== undefined ? Number(waist_cm) : undefined,
    hips_cm: hips_cm !== undefined ? Number(hips_cm) : undefined,
    bicep_cm: bicep_cm !== undefined ? Number(bicep_cm) : undefined,
    notes,
  })

  const [profile, entries] = await Promise.all([
    Profile.findOne({ userId }).lean(),
    ProgressEntry.find({ userId }).sort({ date: 1 }).select('date weight_kg').lean(),
  ])

  if (profile && entries.length >= 2) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prompt = buildProgressReviewPrompt(profile as unknown as ProfileType, entries as any[])
      const completion = await openaiClient.chat.completions.create({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: 'შენ ხარ AI პირადი ტრენერი. პასუხობ ქართულად.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 400,
      })
      const review = completion.choices[0]?.message?.content
      if (review) {
        await ProgressEntry.findByIdAndUpdate(saved._id, { ai_review: review })
      }
    } catch {}
  }

  return NextResponse.json(JSON.parse(JSON.stringify(saved)), { status: 201 })
}
