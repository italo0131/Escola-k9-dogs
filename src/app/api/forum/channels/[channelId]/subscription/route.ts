import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { isStaffRole } from "@/lib/role"

import { requireApiUser } from "../../../../_auth"

export async function POST(_req: Request, { params }: { params: Promise<{ channelId: string }> }) {
  const { session, error } = await requireApiUser()
  if (error) return error

  const { channelId } = await params

  const channel = await prisma.forumChannel.findUnique({
    where: { id: channelId },
    select: { id: true, ownerId: true, isPublic: true },
  })

  if (!channel?.id) {
    return NextResponse.json({ success: false, message: "Canal nao encontrado." }, { status: 404 })
  }

  if (!channel.isPublic && !isStaffRole(session.user.role)) {
    return NextResponse.json(
      { success: false, message: "Canais privados sao gerenciados pela equipe K9." },
      { status: 403 },
    )
  }

  if (channel.ownerId === session.user.id) {
    return NextResponse.json({ success: false, message: "Voce ja administra este canal." }, { status: 400 })
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
      tier: isStaffRole(session.user.role) ? "STAFF" : "MEMBER",
    },
  })

  return NextResponse.json({ success: true, subscription })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ channelId: string }> }) {
  const { session, error } = await requireApiUser()
  if (error) return error

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
    return NextResponse.json({ success: false, message: "Participacao no canal nao encontrada." }, { status: 404 })
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
