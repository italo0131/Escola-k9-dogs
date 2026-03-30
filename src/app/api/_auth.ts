import { getServerSession } from "next-auth"
import type { Session } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "./auth/[...nextauth]/route"
import { isAdminRole, isApprovedProfessional, isRootRole, isStaffRole } from "@/lib/role"

type ApiSession = Session & { user: NonNullable<Session["user"]> }

export async function requireApiUser(): Promise<{ session: ApiSession; error: null } | { session: null; error: NextResponse }> {
  const session = (await getServerSession(authOptions as any)) as ApiSession | null
  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 }) }
  }
  return { session: session as ApiSession, error: null }
}

export async function requireApiStaff() {
  const { session, error } = await requireApiUser()
  if (error) return { session: null, error }
  if (!isStaffRole(session!.user.role)) {
    return { session: null, error: NextResponse.json({ success: false, message: "Acesso restrito" }, { status: 403 }) }
  }
  return { session, error: null }
}

export async function requireApiAdmin() {
  const { session, error } = await requireApiUser()
  if (error) return { session: null, error }
  if (!isAdminRole(session!.user.role)) {
    return { session: null, error: NextResponse.json({ success: false, message: "Acesso restrito a admin" }, { status: 403 }) }
  }
  return { session, error: null }
}

export async function requireApiRoot() {
  const { session, error } = await requireApiUser()
  if (error) return { session: null, error }
  if (!isRootRole(session!.user.role)) {
    return { session: null, error: NextResponse.json({ success: false, message: "Acesso restrito a root" }, { status: 403 }) }
  }
  return { session, error: null }
}

export async function requireApiApprovedProfessional(message = "Seu perfil profissional ainda esta em analise pela equipe.") {
  const { session, error } = await requireApiUser()
  if (error) return { session: null, error }
  if (!isApprovedProfessional(session!.user.role, session!.user.status)) {
    return {
      session: null,
      error: NextResponse.json({ success: false, message }, { status: 403 }),
    }
  }
  return { session, error: null }
}
