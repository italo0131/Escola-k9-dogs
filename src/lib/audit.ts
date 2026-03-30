import { prisma } from "@/lib/prisma"

type AuditInput = {
  actorId?: string | null
  action: string
  targetType: string
  targetId?: string | null
  metadata?: Record<string, any> | null
}

export async function logAudit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId || null,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId || null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    })
  } catch (err) {
    console.error("AUDIT LOG ERROR:", err)
  }
}
