import { NextRequest, NextResponse } from "next/server"

import { normalizeModuleKey } from "@/lib/access"
import { prisma } from "@/lib/prisma"

import { requireApiAdmin } from "@/app/api/_auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiAdmin()
  if (error) return error

  const { id } = await params

  try {
    const data = await req.json().catch(() => ({}))
    const updates: Record<string, unknown> = {}

    if (typeof data.key === "string" && data.key.trim()) {
      updates.key = normalizeModuleKey(data.key)
    }
    if (typeof data.name === "string" && data.name.trim()) {
      updates.name = data.name.trim()
    }
    if (Object.prototype.hasOwnProperty.call(data, "description")) {
      updates.description = String(data.description || "").trim() || null
    }
    if (Array.isArray(data.contentIds)) {
      updates.contentIds = [...new Set(data.contentIds.map((value: unknown) => String(value)).filter(Boolean))]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, message: "Nada para atualizar." }, { status: 400 })
    }

    const updatedModule = await prisma.module.update({
      where: { id },
      data: updates,
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, module: updatedModule })
  } catch (error: unknown) {
    console.error("ERRO PATCH /api/admin/modules/[id]:", error)
    return NextResponse.json({ success: false, message: "Erro ao atualizar modulo." }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiAdmin()
  if (error) return error

  const { id } = await params

  try {
    await prisma.module.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("ERRO DELETE /api/admin/modules/[id]:", error)
    return NextResponse.json({ success: false, message: "Erro ao remover modulo." }, { status: 500 })
  }
}
