import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { openaiClient } from '@/lib/openai/client'
import { buildMealPlanPrompt } from '@/lib/openai/prompts'
import type { Profile } from '@/types/profile'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type } = await request.json()
  const days = type === '30day' ? 30 : 7

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  try {
    const prompt = buildMealPlanPrompt(profile as Profile, days)
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'შენ ხარ კვების სპეციალისტი. პასუხობ მხოლოდ ვალიდური JSON ფორმატით.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: days === 7 ? 4000 : 8000,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) return NextResponse.json({ error: 'AI error' }, { status: 500 })

    const planData = JSON.parse(content)

    // Deactivate old plans
    await supabase
      .from('meal_plans')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('type', type)

    // Save new plan
    const { data: savedPlan, error: saveError } = await supabase
      .from('meal_plans')
      .insert({
        user_id: user.id,
        type,
        content: planData,
        is_active: true,
      })
      .select()
      .single()

    if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 })
    return NextResponse.json(savedPlan)
  } catch (err) {
    console.error('Meal plan generation error:', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(2)

  return NextResponse.json(data || [])
}
