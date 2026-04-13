import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { isAdminRole } from "@/lib/role"

import { requireApiUser } from "../../_auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiUser()
  if (error) return error

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
    return NextResponse.json({ success: false, message: "Topico nao encontrado." }, { status: 404 })
  }

  if (thread.channel) {
    const canAccessChannel =
      thread.channel.isPublic ||
      thread.channel.ownerId === session.user.id ||
      isAdminRole(session.user.role) ||
      thread.channel.subscriptions.length > 0

    if (!canAccessChannel) {
      return NextResponse.json({ success: false, message: "Esse canal privado ainda nao esta liberado para voce." }, { status: 403 })
    }
  }

  return NextResponse.json({ success: true, thread })
}
