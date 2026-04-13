import { isAdminRole, isStaffRole } from "@/lib/role"

export const CORE_MODULES = [
  {
    key: "DOGS",
    name: "Acompanhamento dos Caes",
    description: "Ficha, historico e dados do cao acompanhados pela equipe K9.",
  },
  {
    key: "TRAINING",
    name: "Treinos Liberados",
    description: "Treinos, sessoes e progresso definidos pela equipe K9.",
  },
  {
    key: "SCHEDULE",
    name: "Agenda de Acompanhamento",
    description: "Eventos e sessoes criados pelo admin para o cliente.",
  },
  {
    key: "COURSES",
    name: "Cursos Liberados",
    description: "Cursos e trilhas que a equipe K9 vinculou ao cliente.",
  },
  {
    key: "CONTENT_LIBRARY",
    name: "Biblioteca K9",
    description: "Materiais, guias e conteudos complementares liberados pela equipe.",
  },
] as const

export type CoreModuleKey = (typeof CORE_MODULES)[number]["key"]

type ModuleRequirement = {
  prefixes: string[]
  modules: CoreModuleKey[]
}

const MODULE_ROUTE_RULES: ModuleRequirement[] = [
  { prefixes: ["/dogs", "/api/dogs"], modules: ["DOGS"] },
  { prefixes: ["/training", "/api/training"], modules: ["TRAINING"] },
  { prefixes: ["/calendar", "/agendamento", "/api/schedule"], modules: ["SCHEDULE"] },
  { prefixes: ["/courses", "/conteudos", "/api/content"], modules: ["COURSES", "CONTENT_LIBRARY"] },
]

export const PUBLIC_PAGE_PREFIXES = ["/", "/blog", "/racas", "/login", "/register", "/unauthorized", "/api/auth"] as const
export const PROTECTED_PAGE_PREFIXES = [
  "/dashboard",
  "/profile",
  "/forum",
  "/dogs",
  "/training",
  "/calendar",
  "/agendamento",
  "/courses",
  "/conteudos",
  "/verify",
  "/api/profile",
  "/api/forum",
  "/api/dogs",
  "/api/training",
  "/api/schedule",
  "/api/content",
  "/api/me",
  "/api/verify",
] as const

export function normalizeModuleKey(value?: string | null) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/gi, "_")
    .toUpperCase()
}

export function dedupeModuleKeys(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => normalizeModuleKey(value)).filter(Boolean))]
}

export function getSessionModuleKeys(modules?: Array<string | null | undefined>) {
  return dedupeModuleKeys(modules || [])
}

export function hasModuleAccess(
  moduleKeys: Array<string | null | undefined> | undefined,
  requiredModules: string | string[] | null | undefined,
  role?: string | null,
) {
  if (!requiredModules) return true
  if (isAdminRole(role) || isStaffRole(role)) return true

  const userModules = new Set(getSessionModuleKeys(moduleKeys))
  const requiredList = Array.isArray(requiredModules) ? requiredModules : [requiredModules]

  return requiredList.some((required) => userModules.has(normalizeModuleKey(required)))
}

export function getRequiredModulesForPath(pathname: string) {
  const matched = MODULE_ROUTE_RULES.find(({ prefixes }) =>
    prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
  )

  return matched?.modules || null
}

export function isPublicPath(pathname: string) {
  if (pathname === "/") return true
  return PUBLIC_PAGE_PREFIXES.some((prefix) => prefix !== "/" && (pathname === prefix || pathname.startsWith(`${prefix}/`)))
}

export function isProtectedPath(pathname: string) {
  return PROTECTED_PAGE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function getCoreModuleLabel(key?: string | null) {
  const normalized = normalizeModuleKey(key)
  return CORE_MODULES.find((item) => item.key === normalized)?.name || normalized || "Modulo"
}

export function getCoreModuleDescription(key?: string | null) {
  const normalized = normalizeModuleKey(key)
  return CORE_MODULES.find((item) => item.key === normalized)?.description || "Acesso administrado pela equipe K9."
}
