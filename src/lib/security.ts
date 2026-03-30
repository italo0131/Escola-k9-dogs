import { NextResponse } from "next/server"

type RateLimitEntry = {
  count: number
  resetAt: number
}

const globalStore = globalThis as typeof globalThis & {
  __k9RateLimitStore?: Map<string, RateLimitEntry>
}

function getRateLimitStore() {
  if (!globalStore.__k9RateLimitStore) {
    globalStore.__k9RateLimitStore = new Map<string, RateLimitEntry>()
  }
  return globalStore.__k9RateLimitStore
}

export function takeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const store = getRateLimitStore()
  const current = store.get(key)

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: now + windowMs }
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt }
  }

  current.count += 1
  store.set(key, current)
  return { allowed: true, remaining: Math.max(0, limit - current.count), resetAt: current.resetAt }
}

export function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown"
  }

  return req.headers.get("x-real-ip") || "unknown"
}

function normalizeOrigin(origin: string) {
  try {
    const url = new URL(origin)
    const hostname = url.hostname === "127.0.0.1" || url.hostname === "[::1]" ? "localhost" : url.hostname
    const isDefaultPort = (url.protocol === "http:" && (url.port === "" || url.port === "80")) || (url.protocol === "https:" && (url.port === "" || url.port === "443"))
    const port = isDefaultPort ? "" : `:${url.port}`
    return `${url.protocol}//${hostname}${port}`
  } catch {
    return origin.trim().toLowerCase()
  }
}

function getAllowedOrigins(req: Request) {
  const allowed = new Set<string>()
  const requestUrl = new URL(req.url)

  allowed.add(normalizeOrigin(`${requestUrl.protocol}//${requestUrl.host}`))

  const forwardedProto = req.headers.get("x-forwarded-proto")
  const forwardedHost = req.headers.get("x-forwarded-host")
  if (forwardedProto && forwardedHost) {
    allowed.add(normalizeOrigin(`${forwardedProto}://${forwardedHost}`))
  }

  const host = req.headers.get("host")
  if (host) {
    const protocol = forwardedProto || requestUrl.protocol.replace(":", "")
    allowed.add(normalizeOrigin(`${protocol}://${host}`))
  }

  const nextAuthUrl = String(process.env.NEXTAUTH_URL || "").trim()
  if (nextAuthUrl) {
    allowed.add(normalizeOrigin(nextAuthUrl))
  }

  const explicitAllowedOrigins = String(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

  for (const origin of explicitAllowedOrigins) {
    allowed.add(normalizeOrigin(origin))
  }

  return allowed
}

export function rejectIfRateLimited(req: Request, scope: string, limit: number, windowMs: number, message: string) {
  const ip = getClientIp(req)
  const result = takeRateLimit(`${scope}:${ip}`, limit, windowMs)

  if (result.allowed) {
    return null
  }

  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))
  return NextResponse.json(
    { success: false, message },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
      },
    }
  )
}

export function rejectIfCrossOrigin(req: Request) {
  const origin = req.headers.get("origin")
  if (!origin) return null

  const normalizedOrigin = normalizeOrigin(origin)
  const allowedOrigins = getAllowedOrigins(req)

  if (allowedOrigins.has(normalizedOrigin)) {
    return null
  }

  console.warn("[security] blocked origin", {
    origin: normalizedOrigin,
    allowedOrigins: Array.from(allowedOrigins),
  })

  return NextResponse.json({ success: false, message: "Origem invalida" }, { status: 403 })
}
