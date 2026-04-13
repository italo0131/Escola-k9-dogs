import type { ReactNode } from "react"
import Link from "next/link"

import { getCoreModuleDescription } from "@/lib/access"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getRoleLabel, isAdminRole, isProfessionalRole, isRootRole } from "@/lib/role"

export default async function DashboardPage() {
  const session = await requireUser()
  const role = String(session.user.role || "CLIENT")

  if (isRootRole(role) || isAdminRole(role)) {
    return <AdminDashboard userId={session.user.id!} role={role} />
  }

  if (isProfessionalRole(role)) {
    return <ProfessionalDashboard userId={session.user.id!} role={role} />
  }

  return <ClientDashboard userId={session.user.id!} />
}

async function AdminDashboard({ userId, role }: { userId: string; role: string }) {
  const [viewer, stats, recentClients, upcoming] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
      },
    }),
    Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.user.count({ where: { role: { in: ["TRAINER", "VET"] } } }),
      prisma.dog.count(),
      prisma.trainingSession.count(),
      prisma.schedule.count(),
      prisma.module.count(),
    ]),
    prisma.user.findMany({
      where: { role: "CLIENT" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        modules: {
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        },
        dogs: {
          select: { id: true },
        },
      },
    }),
    prisma.schedule.findMany({
      orderBy: { date: "asc" },
      take: 6,
      include: {
        user: true,
        dog: true,
      },
      where: {
        date: {
          gte: new Date(),
        },
      },
    }),
  ])

  const [users, clients, professionals, dogs, trainings, schedules, modules] = stats

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Hero
          eyebrow="Painel administrativo"
          title={`Operacao ${getRoleLabel(role).toLowerCase()} da K9 Training`}
          description={`${viewer?.name || viewer?.email || "Equipe"} pode criar contas, atribuir modulos e acompanhar a execucao dos clientes.`}
          primaryHref="/admin/users"
          primaryLabel="Gerenciar usuarios"
          secondaryHref="/admin/modules"
          secondaryLabel="Gerenciar modulos"
        />

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Usuarios" value={users} href="/admin/users" />
          <MetricCard title="Clientes" value={clients} href="/admin/users" />
          <MetricCard title="Profissionais" value={professionals} href="/admin/users" />
          <MetricCard title="Modulos" value={modules} href="/admin/modules" accent />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard title="Caes cadastrados" value={dogs} href="/admin/dogs" />
          <MetricCard title="Treinos registrados" value={trainings} href="/admin/trainings" />
          <MetricCard title="Eventos na agenda" value={schedules} href="/admin/schedule" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel title="Clientes recentes" href="/admin/users">
            <div className="grid gap-3">
              {recentClients.map((client) => (
                <div key={client.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <p className="font-semibold">{client.name}</p>
                  <p className="text-xs text-slate-400">{client.email}</p>
                  <p className="mt-2 text-xs text-slate-300">
                    {client.modules.length} modulos • {client.dogs.length} caes
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Proximos acompanhamentos" href="/admin/schedule">
            <div className="space-y-3">
              {upcoming.length === 0 ? <EmptyState text="Nenhum agendamento futuro cadastrado." /> : null}
              {upcoming.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <p className="font-semibold">
                    {new Date(item.date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">{item.user?.name || "Cliente"}</p>
                  <p className="text-xs text-slate-400">{item.dog?.name || "Sem cao vinculado"}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

async function ProfessionalDashboard({ userId, role }: { userId: string; role: string }) {
  const [viewer, channels, contents, forumPosts, upcoming] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        headline: true,
      },
    }),
    prisma.forumChannel.findMany({
      where: { ownerId: userId },
      include: { _count: { select: { threads: true, contents: true, subscriptions: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.channelContent.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.forumThread.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.schedule.findMany({
      where: {
        OR: [{ trainerId: userId }, { createdByAdminId: userId }],
      },
      orderBy: { date: "asc" },
      take: 6,
      include: { user: true, dog: true },
    }),
  ])

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Hero
          eyebrow="Painel profissional"
          title={`Rotina de ${getRoleLabel(role)}`}
          description={viewer?.headline || "Acompanhe agenda, canais e conteudos ativos dentro da operacao K9."}
          primaryHref="/forum/channels/new"
          primaryLabel="Novo canal"
          secondaryHref="/conteudos/new"
          secondaryLabel="Novo conteudo"
        />

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Canais" value={channels.length} href="/forum" />
          <MetricCard title="Conteudos" value={contents.length} href="/conteudos" />
          <MetricCard title="Posts no forum" value={forumPosts.length} href="/forum" />
          <MetricCard title="Agenda" value={upcoming.length} href="/calendar" accent />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <Panel title="Canais ativos" href="/forum">
            <div className="grid gap-3">
              {channels.length === 0 ? <EmptyState text="Nenhum canal criado ainda." /> : null}
              {channels.map((channel) => (
                <div key={channel.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <p className="font-semibold">{channel.name}</p>
                  <p className="mt-1 text-sm text-slate-300">{channel.description}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {channel._count.contents} conteudos • {channel._count.threads} posts • {channel._count.subscriptions} membros
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Proximos eventos" href="/calendar">
            <div className="space-y-3">
              {upcoming.length === 0 ? <EmptyState text="Nenhum evento programado." /> : null}
              {upcoming.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <p className="font-semibold">
                    {new Date(item.date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">{item.user?.name || "Cliente"}</p>
                  <p className="text-xs text-slate-400">{item.dog?.name || "Sem cao vinculado"}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

async function ClientDashboard({ userId }: { userId: string }) {
  const [user, dogs, trainings, upcomingSchedule] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        modules: {
          orderBy: { name: "asc" },
        },
      },
    }),
    prisma.dog.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.trainingSession.findMany({
      where: { dog: { ownerId: userId } },
      include: { dog: true, coach: true },
      orderBy: { executedAt: "desc" },
      take: 6,
    }),
    prisma.schedule.findMany({
      where: { userId },
      include: { dog: true, trainer: true },
      orderBy: { date: "asc" },
      take: 5,
    }),
  ])

  const averageProgress =
    trainings.length > 0 ? Math.round(trainings.reduce((total, item) => total + item.progress, 0) / trainings.length) : 0

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.10),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Hero
          eyebrow="Meu acompanhamento"
          title={`Bem-vindo, ${user?.name || "cliente"}`}
          description="Aqui voce acompanha apenas os modulos que a equipe K9 liberou para sua jornada."
          primaryHref="/profile"
          primaryLabel="Ver meu perfil"
          secondaryHref="/forum"
          secondaryLabel="Abrir forum"
        />

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Modulos liberados" value={user?.modules.length || 0} />
          <MetricCard title="Caes cadastrados" value={dogs.length} href="/dogs" />
          <MetricCard title="Treinos registrados" value={trainings.length} href="/training" />
          <MetricCard title="Progresso medio" value={`${averageProgress}%`} accent />
        </div>

        <Panel title="Modulos ativos">
          <div className="grid gap-4 md:grid-cols-2">
            {user?.modules.length ? (
              user.modules.map((module) => (
                <Link
                  key={module.id}
                  href={resolveModuleHref(module.key)}
                  className="rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
                >
                  <p className="text-lg font-semibold">{module.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan-200/80">{module.key}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{module.description || getCoreModuleDescription(module.key)}</p>
                </Link>
              ))
            ) : (
              <EmptyState text="Nenhum modulo foi liberado para a sua conta ainda." />
            )}
          </div>
        </Panel>

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <Panel title="Meus caes" href="/dogs">
            <div className="grid gap-3">
              {dogs.length === 0 ? <EmptyState text="A equipe ainda nao cadastrou nenhum cao na sua conta." /> : null}
              {dogs.map((dog) => (
                <div key={dog.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <p className="font-semibold">{dog.name}</p>
                  <p className="mt-1 text-sm text-slate-300">{dog.breed}</p>
                  <p className="text-xs text-slate-400">{dog.age} anos</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Proximos compromissos" href="/calendar">
            <div className="space-y-3">
              {upcomingSchedule.length === 0 ? <EmptyState text="Nenhum agendamento cadastrado." /> : null}
              {upcomingSchedule.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <p className="font-semibold">
                    {new Date(item.date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">{item.title}</p>
                  <p className="text-xs text-slate-400">
                    {item.dog?.name || "Sem cao"} • {item.trainer?.name || "Equipe K9"}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="Treinos recentes" href="/training">
          <div className="grid gap-3">
            {trainings.length === 0 ? <EmptyState text="Nenhum treino registrado ainda." /> : null}
            {trainings.map((training) => (
              <div key={training.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{training.title}</p>
                    <p className="text-sm text-slate-300">{training.dog.name}</p>
                  </div>
                  <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs text-cyan-100">{training.progress}%</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">{training.coach?.name || "Equipe K9"}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function resolveModuleHref(key?: string | null) {
  const normalized = String(key || "").toUpperCase()
  if (normalized === "DOGS") return "/dogs"
  if (normalized === "TRAINING") return "/training"
  if (normalized === "SCHEDULE") return "/calendar"
  if (normalized === "COURSES" || normalized === "CONTENT_LIBRARY") return "/conteudos"
  return "/dashboard"
}

function Hero({
  eyebrow,
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  eyebrow: string
  title: string
  description: string
  primaryHref: string
  primaryLabel: string
  secondaryHref: string
  secondaryLabel: string
}) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30">
      <p className="text-sm uppercase tracking-[0.24em] text-cyan-200/80">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-semibold md:text-4xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">{description}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={primaryHref}
          className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5"
        >
          {primaryLabel}
        </Link>
        <Link
          href={secondaryHref}
          className="rounded-2xl border border-white/15 px-5 py-3 text-sm text-slate-100 transition hover:bg-white/10"
        >
          {secondaryLabel}
        </Link>
      </div>
    </section>
  )
}

function MetricCard({
  title,
  value,
  href,
  accent = false,
}: {
  title: string
  value: string | number
  href?: string
  accent?: boolean
}) {
  const content = (
    <div className={`rounded-[26px] border p-5 ${accent ? "border-cyan-300/20 bg-cyan-500/10" : "border-white/10 bg-white/5"}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}

function Panel({ title, href, children }: { title: string; href?: string; children: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/25">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {href ? (
          <Link href={href} className="text-sm text-cyan-300 hover:underline underline-offset-4">
            Abrir
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/35 p-5 text-sm text-slate-300">{text}</div>
}
