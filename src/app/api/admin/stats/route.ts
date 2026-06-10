import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? supabase : null
}

export async function GET() {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const [
    { count: totalUsers },
    { count: proUsers },
    { count: mealPlans },
    { count: workoutPrograms },
    { count: diaryEntries },
    { count: chatMessages },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('plan', 'free'),
    supabase.from('meal_plans').select('*', { count: 'exact', head: true }),
    supabase.from('workout_programs').select('*', { count: 'exact', head: true }),
    supabase.from('food_diary').select('*', { count: 'exact', head: true }),
    supabase.from('chat_messages').select('*', { count: 'exact', head: true }),
  ])

  return NextResponse.json({
    totalUsers: totalUsers || 0,
    proUsers: proUsers || 0,
    mealPlans: mealPlans || 0,
    workoutPrograms: workoutPrograms || 0,
    diaryEntries: diaryEntries || 0,
    chatMessages: chatMessages || 0,
  })
}
