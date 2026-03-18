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

  if (user.emailVerifiedAt) {
    return NextResponse.json({ success: true, message: "Email já verificado" })
  }

  const code = await createVerificationCode(user.id, "email")
  console.log(`[verify-email] ${user.email} code=${code}`)

  return NextResponse.json({ success: true, message: "Código enviado" })
}
