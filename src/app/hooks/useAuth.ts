import { usePlatformSession } from "@/app/components/PlatformSessionProvider"

export function useAuth() {
  const { session, status, isLoggedIn, role, plan, planStatus, emailVerified, hasPremiumAccess, refreshSession } = usePlatformSession()

  return {
    user: session?.user,
    status,
    role,
    plan,
    planStatus,
    emailVerified,
    hasPremiumAccess,
    isAuthenticated: isLoggedIn,
    refreshSession,
  }
}
