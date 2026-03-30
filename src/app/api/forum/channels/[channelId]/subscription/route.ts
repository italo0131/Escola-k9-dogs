import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requireApiUser } from "../../../../_auth"
import { isStaffRole } from "@/lib/role"
import { hasPremiumPlatformAccess } from "@/lib/platform"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { session, error } = await requireApiUser()
  if (error) return error

  if (!hasPremiumPlatformAccess(session.user.plan, session.user.role, session.user.planStatus)) {
    return NextResponse.json({ success: false, message: "Assinaturas de canal fazem parte dos planos pagos" }, { status: 403 })
  }

  const { channelId } = await params

  const channel = await prisma.forumChannel.findUnique({
    where: { id: channelId },
    select: { id: true, ownerId: true, isPublic: true },
  })

  if (!channel?.id || !channel.isPublic) {
    return NextResponse.json({ success: false, message: "Canal nao encontrado" }, { status: 404 })
  }

  if (channel.ownerId === session.user.id) {
    return NextResponse.json({ success: false, message: "Voce ja e o dono deste canal" }, { status: 400 })
  }

  const subscription = await prisma.channelSubscription.upsert({
    where: {
      channelId_userId: {
        channelId: channel.id,
        userId: session.user.id!,
      },
    },
    update: {
      status: "ACTIVE",
      endedAt: null,
    },
    create: {
      channelId: channel.id,
      userId: session.user.id!,
      status: "ACTIVE",
      tier: isStaffRole(session.user.role) ? "PARTNER" : "FREE",
    },
  })

  return NextResponse.json({ success: true, subscription })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { session, error } = await requireApiUser()
  if (error) return error

  if (!hasPremiumPlatformAccess(session.user.plan, session.user.role, session.user.planStatus)) {
    return NextResponse.json({ success: false, message: "Assinaturas de canal fazem parte dos planos pagos" }, { status: 403 })
  }

  const { channelId } = await params

  const existing = await prisma.channelSubscription.findUnique({
    where: {
      channelId_userId: {
        channelId,
        userId: session.user.id!,
      },
    },
  })

  if (!existing) {
    return NextResponse.json({ success: false, message: "Assinatura nao encontrada" }, { status: 404 })
  }

  const subscription = await prisma.channelSubscription.update({
    where: { id: existing.id },
    data: {
      status: "CANCELED",
      endedAt: new Date(),
    },
  })

  return NextResponse.json({ success: true, subscription })
}
