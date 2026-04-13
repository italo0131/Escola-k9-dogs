import { NextResponse } from "next/server"

import { slugify } from "@/lib/community"
import { prisma } from "@/lib/prisma"

import { requireApiAdmin, requireApiUser } from "../../_auth"

function normalize(input: string, max = 240) {
  return input.trim().replace(/\s+/g, " ").slice(0, max)
}

export async function GET() {
  const { error } = await requireApiUser()
  if (error) return error

  const channels = await prisma.forumChannel.findMany({
    where: { isPublic: true },
    include: {
      owner: true,
      _count: { select: { threads: true, subscriptions: true, contents: true } },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  })

  return NextResponse.json(channels)
}

export async function POST(req: Request) {
  const { session, error } = await requireApiAdmin()
  if (error) return error

  const data = await req.json()
  const name = normalize(String(data?.name || ""), 80)
  const description = normalize(String(data?.description || ""), 500)

  if (!name || !description) {
    return NextResponse.json({ success: false, message: "Nome e descricao sao obrigatorios." }, { status: 400 })
  }

  const baseSlug = slugify(name)
  let slug = baseSlug
  let counter = 1

  while (await prisma.forumChannel.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`
  }

  const ownerId = String(data?.ownerId || session.user.id || "").trim() || session.user.id!

  const channel = await prisma.forumChannel.create({
    data: {
      slug,
      name,
      description,
      category: String(data?.category || "COMUNIDADE").toUpperCase(),
      serviceMode: String(data?.serviceMode || "COMMUNITY").toUpperCase(),
      subscriptionPrice: null,
      onlinePrice: data?.onlinePrice ? Math.max(0, Number(data.onlinePrice)) : null,
      inPersonPrice: data?.inPersonPrice ? Math.max(0, Number(data.inPersonPrice)) : null,
      city: normalize(String(data?.city || ""), 60) || null,
      state: normalize(String(data?.state || ""), 40) || null,
      acceptsRemote: Boolean(data?.acceptsRemote),
      featured: Boolean(data?.featured),
      isPublic: data?.isPublic !== false,
      ownerId,
    },
    include: { owner: true, _count: { select: { subscriptions: true, contents: true, threads: true } } },
  })

  return NextResponse.json({ success: true, channel }, { status: 201 })
}
