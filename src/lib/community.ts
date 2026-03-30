export const FORUM_CHANNEL_CATEGORIES = [
  "COMUNIDADE",
  "ADESTRAMENTO",
  "COMPORTAMENTO",
  "SAUDE",
  "ALIMENTACAO",
  "FILHOTES",
  "ESPORTES",
] as const

export const FORUM_SERVICE_MODES = ["COMMUNITY", "ONLINE", "PRESENTIAL", "HYBRID"] as const

export const BLOG_CATEGORIES = [
  "GERAL",
  "ADESTRAMENTO",
  "SAUDE",
  "NUTRICAO",
  "COMPORTAMENTO",
  "ROTINA",
  "CASOS_REAIS",
] as const

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function formatServiceMode(mode?: string | null) {
  const value = String(mode || "COMMUNITY").toUpperCase()
  if (value === "ONLINE") return "Online"
  if (value === "PRESENTIAL") return "Presencial"
  if (value === "HYBRID") return "Online + presencial"
  return "Comunidade gratuita"
}

export function formatMoney(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value / 100)
}

export function formatChannelLocation(city?: string | null, state?: string | null) {
  return [city, state].filter(Boolean).join(" / ") || "Atendimento sem local fixo"
}

export function formatRegion(city?: string | null, state?: string | null) {
  return [city, state].filter(Boolean).join(" / ") || "Regiao nao informada"
}

export function formatDateRange(start?: Date | string | null, end?: Date | string | null) {
  if (!start) return null
  const startDate = new Date(start)
  const endDate = end ? new Date(end) : null

  const startLabel = startDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })

  if (!endDate) {
    return startLabel
  }

  const sameDay = startDate.toDateString() === endDate.toDateString()
  if (sameDay) {
    return `${startDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    })} • ${startDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })} - ${endDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`
  }

  return `${startLabel} ate ${endDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })}`
}
