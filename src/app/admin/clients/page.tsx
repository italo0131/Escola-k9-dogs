import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { isRootRole } from "@/lib/role"
import { redirect } from "next/navigation"
import ClientsTable from "./ClientsTable"

export default async function AdminClientsPage() {
  const session = await requireUser()
  if (!isRootRole(session.user.role)) {
    redirect("/dashboard")
  }

  const clients = await prisma.user.findMany({
    where: { role: { in: ["CLIENT"] } },
    include: {
      dogs: { include: { trainings: true } },
      schedules: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const rows = clients.map((client) => {
    const allTrainings = client.dogs.flatMap((dog) => dog.trainings)
    const progress = allTrainings.length
      ? Math.round(allTrainings.reduce((sum, t) => sum + t.progress, 0) / allTrainings.length)
      : 0
    return {
      id: client.id,
      name: client.name,
      email: client.email,
      role: client.role,
      status: client.status || "ACTIVE",
      dogs: client.dogs.length,
      trainings: allTrainings.length,
      progress,
      emailVerified: !!client.emailVerifiedAt,
      phoneVerified: !!client.phoneVerifiedAt,
      twoFactorEnabled: !!client.twoFactorEnabled,
    }
  })

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 py-10 text-white">
      <div className="max-w-6xl mx-auto">
        <ClientsTable initialClients={rows} />
      </div>
    </div>
  )
}
