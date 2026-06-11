import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/mongoose'
import { FoodDiary } from '@/lib/mongodb/models/FoodDiary'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const date = request.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0]

  await connectDB()
  const entries = await FoodDiary.find({ userId: session.user.id, date })
    .sort({ createdAt: 1 })
    .lean()

  return NextResponse.json(JSON.parse(JSON.stringify(entries)))
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  await connectDB()
  const entry = await FoodDiary.create({ ...body, userId: session.user.id })

  return NextResponse.json(JSON.parse(JSON.stringify(entry)), { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await connectDB()
  await FoodDiary.deleteOne({ _id: id, userId: session.user.id })

  return NextResponse.json({ success: true })
}
