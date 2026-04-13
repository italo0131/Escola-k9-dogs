import { redirect } from "next/navigation"

import UsersTable from "./UsersTable"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminRole } from "@/lib/role"

export default async function AdminUsersPage() {
  const session = await requireUser()
  if (!isAdminRole(session.user.role)) {
    redirect("/dashboard")
  }

  const [users, modules] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        modules: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
      },
    }),
    prisma.module.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
      },
    }),
  ])

  const rows = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdByAdmin: user.createdByAdmin,
    emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
    phoneVerifiedAt: user.phoneVerifiedAt ? user.phoneVerifiedAt.toISOString() : null,
    twoFactorEnabled: user.twoFactorEnabled,
    createdAt: user.createdAt.toISOString(),
    moduleIds: user.modules.map((module) => module.id),
    modules: user.modules,
  }))

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <UsersTable initialUsers={rows} moduleOptions={modules} />
      </div>
    </div>
  )
}
