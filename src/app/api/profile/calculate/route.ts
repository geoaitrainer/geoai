import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateBMR } from '@/lib/calculations/bmr'
import { calculateTDEE } from '@/lib/calculations/tdee'
import { calculateMacros } from '@/lib/calculations/macros'
import type { Profile } from '@/types/profile'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const bmr = calculateBMR(profile as Profile)
  const tdee = calculateTDEE(bmr, profile.activity_level)
  const macros = calculateMacros(tdee, profile.goal, profile.gender)

  await supabase
    .from('profiles')
    .update({ bmr, tdee, ...macros, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  return NextResponse.json({ bmr, tdee, ...macros })
}
