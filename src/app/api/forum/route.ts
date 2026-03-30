import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requireApiUser } from "../_auth"
import { isAdminRole, isStaffRole } from "@/lib/role"
import { normalizeVideoUrl } from "@/lib/video"
import { FORUM_POST_TYPES, hasPremiumPlatformAccess } from "@/lib/platform"

function normalize(input: string, max = 240) {
  return input.trim().replace(/\s+/g, " ").slice(0, max)
}

function normalizeDate(value?: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export async function GET() {
  const { session, error } = await requireApiUser()
  if (error) return error

  const threadWhere = isAdminRole(session.user.role)
    ? {}
    : {
        OR: [
          { channelId: null },
          { channel: { ownerId: session.user.id } },
          { channel: { subscriptions: { some: { userId: session.user.id, status: "ACTIVE" } } } },
        ],
      }

  const threads = await prisma.forumThread.findMany({
    where: threadWhere,
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: {
      author: true,
      channel: { include: { owner: true } },
      _count: { select: { replies: true, reactions: true } },
    },
  })

  return NextResponse.json(threads)
}

export async function POST(req: Request) {
  const { session, error } = await requireApiUser()
  if (error) return error

  if (!hasPremiumPlatformAccess(session.user.plan, session.user.role, session.user.planStatus)) {
    return NextResponse.json({ success: false, message: "Forum disponivel apenas nos planos pagos" }, { status: 403 })
  }

  const data = await req.json()
  const title = normalize(String(data?.title || ""))
  const content = String(data?.content || "").trim()
  const channelId = String(data?.channelId || "").trim() || null
  const postType = String(data?.postType || "POST").toUpperCase()
  const eventStartsAt = normalizeDate(data?.eventStartsAt)
  const eventEndsAt = normalizeDate(data?.eventEndsAt)

  if (!title || !content) {
    return NextResponse.json({ success: false, message: "Título e conteúdo são obrigatórios" }, { status: 400 })
  }

  if (!FORUM_POST_TYPES.includes(postType as (typeof FORUM_POST_TYPES)[number])) {
    return NextResponse.json({ success: false, message: "Tipo de post invalido" }, { status: 400 })
  }

  if (postType === "EVENTO" && !isStaffRole(session.user.role)) {
    return NextResponse.json(
      { success: false, message: "Somente adestradores, veterinarios e admin publicam eventos no forum" },
      { status: 403 }
    )
  }

  if (title.length < 6 || title.length > 120) {
    return NextResponse.json({ success: false, message: "Título deve ter entre 6 e 120 caracteres" }, { status: 400 })
  }

  if (content.length < 20 || content.length > 2000) {
    return NextResponse.json({ success: false, message: "Conteúdo deve ter entre 20 e 2000 caracteres" }, { status: 400 })
  }

  // limite: até 5 tópicos por 10 minutos
  const windowStart = new Date(Date.now() - 10 * 60 * 1000)
  const recentCount = await prisma.forumThread.count({
    where: { authorId: session.user.id, createdAt: { gte: windowStart } },
  })
  if (recentCount >= 5) {
    return NextResponse.json({ success: false, message: "Limite temporário atingido. Tente novamente em alguns minutos." }, { status: 429 })
  }

  if (channelId) {
    const channel = await prisma.forumChannel.findUnique({
      where: { id: channelId },
      select: {
        id: true,
        isPublic: true,
        ownerId: true,
        subscriptions: {
          where: { userId: session.user.id, status: "ACTIVE" },
          select: { id: true },
        },
      },
    })

    if (!channel?.id || !channel.isPublic) {
      return NextResponse.json({ success: false, message: "Canal inválido para publicação" }, { status: 400 })
    }

    const canPostInChannel =
      channel.ownerId === session.user.id || isAdminRole(session.user.role) || channel.subscriptions.length > 0

    if (!canPostInChannel) {
      return NextResponse.json(
        { success: false, message: "Assine o canal antes de publicar dentro dele" },
        { status: 403 }
      )
    }
  }

  if (postType === "EVENTO" && !eventStartsAt) {
    return NextResponse.json({ success: false, message: "Evento precisa de data de inicio" }, { status: 400 })
  }

  const authorId = session.user.id!
  const thread = await prisma.forumThread.create({
    data: {
      title,
      content,
      postType,
      imageUrl: normalize(String(data?.imageUrl || ""), 500) || null,
      videoUrl: normalizeVideoUrl(data?.videoUrl),
      eventStartsAt,
      eventEndsAt,
      eventLocation: postType === "EVENTO" ? normalize(String(data?.eventLocation || "")) || null : null,
      eventCity: postType === "EVENTO" ? normalize(String(data?.eventCity || "")) || null : null,
      eventState: postType === "EVENTO" ? normalize(String(data?.eventState || "")) || null : null,
      authorId,
      channelId,
    },
    include: { channel: true },
  })

  return NextResponse.json({ success: true, thread }, { status: 201 })
}
