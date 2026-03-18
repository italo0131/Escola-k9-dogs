import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"
import { isStaffRole } from "@/lib/role"
import { requireApiUser } from "../../_auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { session, error } = await requireApiUser()
  if (error) return error
  const isStaff = isStaffRole(session?.user?.role)
  const { slug } = await params

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { author: true },
  })

  if (!post) {
    return NextResponse.json({ success: false, message: "Post não encontrado" }, { status: 404 })
  }

  if (!post.published && !isStaff) {
    return NextResponse.json({ success: false, message: "Post não publicado" }, { status: 403 })
  }

  return NextResponse.json({ success: true, post })
}
