import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { connectDB } from '@/lib/mongodb/mongoose'
import { User } from '@/lib/mongodb/models/User'
import { AuthToken } from '@/lib/mongodb/models/AuthToken'
import { sendPasswordResetEmail } from '@/lib/email/nodemailer'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'ელფოსტა სავალდებულოა' }, { status: 400 })

    await connectDB()
    const normalizedEmail = email.toLowerCase().trim()
    const user = await User.findOne({ email: normalizedEmail }).lean() as { _id: unknown } | null

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ ok: true })
    }

    // Delete old reset tokens for this email
    await AuthToken.deleteMany({ email: normalizedEmail, type: 'password_reset' })

    const token = crypto.randomBytes(32).toString('hex')
    await AuthToken.create({
      email: normalizedEmail,
      token,
      type: 'password_reset',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    })

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
    await sendPasswordResetEmail(normalizedEmail, resetUrl)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('forgot-password error:', err)
    return NextResponse.json({ error: 'სერვერის შეცდომა' }, { status: 500 })
  }
}
