import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"
import { connectDB } from "@/lib/mongodb/mongoose"
import { User } from "@/lib/mongodb/models/User"
import { Profile } from "@/lib/mongodb/models/Profile"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        await connectDB()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = await User.findOne({ email: credentials.email }).lean() as any
        if (!user?.hashedPassword) return null
        const valid = await bcrypt.compare(credentials.password as string, user.hashedPassword)
        if (!valid) return null
        return { id: user._id.toString(), email: user.email, name: user.name, image: user.image }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectDB()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = await User.findOne({ email: user.email }).lean() as any
        if (!existing) {
          const newUser = await User.create({
            email: user.email,
            name: user.name,
            image: user.image,
            googleId: account.providerAccountId,
          })
          const userId = newUser._id.toString()
          await Profile.create({
            userId,
            name: user.name || user.email?.split("@")[0] || "მომხმარებელი",
          })
          user.id = userId
        } else {
          user.id = existing._id.toString()
        }
      }
      return true
    },
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
