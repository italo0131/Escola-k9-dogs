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

  if (typeof data.title === "string") updates.title = data.title
  if (typeof data.description === "string") updates.description = data.description
  if (typeof data.progress === "number") updates.progress = data.progress
  if (typeof data.dogId === "string") updates.dogId = data.dogId

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: false, message: "Nada para atualizar" }, { status: 400 })
  }

  try {
    const training = await prisma.trainingSession.update({
      where: { id },
      data: updates,
    })
    await logAudit({
      actorId: session?.user?.id || null,
      action: "TRAINING_UPDATE",
      targetType: "training",
      targetId: id,
      metadata: updates,
    })
    return NextResponse.json({ success: true, training })
  } catch (err) {
    console.error("ERRO PATCH /admin/training/[id]:", err)
    return NextResponse.json({ success: false, message: "Erro ao atualizar treino" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { session, error } = await requireApiRoot()
  if (error) return error

  try {
    await prisma.trainingSession.delete({ where: { id } })
    await logAudit({
      actorId: session?.user?.id || null,
      action: "TRAINING_DELETE",
      targetType: "training",
      targetId: id,
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("ERRO DELETE /admin/training/[id]:", err)
    return NextResponse.json({ success: false, message: "Erro ao remover treino" }, { status: 500 })
  }
}
