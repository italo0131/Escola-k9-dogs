import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { randomBytes, scryptSync } from "crypto"
import { createVerificationCode } from "@/lib/verification"
import { sendVerifyEmail } from "@/lib/email";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const derived = scryptSync(password, salt, 64).toString("hex")
  return `scrypt:${salt}:${derived}`
}

export async function POST(req: Request) {
  try {
    const data = await req.json()

    if (!data?.name || !data?.email || !data?.password) {
      return NextResponse.json(
        { success: false, message: "Nome, email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    const hashedPassword = hashPassword(data.password)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone || null,
        status: "ACTIVE",
      },
    })

    // send real verify email
    const emailCode = await createVerificationCode(user.id, "email")
    await sendVerifyEmail(user.id, emailCode);

    if (data.phone) {
      const phoneCode = await createVerificationCode(user.id, "phone")
      // TODO: integrate SMS service (Twilio)
    }

    const { password, ...safeUser } = user

    return NextResponse.json({ success: true, user: safeUser, message: "Conta criada. Verifique email." }, { status: 201 })
  } catch (error: any) {
    console.error("ERRO API POST /register:", error)

    if (error.code === "P2002") {
      return NextResponse.json({ success: false, message: "Email já cadastrado" }, { status: 409 })
    }

    return NextResponse.json({ success: false, message: "Erro ao registrar usuário" }, { status: 500 })
  }
}
