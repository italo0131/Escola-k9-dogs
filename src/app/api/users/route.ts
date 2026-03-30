import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { randomBytes, scryptSync } from "crypto"
import { requireApiAdmin, requireApiStaff } from "../_auth"
import { isAdminRole } from "@/lib/role"

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const derived = scryptSync(password, salt, 64).toString("hex")
  return `scrypt:${salt}:${derived}`
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function GET() {
  const { session, error } = await requireApiStaff()
  if (error) return error

  const users = await prisma.user.findMany({
    where: isAdminRole(session.user.role) ? {} : { role: "CLIENT" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      twoFactorEnabled: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(users)
}

export async function POST(req: Request) {
  try {
    const { error } = await requireApiAdmin()
    if (error) return error
    const data = await req.json()

    if (!data?.name || !data?.email || !data?.password) {
      return NextResponse.json(
        { success: false, message: "Nome, email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: normalizeEmail(data.email),
        password: hashPassword(data.password),
      },
    })

    const { password, ...safeUser } = user
    return NextResponse.json({ success: true, user: safeUser }, { status: 201 })
  } catch (error: any) {
    console.error("ERRO API POST /users:", error)

    if (error.code === "P2002") {
      return NextResponse.json({ success: false, message: "Email já cadastrado" }, { status: 409 })
    }

    return NextResponse.json({ success: false, message: "Erro ao criar usuário" }, { status: 500 })
  }
}
