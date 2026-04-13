import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { isAdminRole } from "@/lib/role"

import { requireApiUser } from "../../../_auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiUser()
  if (error) return error

  const { id } = await params
  const data = await req.json()
  const content = String(data?.content || "").trim()

  if (!content) {
    return NextResponse.json({ success: false, message: "Conteudo obrigatorio." }, { status: 400 })
  }

  if (content.length < 5 || content.length > 1200) {
    return NextResponse.json({ success: false, message: "Resposta deve ter entre 5 e 1200 caracteres." }, { status: 400 })
  }

  const windowStart = new Date(Date.now() - 10 * 60 * 1000)
  const recentCount = await prisma.forumReply.count({
    where: { authorId: session.user.id, createdAt: { gte: windowStart } },
  })

  if (recentCount >= 20) {
    return NextResponse.json({ success: false, message: "Limite temporario atingido. Tente novamente em alguns minutos." }, { status: 429 })
  }

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
    return NextResponse.json({ success: false, message: "Post nao encontrado." }, { status: 404 })
  }

  if (thread.channel) {
    const canReply =
      thread.channel.isPublic ||
      thread.channel.ownerId === session.user.id ||
      isAdminRole(session.user.role) ||
      thread.channel.subscriptions.length > 0

    if (!canReply) {
      return NextResponse.json({ success: false, message: "Seu acesso ainda nao inclui esse canal privado." }, { status: 403 })
    }
  }

  const reply = await prisma.forumReply.create({
    data: {
      content,
      authorId: session.user.id!,
      threadId: id,
    },
  })

  return NextResponse.json({ success: true, reply }, { status: 201 })
}
