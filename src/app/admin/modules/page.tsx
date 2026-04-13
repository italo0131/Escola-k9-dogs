import { redirect } from "next/navigation"

import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminRole } from "@/lib/role"

import ModulesManager from "./ModulesManager"

export default async function AdminModulesPage() {
  const session = await requireUser()
  if (!isAdminRole(session.user.role)) {
    redirect("/dashboard")
  }

  const modules = await prisma.module.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          users: true,
        },
      },
    },
  })

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <ModulesManager initialModules={modules} />
      </div>
    </div>
  )
}
