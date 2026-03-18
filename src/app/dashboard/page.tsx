import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { requireUser, isAdminSession } from "@/lib/auth"
import { isRootRole } from "@/lib/role"
import RootConsole from "./RootConsole"
import { Role } from "@prisma/client"

type StatCardConfig = {
  title: string
  value: string | number
  href?: string
  accent?: boolean
}

export default async function Dashboard() {
  const session = await requireUser()
  const isRoot = isRootRole(session.user.role)

  if (isRoot) {
    const clientRoles: Role[] = ["CLIENT"]
    const staffRoles: Role[] = ["ADMIN", "ROOT", "SUPERADMIN", "TRAINER"]

    const [
      userCount,
      clientCount,
      staffCount,
      dogCount,
      trainingCount,
      scheduleCount,
      companyCount,
      unverifiedCount,
      progressAgg,
      paymentAgg,
      paymentCount,
      upcomingSchedules,
      recentUsers,
      clients,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: { in: clientRoles } } }),
      prisma.user.count({ where: { role: { in: staffRoles } } }),
      prisma.dog.count(),
      prisma.trainingSession.count(),
      prisma.schedule.count(),
      prisma.company.count(),
      prisma.user.count({ where: { emailVerifiedAt: null } }),
      prisma.trainingSession.aggregate({ _avg: { progress: true } }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.payment.count(),
      prisma.schedule.findMany({
        orderBy: { date: "asc" },
        include: { user: true },
        take: 8,
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.user.findMany({
        where: { role: { in: clientRoles } },
        include: {
          dogs: { include: { trainings: true } },
          schedules: true,
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ])

    const avgProgress = Math.round(progressAgg._avg.progress || 0)

    const clientRows = clients.map((client) => {
      const allTrainings = client.dogs.flatMap((dog) => dog.trainings)
      const progress =
        allTrainings.length > 0
          ? Math.round(allTrainings.reduce((sum, t) => sum + t.progress, 0) / allTrainings.length)
          : 0
      const lastSchedule = client.schedules
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      return {
        id: client.id,
        name: client.name,
        email: client.email,
        role: client.role,
        status: (client as any).status || "ACTIVE",
        dogs: client.dogs.length,
        trainings: allTrainings.length,
        progress,
        emailVerified: !!client.emailVerifiedAt,
        phoneVerified: !!client.phoneVerifiedAt,
        twoFactorEnabled: !!client.twoFactorEnabled,
        lastScheduleDate: lastSchedule ? lastSchedule.date.toISOString() : null,
      }
    })

    const stats = {
      userCount,
      clientCount,
      staffCount,
      dogCount,
      trainingCount,
      scheduleCount,
      companyCount,
      unverifiedCount,
      avgProgress,
      paymentsCount: paymentCount,
      totalPaid: paymentAgg._sum.amount || 0,
    }

    const upcomingRows = upcomingSchedules.map((item) => ({
      id: item.id,
      date: item.date.toISOString(),
      status: item.status,
      userName: item.user?.name || null,
    }))

    const recentRows = recentUsers.map((user) => ({
      id: user.id,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    }))

    return <RootConsole stats={stats} clients={clientRows} upcoming={upcomingRows} recentUsers={recentRows} />
  }

  const isAdmin = isAdminSession(session)

  const whereDog = isAdmin ? {} : { ownerId: session.user.id }
  const whereTraining = isAdmin ? {} : { dog: { ownerId: session.user.id } }
  const whereSchedule = isAdmin ? {} : { userId: session.user.id }

  const [dogs, trainings, schedules, users] = await Promise.all([
    prisma.dog.findMany({
      where: whereDog,
      include: { owner: true, trainings: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.trainingSession.findMany({ where: whereTraining, orderBy: { createdAt: "desc" } }),
    prisma.schedule.findMany({ where: whereSchedule, orderBy: { date: "asc" }, include: { user: true } }),
    prisma.user.count(),
  ])

  const avgProgress =
    trainings.length > 0
      ? Math.round(trainings.reduce((sum, t) => sum + t.progress, 0) / trainings.length)
      : 0

  const progressByDog = dogs.map((dog) => {
    if (dog.trainings.length === 0) return { id: dog.id, name: dog.name, progress: 0, breed: dog.breed }
    const avg = Math.round(dog.trainings.reduce((s, t) => s + t.progress, 0) / dog.trainings.length)
    return { id: dog.id, name: dog.name, progress: avg, breed: dog.breed }
  })

  const upcoming = schedules.slice(0, 5)

  const statCards: StatCardConfig[] = [
    { title: "Caes", value: dogs.length, href: "/dogs" },
    { title: "Treinos", value: trainings.length, href: "/training" },
    { title: "Progresso medio", value: `${avgProgress}%`, accent: true, href: "/training" },
    { title: "Usuarios", value: users, href: isAdmin ? "/admin/users" : "/profile" },
  ]

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4 sm:px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Painel</p>
            <h1 className="text-3xl font-semibold">Centro de Treinamento</h1>
            <p className="text-gray-300/80">Visao geral em tempo real de caes, treinos e agenda.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dogs/new"
              className="rounded-lg bg-cyan-500 px-4 py-2 text-white font-semibold hover:-translate-y-0.5 transition shadow-lg shadow-cyan-500/25"
            >
              Novo cao
            </Link>
            <Link
              href="/calendar"
              className="rounded-lg border border-white/15 px-4 py-2 text-gray-100 hover:bg-white/10 transition"
            >
              Calendario
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Progresso dos caes</h2>
              <span className="text-xs text-gray-300">Media por cao</span>
            </div>
            {progressByDog.length === 0 && <p className="text-gray-300">Nenhum treino registrado.</p>}
            <div className="space-y-3">
              {progressByDog.slice(0, 6).map((dog) => (
                <Link key={dog.id} href={`/training?dog=${dog.id}`} className="block hover:text-cyan-200 transition">
                  <div className="flex justify-between text-sm text-gray-200">
                    <span>{dog.name}</span>
                    <span>{dog.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                      style={{ width: `${dog.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Raca: {dog.breed ?? "-"}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Proximos treinos</h2>
              <Link href="/calendar" className="text-cyan-300 text-sm hover:underline underline-offset-4">
                Ver calendario
              </Link>
            </div>
            {upcoming.length === 0 && <p className="text-gray-300">Nenhum agendamento.</p>}
            <div className="space-y-3">
              {upcoming.map((item) => (
                <Link
                  key={item.id}
                  href="/calendar"
                  className="rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition"
                >
                  <p className="text-sm font-semibold">
                    {new Date(item.date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-gray-300 text-sm">Status: {item.status}</p>
                  {item.user && <p className="text-gray-400 text-sm">Tutor: {item.user.name}</p>}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Caes cadastrados</h2>
            <span className="text-sm text-gray-300">Treinos por cao</span>
          </div>
          {dogs.length === 0 && <p className="text-gray-300">Nenhum cao cadastrado.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dogs.map((dog) => (
              <Link
                key={dog.id}
                href={`/training?dog=${dog.id}`}
                className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2 hover:bg-white/10 transition"
              >
                <p className="text-lg font-semibold">{dog.name}</p>
                <p className="text-gray-300 text-sm">Raca: {dog.breed}</p>
                <p className="text-gray-300 text-sm">Idade: {dog.age}</p>
                {dog.owner && <p className="text-gray-400 text-sm">Tutor: {dog.owner.name}</p>}
                <p className="text-gray-400 text-sm">Treinos: {dog.trainings.length}</p>
                <p className="inline-block mt-1 text-cyan-300 text-sm">Abrir treinos</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({ title, value, accent, href }: StatCardConfig) {
  const content = (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30">
      <p className="text-gray-300 text-sm">{title}</p>
      <p className={`text-3xl font-semibold ${accent ? "text-cyan-300" : ""}`}>{value}</p>
    </div>
  )
  if (!href) return content
  return (
    <Link href={href} className="block hover:-translate-y-0.5 transition">
      {content}
    </Link>
  )
}
