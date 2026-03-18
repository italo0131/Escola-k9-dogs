import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { verifyCode } from "@/lib/verification"
import { getServerSession } from "next-auth"
import type { Session } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions as any)) as Session | null
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 })
  }

  const data = await req.json()
  if (!data?.code) {
    return NextResponse.json({ success: false, message: "Código obrigatório" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) {
    return NextResponse.json({ success: false, message: "Usuário não encontrado" }, { status: 404 })
  }

  const ok = await verifyCode(user.id, "email", data.code)
  if (!ok) {
    return NextResponse.json({ success: false, message: "Código inválido ou expirado" }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date() },
  })

  return NextResponse.json({ success: true, message: "Email verificado" })
}
