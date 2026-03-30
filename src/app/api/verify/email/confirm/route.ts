import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import type { Session } from "next-auth"

import { authOptions } from "../../../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { verifyCode } from "@/lib/verification"
import { rejectIfCrossOrigin, rejectIfRateLimited } from "@/lib/security"

export async function POST(req: Request) {
  const crossOriginError = rejectIfCrossOrigin(req)
  if (crossOriginError) return crossOriginError

  const rateLimitError = rejectIfRateLimited(
    req,
    "verify-email-confirm",
    10,
    15 * 60 * 1000,
    "Houve muitas tentativas de confirmacao. Aguarde alguns minutos antes de tentar novamente.",
  )
  if (rateLimitError) return rateLimitError

  const session = (await getServerSession(authOptions as any)) as Session | null
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Voce precisa entrar na conta antes de confirmar o email." }, { status: 401 })
  }

  const data = await req.json().catch(() => null)
  if (!data?.code) {
    return NextResponse.json({ success: false, message: "Digite o codigo que enviamos por email para concluir esta etapa." }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) {
    return NextResponse.json({ success: false, message: "Nao encontramos sua conta agora. Tente novamente em instantes." }, { status: 404 })
  }

  const ok = await verifyCode(user.id, "email", data.code)
  if (!ok) {
    return NextResponse.json({ success: false, message: "Esse codigo nao bateu ou ja expirou. Vale pedir um novo e tentar novamente." }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date() },
  })

  return NextResponse.json({ success: true, message: "Email confirmado com sucesso. Agora voce pode seguir com a experiencia completa da plataforma." })
}
