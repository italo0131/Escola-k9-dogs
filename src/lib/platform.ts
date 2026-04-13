import { isAdminRole } from "@/lib/role"

export const REGISTERABLE_ROLES = ["CLIENT", "TRAINER", "VET"] as const

export const ACCOUNT_PLANS = ["FREE", "PAID"] as const
export const PAID_ACCOUNT_PLANS = ["PAID"] as const
export const FREE_PLAN_DOG_LIMIT = 3

export const ACCOUNT_PLAN_OPTIONS = [
  {
    code: "FREE",
    name: "Free",
    priceLabel: "R$ 0",
    priceInCents: 0,
    billingCycle: null,
    description: "Entrada leve para estudar racas, usar o blog e cadastrar ate 3 caes.",
    perks: [
      "Ate 3 caes por conta",
      "Blog livre e area educativa de racas",
      "Perfil e base da rotina organizados",
    ],
  },
  {
    code: "PAID",
    name: "Pago",
    priceLabel: "R$ 59,90/mes",
    priceInCents: 5990,
    billingCycle: "MONTHLY",
    description: "Assinatura principal com acesso completo a cursos, IA, treino, agenda, forum e comunidade.",
    perks: [
      "Cursos, forum, canais, treinos e agenda completos",
      "IA personalizada para racas, estudo e rotina",
      "Assinatura unica e simples para operar toda a plataforma",
    ],
  },
] as const

export const CHANNEL_CONTENT_TYPES = ["LESSON", "VIDEO", "CHECKLIST", "GUIDE", "LIVE_REPLAY"] as const
export const CHANNEL_CONTENT_CATEGORIES = [
  "TRILHA",
  "DICAS",
  "TECNICAS",
  "COMPORTAMENTO",
  "ROTINA",
  "SAUDE",
  "CONDICIONAMENTO",
] as const

export const CHANNEL_CONTENT_ACCESS = ["FREE", "SUBSCRIBER"] as const

export const TRAINING_FOCUS_AREAS = [
  "OBEDIENCIA",
  "SOCIALIZACAO",
  "ANSIEDADE",
  "CONDUTA_EM_PASSEIO",
  "ENRIQUECIMENTO",
  "ESPORTES",
  "REABILITACAO_COMPORTAMENTAL",
] as const

export const TRAINING_DIFFICULTIES = ["INICIANTE", "INTERMEDIARIO", "AVANCADO"] as const

export const SCHEDULE_FORMATS = ["PRESENTIAL", "ONLINE", "HYBRID"] as const

export const FORUM_POST_TYPES = ["POST", "DICA", "TECNICA", "COMPORTAMENTO", "EVENTO"] as const
export const BLOG_POST_TYPES = ["POST", "GUIA", "CASO_REAL", "EVENTO"] as const

export function isPaidPlan(plan?: string | null) {
  const value = String(plan || "FREE").toUpperCase()
  return value === "PAID"
}

export function isPlanActiveStatus(status?: string | null) {
  const value = String(status || "ACTIVE").toUpperCase()
  return value === "ACTIVE"
}

export function hasPremiumPlatformAccess(plan?: string | null, role?: string | null, planStatus?: string | null) {
  if (isAdminRole(role)) return true
  if (typeof planStatus === "undefined" || planStatus === null || planStatus === "") return true
  return isPlanActiveStatus(planStatus)
}

export function getDogLimit(plan?: string | null, role?: string | null, planStatus?: string | null) {
  if (hasPremiumPlatformAccess(plan, role, planStatus)) return Number.POSITIVE_INFINITY
  return FREE_PLAN_DOG_LIMIT
}

export function getRemainingDogSlots(currentDogs: number, plan?: string | null, role?: string | null, planStatus?: string | null) {
  const limit = getDogLimit(plan, role, planStatus)
  if (!Number.isFinite(limit)) return Number.POSITIVE_INFINITY
  return Math.max(0, limit - currentDogs)
}

export function getPlanStatusLabel(status?: string | null) {
  const value = String(status || "ACTIVE").toUpperCase()
  if (value === "PENDING_APPROVAL") return "Aguardando liberacao"
  if (value === "CHECKOUT_PENDING") return "Checkout em andamento"
  if (value === "CHECKOUT_REQUIRED") return "Assinatura pendente"
  if (value === "PAST_DUE") return "Pagamento pendente"
  if (value === "CANCELED") return "Cancelado"
  if (value === "SUSPENDED") return "Suspenso"
  return "Ativo"
}

export function getAccountPlanLabel(plan?: string | null) {
  const value = String(plan || "MANAGED").toUpperCase()
  if (value === "PAID") return "Acesso legado"
  if (value === "FREE") return "Acesso administrado"
  return "Acesso administrado"
}

export function getAccountPlanDescription(plan?: string | null) {
  const value = String(plan || "MANAGED").toUpperCase()
  if (value === "PAID") return "Conta em modo legado. A K9 agora libera acessos por modulos administrados."
  return "A equipe K9 libera cada modulo manualmente conforme o acompanhamento contratado para o cliente."
}

export function getPlanUpgradeReason(reason?: string | null) {
  const value = String(reason || "").toLowerCase()
  if (value.includes("/forum")) return "O forum e exclusivo para clientes logados da K9 Training."
  if (value.includes("/conteudos")) return "Esse conteudo precisa ser liberado pela equipe K9 no seu acesso."
  if (value.includes("/training")) return "Os treinos aparecem apenas quando a equipe K9 libera esse modulo para voce."
  if (value.includes("/calendar")) return "A agenda so aparece quando o acompanhamento foi liberado pela equipe K9."
  return "Essa area depende de liberacao manual da equipe K9."
}

export function getScheduleFormatLabel(format?: string | null) {
  const value = String(format || "PRESENTIAL").toUpperCase()
  if (value === "ONLINE") return "Online"
  if (value === "HYBRID") return "Hibrido"
  return "Presencial"
}

export function getTrainingDifficultyLabel(difficulty?: string | null) {
  const value = String(difficulty || "INICIANTE").toUpperCase()
  if (value === "INTERMEDIARIO") return "Intermediario"
  if (value === "AVANCADO") return "Avancado"
  return "Iniciante"
}

export function getChannelContentTypeLabel(type?: string | null) {
  const value = String(type || "LESSON").toUpperCase()
  if (value === "VIDEO") return "Video"
  if (value === "CHECKLIST") return "Checklist"
  if (value === "GUIDE") return "Guia"
  if (value === "LIVE_REPLAY") return "Replay"
  return "Aula"
}

export function getChannelContentCategoryLabel(category?: string | null) {
  const value = String(category || "TRILHA").toUpperCase()
  if (value === "DICAS") return "Dicas"
  if (value === "TECNICAS") return "Tecnicas"
  if (value === "COMPORTAMENTO") return "Comportamento"
  if (value === "ROTINA") return "Rotina"
  if (value === "SAUDE") return "Saude"
  if (value === "CONDICIONAMENTO") return "Condicionamento"
  return "Trilha"
}

export function getChannelContentAccessLabel(access?: string | null) {
  const value = String(access || "SUBSCRIBER").toUpperCase()
  if (value === "FREE") return "Livre"
  return "Assinantes"
}

export function getTrainingFocusLabel(value?: string | null) {
  return String(value || "OBEDIENCIA")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (char) => char.toUpperCase())
}

export function getForumPostTypeLabel(value?: string | null) {
  const normalized = String(value || "POST").toUpperCase()
  if (normalized === "DICA") return "Dica"
  if (normalized === "TECNICA") return "Tecnica"
  if (normalized === "COMPORTAMENTO") return "Comportamento"
  if (normalized === "EVENTO") return "Evento"
  return "Post"
}

export function getBlogPostTypeLabel(value?: string | null) {
  const normalized = String(value || "POST").toUpperCase()
  if (normalized === "GUIA") return "Guia"
  if (normalized === "CASO_REAL") return "Caso real"
  if (normalized === "EVENTO") return "Evento"
  return "Post"
}
