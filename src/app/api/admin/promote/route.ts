import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import type { Session } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { isAdminRole, USER_ROLES, type UserRole } from "@/lib/role"
import { logAudit } from "@/lib/audit"

export async function POST(req: Request) {
  const adminKey = process.env.ADMIN_API_KEY
  const rootKey = process.env.ROOT_ADMIN_KEY
  const provided = req.headers.get("x-admin-key")
  const providedRoot = req.headers.get("x-root-key")

  const session = (await getServerSession(authOptions as any)) as Session | null
  const isAdmin = isAdminRole(session?.user?.role)

  const data = await req.json()
  if (!data?.email) {
    return NextResponse.json({ success: false, message: "Email obrigatório" }, { status: 400 })
  }

  const adminCount = await prisma.user.count({
    where: { role: { in: ["ADMIN", "ROOT", "SUPERADMIN"] } },
  })

  if (!isAdmin) {
    // bootstrap: permite primeiro admin com ADMIN_API_KEY
    if (adminKey && provided === adminKey && adminCount === 0) {
      // ok
    } else if (rootKey && providedRoot === rootKey) {
      // ok (root)
    } else {
      return NextResponse.json({ success: false, message: "Não autorizado" }, { status: 401 })
    }
  }

  const role = String(data.role || "ADMIN").toUpperCase() as UserRole
  const allowed: UserRole[] = [...USER_ROLES]
  if (!allowed.includes(role)) {
    return NextResponse.json({ success: false, message: "Role inválida" }, { status: 400 })
  }

  try {
    const user = await prisma.user.update({
      where: { email: data.email },
      data: { role },
    })

    const { password, ...safe } = user
    await logAudit({
      actorId: session?.user?.id || null,
      action: "ROLE_UPDATE",
      targetType: "user",
      targetId: user.id,
      metadata: { email: data.email, role },
    })
    return NextResponse.json({ success: true, user: safe })
  } catch (error) {
    console.error("ERRO PROMOTE ADMIN:", error)
    return NextResponse.json({ success: false, message: "Erro ao promover" }, { status: 500 })
  }
}
