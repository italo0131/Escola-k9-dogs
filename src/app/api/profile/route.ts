import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto"
import { getServerSession } from "next-auth"
import type { Session } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const derived = scryptSync(password, salt, 64).toString("hex")
  return `scrypt:${salt}:${derived}`
}

function verifyPassword(stored: string, input: string) {
  if (stored.startsWith("scrypt:")) {
    const [, salt, hash] = stored.split(":")
    const derivedInput = scryptSync(input, salt, 64)
    return timingSafeEqual(Buffer.from(hash, "hex"), derivedInput)
  }
  const sha = createHash("sha256").update(input).digest("hex")
  if (stored === sha) return true
  return stored === input
}

export async function GET() {
  const session = (await getServerSession(authOptions as any)) as Session | null
  if (!session?.user?.id) return NextResponse.json({ success: false, message: "Sem sessão" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      twoFactorEnabled: true,
      createdAt: true,
    },
  })

  if (!user) {
    return NextResponse.json({ success: false, message: "Nenhum usuário" }, { status: 404 })
  }

  const [dogs, trainings, schedules] = await Promise.all([
    prisma.dog.count({ where: { ownerId: user.id } }),
    prisma.trainingSession.count({ where: { dog: { ownerId: user.id } } }),
    prisma.schedule.count({ where: { userId: user.id } }),
  ])

  return NextResponse.json({
    success: true,
    user,
    stats: { dogs, trainings, schedules },
  })
}

export async function PATCH(req: Request) {
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null
    if (!session?.user?.id) return NextResponse.json({ success: false, message: "Sem sessão" }, { status: 401 })

    const data = await req.json()
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })

    if (!user) {
      return NextResponse.json({ success: false, message: "Usuário não encontrado" }, { status: 404 })
    }

    const wantsEmailChange = data.email && data.email !== user.email
    const wantsPasswordChange = !!data.password

    if (wantsEmailChange || wantsPasswordChange) {
      if (!data.currentPassword) {
        return NextResponse.json(
          { success: false, message: "Senha atual é obrigatória para alterar email ou senha" },
          { status: 400 }
        )
      }

      const valid = verifyPassword(user.password, data.currentPassword)
      if (!valid) {
        return NextResponse.json({ success: false, message: "Senha atual incorreta" }, { status: 401 })
      }
    }

    const payload: { name?: string; email?: string; password?: string; phone?: string | null; twoFactorEnabled?: boolean } = {}
    if (data.name) payload.name = data.name
    if (wantsEmailChange) payload.email = data.email
    if (typeof data.phone !== "undefined") payload.phone = data.phone || null
    if (typeof data.twoFactorEnabled !== "undefined") payload.twoFactorEnabled = !!data.twoFactorEnabled
    if (wantsPasswordChange) payload.password = hashPassword(data.password)

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: payload,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    console.error("ERRO PATCH /profile:", error)
    return NextResponse.json({ success: false, message: "Erro ao atualizar perfil" }, { status: 500 })
  }
}
