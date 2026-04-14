import { randomBytes, scryptSync } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { logAudit } from "@/lib/audit"
import { prisma } from "@/lib/prisma"
import { USER_ROLES, USER_STATUSES, isRootRole } from "@/lib/role"

import { requireApiAdmin } from "@/app/api/_auth"

const ROOT_ONLY_ROLES = new Set(["ROOT", "SUPERADMIN"])
type UserAdminUpdateFields = {
  name?: string
  phone?: string | null
  zipCode?: string | null
  addressStreet?: string | null
  addressNumber?: string | null
  addressNeighborhood?: string | null
  addressCity?: string | null
  addressState?: string | null
  addressComplement?: string | null
  addressCountry?: string | null
  addressNotes?: string | null
  role?: string
  status?: string
  twoFactorEnabled?: boolean
  emailVerifiedAt?: Date | null
  phoneVerifiedAt?: Date | null
  createdByAdmin?: boolean
  password?: string
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const derived = scryptSync(password, salt, 64).toString("hex")
  return `scrypt:${salt}:${derived}`
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiAdmin()
  if (error) return error

  const { id } = await params
  const data = await req.json().catch(() => ({}))
  const isRoot = isRootRole(session?.user?.role)

  const currentUser = await prisma.user.findUnique({
    where: { id },
    include: {
      modules: {
        select: {
          id: true,
        },
      },
    },
  })

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "Usuario nao encontrado." }, { status: 404 })
  }

  const updates: UserAdminUpdateFields = {}

  if (typeof data.name === "string") updates.name = data.name.trim()
  if (typeof data.phone === "string") updates.phone = data.phone.trim() || null
  if (typeof data.zipCode === "string") updates.zipCode = data.zipCode.trim() || null
  if (typeof data.addressStreet === "string") updates.addressStreet = data.addressStreet.trim() || null
  if (typeof data.addressNumber === "string") updates.addressNumber = data.addressNumber.trim() || null
  if (typeof data.addressNeighborhood === "string") updates.addressNeighborhood = data.addressNeighborhood.trim() || null
  if (typeof data.addressCity === "string") updates.addressCity = data.addressCity.trim() || null
  if (typeof data.addressState === "string") updates.addressState = data.addressState.trim() || null
  if (typeof data.addressComplement === "string") updates.addressComplement = data.addressComplement.trim() || null
  if (typeof data.addressCountry === "string") updates.addressCountry = data.addressCountry.trim() || null
  if (typeof data.addressNotes === "string") updates.addressNotes = data.addressNotes.trim() || null

  if (typeof data.role === "string") {
    const role = data.role.toUpperCase()
    if (!USER_ROLES.includes(role as (typeof USER_ROLES)[number])) {
      return NextResponse.json({ success: false, message: "Role invalida." }, { status: 400 })
    }
    if (!isRoot && ROOT_ONLY_ROLES.has(role)) {
      return NextResponse.json({ success: false, message: "Somente root pode promover para esse papel." }, { status: 403 })
    }
    updates.role = role
  }

  if (typeof data.status === "string") {
    const status = data.status.toUpperCase()
    if (!USER_STATUSES.includes(status as (typeof USER_STATUSES)[number])) {
      return NextResponse.json({ success: false, message: "Status invalido." }, { status: 400 })
    }
    updates.status = status
  }

  if (typeof data.twoFactorEnabled === "boolean") {
    updates.twoFactorEnabled = data.twoFactorEnabled
  }

  if (typeof data.emailVerified === "boolean") {
    updates.emailVerifiedAt = data.emailVerified ? new Date() : null
  }

  if (typeof data.phoneVerified === "boolean") {
    updates.phoneVerifiedAt = data.phoneVerified ? new Date() : null
  }

  if (typeof data.createdByAdmin === "boolean") {
    updates.createdByAdmin = data.createdByAdmin
  }

  if (typeof data.password === "string" && data.password.trim()) {
    updates.password = hashPassword(data.password.trim())
  }

  const moduleIds: string[] | null = Array.isArray(data.moduleIds)
    ? Array.from(
        new Set(
          data.moduleIds
            .map((value: unknown) => String(value))
            .filter((value: string): value is string => Boolean(value)),
        ),
      )
    : null

  if (moduleIds) {
    const count = await prisma.module.count({ where: { id: { in: moduleIds } } })
    if (count !== moduleIds.length) {
      return NextResponse.json({ success: false, message: "Um ou mais modulos informados nao existem." }, { status: 400 })
    }
  }

  if (Object.keys(updates).length === 0 && !moduleIds) {
    return NextResponse.json({ success: false, message: "Nada para atualizar." }, { status: 400 })
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...updates,
        ...(moduleIds
          ? {
              modules: {
                set: moduleIds.map((moduleId) => ({ id: moduleId })),
              },
            }
          : {}),
      },
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

    const safe = { ...user } as Record<string, unknown>
    delete safe.password
    await logAudit({
      actorId: session?.user?.id || null,
      action: "USER_UPDATE",
      targetType: "user",
      targetId: id,
      metadata: {
        updates,
        moduleIds,
      },
    })

    return NextResponse.json({ success: true, user: safe })
  } catch (err) {
    console.error("ERRO PATCH /api/admin/users/[id]:", err)
    return NextResponse.json({ success: false, message: "Erro ao atualizar usuario." }, { status: 500 })
  }
}
