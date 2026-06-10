import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { buildChatSystemPrompt } from '@/lib/openai/prompts'
import { containsMedicalQuery, SAFETY_RESPONSE } from '@/lib/openai/safety'
import type { Profile } from '@/types/profile'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { messages } = await request.json()
  const lastMessage = (messages[messages.length - 1]?.content as string) || ''

  // Medical safety check
  if (containsMedicalQuery(lastMessage)) {
    return new Response(SAFETY_RESPONSE, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  // Load user context in parallel
  const [{ data: profile }, { data: mealPlans }, { data: workoutPrograms }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('meal_plans').select('id, type, content, user_id, is_active, created_at').eq('user_id', user.id).eq('is_active', true).limit(1),
    supabase.from('workout_programs').select('id, type, level, content, user_id, is_active, created_at').eq('user_id', user.id).eq('is_active', true).limit(1),
  ])

  if (!profile) return new Response('Profile not found', { status: 404 })

  const systemPrompt = buildChatSystemPrompt(
    profile as Profile,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mealPlans?.[0] as any) || null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (workoutPrograms?.[0] as any) || null
  )

  // Save user message
  supabase.from('chat_messages').insert({
    user_id: user.id,
    role: 'user',
    content: lastMessage,
  }).then(() => {})

  const result = streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages: messages.slice(-10),
    maxOutputTokens: 1000,
    onFinish: async ({ text }) => {
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        role: 'assistant',
        content: text,
      })
    },
  })

  return result.toTextStreamResponse()
}
