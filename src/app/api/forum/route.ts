import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requireApiUser } from "../_auth"

function normalize(input: string) {
  return input.trim().replace(/\s+/g, " ")
}

export async function GET() {
  const { error } = await requireApiUser()
  if (error) return error

  const threads = await prisma.forumThread.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: true, _count: { select: { replies: true } } },
  })

  return NextResponse.json(threads)
}

export async function POST(req: Request) {
  const { session, error } = await requireApiUser()
  if (error) return error

  const data = await req.json()
  const title = normalize(String(data?.title || ""))
  const content = String(data?.content || "").trim()

  if (!title || !content) {
    return NextResponse.json({ success: false, message: "Título e conteúdo são obrigatórios" }, { status: 400 })
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

  const authorId = session.user.id!
  const thread = await prisma.forumThread.create({
    data: {
      title,
      content,
      authorId,
    },
  })

  return NextResponse.json({ success: true, thread }, { status: 201 })
}
