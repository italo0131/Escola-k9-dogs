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

  if (typeof data.status === "string") updates.status = data.status
  if (typeof data.userId === "string") updates.userId = data.userId
  if (typeof data.date === "string" || data.date instanceof Date) {
    updates.date = new Date(data.date)
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: false, message: "Nada para atualizar" }, { status: 400 })
  }

  try {
    const schedule = await prisma.schedule.update({
      where: { id },
      data: updates,
    })
    await logAudit({
      actorId: session?.user?.id || null,
      action: "SCHEDULE_UPDATE",
      targetType: "schedule",
      targetId: id,
      metadata: updates,
    })
    return NextResponse.json({ success: true, schedule })
  } catch (err) {
    console.error("ERRO PATCH /admin/schedules/[id]:", err)
    return NextResponse.json({ success: false, message: "Erro ao atualizar agenda" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { session, error } = await requireApiRoot()
  if (error) return error

  try {
    await prisma.schedule.delete({ where: { id } })
    await logAudit({
      actorId: session?.user?.id || null,
      action: "SCHEDULE_DELETE",
      targetType: "schedule",
      targetId: id,
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("ERRO DELETE /admin/schedules/[id]:", err)
    return NextResponse.json({ success: false, message: "Erro ao remover agenda" }, { status: 500 })
  }
}
