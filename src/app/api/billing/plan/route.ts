import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requireApiUser } from "../../_auth"

export async function POST(req: Request) {
  const { session, error } = await requireApiUser()
  if (error) return error

  try {
    const body = await req.json()
    const plan = String(body?.plan || "").toUpperCase()

    if (plan !== "FREE") {
      return NextResponse.json({ success: false, message: "Somente o plano free pode ser ativado diretamente" }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: session.user.id! },
      data: {
        plan: "FREE",
        planStatus: "ACTIVE",
        planActivatedAt: new Date(),
      },
      select: {
        id: true,
        plan: true,
        planStatus: true,
        planActivatedAt: true,
      },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("ERRO POST /api/billing/plan:", error)
    return NextResponse.json({ success: false, message: "Erro ao atualizar plano" }, { status: 500 })
  }
}
