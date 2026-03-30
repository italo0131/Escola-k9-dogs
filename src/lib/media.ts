import { access } from "fs/promises"
import path from "path"
import { cache } from "react"

const LOCAL_UPLOAD_PREFIX = "/uploads/"
export const DEFAULT_CONTENT_IMAGE = "/images/placeholders/content-cover.svg"

export const resolveMediaUrl = cache(async (value?: string | null, fallback = DEFAULT_CONTENT_IMAGE) => {
  const normalized = typeof value === "string" ? value.trim() : ""

  if (!normalized) return null
  if (!normalized.startsWith(LOCAL_UPLOAD_PREFIX)) return normalized

  const publicPath = path.join(process.cwd(), "public", normalized.replace(/^\/+/, ""))

  try {
    await access(publicPath)
    return normalized
  } catch {
    return fallback
  }
})
