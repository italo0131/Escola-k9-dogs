import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

import { getRequiredModulesForPath, getSessionModuleKeys, hasModuleAccess, isProtectedPath, isPublicPath } from "./src/lib/access"
import { isAdminRole } from "./src/lib/role"

const ADMIN_PATHS = ["/admin", "/api/admin"]
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "connect-src 'self' https:",
].join("; ")

function matchesPrefix(path: string, prefixes: string[]) {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store")
  response.headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY)
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin")
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin")
  return response
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  if (isPublicPath(path) && !matchesPrefix(path, ADMIN_PATHS)) {
    return applySecurityHeaders(NextResponse.next())
  }

  const requiresAuth = isProtectedPath(path) || matchesPrefix(path, ADMIN_PATHS)

  if (!requiresAuth) {
    return applySecurityHeaders(NextResponse.next())
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("next", path)
    return applySecurityHeaders(NextResponse.redirect(loginUrl))
  }

  if ((token.status as string | undefined) === "SUSPENDED") {
    const blockedUrl = new URL("/login", req.url)
    blockedUrl.searchParams.set("reason", "suspended")
    return applySecurityHeaders(NextResponse.redirect(blockedUrl))
  }

  if (matchesPrefix(path, ADMIN_PATHS) && !isAdminRole(token.role as string)) {
    return applySecurityHeaders(NextResponse.redirect(new URL("/unauthorized", req.url)))
  }

  const requiredModules = getRequiredModulesForPath(path)
  const moduleKeys = getSessionModuleKeys((token.modules as string[]) || [])

  if (!hasModuleAccess(moduleKeys, requiredModules, token.role as string | undefined)) {
    const unauthorizedUrl = new URL("/unauthorized", req.url)
    unauthorizedUrl.searchParams.set("from", path)
    return applySecurityHeaders(NextResponse.redirect(unauthorizedUrl))
  }

  return applySecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/calendar/:path*",
    "/agendamento/:path*",
    "/conteudos/:path*",
    "/courses/:path*",
    "/dogs/:path*",
    "/forum/:path*",
    "/profile/:path*",
    "/training/:path*",
    "/verify/:path*",
    "/api/admin/:path*",
    "/api/content/:path*",
    "/api/dogs/:path*",
    "/api/forum/:path*",
    "/api/profile/:path*",
    "/api/schedule/:path*",
    "/api/training/:path*",
    "/api/verify/:path*",
  ],
}
