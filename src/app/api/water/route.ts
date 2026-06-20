import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/mongoose'
import { WaterEntry } from '@/lib/mongodb/models/WaterEntry'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const date = request.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0]
  await connectDB()

  const entries = await WaterEntry.find({ userId: session.user.id, date }).lean()
  const total_ml = (entries as { amount_ml: number }[]).reduce((s, e) => s + e.amount_ml, 0)
  return NextResponse.json({ total_ml, entries: JSON.parse(JSON.stringify(entries)) })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date, amount_ml } = await request.json()
  if (!amount_ml || amount_ml <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

  await connectDB()
  const entry = await WaterEntry.create({
    userId: session.user.id,
    date: date || new Date().toISOString().split('T')[0],
    amount_ml,
  })
  return NextResponse.json(JSON.parse(JSON.stringify(entry)), { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const date = request.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0]
  await connectDB()
  await WaterEntry.deleteMany({ userId: session.user.id, date })
  return NextResponse.json({ ok: true })
}
