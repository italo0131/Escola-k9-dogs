import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { isRootRole } from "@/lib/role"
import { redirect } from "next/navigation"
import TrainingsTable from "./TrainingsTable"

export default async function AdminTrainingsPage() {
  const session = await requireUser()
  if (!isRootRole(session.user.role)) {
    redirect("/dashboard")
  }

  const trainings = await prisma.trainingSession.findMany({
    orderBy: { createdAt: "desc" },
    include: { dog: { include: { owner: true } } },
  })

  const rows = trainings.map((training) => ({
    id: training.id,
    title: training.title,
    description: training.description || "",
    progress: training.progress,
    dogId: training.dogId,
    dogName: training.dog?.name || null,
    ownerName: training.dog?.owner?.name || null,
  }))

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 py-10 text-white">
      <div className="max-w-6xl mx-auto">
        <TrainingsTable initialTrainings={rows} />
      </div>
    </div>
  )
}
