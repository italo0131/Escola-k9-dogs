import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import type { Session } from "next-auth"

import { authOptions } from "../../../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { createVerificationCode } from "@/lib/verification"
import { rejectIfCrossOrigin, rejectIfRateLimited } from "@/lib/security"

export async function POST(req: Request) {
  const crossOriginError = rejectIfCrossOrigin(req)
  if (crossOriginError) return crossOriginError

  const rateLimitError = rejectIfRateLimited(
    req,
    "verify-phone-request",
    5,
    15 * 60 * 1000,
    "Voce pediu muitos codigos em pouco tempo. Aguarde um pouco antes de tentar novamente.",
  )
  if (rateLimitError) return rateLimitError

  const session = (await getServerSession(authOptions as any)) as Session | null
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Voce precisa entrar na conta antes de confirmar o telefone." }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) {
    return NextResponse.json({ success: false, message: "Nao encontramos sua conta agora. Tente novamente em instantes." }, { status: 404 })
  }

  if (!user.phone) {
    return NextResponse.json({ success: false, message: "Adicione um telefone no seu perfil antes de pedir o codigo por SMS." }, { status: 400 })
  }

  if (user.phoneVerifiedAt) {
    return NextResponse.json({ success: true, message: "Seu telefone ja esta confirmado. Nao precisa repetir esta etapa." })
  }

  const code = await createVerificationCode(user.id, "phone")
  console.log(`[verify-phone] ${user.phone} code=${code}`)

  return NextResponse.json({
    success: true,
    message: "Se o envio por SMS estiver ativo neste ambiente, o codigo chega em instantes. Se nao chegar, tente novamente daqui a pouco.",
  })
}
