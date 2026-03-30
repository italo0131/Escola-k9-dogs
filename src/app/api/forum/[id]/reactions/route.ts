import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireApiUser } from "@/app/api/_auth"
import { hasPremiumPlatformAccess } from "@/lib/platform"
import { isAdminRole } from "@/lib/role"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiUser()
  if (error) return error

  if (!hasPremiumPlatformAccess(session.user.plan, session.user.role, session.user.planStatus)) {
    return NextResponse.json({ success: false, message: "Forum disponivel apenas nos planos pagos" }, { status: 403 })
  }

  const { id } = await params

  const thread = await prisma.forumThread.findUnique({
    where: { id },
    include: {
      channel: {
        include: {
          subscriptions: {
            where: { userId: session.user.id, status: "ACTIVE" },
            select: { id: true },
          },
        },
      },
    },
  })

  if (!thread) {
    return NextResponse.json({ success: false, message: "Post nao encontrado" }, { status: 404 })
  }

  if (thread.channel) {
    const canAccessChannel =
      thread.channel.ownerId === session.user.id || isAdminRole(session.user.role) || thread.channel.subscriptions.length > 0

    if (!canAccessChannel) {
      return NextResponse.json({ success: false, message: "Assine o canal para curtir este post" }, { status: 403 })
    }
  }

  const existing = await prisma.forumThreadReaction.findUnique({
    where: {
      threadId_userId: {
        threadId: id,
        userId: session.user.id!,
      },
    },
  })

  if (existing) {
    await prisma.forumThreadReaction.delete({ where: { id: existing.id } })
  } else {
    await prisma.forumThreadReaction.create({
      data: {
        threadId: id,
        userId: session.user.id!,
      },
    })
  }

  const count = await prisma.forumThreadReaction.count({ where: { threadId: id } })
  return NextResponse.json({ success: true, liked: !existing, count })
}
