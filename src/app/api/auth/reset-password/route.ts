import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb/mongoose'
import { User } from '@/lib/mongodb/models/User'
import { AuthToken } from '@/lib/mongodb/models/AuthToken'

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()
    if (!token || !password) return NextResponse.json({ error: 'მონაცემები არასრულია' }, { status: 400 })
    if (password.length < 6) return NextResponse.json({ error: 'პაროლი მინიმუმ 6 სიმბოლო' }, { status: 400 })

    await connectDB()
    const authToken = await AuthToken.findOne({
      token,
      type: 'password_reset',
      used: false,
      expiresAt: { $gt: new Date() },
    }).lean() as { _id: unknown; email: string } | null

    if (!authToken) {
      return NextResponse.json({ error: 'ლინკი არასწორია ან ვადა გაუვიდა' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)
    await User.updateOne({ email: authToken.email }, { hashedPassword: hashed })
    await AuthToken.updateOne({ _id: authToken._id }, { used: true })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('reset-password error:', err)
    return NextResponse.json({ error: 'სერვერის შეცდომა' }, { status: 500 })
  }
}
