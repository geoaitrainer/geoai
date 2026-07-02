import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/mongoose'
import { Profile } from '@/lib/mongodb/models/Profile'
import { User } from '@/lib/mongodb/models/User'

const SETUP_SECRET = process.env.ADMIN_SETUP_SECRET

export async function POST(request: NextRequest) {
  // No hardcoded fallback: if the secret isn't configured, the endpoint is off.
  if (!SETUP_SECRET) {
    return NextResponse.json({ error: 'Setup disabled' }, { status: 403 })
  }

  const { email, secret } = await request.json()

  if (secret !== SETUP_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 403 })
  }

  await connectDB()
  const user = await User.findOne({ email }).lean() as { _id: unknown } | null
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const userId = String(user._id)
  await Profile.updateOne({ userId }, { $set: { is_admin: true } })

  return NextResponse.json({ ok: true, message: `${email} is now admin` })
}
