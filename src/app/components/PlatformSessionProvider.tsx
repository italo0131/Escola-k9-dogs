"use client"

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useEffectEvent,
  useState,
  type ReactNode,
} from "react"
import { useSession } from "next-auth/react"

import { dedupeModuleKeys, hasModuleAccess } from "@/lib/access"
import { isAdminRole, isRootRole, isStaffRole } from "@/lib/role"

type PlatformSessionValue = {
  session: ReturnType<typeof useSession>["data"]
  status: ReturnType<typeof useSession>["status"]
  isLoggedIn: boolean
  isLoading: boolean
  role: string
  modules: string[]
  createdByAdmin: boolean
  emailVerified: boolean
  isAdmin: boolean
  isRoot: boolean
  isStaff: boolean
  hasManagedAccess: boolean
  hasModule: (required: string | string[] | null | undefined) => boolean
  refreshSession: () => Promise<unknown>
}

const PlatformSessionContext = createContext<PlatformSessionValue | null>(null)

export function PlatformSessionProvider({ children }: { children: ReactNode }) {
  const sessionState = useSession()
  const { data, status, update } = sessionState
  const [lastSyncedAt, setLastSyncedAt] = useState(0)

  const role = String(data?.user?.role || "GUEST").toUpperCase()
  const modules = dedupeModuleKeys(data?.user?.modules || [])
  const createdByAdmin = !!data?.user?.createdByAdmin
  const isLoggedIn = status === "authenticated" && !!data?.user?.id
  const isLoading = status === "loading"
  const emailVerified = !!data?.user?.emailVerifiedAt
  const isAdmin = isAdminRole(role)
  const isRoot = isRootRole(role)
  const isStaff = isStaffRole(role)
  const hasManagedAccess = isLoggedIn && ((data?.user?.status || "ACTIVE") !== "SUSPENDED")

  const syncSessionEffect = useEffectEvent(async () => {
    const now = Date.now()
    if (status !== "authenticated") return null
    if (now - lastSyncedAt < 15_000) return null

    setLastSyncedAt(now)
    return update()
  })

  const refreshSession = async () => {
    const now = Date.now()
    if (status !== "authenticated") return null
    if (now - lastSyncedAt < 15_000) return null

    setLastSyncedAt(now)
    return update()
  }

  useEffect(() => {
    const html = document.documentElement

    html.dataset.auth = isLoggedIn ? "authenticated" : status
    html.dataset.role = role.toLowerCase()
    html.dataset.accessModel = createdByAdmin ? "admin-managed" : "legacy"
    html.dataset.modules = modules.join(",").toLowerCase()

    html.classList.toggle("root-mode", isRoot)
    html.classList.toggle("logged-in", isLoggedIn)
    html.classList.toggle("managed-access", hasManagedAccess)
    html.classList.toggle("email-pending", isLoggedIn && !emailVerified)

    return () => {
      if (status === "unauthenticated") {
        html.classList.remove("root-mode", "logged-in", "managed-access", "email-pending")
        html.dataset.auth = "unauthenticated"
        html.dataset.role = "guest"
        html.dataset.accessModel = "public"
        html.dataset.modules = ""
      }
    }
  }, [createdByAdmin, emailVerified, hasManagedAccess, isLoggedIn, isRoot, modules, role, status])

  useEffect(() => {
    if (!isLoggedIn) return

    const syncVisibleSession = () => {
      if (document.visibilityState === "hidden") return
      startTransition(() => {
        void syncSessionEffect()
      })
    }

    syncVisibleSession()
    const intervalId = window.setInterval(syncVisibleSession, 120_000)

    window.addEventListener("focus", syncVisibleSession)
    document.addEventListener("visibilitychange", syncVisibleSession)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener("focus", syncVisibleSession)
      document.removeEventListener("visibilitychange", syncVisibleSession)
    }
  }, [isLoggedIn])

  const value: PlatformSessionValue = {
    session: data,
    status,
    isLoggedIn,
    isLoading,
    role,
    modules,
    createdByAdmin,
    emailVerified,
    isAdmin,
    isRoot,
    isStaff,
    hasManagedAccess,
    hasModule: (required) => hasModuleAccess(modules, required, role),
    refreshSession,
  }

  return <PlatformSessionContext.Provider value={value}>{children}</PlatformSessionContext.Provider>
}

export function usePlatformSession() {
  const value = useContext(PlatformSessionContext)
  if (!value) {
    throw new Error("usePlatformSession deve ser usado dentro de PlatformSessionProvider")
  }
  return value
}
