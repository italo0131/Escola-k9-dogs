import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireApiUser } from "@/app/api/_auth"
import { isStaffRole } from "@/lib/role"

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { session, error } = await requireApiUser()
  if (error) return error

  const { slug } = await params

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: { id: true, published: true },
  })

  if (!post) {
    return NextResponse.json({ success: false, message: "Post nao encontrado" }, { status: 404 })
  }

  if (!post.published && !isStaffRole(session.user.role)) {
    return NextResponse.json({ success: false, message: "Post nao disponivel para curtida" }, { status: 403 })
  }

  const existing = await prisma.blogPostReaction.findUnique({
    where: {
      postId_userId: {
        postId: post.id,
        userId: session.user.id!,
      },
    },
  })

  if (existing) {
    await prisma.blogPostReaction.delete({ where: { id: existing.id } })
  } else {
    await prisma.blogPostReaction.create({
      data: {
        postId: post.id,
        userId: session.user.id!,
      },
    })
  }

  const count = await prisma.blogPostReaction.count({ where: { postId: post.id } })
  return NextResponse.json({ success: true, liked: !existing, count })
}
