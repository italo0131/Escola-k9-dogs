import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { isStaffRole } from "@/lib/role"

import { requireApiAdmin, requireApiModule } from "../_auth"

export async function GET() {
  const { session, error } = await requireApiModule("SCHEDULE")
  if (error) return error

  const where = isStaffRole(session.user.role) ? {} : { userId: session.user.id }

  const schedule = await prisma.schedule.findMany({
    where,
    include: {
      user: true,
      trainer: true,
      dog: true,
      createdByAdmin: true,
    },
    orderBy: { date: "asc" },
  })

  return NextResponse.json(schedule)
}

export async function POST(req: Request) {
  const { session, error } = await requireApiAdmin()
  if (error) return error

  const data = await req.json()
  const parsedDate = new Date(data?.date)
  const userId = String(data?.userId || "").trim()
  const dogId = String(data?.dogId || "").trim() || null

  if (!userId) {
    return NextResponse.json({ success: false, message: "Cliente responsavel e obrigatorio." }, { status: 400 })
  }

  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ success: false, message: "Data invalida." }, { status: 400 })
  }

  if (dogId) {
    const dog = await prisma.dog.findUnique({ where: { id: dogId } })
    if (!dog) {
      return NextResponse.json({ success: false, message: "Cao nao encontrado." }, { status: 404 })
    }

    if (dog.ownerId !== userId) {
      return NextResponse.json(
        { success: false, message: "O cao informado nao pertence ao cliente selecionado." },
        { status: 400 },
      )
    }
  }

  const schedule = await prisma.schedule.create({
    data: {
      title: String(data?.title || "Sessao de treino").trim() || "Sessao de treino",
      notes: String(data?.notes || "").trim() || null,
      location: String(data?.location || "").trim() || null,
      format: String(data?.format || "PRESENTIAL").trim().toUpperCase(),
      durationMinutes: data?.durationMinutes ? Math.max(15, Number(data.durationMinutes)) : null,
      date: parsedDate,
      status: String(data?.status || "CONFIRMADO").trim().toUpperCase(),
      userId,
      trainerId: String(data?.trainerId || session.user.id || "").trim() || session.user.id!,
      dogId,
      createdByAdminId: session.user.id!,
    },
    include: {
      user: true,
      trainer: true,
      dog: true,
      createdByAdmin: true,
    },
  })

  return NextResponse.json(schedule)
}
