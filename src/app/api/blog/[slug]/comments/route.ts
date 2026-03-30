import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireApiUser } from "@/app/api/_auth"
import { isStaffRole } from "@/lib/role"

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { session, error } = await requireApiUser()
  if (error) return error

  const { slug } = await params
  const data = await req.json().catch(() => ({}))
  const content = String(data?.content || "").trim()

  if (!content || content.length < 3 || content.length > 1200) {
    return NextResponse.json(
      { success: false, message: "Comentario deve ter entre 3 e 1200 caracteres" },
      { status: 400 }
    )
  }

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: { id: true, published: true },
  })

  if (!post) {
    return NextResponse.json({ success: false, message: "Post nao encontrado" }, { status: 404 })
  }

  if (!post.published && !isStaffRole(session.user.role)) {
    return NextResponse.json({ success: false, message: "Post nao disponivel para comentario" }, { status: 403 })
  }

  const windowStart = new Date(Date.now() - 10 * 60 * 1000)
  const recentCount = await prisma.blogComment.count({
    where: { authorId: session.user.id, createdAt: { gte: windowStart } },
  })

  if (recentCount >= 20) {
    return NextResponse.json(
      { success: false, message: "Limite temporario atingido. Tente novamente em alguns minutos." },
      { status: 429 }
    )
  }

  const comment = await prisma.blogComment.create({
    data: {
      content,
      authorId: session.user.id!,
      postId: post.id,
    },
    include: { author: true },
  })

  return NextResponse.json({ success: true, comment }, { status: 201 })
}
