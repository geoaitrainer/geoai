import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { calculateBMR } from '@/lib/calculations/bmr'
import { calculateTDEE } from '@/lib/calculations/tdee'
import { calculateMacros } from '@/lib/calculations/macros'
import type { Profile } from '@/types/profile'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const bmr = calculateBMR(body as Profile)
  const tdee = calculateTDEE(bmr, body.activity_level)
  const macros = calculateMacros(tdee, body.goal, body.gender)

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...body, bmr, tdee, ...macros, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
