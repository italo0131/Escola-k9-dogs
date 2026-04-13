import { NextResponse } from "next/server"

import { buildDogPayload } from "@/lib/dog-profile"
import { prisma } from "@/lib/prisma"
import { isStaffRole } from "@/lib/role"

import { requireApiAdmin, requireApiModule } from "../_auth"

export async function GET() {
  const { session, error } = await requireApiModule("DOGS")
  if (error) return error

  try {
    const where = isStaffRole(session.user.role) ? {} : { ownerId: session.user.id }

    const dogs = await prisma.dog.findMany({
      where,
      include: {
        owner: true,
        trainings: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(dogs)
  } catch (error) {
    console.error("ERRO API GET /dogs:", error)
    return NextResponse.json({ success: false, message: "Erro ao listar caes" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { session, error } = await requireApiAdmin()
  if (error) return error

  try {
    const data = await req.json()

    if (!data?.name || !data?.breed || !data?.age || !data?.ownerId) {
      return NextResponse.json(
        { success: false, message: "Nome, raca, idade e cliente responsavel sao obrigatorios." },
        { status: 400 },
      )
    }

    const owner = await prisma.user.findUnique({
      where: { id: String(data.ownerId) },
      select: { id: true, role: true, status: true },
    })

    if (!owner) {
      return NextResponse.json({ success: false, message: "Cliente responsavel nao encontrado." }, { status: 404 })
    }

    const payload = buildDogPayload(data, owner.id)
    const dog = await prisma.dog.create({
      data: {
        ...payload,
        createdByAdminId: session.user.id!,
      },
    })

    return NextResponse.json({ success: true, dog }, { status: 201 })
  } catch (error) {
    console.error("ERRO API POST /dogs:", error)
    return NextResponse.json({ success: false, message: "Erro ao salvar cao" }, { status: 500 })
  }
}
