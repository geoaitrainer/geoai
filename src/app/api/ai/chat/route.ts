import { auth } from '@/auth'
import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { connectDB } from '@/lib/mongodb/mongoose'
import { Profile } from '@/lib/mongodb/models/Profile'
import { MealPlan } from '@/lib/mongodb/models/MealPlan'
import { WorkoutProgram } from '@/lib/mongodb/models/WorkoutProgram'
import { ChatMessage } from '@/lib/mongodb/models/ChatMessage'
import { buildChatSystemPrompt } from '@/lib/openai/prompts'
import { containsMedicalQuery, SAFETY_RESPONSE } from '@/lib/openai/safety'
import type { Profile as ProfileType } from '@/types/profile'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return new Response('Unauthorized', { status: 401 })

  const { messages } = await request.json()
  const lastMessage = (messages[messages.length - 1]?.content as string) || ''

  if (containsMedicalQuery(lastMessage)) {
    return new Response(SAFETY_RESPONSE, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  await connectDB()
  const userId = session.user.id

  const [profile, activeMealPlan, activeWorkout] = await Promise.all([
    Profile.findOne({ userId }).lean(),
    MealPlan.findOne({ userId, is_active: true }).lean(),
    WorkoutProgram.findOne({ userId, is_active: true }).lean(),
  ])

  if (!profile) return new Response('Profile not found', { status: 404 })

  const systemPrompt = buildChatSystemPrompt(
    profile as unknown as ProfileType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (activeMealPlan as any) || null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (activeWorkout as any) || null
  )

  ChatMessage.create({ userId, role: 'user', content: lastMessage }).catch(() => {})

  const result = streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages: messages.slice(-10),
    maxOutputTokens: 1000,
    onFinish: async ({ text }) => {
      await ChatMessage.create({ userId, role: 'assistant', content: text })
    },
  })

  return result.toTextStreamResponse()
}
