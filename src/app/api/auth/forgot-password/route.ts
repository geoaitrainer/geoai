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
    const user = await User.findOne({ email: email.toLowerCase().trim() }).lean() as { _id: unknown } | null
    if (!user) {
      return NextResponse.json({ error: 'ამ ელფოსტით მომხმარებელი არ არის რეგისტრირებული' }, { status: 404 })
    }

    // Delete old reset tokens for this email
    await AuthToken.deleteMany({ email, type: 'password_reset' })

    const token = crypto.randomBytes(32).toString('hex')
    await AuthToken.create({
      email,
      token,
      type: 'password_reset',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    })

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
    await sendPasswordResetEmail(email, resetUrl)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('forgot-password error:', err)
    return NextResponse.json({ error: 'სერვერის შეცდომა' }, { status: 500 })
  }
}
