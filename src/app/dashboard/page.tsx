import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { isAdminRole, isProfessionalRole, isRootRole, isVetRole, STAFF_ROLES, type UserRole } from "@/lib/role"
import RootConsole from "./RootConsole"
import { getAccountPlanLabel, getDogLimit, getPlanStatusLabel, hasPremiumPlatformAccess } from "@/lib/platform"
import { formatDateRange, formatRegion } from "@/lib/community"

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
    const clientRoles: UserRole[] = ["CLIENT"]
    const staffRoles: UserRole[] = [...STAFF_ROLES]

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

  if (isAdminRole(session.user.role)) {
    return <AdminDashboard userId={session.user.id!} />
  }

  if (isProfessionalRole(session.user.role)) {
    return <ProfessionalDashboard userId={session.user.id!} role={String(session.user.role || "TRAINER")} />
  }

  return <ClientDashboard userId={session.user.id!} />
}

async function AdminDashboard({ userId }: { userId: string }) {
  const [me, stats, upcomingSchedules, recentEvents, recentChannels] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        plan: true,
        planStatus: true,
        emailVerifiedAt: true,
      },
    }),
    Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "TRAINER" } }),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.forumChannel.count(),
      prisma.channelSubscription.count({ where: { status: "ACTIVE" } }),
      prisma.blogPost.count({ where: { published: true } }),
      prisma.forumThread.count(),
      prisma.user.count({ where: { emailVerifiedAt: null } }),
    ]),
    prisma.schedule.findMany({
      orderBy: { date: "asc" },
      include: { user: true, trainer: true, dog: true },
      take: 6,
    }),
    prisma.blogPost.findMany({
      where: { postType: "EVENTO" },
      orderBy: { eventStartsAt: "asc" },
      include: { author: true },
      take: 4,
    }),
    prisma.forumChannel.findMany({
      include: { owner: true, _count: { select: { subscriptions: true, contents: true } } },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
  ])

  const [users, trainers, clients, channels, subscriptions, posts, forumPosts, unverified] = stats

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.13),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Dashboard admin</p>
              <h1 className="text-3xl font-semibold md:text-4xl">Operacao geral da plataforma</h1>
              <p className="max-w-2xl text-slate-300">
                Visao consolidada de usuarios, canais, eventos, publicacoes e agenda para manter a operacao em ordem.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/80">Conta</p>
              <p className="mt-2 text-2xl font-semibold">{getAccountPlanLabel(me?.plan)}</p>
              <p className="mt-2 text-sm text-emerald-50/90">{getPlanStatusLabel(me?.planStatus)}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <StatCard title="Usuarios" value={users} href="/admin/users" />
            <StatCard title="Adestradores" value={trainers} href="/admin/users" />
            <StatCard title="Clientes" value={clients} href="/admin/clients" />
            <StatCard title="Pendencias" value={unverified} href="/admin/security" accent />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <StatCard title="Canais" value={channels} href="/forum" />
          <StatCard title="Assinaturas ativas" value={subscriptions} href="/forum" />
          <StatCard title="Posts e forum" value={`${posts + forumPosts}`} href="/blog" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Agenda operacional</h2>
              <Link href="/calendar" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                Abrir calendario
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingSchedules.map((item) => (
                <Link
                  key={item.id}
                  href="/calendar"
                  className="block rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                >
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-300">
                    {formatDateRange(item.date, item.durationMinutes ? new Date(item.date.getTime() + item.durationMinutes * 60000) : null)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Tutor: {item.user?.name || "Nao informado"} • Responsavel: {item.trainer?.name || "Nao definido"}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Eventos publicados</h2>
                <Link href="/blog/new" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                  Novo evento
                </Link>
              </div>
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <Link key={event.id} href={`/blog/${event.slug}`} className="block rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
                    <p className="font-semibold">{event.title}</p>
                    <p className="mt-1 text-sm text-slate-300">{formatDateRange(event.eventStartsAt, event.eventEndsAt)}</p>
                    <p className="mt-1 text-xs text-slate-400">{event.author.name}</p>
                  </Link>
                ))}
                {recentEvents.length === 0 && <p className="text-sm text-slate-300">Nenhum evento publicado ainda.</p>}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Canais em movimento</h2>
                <Link href="/forum" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                  Ver forum
                </Link>
              </div>
              <div className="space-y-3">
                {recentChannels.map((channel) => (
                  <Link key={channel.id} href={`/forum/channels/${channel.slug}`} className="block rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
                    <p className="font-semibold">{channel.name}</p>
                    <p className="mt-1 text-sm text-slate-300">{channel.owner.name}</p>
                    <p className="mt-1 text-xs text-slate-400">{channel._count.subscriptions} assinantes • {channel._count.contents} conteudos</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

async function ProfessionalDashboard({ userId, role }: { userId: string; role: string }) {
  const [me, ownedChannels, schedules, recentContents, recentPosts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        plan: true,
        planStatus: true,
        city: true,
        state: true,
        emailVerifiedAt: true,
      },
    }),
    prisma.forumChannel.findMany({
      where: { ownerId: userId },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                city: true,
                state: true,
              },
            },
          },
        },
        _count: { select: { contents: true, threads: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.schedule.findMany({
      where: { trainerId: userId },
      orderBy: { date: "asc" },
      include: { user: true, dog: true },
      take: 6,
    }),
    prisma.channelContent.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      include: { channel: true },
      take: 6,
    }),
    prisma.forumThread.findMany({
      where: {
        OR: [{ authorId: userId }, { channel: { ownerId: userId } }],
      },
      orderBy: { createdAt: "desc" },
      include: { channel: true, _count: { select: { replies: true } } },
      take: 6,
    }),
  ])

  const subscriptionUsers = ownedChannels.flatMap((channel) => channel.subscriptions.map((subscription) => subscription.user))
  const uniqueClients = Array.from(new Map(subscriptionUsers.map((user) => [user.id, user])).values())
  const uniqueClientIds = uniqueClients.map((user) => user.id)
  const dogCount = uniqueClientIds.length
    ? await prisma.dog.count({ where: { ownerId: { in: uniqueClientIds } } })
    : 0
  const activeSubscriptions = ownedChannels.reduce((sum, channel) => sum + channel.subscriptions.length, 0)
  const regions = countRegions(uniqueClients)
  const topRegion = regions[0]?.label || "Regiao ainda em formacao"
  const normalizedRole = isVetRole(role) ? "VET" : "TRAINER"
  const professionalLabel = isVetRole(role) ? "veterinario" : "adestrador"
  const professionalTitle = isVetRole(role) ? "Veterinario" : "Adestrador"
  const introTitle = isVetRole(role)
    ? "Sua operacao clinica, seus tutores e sua presenca regional."
    : "Sua operacao, seus clientes e sua regiao."
  const introCopy = isVetRole(role)
    ? "Veja crescimento de assinaturas, tutores acompanhados, caes monitorados e agenda de atendimento clinico, preventivo ou esportivo."
    : "Veja crescimento de assinaturas, carteira ativa, caes acompanhados e agenda de atendimento online ou presencial."
  const premiumCopy = isVetRole(role)
    ? "Seu plano atual ainda nao libera canal, agenda, conteudos e forum do veterinario. Atualize a assinatura para orientar, atender e acompanhar por aqui."
    : "Seu plano atual ainda nao libera canal, agenda, conteudos e forum do adestrador. Atualize a assinatura para publicar, vender e atender por aqui."
  const clientLabel = isVetRole(role) ? "Tutores ativos" : "Clientes na carteira"
  const dogsLabel = isVetRole(role) ? "Caes monitorados" : "Caes acompanhados"
  const hasPremium = hasPremiumPlatformAccess(me?.plan, normalizedRole, me?.planStatus)

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.13),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Dashboard do {professionalLabel}</p>
              <h1 className="text-3xl font-semibold md:text-4xl">{introTitle}</h1>
              <p className="max-w-2xl text-slate-300">{introCopy}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/forum/channels/new"
                className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
              >
                Criar canal
              </Link>
              <Link
                href="/blog/new"
                className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
              >
                Novo post
              </Link>
            </div>
          </div>

          {!me?.emailVerifiedAt && (
            <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-amber-50">
              Confirme seu email para reforcar a seguranca da conta e transmitir mais confianca aos clientes.
              <Link href="/verify" className="ml-2 underline underline-offset-4">
                Confirmar agora
              </Link>
            </div>
          )}

          {!hasPremium && (
            <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4 text-cyan-50">
              {premiumCopy}
              <Link href="/billing" className="ml-2 underline underline-offset-4">
                Ir para assinatura
              </Link>
            </div>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <StatCard title="Assinaturas ativas" value={activeSubscriptions} href="/forum" accent />
            <StatCard title={clientLabel} value={uniqueClients.length} href="/profile" />
            <StatCard title={dogsLabel} value={dogCount} href="/dogs" />
            <StatCard title="Regiao lider" value={topRegion} href="/profile" />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Seus canais</h2>
              <span className="text-sm text-slate-400">{ownedChannels.length} canais</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {ownedChannels.map((channel) => (
                <Link
                  key={channel.id}
                  href={`/forum/channels/${channel.slug}`}
                  className="rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
                >
                  <p className="text-lg font-semibold">{channel.name}</p>
                  <p className="mt-2 text-sm text-slate-300">{channel.description}</p>
                  <p className="mt-3 text-xs text-slate-400">
                    {channel.subscriptions.length} assinantes • {channel._count.contents} conteudos • {channel._count.threads} posts
                  </p>
                </Link>
              ))}
              {ownedChannels.length === 0 && (
                <div className="rounded-[24px] border border-dashed border-white/15 bg-white/5 p-5 text-sm text-slate-300">
                  Seu canal ainda nao existe. Crie um espaco proprio para vender atendimento, publicar conteudo e organizar a comunidade.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Agenda de atendimentos</h2>
                <Link href="/calendar" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                  Ver calendario
                </Link>
              </div>
              <div className="space-y-3">
                {schedules.map((item) => (
                  <Link key={item.id} href="/calendar" className="block rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-300">
                      {formatDateRange(item.date, item.durationMinutes ? new Date(item.date.getTime() + item.durationMinutes * 60000) : null)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.user?.name || "Tutor"} • {item.dog?.name || "Sem cao"}
                    </p>
                  </Link>
                ))}
                {schedules.length === 0 && <p className="text-sm text-slate-300">Nenhum atendimento futuro registrado.</p>}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
              <h2 className="text-2xl font-semibold">Presenca regional</h2>
              <div className="mt-4 space-y-3">
                {regions.slice(0, 5).map((region) => (
                  <div key={region.label} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{region.label}</p>
                      <span className="text-sm text-cyan-200">
                        {region.count} {isVetRole(role) ? "tutores" : "clientes"}
                      </span>
                    </div>
                  </div>
                ))}
                {regions.length === 0 && <p className="text-sm text-slate-300">Sua base ainda nao preencheu localizacao suficiente.</p>}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Conteudos recentes</h2>
              <Link href="/conteudos/new" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                Novo conteudo
              </Link>
            </div>
            <div className="space-y-3">
              {recentContents.map((item) => (
                <Link key={item.id} href={`/conteudos/${item.slug}`} className="block rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-300">{item.channel.name}</p>
                </Link>
              ))}
              {recentContents.length === 0 && <p className="text-sm text-slate-300">Nenhum conteudo publicado ainda.</p>}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Posts e comunidade</h2>
              <Link href="/forum" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                Abrir forum
              </Link>
            </div>
            <div className="space-y-3">
              {recentPosts.map((item) => (
                <Link key={item.id} href={`/forum/${item.id}`} className="block rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-300">{item.channel?.name || "Comunidade geral"}</p>
                  <p className="mt-1 text-xs text-slate-400">{item._count.replies} comentarios</p>
                </Link>
              ))}
              {recentPosts.length === 0 && <p className="text-sm text-slate-300">Nenhum post publicado ainda.</p>}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Presenca profissional</p>
              <h2 className="mt-2 text-2xl font-semibold">{professionalTitle} com perfil forte vende mais confianca</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
                Mantenha bio, regiao, especialidades, disponibilidade e provas de consistencia bem preenchidas. Isso aumenta a confianca de quem chega na plataforma e faz seu trabalho parecer mais profissional.
              </p>
            </div>
            <Link
              href="/profile/edit"
              className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
            >
              Fortalecer perfil
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

async function ClientDashboard({ userId }: { userId: string }) {
  const subscriptions = await prisma.channelSubscription.findMany({
    where: { userId, status: "ACTIVE" },
    include: {
      channel: {
        include: {
          owner: true,
          _count: { select: { contents: true, threads: true } },
        },
      },
    },
    orderBy: { startedAt: "desc" },
  })
  const subscribedChannelIds = subscriptions.map((item) => item.channelId)

  const [me, dogs, trainings, schedules, contents, blogEvents, forumEvents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        plan: true,
        planStatus: true,
        city: true,
        state: true,
        emailVerifiedAt: true,
      },
    }),
    prisma.dog.findMany({
      where: { ownerId: userId },
      include: { trainings: true },
      orderBy: { createdAt: "desc" },
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
      take: 6,
    }),
    prisma.channelContent.findMany({
      where: {
        published: true,
        OR: [
          { accessLevel: "FREE" },
          { channelId: { in: subscribedChannelIds.length ? subscribedChannelIds : ["__none__"] } },
        ],
      },
      include: { channel: true, author: true },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
      take: 6,
    }),
    prisma.blogPost.findMany({
      where: { published: true, postType: "EVENTO" },
      orderBy: { eventStartsAt: "asc" },
      include: { author: true },
      take: 3,
    }),
    prisma.forumThread.findMany({
      where: {
        postType: "EVENTO",
        OR: [
          { channelId: null },
          { channel: { subscriptions: { some: { userId, status: "ACTIVE" } } } },
        ],
      },
      include: { author: true, channel: true },
      orderBy: { eventStartsAt: "asc" },
      take: 3,
    }),
  ])

  const avgProgress = trainings.length
    ? Math.round(trainings.reduce((sum, item) => sum + item.progress, 0) / trainings.length)
    : 0
  const athleteDogs = dogs.filter((dog) => dog.athleteClearance || !!dog.sportFocus).length
  const hasPremium = hasPremiumPlatformAccess(me?.plan, "CLIENT", me?.planStatus)
  const dogLimit = getDogLimit(me?.plan, "CLIENT", me?.planStatus)

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.13),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Seu espaco</p>
              <h1 className="text-3xl font-semibold md:text-4xl">Sua conta, seus caes e a trilha dos seus adestradores.</h1>
              <p className="max-w-2xl text-slate-300">
                Reunimos em um so lugar seus caes, suas rotinas e os proximos passos sugeridos para voce seguir com mais calma, consistencia e clareza.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dogs/new"
                className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
              >
                Cadastrar meu cao
              </Link>
              <Link
                href="/blog/new"
                className="rounded-2xl border border-white/15 px-4 py-3 text-sm text-gray-100 transition hover:bg-white/10"
              >
                Compartilhar no blog
              </Link>
            </div>
          </div>

          {!me?.emailVerifiedAt && (
            <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-amber-50">
              Confirme seu email para proteger a conta e facilitar a confianca nas interacoes com os adestradores.
              <Link href="/verify" className="ml-2 underline underline-offset-4">
                Confirmar agora
              </Link>
            </div>
          )}

          {!hasPremium && (
            <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4 text-cyan-50">
              Seu plano Free inclui ate {dogLimit} caes, blog e biblioteca de racas. Para receber conteudos dos
              adestradores, entrar no forum e usar agenda e treinos completos, escolha Starter ou Pro.
              <Link href="/billing" className="ml-2 underline underline-offset-4">
                Ver assinatura
              </Link>
            </div>
          )}

          {me?.planStatus === "CHECKOUT_REQUIRED" && (
            <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4 text-cyan-50">
              Voce escolheu o plano <strong>{getAccountPlanLabel(me.plan)}</strong>, mas ainda precisa concluir a assinatura.
              <Link href="/billing" className="ml-2 underline underline-offset-4">
                Ir para assinatura
              </Link>
            </div>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <StatCard title="Caes" value={dogs.length} href="/dogs" />
            <StatCard title="Canais assinados" value={subscriptions.length} href="/forum" />
            <StatCard title="Progresso medio" value={`${avgProgress}%`} href="/training" accent />
            <StatCard title="Caes atleta" value={athleteDogs} href="/dogs" />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Resumo da conta</h2>
                <Link href="/profile" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                  Abrir perfil
                </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <ProfileMetric title="Plano" value={getAccountPlanLabel(me?.plan)} />
              <ProfileMetric title="Status" value={getPlanStatusLabel(me?.planStatus)} />
              <ProfileMetric title="Cidade" value={formatRegion(me?.city, me?.state)} />
              <ProfileMetric title="Email" value={me?.emailVerifiedAt ? "Confirmado" : "Pendente"} />
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Proximos movimentos</h2>
              <Link href="/calendar" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                Ver tudo
              </Link>
            </div>
            <div className="space-y-3">
              {schedules.map((item) => (
                <Link key={item.id} href="/calendar" className="block rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {formatDateRange(item.date, item.durationMinutes ? new Date(item.date.getTime() + item.durationMinutes * 60000) : null)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.trainer?.name || "Equipe"} • {item.dog?.name || "Sem cao"}
                  </p>
                </Link>
              ))}
              {schedules.length === 0 && <p className="text-sm text-slate-300">Ainda nao ha agendamentos. Que tal marcar um momento de treino com calma?</p>}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Adestradores que guiam sua rotina</h2>
              <Link href="/forum" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                Explorar forum
              </Link>
            </div>
            <div className="space-y-3">
              {subscriptions.map((subscription) => (
                <Link key={subscription.id} href={`/forum/channels/${subscription.channel.slug}`} className="block rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
                  <p className="font-semibold">{subscription.channel.name}</p>
                  <p className="mt-1 text-sm text-slate-300">{subscription.channel.owner.name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {subscription.channel._count.contents} conteudos • {subscription.channel._count.threads} posts
                  </p>
                </Link>
              ))}
              {subscriptions.length === 0 && <p className="text-sm text-slate-300">Voce ainda nao assinou nenhum canal.</p>}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Conteudos liberados</h2>
              <Link href="/conteudos" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                Abrir conteudos
              </Link>
            </div>
            <div className="space-y-3">
              {contents.map((item) => (
                <Link key={item.id} href={`/conteudos/${item.slug}`} className="block rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-300">{item.channel.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.author.name}</p>
                </Link>
              ))}
              {contents.length === 0 && <p className="text-sm text-slate-300">Nenhum conteudo liberado ainda.</p>}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Seus caes</h2>
              <Link href="/dogs" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                Ver todos
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {dogs.map((dog) => {
                const avg = dog.trainings.length
                  ? Math.round(dog.trainings.reduce((sum, item) => sum + item.progress, 0) / dog.trainings.length)
                  : 0
                return (
                  <Link key={dog.id} href={`/training?dog=${dog.id}`} className="rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:bg-white/10">
                    <p className="text-lg font-semibold">{dog.name}</p>
                    <p className="mt-1 text-sm text-slate-300">{dog.breed}</p>
                    <p className="mt-1 text-xs text-slate-400">{dog.trainings.length} treinos • progresso medio {avg}%</p>
                  </Link>
                )
              })}
              {dogs.length === 0 && <p className="text-sm text-slate-300">Cadastre o primeiro cao para iniciar o acompanhamento.</p>}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Eventos da sua trilha</h2>
              <Link href="/calendar" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                Ver calendario
              </Link>
            </div>
            <div className="space-y-3">
              {[...blogEvents, ...forumEvents]
                .sort((a, b) => {
                  const aDate = "eventStartsAt" in a && a.eventStartsAt ? new Date(a.eventStartsAt).getTime() : 0
                  const bDate = "eventStartsAt" in b && b.eventStartsAt ? new Date(b.eventStartsAt).getTime() : 0
                  return aDate - bDate
                })
                .slice(0, 5)
                .map((item) => {
                  const href = "slug" in item ? `/blog/${item.slug}` : `/forum/${item.id}`
                  return (
                    <Link key={item.id} href={href} className="block rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-300">{formatDateRange(item.eventStartsAt, item.eventEndsAt)}</p>
                      <p className="mt-1 text-xs text-slate-400">{"channel" in item ? item.channel?.name || "Forum" : "Blog"}</p>
                    </Link>
                  )
                })}
              {blogEvents.length + forumEvents.length === 0 && <p className="text-sm text-slate-300">Nenhum evento publicado para voce ainda.</p>}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function countRegions(users: Array<{ city?: string | null; state?: string | null }>) {
  const counts = new Map<string, number>()

  for (const user of users) {
    const label = formatRegion(user.city, user.state)
    if (label === "Regiao nao informada") continue
    counts.set(label, (counts.get(label) || 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
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

function ProfileMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-2 text-sm text-white">{value}</p>
    </div>
  )
}
