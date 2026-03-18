import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"
import { requireApiUser } from "../../../_auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiUser()
  if (error) return error
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
