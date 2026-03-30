import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { isRootRole } from "@/lib/role"
import { redirect } from "next/navigation"
import UsersTable from "./UsersTable"

export default async function AdminUsersPage() {
  const session = await requireUser()
  if (!isRootRole(session.user.role)) {
    redirect("/dashboard")
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      twoFactorEnabled: true,
      createdAt: true,
    },
  })

  const rows = users.map((user) => ({
    ...user,
    emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
    phoneVerifiedAt: user.phoneVerifiedAt ? user.phoneVerifiedAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
  }))

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 py-10 text-white">
      <div className="max-w-6xl mx-auto">
        <UsersTable initialUsers={rows} />
      </div>
    </div>
  )
}
