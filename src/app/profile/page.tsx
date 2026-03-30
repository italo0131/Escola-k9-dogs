import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { getRoleLabel, getUserStatusLabel, isProfessionalRole, needsProfessionalApproval } from "@/lib/role"
import { getAccountPlanLabel } from "@/lib/platform"

export default async function ProfilePage() {
  const session = await requireUser()

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      dogs: { include: { trainings: true }, orderBy: { createdAt: "desc" } },
      forumChannels: { include: { _count: { select: { subscriptions: true, contents: true, threads: true } } } },
      channelSubscriptions: {
        where: { status: "ACTIVE" },
        include: { channel: { include: { owner: true } } },
        orderBy: { startedAt: "desc" },
      },
      blogPosts: { orderBy: { createdAt: "desc" }, take: 4 },
      channelContents: { orderBy: { createdAt: "desc" }, take: 4, include: { channel: true } },
    },
  })

  if (!user) {
    return (
      <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 sm:px-6">
        <div className="max-w-xl w-full text-center rounded-2xl border border-white/10 bg-white/5 p-10 backdrop-blur">
          <h1 className="text-2xl font-semibold text-white">Nenhum usuario encontrado</h1>
          <p className="mt-2 text-gray-300">Crie uma conta para acessar o perfil.</p>
          <Link
            href="/register"
            className="inline-block mt-6 rounded-lg bg-cyan-500 px-4 py-3 text-white font-semibold hover:-translate-y-0.5 transition shadow-lg shadow-cyan-500/20"
          >
            Criar conta
          </Link>
        </div>
      </div>
    )
  }

  const [trainingsCount, schedulesCount, activeChannelsCount, totalPayments] = await Promise.all([
    prisma.trainingSession.count({
      where: { dog: { ownerId: user.id } },
    }),
    prisma.schedule.count({
      where: { userId: user.id },
    }),
    prisma.channelSubscription.count({
      where: { userId: user.id, status: "ACTIVE" },
    }),
    prisma.payment.aggregate({
      where: { userId: user.id },
      _sum: { amount: true },
    }),
  ])

  const progressByDog = user.dogs.map((dog) => {
    const sessions = (dog.trainings || []).slice().sort((a, b) => a.executedAt.getTime() - b.executedAt.getTime())
    const avg = sessions.length
      ? Math.round(sessions.reduce((sum, t) => sum + t.progress, 0) / sessions.length)
      : 0
    const first = sessions[0]
    const last = sessions[sessions.length - 1]
    const delta = first && last ? last.progress - first.progress : 0
    return {
      id: dog.id,
      name: dog.name,
      breed: dog.breed,
      progress: avg,
      delta,
      sessions: sessions.length,
    }
  })
  const pendingProfessionalApproval = needsProfessionalApproval(user.role, user.status)

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,23,42,0.74)),radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_30%)] p-8 shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Perfil</p>
              <h1 className="text-3xl font-semibold md:text-4xl">{user.name}</h1>
              <p className="max-w-2xl text-slate-300">
                {user.headline || `${getRoleLabel(user.role)} com foco em rotina disciplinada, evolucao visivel e comunidade.`}
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{getRoleLabel(user.role)}</span>
                <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-100">{getAccountPlanLabel(user.plan)}</span>
                <span className={`rounded-full px-3 py-1 ${pendingProfessionalApproval ? "bg-amber-500/15 text-amber-100" : "bg-emerald-500/15 text-emerald-100"}`}>
                  {getUserStatusLabel(user.status, user.role)}
                </span>
                <span className={`rounded-full px-3 py-1 ${user.emailVerifiedAt ? "bg-emerald-500/15 text-emerald-100" : "bg-amber-500/15 text-amber-100"}`}>
                  {user.emailVerifiedAt ? "Email confirmado" : "Email pendente"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {!user.emailVerifiedAt && (
                <Link
                  href="/verify"
                  className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-50"
                >
                  Confirmar email
                </Link>
              )}
              <Link
                href="/profile/edit"
                className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
              >
                Editar perfil
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <Metric title="Caes" value={String(user.dogs.length)} description="Base de acompanhamento individual" />
            <Metric title="Treinos" value={String(trainingsCount)} description="Historico consolidado da evolucao" />
            <Metric title="Agenda" value={String(schedulesCount)} description="Compromissos organizados no calendario" />
            <Metric title="Canais ativos" value={String(activeChannelsCount)} description="Assinaturas conectadas ao seu feed" />
          </div>
        </section>

        {pendingProfessionalApproval ? (
          <section className="rounded-[28px] border border-amber-300/20 bg-amber-500/10 p-6 text-amber-50 shadow-lg shadow-black/20">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-100/80">Analise profissional</p>
            <h2 className="mt-2 text-2xl font-semibold">Seu perfil ainda esta em validacao</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7">
              Enquanto a equipe revisa seus dados, sua conta continua ativa para navegar na plataforma, mas canal,
              conteudo exclusivo e publicacoes como profissional ficam bloqueados.
            </p>
          </section>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Identidade e disciplina</h2>
              <Link href="/billing" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                Gerenciar assinatura
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ProfileBlock title="Email" value={user.email} />
              <ProfileBlock title="Telefone" value={user.phone || "Nao informado"} />
              <ProfileBlock title="Cidade" value={[user.city, user.state].filter(Boolean).join(" / ") || "Nao informado"} />
              <ProfileBlock title="Experiencia" value={user.experienceYears ? `${user.experienceYears} anos` : "Em construcao"} />
              <ProfileBlock title="Especialidades" value={user.specialties || "Nao informado"} />
              <ProfileBlock title="Instagram" value={user.instagramHandle || "Nao informado"} />
            </div>

            {user.bio && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Bio</p>
                <p className="mt-3 whitespace-pre-wrap text-slate-100 leading-7">{user.bio}</p>
              </div>
            )}

            {user.availabilityNotes && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Rotina e disponibilidade</p>
                <p className="mt-3 whitespace-pre-wrap text-slate-100 leading-7">{user.availabilityNotes}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
              <h2 className="text-2xl font-semibold">Financeiro e plano</h2>
              <div className="mt-4 grid gap-4">
                <ProfileBlock title="Plano atual" value={getAccountPlanLabel(user.plan)} />
                <ProfileBlock title="Status do plano" value={user.planStatus || "ACTIVE"} />
                <ProfileBlock title="Receita registrada" value={`R$ ${((totalPayments._sum.amount || 0) / 100).toFixed(2)}`} />
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Publicacao</h2>
                <Link href="/blog/new" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                  Novo post
                </Link>
              </div>
              <div className="space-y-3">
                {user.blogPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <p className="font-semibold">{post.title}</p>
                    <p className="mt-1 text-sm text-slate-300">{post.category}</p>
                  </Link>
                ))}
                {user.blogPosts.length === 0 && <p className="text-sm text-slate-300">Nenhum post publicado ainda.</p>}
              </div>
            </div>
          </div>
        </section>

        {isProfessionalRole(user.role) && (
          <section className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Canais e conteudos</h2>
              <Link href="/conteudos/new" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                Novo conteudo
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {user.forumChannels.map((channel) => (
                <Link
                  key={channel.id}
                  href={`/forum/channels/${channel.slug}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-semibold">{channel.name}</p>
                    <span className="text-xs text-slate-400">{channel._count.subscriptions} assinantes</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{channel.description}</p>
                  <p className="mt-3 text-xs text-slate-400">
                    {channel._count.contents} conteudos • {channel._count.threads} topicos
                  </p>
                </Link>
              ))}
              {user.forumChannels.length === 0 && <p className="text-sm text-slate-300">Nenhum canal criado ainda.</p>}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {user.channelContents.map((content) => (
                <Link
                  key={content.id}
                  href={`/conteudos/${content.slug}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                >
                  <p className="font-semibold">{content.title}</p>
                  <p className="mt-1 text-sm text-slate-300">{content.channel.name}</p>
                </Link>
              ))}
              {user.channelContents.length === 0 && <p className="text-sm text-slate-300">Nenhum conteudo de canal publicado ainda.</p>}
            </div>
          </section>
        )}

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Progresso dos caes</h2>
              <Link href="/dogs" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                Ver caes
              </Link>
            </div>

            <div className="space-y-3">
              {progressByDog.map((dog) => (
                <Link
                  key={dog.id}
                  href={`/training?dog=${dog.id}`}
                  className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">{dog.name}</p>
                      <p className="text-xs text-slate-400">{dog.breed}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-cyan-200">{dog.progress}%</p>
                      <p className={`text-xs ${dog.delta >= 0 ? "text-emerald-200" : "text-rose-200"}`}>
                        {dog.delta >= 0 ? "+" : ""}
                        {dog.delta}% evolucao
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
              {progressByDog.length === 0 && <p className="text-sm text-slate-300">Nenhum treino consolidado ainda.</p>}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Canais assinados</h2>
              <Link href="/forum" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                Explorar
              </Link>
            </div>
            <div className="space-y-3">
              {user.channelSubscriptions.map((subscription) => (
                <Link
                  key={subscription.id}
                  href={`/forum/channels/${subscription.channel.slug}`}
                  className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                >
                  <p className="font-semibold">{subscription.channel.name}</p>
                  <p className="mt-1 text-sm text-slate-300">{subscription.channel.owner.name}</p>
                </Link>
              ))}
              {user.channelSubscriptions.length === 0 && <p className="text-sm text-slate-300">Nenhum canal assinado ainda.</p>}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function Metric({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
    </div>
  )
}

function ProfileBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-2 text-sm text-white">{value}</p>
    </div>
  )
}
