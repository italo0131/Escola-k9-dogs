import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { isStaffRole } from "@/lib/role"
import { normalizeVideoUrl } from "@/lib/video"

import { requireApiAdmin, requireApiModule } from "../_auth"

export async function GET() {
  const { session, error } = await requireApiModule("TRAINING")
  if (error) return error

  const where = isStaffRole(session.user.role) ? {} : { dog: { ownerId: session.user.id } }

  const training = await prisma.trainingSession.findMany({
    where,
    include: {
      dog: true,
      coach: true,
      createdByAdmin: true,
    },
    orderBy: { executedAt: "desc" },
  })

  return NextResponse.json(training)
}

export async function POST(req: Request) {
  const { session, error } = await requireApiAdmin()
  if (error) return error

  const data = await req.json()
  const title = String(data?.title || "").trim()
  const dogId = String(data?.dogId || "").trim()
  const description = String(data?.description || "").trim() || null

  if (!title || !dogId) {
    return NextResponse.json({ success: false, message: "Titulo e cao sao obrigatorios." }, { status: 400 })
  }

  const dog = await prisma.dog.findUnique({ where: { id: dogId } })
  if (!dog) {
    return NextResponse.json({ success: false, message: "Cao nao encontrado." }, { status: 404 })
  }

  const training = await prisma.trainingSession.create({
    data: {
      title,
      description,
      focusArea: String(data?.focusArea || "").trim().toUpperCase() || null,
      difficulty: String(data?.difficulty || "").trim().toUpperCase() || null,
      durationMinutes: data?.durationMinutes ? Math.max(1, Number(data.durationMinutes)) : null,
      trainerNotes: String(data?.trainerNotes || "").trim() || null,
      homework: String(data?.homework || "").trim() || null,
      videoUrl: normalizeVideoUrl(data?.videoUrl),
      progress: Math.max(0, Math.min(100, Number(data.progress) || 0)),
      dogId,
      coachId: String(data?.coachId || session.user.id || "").trim() || session.user.id!,
      createdByAdminId: session.user.id!,
      executedAt: data?.executedAt ? new Date(data.executedAt) : new Date(),
    },
    include: {
      dog: true,
      coach: true,
      createdByAdmin: true,
    },
  })

  return NextResponse.json(training)
}
