import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if profile exists, create if not (Google OAuth users)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!profile) {
        const name = data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'მომხმარებელი'
        await supabase.from('profiles').insert({
          id: data.user.id,
          name,
          age: 25,
          gender: 'male',
          height_cm: 170,
          weight_kg: 70,
          goal: 'maintain',
          activity_level: 'moderate',
          work_type: 'desk',
          experience: 'beginner',
          allergies: [],
          conditions: [],
          liked_foods: [],
          disliked_foods: [],
          daily_budget: 50,
        })
        return NextResponse.redirect(`${origin}/profile?onboarding=true`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
