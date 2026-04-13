import { usePlatformSession } from "@/app/components/PlatformSessionProvider"

export function useAuth() {
  const {
    session,
    status,
    isLoggedIn,
    role,
    modules,
    createdByAdmin,
    emailVerified,
    hasManagedAccess,
    refreshSession,
    hasModule,
  } = usePlatformSession()

  return {
    user: session?.user,
    status,
    role,
    modules,
    createdByAdmin,
    emailVerified,
    hasManagedAccess,
    hasModule,
    isAuthenticated: isLoggedIn,
    refreshSession,
  }
}
