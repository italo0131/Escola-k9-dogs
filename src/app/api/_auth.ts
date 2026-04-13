import { getServerSession } from "next-auth"
import type { Session } from "next-auth"
import { NextResponse } from "next/server"

import { hasModuleAccess } from "@/lib/access"
import { isAdminRole, isApprovedProfessional, isRootRole, isStaffRole } from "@/lib/role"

import { authOptions } from "./auth/[...nextauth]/route"

type ApiSession = Session & { user: NonNullable<Session["user"]> }

export async function requireApiUser(): Promise<{ session: ApiSession; error: null } | { session: null; error: NextResponse }> {
  const session = (await getServerSession(authOptions)) as ApiSession | null

  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ success: false, message: "Nao autenticado" }, { status: 401 }) }
  }

  return { session, error: null }
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

export async function requireApiModule(requiredModule: string | string[]) {
  const { session, error } = await requireApiUser()
  if (error) return { session: null, error }

  if (!hasModuleAccess(session!.user.modules || [], requiredModule, session!.user.role)) {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, message: "Esse modulo ainda nao foi liberado pela equipe K9 para a sua conta." },
        { status: 403 },
      ),
    }
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
