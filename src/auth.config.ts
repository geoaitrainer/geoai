import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user
      const path = nextUrl.pathname
      const protectedPaths = [
        "/dashboard", "/nutrition", "/workout", "/progress", "/chat", "/profile", "/admin", "/recipes", "/calendar",
      ]
      const isProtected = protectedPaths.some(p => path.startsWith(p))
      const isAuthPage = path === "/login" || path === "/register" || path === "/admin-login" || path === "/forgot-password"

      if (isProtected && !isLoggedIn) return false
      if (isAuthPage && isLoggedIn)
        return Response.redirect(new URL("/dashboard", nextUrl))
      return true
    },
  },
  providers: [],
}
