import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { openaiClient } from '@/lib/openai/client'
import { buildProgressReviewPrompt } from '@/lib/openai/prompts'
import type { Profile } from '@/types/profile'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('progress_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const { data: saved, error } = await supabase
    .from('progress_entries')
    .insert({ ...body, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-generate AI review if enough data (async, don't wait)
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: entries } = await supabase
    .from('progress_entries')
    .select('date, weight_kg')
    .eq('user_id', user.id)
    .order('date', { ascending: true })

  if (profile && entries && entries.length >= 2) {
    try {
      const prompt = buildProgressReviewPrompt(profile as Profile, entries)
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
        await supabase.from('progress_entries').update({ ai_review: review }).eq('id', saved.id)
      }
    } catch {}
  }

  return NextResponse.json(saved, { status: 201 })
}
