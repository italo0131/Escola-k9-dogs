import { NextResponse } from "next/server"

import { normalizeModuleKey } from "@/lib/access"
import { prisma } from "@/lib/prisma"

import { requireApiAdmin } from "../../_auth"

export async function GET() {
  const { error } = await requireApiAdmin()
  if (error) return error

  const modules = await prisma.module.findMany({
    orderBy: [{ name: "asc" }],
    include: {
      _count: {
        select: {
          users: true,
        },
      },
    },
  })

  return NextResponse.json({ success: true, modules })
}

export async function POST(req: Request) {
  const { error } = await requireApiAdmin()
  if (error) return error

  try {
    const data = await req.json()
    const key = normalizeModuleKey(String(data?.key || data?.name || ""))
    const name = String(data?.name || "").trim()
    const description = String(data?.description || "").trim() || null
    const contentIds: string[] = Array.isArray(data?.contentIds)
      ? Array.from(
          new Set(
            data.contentIds
              .map((value: unknown) => String(value))
              .filter((value: string): value is string => Boolean(value)),
          ),
        )
      : []

    if (!key || !name) {
      return NextResponse.json({ success: false, message: "Chave e nome do modulo sao obrigatorios." }, { status: 400 })
    }

    const createdModule = await prisma.module.create({
      data: {
        key,
        name,
        description,
        contentIds,
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, module: createdModule }, { status: 201 })
  } catch (error: unknown) {
    console.error("ERRO POST /api/admin/modules:", error)

    const errorCode = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code || "") : ""
    if (errorCode === "P2002") {
      return NextResponse.json({ success: false, message: "Ja existe um modulo com essa chave." }, { status: 409 })
    }

    return NextResponse.json({ success: false, message: "Erro ao criar modulo." }, { status: 500 })
  }
}
