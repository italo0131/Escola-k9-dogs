import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requireApiUser } from "../_auth"
import { isApprovedProfessional } from "@/lib/role"
import { slugify } from "@/lib/community"
import { normalizeVideoUrl } from "@/lib/video"
import { hasPremiumPlatformAccess } from "@/lib/platform"

function normalize(input: string, max = 240) {
  return input.trim().replace(/\s+/g, " ").slice(0, max)
}

export async function POST(req: Request) {
  const { session, error } = await requireApiUser()
  if (error) return error

  if (!hasPremiumPlatformAccess(session.user.plan, session.user.role, session.user.planStatus)) {
    return NextResponse.json({ success: false, message: "Conteudos exclusivos fazem parte dos planos pagos" }, { status: 403 })
  }

  if (!isApprovedProfessional(session.user.role, session.user.status)) {
    return NextResponse.json(
      { success: false, message: "Somente profissionais aprovados publicam conteudo de canal" },
      { status: 403 }
    )
  }

  const data = await req.json()
  const title = normalize(String(data?.title || ""), 120)
  const summary = normalize(String(data?.summary || ""), 280) || null
  const body = String(data?.body || "").trim()
  const channelId = String(data?.channelId || "").trim()

  if (!title || !body || !channelId) {
    return NextResponse.json({ success: false, message: "Titulo, canal e conteudo sao obrigatorios" }, { status: 400 })
  }

  const channel = await prisma.forumChannel.findUnique({
    where: { id: channelId },
    select: { id: true, ownerId: true, name: true },
  })

  if (!channel) {
    return NextResponse.json({ success: false, message: "Canal nao encontrado" }, { status: 404 })
  }

  if (channel.ownerId !== session.user.id) {
    return NextResponse.json({ success: false, message: "Voce nao pode publicar neste canal" }, { status: 403 })
  }

  const baseSlug = slugify(`${channel.name}-${title}`)
  let slug = baseSlug
  let counter = 1

  while (await prisma.channelContent.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`
  }

  const content = await prisma.channelContent.create({
    data: {
      slug,
      title,
      summary,
      body,
      coverImageUrl: normalize(String(data?.coverImageUrl || ""), 500) || null,
      category: normalize(String(data?.category || "TREINO"), 40).toUpperCase(),
      contentType: normalize(String(data?.contentType || "LESSON"), 40).toUpperCase(),
      accessLevel: normalize(String(data?.accessLevel || "SUBSCRIBER"), 40).toUpperCase(),
      objective: normalize(String(data?.objective || ""), 180) || null,
      difficulty: normalize(String(data?.difficulty || ""), 40).toUpperCase() || null,
      durationMinutes: data?.durationMinutes ? Math.max(1, Number(data.durationMinutes)) : null,
      orderIndex: data?.orderIndex ? Math.max(1, Number(data.orderIndex)) : null,
      videoUrl: normalizeVideoUrl(data?.videoUrl),
      published: data?.published !== false,
      authorId: session.user.id!,
      channelId,
    },
    include: {
      author: true,
      channel: true,
    },
  })

  return NextResponse.json({ success: true, content }, { status: 201 })
}
