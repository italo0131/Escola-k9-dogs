import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createVerificationCode } from "@/lib/verification"
import { getServerSession } from "next-auth"
import type { Session } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions as any)) as Session | null
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) {
    return NextResponse.json({ success: false, message: "Usuário não encontrado" }, { status: 404 })
  }
  if (!user.phone) {
    return NextResponse.json({ success: false, message: "Telefone não cadastrado" }, { status: 400 })
  }
  if (user.phoneVerifiedAt) {
    return NextResponse.json({ success: true, message: "Telefone já verificado" })
  }

  const code = await createVerificationCode(user.id, "phone")
  console.log(`[verify-phone] ${user.phone} code=${code}`)

  return NextResponse.json({ success: true, message: "Código enviado" })
}
