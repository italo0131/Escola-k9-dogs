import { redirect } from "next/navigation"

import AdminConsoleClient from "@/app/admin/AdminConsoleClient"
import { requireUser } from "@/lib/auth"
import { isAdminRole, isRootRole } from "@/lib/role"

export default async function AdminPage() {
  const session = await requireUser()

  if (!isAdminRole(session.user.role)) {
    redirect("/dashboard")
  }

  return (
    <AdminConsoleClient
      viewerName={session.user.name || session.user.email || "Admin"}
      viewerRole={session.user.role || "ADMIN"}
      isRoot={isRootRole(session.user.role)}
    />
  )
}
