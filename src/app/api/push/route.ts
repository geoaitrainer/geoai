import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/mongoose'
import { PushSubscription } from '@/lib/mongodb/models/PushSubscription'
import webpush from 'web-push'

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@aitrainer.ge',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
}

export async function GET() {
  return NextResponse.json({
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
  })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subscription } = await request.json()
  if (!subscription?.endpoint || !subscription?.keys) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  await connectDB()
  await PushSubscription.findOneAndUpdate(
    { userId: session.user.id },
    {
      userId: session.user.id,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    },
    { upsert: true, new: true }
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  await PushSubscription.deleteMany({ userId: session.user.id })
  return NextResponse.json({ ok: true })
}
