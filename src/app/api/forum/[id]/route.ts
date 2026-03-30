import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"
import { requireApiUser } from "../../_auth"
import { isAdminRole } from "@/lib/role"
import { hasPremiumPlatformAccess } from "@/lib/platform"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiUser()
  if (error) return error

  if (!hasPremiumPlatformAccess(session.user.plan, session.user.role, session.user.planStatus)) {
    return NextResponse.json({ success: false, message: "Forum disponivel apenas nos planos pagos" }, { status: 403 })
  }

  const { id } = await params
  const thread = await prisma.forumThread.findUnique({
    where: { id },
    include: {
      author: true,
      channel: {
        include: {
          owner: true,
          subscriptions: {
            where: { userId: session.user.id, status: "ACTIVE" },
            select: { id: true },
          },
        },
      },
      replies: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  })

  if (!thread) {
    return NextResponse.json({ success: false, message: "Tópico não encontrado" }, { status: 404 })
  }

  if (thread.channel) {
    const canAccessChannel =
      thread.channel.ownerId === session.user.id || isAdminRole(session.user.role) || thread.channel.subscriptions.length > 0

    if (!canAccessChannel) {
      return NextResponse.json({ success: false, message: "Assine o canal para acessar este post" }, { status: 403 })
    }
  }

  return NextResponse.json({ success: true, thread })
}
