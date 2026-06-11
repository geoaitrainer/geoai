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
  const saved = await ProgressEntry.create({ ...body, userId })

  const [profile, entries] = await Promise.all([
    Profile.findOne({ userId }).lean(),
    ProgressEntry.find({ userId }).sort({ date: 1 }).select('date weight_kg').lean(),
  ])

  if (profile && entries.length >= 2) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prompt = buildProgressReviewPrompt(profile as unknown as ProfileType, entries as any[])
      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
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
