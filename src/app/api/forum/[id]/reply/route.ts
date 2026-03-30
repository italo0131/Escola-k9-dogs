import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"
import { requireApiUser } from "../../../_auth"
import { isAdminRole } from "@/lib/role"
import { hasPremiumPlatformAccess } from "@/lib/platform"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiUser()
  if (error) return error

  if (!hasPremiumPlatformAccess(session.user.plan, session.user.role, session.user.planStatus)) {
    return NextResponse.json({ success: false, message: "Forum disponivel apenas nos planos pagos" }, { status: 403 })
  }

  const { id } = await params

  const data = await req.json()
  const content = String(data?.content || "").trim()
  if (!content) {
    return NextResponse.json({ success: false, message: "Conteúdo obrigatório" }, { status: 400 })
  }
  if (content.length < 5 || content.length > 1200) {
    return NextResponse.json({ success: false, message: "Resposta deve ter entre 5 e 1200 caracteres" }, { status: 400 })
  }

  // limite: até 20 respostas por 10 minutos
  const windowStart = new Date(Date.now() - 10 * 60 * 1000)
  const recentCount = await prisma.forumReply.count({
    where: { authorId: session.user.id, createdAt: { gte: windowStart } },
  })
  if (recentCount >= 20) {
    return NextResponse.json({ success: false, message: "Limite temporário atingido. Tente novamente em alguns minutos." }, { status: 429 })
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
    return NextResponse.json({ success: false, message: "Post nao encontrado" }, { status: 404 })
  }

  if (thread.channel) {
    const canReply =
      thread.channel.ownerId === session.user.id || isAdminRole(session.user.role) || thread.channel.subscriptions.length > 0

    if (!canReply) {
      return NextResponse.json({ success: false, message: "Assine o canal para comentar neste post" }, { status: 403 })
    }
  }

  const authorId = session.user.id!
  const reply = await prisma.forumReply.create({
    data: {
      content,
      authorId,
      threadId: id,
    },
  })

  return NextResponse.json({ success: true, reply }, { status: 201 })
}
