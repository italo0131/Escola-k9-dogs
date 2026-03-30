const DIRECT_VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov", ".m4v"]

export function normalizeVideoUrl(input?: string | null) {
  const value = String(input || "").trim()
  return value || null
}

export function getVideoPresentation(url?: string | null) {
  const value = normalizeVideoUrl(url)
  if (!value) return null

  if (value.includes("youtube.com/watch?v=")) {
    const parsed = new URL(value)
    const videoId = parsed.searchParams.get("v")
    if (videoId) {
      return { kind: "embed" as const, src: `https://www.youtube.com/embed/${videoId}` }
    }
  }

  if (value.includes("youtu.be/")) {
    const videoId = value.split("youtu.be/")[1]?.split(/[?&]/)[0]
    if (videoId) {
      return { kind: "embed" as const, src: `https://www.youtube.com/embed/${videoId}` }
    }
  }

  if (value.includes("vimeo.com/")) {
    const match = value.match(/vimeo\.com\/(\d+)/)
    if (match?.[1]) {
      return { kind: "embed" as const, src: `https://player.vimeo.com/video/${match[1]}` }
    }
  }

  const normalized = value.toLowerCase()
  if (value.startsWith("/uploads/") || DIRECT_VIDEO_EXTENSIONS.some((extension) => normalized.endsWith(extension))) {
    return { kind: "direct" as const, src: value }
  }

  return { kind: "link" as const, src: value }
}
