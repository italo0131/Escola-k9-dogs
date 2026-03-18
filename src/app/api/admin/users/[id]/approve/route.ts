import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiRoot } from "@/app/api/_auth"
import { logAudit } from "@/lib/audit"
import { sendApprovalEmail } from "@/lib/email"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiRoot()
  if (error) return error

  const { id } = await params
  const data = await req.json().catch(() => ({}))
  const reason = data.reason || "Aprovado pelo admin"

  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        status: "ACTIVE",
      },
    })

    await sendApprovalEmail(id, session.user.name || "Admin")

    await logAudit({
      actorId: session.user.id,
      action: "USER_APPROVE",
      targetType: "user",
      targetId: id,
      metadata: { reason },
    })

    const { password, ...safe } = user
    return NextResponse.json({ success: true, user: safe })
  } catch (err) {
    console.error("ERRO APPROVE USER:", err)
    return NextResponse.json({ success: false, message: "Erro ao aprovar" }, { status: 500 })
  }
}
