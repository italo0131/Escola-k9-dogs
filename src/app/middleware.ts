import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { hasPremiumPlatformAccess } from "@/lib/platform"

const PREMIUM_ROUTE_PREFIXES = ["/conteudos", "/training", "/calendar"]
const PREMIUM_FORUM_PATHS = ["/forum/new"]

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname
    const role = req.nextauth.token?.role as string | undefined
    const plan = req.nextauth.token?.plan as string | undefined
    const planStatus = req.nextauth.token?.planStatus as string | undefined

    const requiresPremium = PREMIUM_ROUTE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
    const requiresPremiumForum = PREMIUM_FORUM_PATHS.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )

    if ((requiresPremium || requiresPremiumForum) && !hasPremiumPlatformAccess(plan, role, planStatus)) {
      const url = req.nextUrl.clone()
      url.pathname = "/billing"
      url.searchParams.set("locked", pathname)
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/dogs/:path*",
    "/training/:path*",
    "/calendar/:path*",
    "/forum/:path*",
    "/conteudos/:path*",
    "/billing/:path*",
    "/profile/:path*",
    "/verify/:path*",
    "/blog/new/:path*",
  ],
}
