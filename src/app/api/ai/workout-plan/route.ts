import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { openaiClient } from '@/lib/openai/client'
import {
  buildWorkoutShellPrompt,
  buildWorkoutDayPrompt,
} from '@/lib/openai/prompts'
import { connectDB } from '@/lib/mongodb/mongoose'
import { Profile } from '@/lib/mongodb/models/Profile'
import { WorkoutProgram } from '@/lib/mongodb/models/WorkoutProgram'
import type { Profile as ProfileType } from '@/types/profile'
import type { WorkoutDay } from '@/types/workout'

export const maxDuration = 300

const MODEL = 'google/gemini-2.5-flash-lite'
const SYSTEM = `შენ ხარ ელიტარული Strength & Conditioning კოჩი, NSCA CSCS სერტიფიცირებული. მეთოდოლოგია: COMPOUND-FIRST, PROGRESSIVE OVERLOAD, PERIODIZATION. სტილი: პირდაპირი, პრაქტიკული, მტკიცებულებებზე დაფუძნებული. პასუხობ მხოლოდ ვალიდური JSON ფორმატით ქართულ ენაზე.`

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

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type } = await request.json()

  await connectDB()
  const userId = session.user.id
  const profileDoc = await Profile.findOne({ userId }).lean()
  if (!profileDoc) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  const profile = profileDoc as unknown as ProfileType

  // Cooldown: reject rapid re-generation (double-click / spam) of the same type.
  const lastProgram = await WorkoutProgram.findOne({ userId, type }).sort({ createdAt: -1 }).select('createdAt').lean()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (lastProgram && Date.now() - new Date((lastProgram as any).createdAt).getTime() < 20000) {
    return NextResponse.json({ error: 'ძალიან ხშირი მოთხოვნა — სცადე 20 წამში' }, { status: 429 })
  }

  try {
    // 1. Program shell: metadata + 7 day headers, no exercises.
    const shell = await jsonCall(buildWorkoutShellPrompt(profile, type), 3000)
    if (!shell?.days?.length) {
      return NextResponse.json({ error: 'AI returned invalid format' }, { status: 502 })
    }

    // 2. Fill each workout day's exercises in parallel (rest days stay empty).
    const days: WorkoutDay[] = shell.days
    await Promise.all(
      days.map(async (day) => {
        if (day.is_rest) {
          day.exercises = day.exercises ?? []
          return
        }
        const prompt = buildWorkoutDayPrompt(profile, type, day.day_name, day.muscle_groups ?? [])
        let res = await jsonCall(prompt, 4000)
        if (!res?.exercises) res = await jsonCall(prompt, 4000) // one retry
        day.exercises = Array.isArray(res?.exercises) ? res.exercises : []
      })
    )

    // Fail if no workout day got exercises — better a clean error than an empty program.
    const hasExercises = days.some(d => !d.is_rest && (d.exercises?.length ?? 0) > 0)
    if (!hasExercises) {
      return NextResponse.json({ error: 'AI generation incomplete' }, { status: 502 })
    }

    const saved = await WorkoutProgram.create({
      userId, type,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      level: (profile as any).experience,
      content: shell,
      is_active: true,
    })
    await WorkoutProgram.updateMany({ userId, type, _id: { $ne: saved._id } }, { is_active: false })

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
