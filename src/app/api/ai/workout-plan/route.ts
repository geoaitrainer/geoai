import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { openaiClient } from '@/lib/openai/client'
import { buildWorkoutPlanPrompt } from '@/lib/openai/prompts'
import type { Profile } from '@/types/profile'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type } = await request.json()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  try {
    const prompt = buildWorkoutPlanPrompt(profile as Profile, type)
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

    await supabase
      .from('workout_programs')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('type', type)

    const { data: saved, error: saveError } = await supabase
      .from('workout_programs')
      .insert({
        user_id: user.id,
        type,
        level: profile.experience,
        content: programData,
        is_active: true,
      })
      .select()
      .single()

    if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 })
    return NextResponse.json(saved)
  } catch (err) {
    console.error('Workout plan error:', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('workout_programs')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)

  return NextResponse.json(data?.[0] || null)
}
