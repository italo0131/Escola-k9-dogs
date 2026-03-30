import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { isRootRole } from "@/lib/role"
import { redirect } from "next/navigation"
import ScheduleTable from "./ScheduleTable"

export default async function AdminSchedulePage() {
  const session = await requireUser()
  if (!isRootRole(session.user.role)) {
    redirect("/dashboard")
  }

  const schedules = await prisma.schedule.findMany({
    orderBy: { date: "asc" },
    include: { user: true },
  })

  const rows = schedules.map((schedule) => ({
    id: schedule.id,
    date: schedule.date.toISOString(),
    status: schedule.status,
    userName: schedule.user?.name || null,
  }))

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 py-10 text-white">
      <div className="max-w-6xl mx-auto">
        <ScheduleTable initialSchedules={rows} />
      </div>
    </div>
  )
}
