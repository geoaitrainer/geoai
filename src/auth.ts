import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"
import { connectDB } from "@/lib/mongodb/mongoose"
import { User } from "@/lib/mongodb/models/User"
import { AuthToken } from "@/lib/mongodb/models/AuthToken"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {}, adminOtp: {} },
      async authorize(credentials) {
        if (!credentials?.email) return null
        const email = String(credentials.email).toLowerCase().trim()
        await connectDB()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = await User.findOne({ email }).lean() as any
        if (!user) return null

        // Admin OTP path
        if (credentials.adminOtp) {
          const record = await AuthToken.findOne({
            email,
            token: credentials.adminOtp,
            type: 'admin_otp',
            used: false,
            expiresAt: { $gt: new Date() },
          })
          if (!record) return null
          await AuthToken.updateOne({ _id: record._id }, { used: true })
          return { id: user._id.toString(), email: user.email, name: user.name, image: user.image }
        }

        // Normal password path
        if (!credentials.password) return null
        if (!user.hashedPassword) return null
        const valid = await bcrypt.compare(credentials.password as string, user.hashedPassword)
        if (!valid) return null
        return { id: user._id.toString(), email: user.email, name: user.name, image: user.image }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (session.user && token.id) session.user.id = token.id as string
      return session
    },
  },
})
