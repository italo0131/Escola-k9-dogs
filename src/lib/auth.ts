import { getServerSession } from "next-auth"
import type { Session } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

import { isAdminRole, isStaffRole } from "@/lib/role"

export async function getAuthSession(): Promise<Session | null> {
  return getServerSession(authOptions as any)
}

type AuthenticatedSession = Session & { user: NonNullable<Session["user"]> }

export async function requireUser(redirectTo: string = "/login"): Promise<AuthenticatedSession> {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    redirect(redirectTo)
  }
  return session as AuthenticatedSession
}

export function isAdminSession(session: any) {
  return isAdminRole(session?.user?.role)
}

export function isStaffSession(session: any) {
  return isStaffRole(session?.user?.role)
}

export { authOptions }
