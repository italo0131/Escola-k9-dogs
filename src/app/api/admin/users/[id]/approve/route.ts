import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiAdmin } from "@/app/api/_auth"
import { logAudit } from "@/lib/audit"
import { sendApprovalEmail } from "@/lib/email"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiAdmin()
  if (error) return error

  const { id } = await params
  const data = await req.json().catch(() => ({}))
  const reason = data.reason || "Aprovado pelo admin"
  const mode = String(data.mode || "full").toLowerCase()

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        plan: true,
        planActivatedAt: true,
        emailVerifiedAt: true,
      },
    })

    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Usuario nao encontrado" }, { status: 404 })
    }

    const updates: Record<string, unknown> =
      mode === "professional"
        ? {
            status: "ACTIVE",
          }
        : mode === "plan"
          ? {
              planStatus: "ACTIVE",
              planActivatedAt: currentUser.planActivatedAt || new Date(),
            }
          : {
              status: "ACTIVE",
              emailVerifiedAt: currentUser.emailVerifiedAt || new Date(),
              planStatus: "ACTIVE",
              planActivatedAt: currentUser.plan === "FREE" ? currentUser.planActivatedAt || new Date() : currentUser.planActivatedAt || new Date(),
            }

    const user = await prisma.user.update({
      where: { id },
      data: updates,
    })

    await sendApprovalEmail(id, session.user.name || "Admin")

    await logAudit({
      actorId: session.user.id,
      action: "USER_APPROVE",
      targetType: "user",
      targetId: id,
      metadata: { reason, mode },
    })

    const { password, ...safe } = user
    return NextResponse.json({ success: true, user: safe })
  } catch (err) {
    console.error("ERRO APPROVE USER:", err)
    return NextResponse.json({ success: false, message: "Erro ao aprovar" }, { status: 500 })
  }
}
