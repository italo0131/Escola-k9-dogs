import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { isStaffRole } from "@/lib/role"
import { requireApiUser } from "../_auth"
import { buildDogPayload } from "@/lib/dog-profile"
import { getDogLimit } from "@/lib/platform"

export async function GET() {
  const { session, error } = await requireApiUser()
  if (error) return error

  try {
    const where = isStaffRole(session.user.role) ? {} : { ownerId: session.user.id }

    const dogs = await prisma.dog.findMany({
      where,
      include: { owner: true, trainings: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(dogs)
  } catch (error) {
    console.error("ERRO API GET /dogs:", error)
    return NextResponse.json({ success: false, message: "Erro ao listar cães" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { session, error } = await requireApiUser()
  if (error) return error

  try {
    const data = await req.json()

    if (!data?.name || !data?.breed || !data?.age) {
      return NextResponse.json({ success: false, message: "Campos obrigatórios faltando" }, { status: 400 })
    }

    const ownerId = isStaffRole(session.user.role) && data.ownerId ? data.ownerId : session.user.id

    if (!isStaffRole(session.user.role) && data.ownerId && data.ownerId !== session.user.id) {
      return NextResponse.json({ success: false, message: "Sem permissão para atribuir outro tutor" }, { status: 403 })
    }

    if (!isStaffRole(session.user.role)) {
      const currentDogs = await prisma.dog.count({ where: { ownerId } })
      const limit = getDogLimit(session.user.plan, session.user.role, session.user.planStatus)
      if (Number.isFinite(limit) && currentDogs >= limit) {
        return NextResponse.json(
          {
            success: false,
            message: `O plano Free permite ate ${limit} caes. Para cadastrar mais, atualize sua assinatura.`,
          },
          { status: 403 }
        )
      }
    }

    const payload = buildDogPayload(data, ownerId)
    const dog = await prisma.dog.create({ data: payload })



    return NextResponse.json({ success: true, dog }, { status: 201 })
  } catch (error) {
    console.error("ERRO API POST /dogs:", error)
    return NextResponse.json({ success: false, message: "Erro ao salvar cão" }, { status: 500 })
  }
}
