import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"
import { requireApiRoot } from "@/app/api/_auth"
import { logAudit } from "@/lib/audit"

const ALLOWED_ROLES = ["ADMIN", "ROOT", "SUPERADMIN", "TRAINER", "CLIENT"]
const ALLOWED_STATUS = ["ACTIVE", "SUSPENDED"]

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiRoot()
  if (error) return error

  const { id } = await params
  const data = await req.json().catch(() => ({}))

  const updates: any = {}

  if (typeof data.name === "string") updates.name = data.name
  if (typeof data.phone === "string") updates.phone = data.phone

  if (typeof data.role === "string") {
    const role = data.role.toUpperCase()
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ success: false, message: "Role invalida" }, { status: 400 })
    }
    updates.role = role
  }

  if (typeof data.status === "string") {
    const status = data.status.toUpperCase()
    if (!ALLOWED_STATUS.includes(status)) {
      return NextResponse.json({ success: false, message: "Status invalido" }, { status: 400 })
    }
    updates.status = status
  }

  if (typeof data.twoFactorEnabled === "boolean") {
    updates.twoFactorEnabled = data.twoFactorEnabled
  }

  if (typeof data.emailVerified === "boolean") {
    updates.emailVerifiedAt = data.emailVerified ? new Date() : null
  }

  if (typeof data.phoneVerified === "boolean") {
    updates.phoneVerifiedAt = data.phoneVerified ? new Date() : null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: false, message: "Nada para atualizar" }, { status: 400 })
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: updates,
    })
    const { password, ...safe } = user
    await logAudit({
      actorId: session?.user?.id || null,
      action: "USER_UPDATE",
      targetType: "user",
      targetId: id,
      metadata: updates,
    })
    return NextResponse.json({ success: true, user: safe })
  } catch (err) {
    console.error("ERRO PATCH /admin/users/[id]:", err)
    return NextResponse.json({ success: false, message: "Erro ao atualizar usuario" }, { status: 500 })
  }
}
