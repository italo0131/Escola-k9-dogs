import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { isStaffRole } from "@/lib/role"
import { getServerSession } from "next-auth"
import type { Session } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { requireApiUser } from "../_auth"

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
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

  const data = await req.json()
  if (!data?.title || !data?.content) {
    return NextResponse.json({ success: false, message: "Título e conteúdo são obrigatórios" }, { status: 400 })
  }

  const baseSlug = slugify(data.title)
  let slug = baseSlug
  let counter = 1

  while (await prisma.blogPost.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`
  }

  const canPublish = isStaffRole(session.user.role)
  const authorId = session.user.id!
  const post = await prisma.blogPost.create({
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt || null,
      content: data.content,
      published: canPublish ? data.published ?? true : false,
      authorId,
    },
  })

  return NextResponse.json({ success: true, post }, { status: 201 })
}
