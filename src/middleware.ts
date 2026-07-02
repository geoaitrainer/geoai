import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

export default NextAuth(authConfig).auth

export const config = {
  matcher: [
    // Exclude static assets, PWA files (manifest, sw) and .well-known (TWA asset
    // links) so they're served publicly without the auth middleware.
    "/((?!_next/static|_next/image|favicon.ico|.well-known|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
