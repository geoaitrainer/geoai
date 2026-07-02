import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { connectDB } from '@/lib/mongodb/mongoose'
import { User } from '@/lib/mongodb/models/User'
import { Profile } from '@/lib/mongodb/models/Profile'
import { AuthToken } from '@/lib/mongodb/models/AuthToken'
import { sendAdminOtpEmail } from '@/lib/email/nodemailer'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'ელფოსტა სავალდებულოა' }, { status: 400 })

    const normalizedEmail = email.toLowerCase().trim()
    await connectDB()
    const user = await User.findOne({ email: normalizedEmail }).lean() as { _id: unknown } | null

    // Only send OTP if user exists AND is admin — but always return the same
    // generic response to prevent email/admin enumeration.
    if (user) {
      const profile = await Profile.findOne({ userId: (user._id as { toString(): string }).toString() }).lean() as { is_admin?: boolean } | null
      if (profile?.is_admin) {
        await AuthToken.deleteMany({ email: normalizedEmail, type: 'admin_otp' })
        const otp = crypto.randomInt(100000, 1000000).toString()
        await AuthToken.create({
          email: normalizedEmail,
          token: otp,
          type: 'admin_otp',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        })
        await sendAdminOtpEmail(normalizedEmail, otp)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('admin-otp error:', err)
    return NextResponse.json({ error: 'სერვერის შეცდომა' }, { status: 500 })
  }
}
