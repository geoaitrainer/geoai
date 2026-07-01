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

  const serialized = JSON.parse(JSON.stringify(entries))
  return NextResponse.json(serialized.map((e: Record<string, unknown>) => ({ ...e, id: e._id })))
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  await connectDB()
  const { date, food_name, amount_g, meal_type, calories, protein_g, fat_g, carbs_g } = body
  const entry = await FoodDiary.create({
    userId: session.user.id,
    date,
    food_name,
    amount_g: Number(amount_g) || 0,
    meal_type,
    calories: Number(calories) || 0,
    protein_g: Number(protein_g) || 0,
    fat_g: Number(fat_g) || 0,
    carbs_g: Number(carbs_g) || 0,
  })

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
