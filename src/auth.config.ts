import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user
      const path = nextUrl.pathname
      const protectedPaths = [
        "/dashboard", "/nutrition", "/workout", "/progress", "/chat", "/profile", "/admin",
      ]
      const isProtected = protectedPaths.some(p => path.startsWith(p))
      const isAuthPage = path === "/login" || path === "/register"

      if (isProtected && !isLoggedIn) return false
      if (isAuthPage && isLoggedIn)
        return Response.redirect(new URL("/dashboard", nextUrl))
      return true
    },
  },
  providers: [],
}
