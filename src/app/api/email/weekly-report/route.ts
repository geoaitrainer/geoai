import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/mongoose'
import { Profile } from '@/lib/mongodb/models/Profile'
import { ProgressEntry } from '@/lib/mongodb/models/ProgressEntry'
import { FoodDiary } from '@/lib/mongodb/models/FoodDiary'
import { WaterEntry } from '@/lib/mongodb/models/WaterEntry'
import { User } from '@/lib/mongodb/models/User'
import { getResend, buildWeeklyReportHtml } from '@/lib/email/resend'
import { GOAL_LABELS } from '@/lib/utils'

export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email not configured. Add RESEND_API_KEY to env vars.' }, { status: 503 })
  }

  await connectDB()
  const userId = session.user.id

  const since = new Date()
  since.setDate(since.getDate() - 7)
  const sinceStr = since.toISOString().split('T')[0]

  const [profile, user, recentProgress, recentDiary, recentWater] = await Promise.all([
    Profile.findOne({ userId }).lean(),
    User.findById(userId).lean(),
    ProgressEntry.find({ userId, date: { $gte: sinceStr } }).sort({ date: 1 }).lean(),
    FoodDiary.find({ userId, date: { $gte: sinceStr } }).select('calories date').lean(),
    WaterEntry.find({ userId, date: { $gte: sinceStr } }).select('amount_ml date').lean(),
  ])

  if (!profile || !user) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = profile as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const progressArr = recentProgress as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const diaryArr = recentDiary as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const waterArr = recentWater as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userDoc = user as any

  const currentWeight = progressArr.length > 0 ? progressArr[progressArr.length - 1].weight_kg : null
  const firstWeight = progressArr.length > 0 ? progressArr[0].weight_kg : null
  const weightChange = currentWeight && firstWeight ? currentWeight - firstWeight : null

  const calorieAvg = diaryArr.length > 0
    ? diaryArr.reduce((s: number, e: { calories: number }) => s + (e.calories || 0), 0) / 7
    : 0

  const waterByDay = waterArr.reduce((acc: Record<string, number>, e: { date: string; amount_ml: number }) => {
    acc[e.date] = (acc[e.date] || 0) + e.amount_ml
    return acc
  }, {})
  const waterDays = Object.values(waterByDay) as number[]
  const waterAvgMl = waterDays.length > 0 ? waterDays.reduce((a, b) => a + b, 0) / 7 : 0

  try {
    const resend = getResend()
    const html = buildWeeklyReportHtml({
      name: p.name,
      goal: GOAL_LABELS[p.goal as keyof typeof GOAL_LABELS] || p.goal,
      weightChange,
      currentWeight,
      calorieAvg,
      calorieGoal: p.calorie_goal || 2000,
      workoutsCompleted: 0,
      waterAvgMl,
    })

    await resend.emails.send({
      from: 'AI ტრენერი <noreply@aitrainer.ge>',
      to: userDoc.email,
      subject: `${p.name}, შენი კვირის ანგარიში 📊`,
      html,
    })

    return NextResponse.json({ ok: true, sent_to: userDoc.email })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
