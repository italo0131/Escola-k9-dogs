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

import { hasPremiumPlatformAccess, isPlanActiveStatus } from "@/lib/platform"
import { isAdminRole, isRootRole, isStaffRole } from "@/lib/role"

type PlatformSessionValue = {
  session: ReturnType<typeof useSession>["data"]
  status: ReturnType<typeof useSession>["status"]
  isLoggedIn: boolean
  isLoading: boolean
  role: string
  plan: string
  planStatus: string
  emailVerified: boolean
  isAdmin: boolean
  isRoot: boolean
  isStaff: boolean
  hasPremiumAccess: boolean
  hasActivePlan: boolean
  refreshSession: () => Promise<unknown>
}

const PlatformSessionContext = createContext<PlatformSessionValue | null>(null)

export function PlatformSessionProvider({ children }: { children: ReactNode }) {
  const sessionState = useSession()
  const { data, status, update } = sessionState
  const [lastSyncedAt, setLastSyncedAt] = useState(0)

  const role = String(data?.user?.role || "GUEST").toUpperCase()
  const plan = String(data?.user?.plan || "FREE").toUpperCase()
  const planStatus = String(data?.user?.planStatus || "ACTIVE").toUpperCase()
  const isLoggedIn = status === "authenticated" && !!data?.user?.id
  const isLoading = status === "loading"
  const emailVerified = !!data?.user?.emailVerifiedAt
  const isAdmin = isAdminRole(role)
  const isRoot = isRootRole(role)
  const isStaff = isStaffRole(role)
  const hasActivePlan = isPlanActiveStatus(planStatus)
  const hasPremiumAccess = hasPremiumPlatformAccess(plan, role, planStatus)

  const refreshSession = useEffectEvent(async () => {
    const now = Date.now()
    if (status !== "authenticated") return null
    if (now - lastSyncedAt < 15_000) return null

    setLastSyncedAt(now)
    return update()
  })

  useEffect(() => {
    const html = document.documentElement

    html.dataset.auth = isLoggedIn ? "authenticated" : status
    html.dataset.role = role.toLowerCase()
    html.dataset.plan = plan.toLowerCase()
    html.dataset.planStatus = planStatus.toLowerCase()

    html.classList.toggle("root-mode", isRoot)
    html.classList.toggle("logged-in", isLoggedIn)
    html.classList.toggle("premium-plan", hasPremiumAccess)
    html.classList.toggle("email-pending", isLoggedIn && !emailVerified)

    return () => {
      if (status === "unauthenticated") {
        html.classList.remove("root-mode", "logged-in", "premium-plan", "email-pending")
        html.dataset.auth = "unauthenticated"
        html.dataset.role = "guest"
        html.dataset.plan = "free"
        html.dataset.planStatus = "active"
      }
    }
  }, [emailVerified, hasPremiumAccess, isLoggedIn, isRoot, plan, planStatus, role, status])

  useEffect(() => {
    if (!isLoggedIn) return

    const syncVisibleSession = () => {
      if (document.visibilityState === "hidden") return
      startTransition(() => {
        void refreshSession()
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
  }, [isLoggedIn, refreshSession])

  const value: PlatformSessionValue = {
    session: data,
    status,
    isLoggedIn,
    isLoading,
    role,
    plan,
    planStatus,
    emailVerified,
    isAdmin,
    isRoot,
    isStaff,
    hasPremiumAccess,
    hasActivePlan,
    refreshSession: () => refreshSession(),
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
