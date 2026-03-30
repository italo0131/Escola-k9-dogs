import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"
import { requireApiAdmin } from "@/app/api/_auth"
import { logAudit } from "@/lib/audit"
import { sendApprovalEmail } from "@/lib/email"
import { ACCOUNT_PLANS } from "@/lib/platform"
import { isRootRole } from "@/lib/role"

const ALLOWED_ROLES = ["ADMIN", "ROOT", "SUPERADMIN", "TRAINER", "VET", "CLIENT"]
const ALLOWED_STATUS = ["ACTIVE", "PENDING_APPROVAL", "SUSPENDED"]
const ALLOWED_PLAN_STATUS = ["ACTIVE", "CHECKOUT_REQUIRED", "CHECKOUT_PENDING", "PAST_DUE", "CANCELED"]

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiAdmin()
  if (error) return error

  const { id } = await params
  const data = await req.json().catch(() => ({}))
  const isRoot = isRootRole(session?.user?.role)

  const currentUser = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      planStatus: true,
      planActivatedAt: true,
      emailVerifiedAt: true,
    },
  })

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "Usuario nao encontrado" }, { status: 404 })
  }

  const updates: any = {}
  let shouldSendApprovalEmail = data.sendApprovalEmail === true

  if (typeof data.name === "string") updates.name = data.name
  if (typeof data.phone === "string") updates.phone = data.phone

  if (typeof data.role === "string") {
    if (!isRoot) {
      return NextResponse.json({ success: false, message: "Somente root pode alterar papeis" }, { status: 403 })
    }
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

  if (typeof data.plan === "string") {
    const plan = data.plan.toUpperCase()
    if (!ACCOUNT_PLANS.includes(plan as (typeof ACCOUNT_PLANS)[number])) {
      return NextResponse.json({ success: false, message: "Plano invalido" }, { status: 400 })
    }
    updates.plan = plan
  }

  if (typeof data.planStatus === "string") {
    const planStatus = data.planStatus.toUpperCase()
    if (!ALLOWED_PLAN_STATUS.includes(planStatus)) {
      return NextResponse.json({ success: false, message: "Status do plano invalido" }, { status: 400 })
    }
    updates.planStatus = planStatus
  }

  if (Object.prototype.hasOwnProperty.call(data, "planActivatedAt")) {
    updates.planActivatedAt = data.planActivatedAt ? new Date(data.planActivatedAt) : null
  }

  if (data.approveAccess === true) {
    updates.status = "ACTIVE"
    updates.emailVerifiedAt = currentUser.emailVerifiedAt || new Date()
    updates.planStatus = "ACTIVE"
    updates.planActivatedAt = currentUser.planActivatedAt || new Date()
    shouldSendApprovalEmail = true
  }

  const resolvedPlan = String(updates.plan || currentUser.plan || "FREE").toUpperCase()
  const resolvedPlanStatus = String(updates.planStatus || currentUser.planStatus || "ACTIVE").toUpperCase()

  if (resolvedPlan === "FREE") {
    updates.planStatus = "ACTIVE"
    if (!Object.prototype.hasOwnProperty.call(updates, "planActivatedAt")) {
      updates.planActivatedAt = currentUser.planActivatedAt || new Date()
    }
  } else if (resolvedPlanStatus === "ACTIVE" && !Object.prototype.hasOwnProperty.call(updates, "planActivatedAt")) {
    updates.planActivatedAt = currentUser.planActivatedAt || new Date()
  } else if (
    currentUser.plan === "FREE" &&
    resolvedPlan !== "FREE" &&
    resolvedPlanStatus !== "ACTIVE" &&
    !Object.prototype.hasOwnProperty.call(updates, "planActivatedAt")
  ) {
    updates.planActivatedAt = null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: false, message: "Nada para atualizar" }, { status: 400 })
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: updates,
    })

    if (shouldSendApprovalEmail) {
      await sendApprovalEmail(id, session?.user?.name || "Admin")
    }

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
