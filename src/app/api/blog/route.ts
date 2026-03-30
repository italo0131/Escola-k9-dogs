import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { isApprovedProfessional, isProfessionalRole, isStaffRole } from "@/lib/role"
import { getServerSession } from "next-auth"
import type { Session } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { requireApiUser } from "../_auth"
import { slugify } from "@/lib/community"
import { normalizeVideoUrl } from "@/lib/video"
import { BLOG_POST_TYPES } from "@/lib/platform"

function normalize(input: string, max = 240) {
  return input.trim().replace(/\s+/g, " ").slice(0, max)
}

function normalizeDate(value?: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export async function GET() {
  const session = (await getServerSession(authOptions as any)) as Session | null
  const canViewDrafts = isStaffRole(session?.user?.role)

  const posts = await prisma.blogPost.findMany({
    where: canViewDrafts ? {} : { published: true },
    orderBy: { createdAt: "desc" },
    include: { author: true },
  })

  return NextResponse.json(posts)
}

export async function POST(req: Request) {
  const { session, error } = await requireApiUser()
  if (error) return error

  if (isProfessionalRole(session.user.role) && !isApprovedProfessional(session.user.role, session.user.status)) {
    return NextResponse.json(
      { success: false, message: "Seu perfil profissional ainda esta em analise. Assim que a equipe aprovar, o blog profissional sera liberado." },
      { status: 403 },
    )
  }

  const data = await req.json()
  const title = normalize(String(data?.title || ""), 140)
  const content = String(data?.content || "").trim()
  const postType = String(data?.postType || "POST").toUpperCase()
  const isEvent = postType === "EVENTO"
  const eventStartsAt = normalizeDate(data?.eventStartsAt)
  const eventEndsAt = normalizeDate(data?.eventEndsAt)

  if (!title || !content) {
    return NextResponse.json({ success: false, message: "Título e conteúdo são obrigatórios" }, { status: 400 })
  }

  if (!BLOG_POST_TYPES.includes(postType as (typeof BLOG_POST_TYPES)[number])) {
    return NextResponse.json({ success: false, message: "Tipo de post invalido" }, { status: 400 })
  }

  if (isEvent && !isStaffRole(session.user.role)) {
    return NextResponse.json(
      { success: false, message: "Somente adestradores, veterinarios e admin podem publicar eventos" },
      { status: 403 }
    )
  }

  if (isEvent && !eventStartsAt) {
    return NextResponse.json({ success: false, message: "Evento precisa de data de inicio" }, { status: 400 })
  }

  const baseSlug = slugify(title)
  let slug = baseSlug
  let counter = 1

  while (await prisma.blogPost.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`
  }

  const canPublish = isStaffRole(session.user.role)
  const authorId = session.user.id!
  const post = await prisma.blogPost.create({
    data: {
      title,
      slug,
      category: normalize(String(data?.category || "GERAL"), 40).toUpperCase(),
      postType,
      accessLevel: "FREE",
      excerpt: normalize(String(data?.excerpt || ""), 280) || null,
      content,
      coverImageUrl: normalize(String(data?.coverImageUrl || ""), 500) || null,
      videoUrl: normalizeVideoUrl(data?.videoUrl),
      featured: canPublish ? Boolean(data?.featured) : false,
      eventStartsAt,
      eventEndsAt,
      eventLocation: isEvent ? normalize(String(data?.eventLocation || ""), 120) || null : null,
      eventCity: isEvent ? normalize(String(data?.eventCity || ""), 60) || null : null,
      eventState: isEvent ? normalize(String(data?.eventState || ""), 40) || null : null,
      published: canPublish ? data.published ?? true : true,
      authorId,
    },
  })

  return NextResponse.json({ success: true, post }, { status: 201 })
}
