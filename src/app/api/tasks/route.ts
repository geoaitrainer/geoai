import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/mongoose'
import { Task } from '@/lib/mongodb/models/Task'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const userId = session.user.id
  const type = request.nextUrl.searchParams.get('type')
  const date = request.nextUrl.searchParams.get('date')

  const query: Record<string, string> = { userId }
  if (type) query.type = type
  if (date !== null) query.date = date

  const tasks = await Task.find(query).sort({ order: 1, createdAt: 1 }).lean()
  return NextResponse.json(JSON.parse(JSON.stringify(tasks)))
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const body = await request.json()
  const { type, title, date = '', meta = {}, order = 0 } = body

  if (!type || !title?.trim()) {
    return NextResponse.json({ error: 'type and title required' }, { status: 400 })
  }

  const task = await Task.create({
    userId: session.user.id,
    type,
    title: title.trim(),
    date,
    meta,
    order,
    completed: false,
  })

  return NextResponse.json(JSON.parse(JSON.stringify(task)), { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { id, ...updates } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const allowed: Record<string, unknown> = {}
  if (typeof updates.completed === 'boolean') allowed.completed = updates.completed
  if (typeof updates.title === 'string') allowed.title = updates.title.trim()

  const task = await Task.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    allowed,
    { new: true }
  ).lean()

  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(JSON.parse(JSON.stringify(task)))
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await Task.deleteOne({ _id: id, userId: session.user.id })
  return NextResponse.json({ success: true })
}
