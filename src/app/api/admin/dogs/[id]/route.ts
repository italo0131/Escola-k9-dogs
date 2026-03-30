import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"
import { requireApiRoot } from "@/app/api/_auth"
import { logAudit } from "@/lib/audit"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { session, error } = await requireApiRoot()
  if (error) return error

  const data = await req.json().catch(() => ({}))
  const updates: any = {}

  if (typeof data.name === "string") updates.name = data.name
  if (typeof data.breed === "string") updates.breed = data.breed
  if (typeof data.age === "number") updates.age = data.age
  if (typeof data.ownerId === "string") updates.ownerId = data.ownerId

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: false, message: "Nada para atualizar" }, { status: 400 })
  }

  try {
    const dog = await prisma.dog.update({
      where: { id },
      data: updates,
      include: { owner: true },
    })
    await logAudit({
      actorId: session?.user?.id || null,
      action: "DOG_UPDATE",
      targetType: "dog",
      targetId: id,
      metadata: updates,
    })
    return NextResponse.json({ success: true, dog })
  } catch (err) {
    console.error("ERRO PATCH /admin/dogs/[id]:", err)
    return NextResponse.json({ success: false, message: "Erro ao atualizar cao" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { session, error } = await requireApiRoot()
  if (error) return error

  try {
    await prisma.dog.delete({ where: { id } })
    await logAudit({
      actorId: session?.user?.id || null,
      action: "DOG_DELETE",
      targetType: "dog",
      targetId: id,
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("ERRO DELETE /admin/dogs/[id]:", err)
    return NextResponse.json({ success: false, message: "Erro ao remover cao" }, { status: 500 })
  }
}
