import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"
import { requireApiUser } from "../../_auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiUser()
  if (error) return error
  const { id } = await params
  const thread = await prisma.forumThread.findUnique({
    where: { id },
    include: { author: true, replies: { include: { author: true }, orderBy: { createdAt: "asc" } } },
  })

  if (!thread) {
    return NextResponse.json({ success: false, message: "Tópico não encontrado" }, { status: 404 })
  }

  return NextResponse.json({ success: true, thread })
}
