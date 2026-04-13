import { randomBytes, scryptSync } from "crypto"
import { NextResponse } from "next/server"

import { dedupeModuleKeys } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { USER_ROLES, USER_STATUSES, isRootRole } from "@/lib/role"

import { requireApiAdmin } from "../../_auth"

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const derived = scryptSync(password, salt, 64).toString("hex")
  return `scrypt:${salt}:${derived}`
}

function generateTemporaryPassword() {
  return randomBytes(9).toString("base64url")
}

const SELF_SERVICE_ROLES = new Set(["CLIENT", "TRAINER", "VET", "ADMIN"])
const MANAGEABLE_STATUSES = new Set(USER_STATUSES)

type SafeUserPayload = Omit<Awaited<ReturnType<typeof prisma.user.findUnique>>, "password">

export async function GET() {
  const { error } = await requireApiAdmin()
  if (error) return error

  const [users, modules] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        modules: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
      },
    }),
    prisma.module.findMany({
      orderBy: { name: "asc" },
    }),
  ])

  return NextResponse.json({
    success: true,
    users: users.map((user) => {
      const safeUser = { ...user } as Record<string, unknown>
      delete safeUser.password
      return safeUser
    }),
    modules,
  })
}

export async function POST(req: Request) {
  const { session, error } = await requireApiAdmin()
  if (error) return error

  try {
    const data = await req.json()
    const name = String(data?.name || "").trim()
    const email = normalizeEmail(String(data?.email || ""))
    const role = String(data?.role || "CLIENT").toUpperCase()
    const status = String(data?.status || "ACTIVE").toUpperCase()
    const requestedModuleIds: string[] = Array.isArray(data?.moduleIds)
      ? data.moduleIds.map((value: unknown) => String(value))
      : []

    if (!name || !email) {
      return NextResponse.json({ success: false, message: "Nome e email sao obrigatorios." }, { status: 400 })
    }

    if (!USER_ROLES.includes(role as (typeof USER_ROLES)[number])) {
      return NextResponse.json({ success: false, message: "Papel invalido." }, { status: 400 })
    }

    if (!MANAGEABLE_STATUSES.has(status as (typeof USER_STATUSES)[number])) {
      return NextResponse.json({ success: false, message: "Status invalido." }, { status: 400 })
    }

    if (!isRootRole(session.user.role) && !SELF_SERVICE_ROLES.has(role)) {
      return NextResponse.json(
        { success: false, message: "Somente root pode criar contas ROOT ou SUPERADMIN." },
        { status: 403 },
      )
    }

    const moduleIds: string[] = [...new Set(requestedModuleIds.filter(Boolean))]
    if (moduleIds.length > 0) {
      const count = await prisma.module.count({ where: { id: { in: moduleIds } } })
      if (count !== moduleIds.length) {
        return NextResponse.json({ success: false, message: "Um ou mais modulos informados nao existem." }, { status: 400 })
      }
    }

    const temporaryPassword = String(data?.password || "").trim() || generateTemporaryPassword()

    const createdUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashPassword(temporaryPassword),
        role,
        status,
        createdByAdmin: true,
        modules: {
          connect: moduleIds.map((id) => ({ id })),
        },
      },
    })

    const user = await prisma.user.findUnique({
      where: { id: createdUser.id },
      include: {
        modules: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, message: "Nao foi possivel recarregar o usuario criado." }, { status: 500 })
    }

    const safeUser = { ...user } as Record<string, unknown>
    delete safeUser.password
    return NextResponse.json(
      {
        success: true,
        user: safeUser as SafeUserPayload,
        temporaryPassword,
        normalizedModules: dedupeModuleKeys(user.modules.map((module) => module.key)),
      },
      { status: 201 },
    )
  } catch (error: unknown) {
    console.error("ERRO POST /api/admin/users:", error)

    const errorCode = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code || "") : ""
    if (errorCode === "P2002") {
      return NextResponse.json({ success: false, message: "Ja existe uma conta com esse email." }, { status: 409 })
    }

    return NextResponse.json({ success: false, message: "Erro ao criar usuario." }, { status: 500 })
  }
}
