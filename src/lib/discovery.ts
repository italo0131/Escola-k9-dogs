type FreshnessInput = Date | string | null | undefined

function toDate(value: FreshnessInput) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function getAgeInDays(value: FreshnessInput) {
  const date = toDate(value)
  if (!date) return 999
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000))
}

export function scoreFreshness(value: FreshnessInput) {
  const days = getAgeInDays(value)
  if (days <= 2) return 28
  if (days <= 7) return 22
  if (days <= 15) return 16
  if (days <= 30) return 10
  if (days <= 60) return 6
  return 2
}

export function scorePublicPost(post: {
  featured?: boolean | null
  createdAt?: FreshnessInput
  coverImageUrl?: string | null
  videoUrl?: string | null
  postType?: string | null
  _count?: { comments?: number; reactions?: number }
}) {
  const reactions = Number(post._count?.reactions || 0)
  const comments = Number(post._count?.comments || 0)
  const type = String(post.postType || "POST").toUpperCase()

  let score = scoreFreshness(post.createdAt)
  if (post.featured) score += 28
  if (post.videoUrl) score += 12
  if (post.coverImageUrl) score += 8
  if (type === "GUIA") score += 10
  if (type === "CASO_REAL") score += 8
  if (type === "EVENTO") score += 6

  score += Math.min(18, reactions * 2)
  score += Math.min(20, comments * 3)

  return score
}

export function scoreChannelDiscovery(channel: {
  featured?: boolean | null
  createdAt?: FreshnessInput
  contents?: Array<{ accessLevel?: string | null }>
  _count?: { subscriptions?: number; threads?: number; contents?: number }
}) {
  const subscriptions = Number(channel._count?.subscriptions || 0)
  const threads = Number(channel._count?.threads || 0)
  const contents = Number(channel._count?.contents || channel.contents?.length || 0)
  const freeCount = (channel.contents || []).filter((item) => String(item.accessLevel || "").toUpperCase() === "FREE").length

  let score = scoreFreshness(channel.createdAt)
  if (channel.featured) score += 26
  score += Math.min(24, subscriptions * 2)
  score += Math.min(18, threads * 2)
  score += Math.min(18, contents * 2)
  score += Math.min(16, freeCount * 4)

  return score
}

export function scoreLessonDiscovery(content: {
  createdAt?: FreshnessInput
  accessLevel?: string | null
  category?: string | null
  durationMinutes?: number | null
  summary?: string | null
  channel?: { featured?: boolean | null }
}) {
  const access = String(content.accessLevel || "").toUpperCase()
  const category = String(content.category || "").toUpperCase()
  const duration = Number(content.durationMinutes || 0)

  let score = scoreFreshness(content.createdAt)
  if (access === "FREE") score += 20
  if (content.channel?.featured) score += 10
  if (content.summary) score += 6
  if (category === "DICAS" || category === "TECNICAS" || category === "COMPORTAMENTO") score += 10
  if (duration >= 3 && duration <= 20) score += 10
  if (duration > 20 && duration <= 45) score += 6

  return score
}

export function sortByDiscoveryScore<T>(items: T[], scorer: (item: T) => number) {
  return [...items].sort((left, right) => scorer(right) - scorer(left))
}
