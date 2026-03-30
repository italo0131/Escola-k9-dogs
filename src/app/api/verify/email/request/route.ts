import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import type { Session } from "next-auth"

import { authOptions } from "../../../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { createVerificationCode } from "@/lib/verification"
import { sendVerifyEmail } from "@/lib/email"
import { rejectIfCrossOrigin, rejectIfRateLimited } from "@/lib/security"

export async function POST(req: Request) {
  const crossOriginError = rejectIfCrossOrigin(req)
  if (crossOriginError) return crossOriginError

  const rateLimitError = rejectIfRateLimited(
    req,
    "verify-email-request",
    5,
    15 * 60 * 1000,
    "Voce pediu muitos codigos em pouco tempo. Aguarde alguns minutos antes de tentar novamente.",
  )
  if (rateLimitError) return rateLimitError

  const session = (await getServerSession(authOptions as any)) as Session | null
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Voce precisa entrar na conta antes de pedir um novo codigo." }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) {
    return NextResponse.json({ success: false, message: "Nao encontramos sua conta agora. Tente novamente em instantes." }, { status: 404 })
  }

  if (user.emailVerifiedAt) {
    return NextResponse.json({ success: true, message: "Seu email ja esta confirmado. Esta etapa ja foi concluida." })
  }

  const code = await createVerificationCode(user.id, "email")
  try {
    await sendVerifyEmail(user.id, code)
  } catch (emailError) {
    console.warn("Nao foi possivel reenviar o email de verificacao.", emailError)
    console.log(`[verify-email] ${user.email} code=${code}`)
    return NextResponse.json(
      {
        success: false,
        message: "Nao conseguimos enviar o email agora. Revise o remetente configurado no provedor e tente novamente.",
      },
      { status: 503 },
    )
  }

  return NextResponse.json({ success: true, message: "Enviamos um novo codigo para o seu email. Se nao aparecer logo, vale conferir spam e promocoes." })
}
