import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { verifyCode } from "@/lib/verification"

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions as any)) as Session | null
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 })
  }

  const data = await req.json()
  const { code } = data

  if (!code) {
    return NextResponse.json({ success: false, message: "Código obrigatório" }, { status: 400 })
  }

  const valid = await verifyCode(session.user.id, "email", code)

  if (!valid) {
    return NextResponse.json({ success: false, message: "Código inválido ou expirado" }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      emailVerifiedAt: new Date(),
    },
  })

  return NextResponse.json({ success: true, message: "Email verificado" })
}
