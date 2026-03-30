import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireApiUser } from "@/app/api/_auth"
import { buildDogPayload } from "@/lib/dog-profile"
import { isStaffRole } from "@/lib/role"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiUser()
  if (error) return error

  const { id } = await params
  const dog = await prisma.dog.findUnique({
    where: { id },
    include: { owner: true, trainings: true },
  })

  if (!dog) {
    return NextResponse.json({ success: false, message: "Cao nao encontrado" }, { status: 404 })
  }

  if (!isStaffRole(session.user.role) && dog.ownerId !== session.user.id) {
    return NextResponse.json({ success: false, message: "Sem permissao para visualizar este cao" }, { status: 403 })
  }

  return NextResponse.json({ success: true, dog })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireApiUser()
  if (error) return error

  const { id } = await params
  const existingDog = await prisma.dog.findUnique({
    where: { id },
    select: { id: true, ownerId: true },
  })

  if (!existingDog) {
    return NextResponse.json({ success: false, message: "Cao nao encontrado" }, { status: 404 })
  }

  if (!isStaffRole(session.user.role) && existingDog.ownerId !== session.user.id) {
    return NextResponse.json({ success: false, message: "Sem permissao para editar este cao" }, { status: 403 })
  }

  const data = await req.json().catch(() => ({}))

  if (!data?.name || !data?.breed || !data?.age) {
    return NextResponse.json({ success: false, message: "Nome, raca e idade sao obrigatorios" }, { status: 400 })
  }

  const ownerId = isStaffRole(session.user.role) && data.ownerId ? String(data.ownerId) : existingDog.ownerId

  if (!isStaffRole(session.user.role) && data.ownerId && data.ownerId !== existingDog.ownerId) {
    return NextResponse.json({ success: false, message: "Sem permissao para trocar o tutor" }, { status: 403 })
  }

  const payload = buildDogPayload(data, ownerId)
  const dog = await prisma.dog.update({
    where: { id },
    data: payload,
    include: { owner: true, trainings: true },
  })

  return NextResponse.json({ success: true, dog })
}
