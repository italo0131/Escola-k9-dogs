export const USER_ROLES = ["ADMIN", "ROOT", "SUPERADMIN", "TRAINER", "VET", "CLIENT"] as const
export const ADMIN_ROLES = ["ADMIN", "ROOT", "SUPERADMIN"] as const
export const STAFF_ROLES = ["ADMIN", "ROOT", "SUPERADMIN", "TRAINER", "VET"] as const
export const PRIMARY_PLATFORM_ROLES = ["ADMIN", "TRAINER", "VET", "CLIENT"] as const
export const USER_STATUSES = ["ACTIVE", "PENDING_APPROVAL", "SUSPENDED"] as const

export type UserRole = (typeof USER_ROLES)[number]

export function isAdminRole(role?: string | null) {
  const r = (role || "").toLowerCase()
  return r === "admin" || r === "root" || r === "superadmin"
}

export function isRootRole(role?: string | null) {
  const r = (role || "").toLowerCase()
  return r === "root"
}

export function isTrainerRole(role?: string | null) {
  const r = (role || "").toLowerCase()
  return r === "trainer"
}

export function isVetRole(role?: string | null) {
  const r = (role || "").toLowerCase()
  return r === "vet"
}

export function isProfessionalRole(role?: string | null) {
  return isTrainerRole(role) || isVetRole(role)
}

export function isStaffRole(role?: string | null) {
  const r = (role || "").toLowerCase()
  return isAdminRole(r) || r === "trainer" || r === "vet"
}

export function isActiveUserStatus(status?: string | null) {
  return String(status || "ACTIVE").toUpperCase() === "ACTIVE"
}

export function needsProfessionalApproval(role?: string | null, status?: string | null) {
  return isProfessionalRole(role) && !isActiveUserStatus(status)
}

export function isApprovedProfessional(role?: string | null, status?: string | null) {
  return isProfessionalRole(role) && isActiveUserStatus(status)
}

export function getRoleLabel(role?: string | null) {
  const r = String(role || "CLIENT").toUpperCase()
  if (r === "ROOT") return "Root"
  if (r === "SUPERADMIN") return "Superadmin"
  if (r === "ADMIN") return "Administrador"
  if (r === "TRAINER") return "Adestrador"
  if (r === "VET") return "Veterinario"
  return "Cliente"
}

export function getUserStatusLabel(status?: string | null, role?: string | null) {
  const normalized = String(status || "ACTIVE").toUpperCase()

  if (normalized === "PENDING_APPROVAL" && isTrainerRole(role)) return "Adestrador em analise"
  if (normalized === "PENDING_APPROVAL" && isVetRole(role)) return "Veterinario em analise"
  if (normalized === "PENDING_APPROVAL") return "Em analise"
  if (normalized === "SUSPENDED") return "Suspenso"
  return "Ativo"
}
