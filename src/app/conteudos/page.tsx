import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { requireUser, isStaffSession } from "@/lib/auth"
import { getRoleLabel, isProfessionalRole } from "@/lib/role"
import {
  getChannelContentAccessLabel,
  getChannelContentCategoryLabel,
  getChannelContentTypeLabel,
} from "@/lib/platform"
import { getCourseAccess } from "@/lib/course-access"

export default async function ConteudosPage() {
  const session = await requireUser()
  const isStaff = isStaffSession(session)
  const isProfessional = isProfessionalRole(session.user.role)
  const access = await getCourseAccess(session)
  const allowedTokens = Array.from(access.allowedContentIds)

  const contentWhere = isStaff
    ? session.user.role === "ADMIN" || session.user.role === "ROOT" || session.user.role === "SUPERADMIN"
      ? { published: true }
      : {
          published: true,
          OR: [{ authorId: session.user.id }, { channel: { ownerId: session.user.id } }],
        }
    : access.allowAll
      ? { published: true }
      : allowedTokens.length
        ? {
            published: true,
            OR: [
              { accessLevel: "FREE" },
              { id: { in: allowedTokens } },
              { slug: { in: allowedTokens } },
              { channelId: { in: allowedTokens } },
            ],
          }
        : { published: true, accessLevel: "FREE" }

  const [contents, blogPosts, recentTrainings, schedules, moduleCount] = await Promise.all([
    prisma.channelContent.findMany({
      where: contentWhere,
      include: {
        author: true,
        channel: {
          include: {
            owner: true,
            _count: { select: { contents: true, threads: true } },
          },
        },
      },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
      take: 12,
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      include: { author: true },
      take: 4,
    }),
    prisma.trainingSession.findMany({
      where: isStaff ? { coachId: session.user.id } : { dog: { ownerId: session.user.id } },
      orderBy: { executedAt: "desc" },
      include: { dog: true },
      take: 4,
    }),
    prisma.schedule.findMany({
      where: isStaff ? { trainerId: session.user.id } : { userId: session.user.id },
      orderBy: { date: "asc" },
      include: { dog: true, user: true },
      take: 4,
    }),
    prisma.module.count({
      where: { users: { some: { id: session.user.id } } },
    }),
  ])

  const accessibleLabel = isStaff
    ? "Sua biblioteca de publicacao e entrega"
    : access.allowAll || access.allowedContentIds.size > 0
      ? "Conteudos liberados pela equipe K9"
      : "Conteudos abertos da plataforma. Fale com a equipe para liberar sua trilha"

  const visibleChannels = Array.from(
    new Map(contents.map((content) => [content.channelId, content.channel])).values(),
  )

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,23,42,0.72)),radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_30%)] p-8 shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200/80">Conteudos</p>
              <h1 className="text-3xl font-semibold md:text-4xl">Biblioteca de aulas, videos e guias do seu profissional.</h1>
              <p className="text-slate-300">
                {accessibleLabel}. Aqui voce encontra o que foi liberado para estudar, aplicar e revisar com constancia.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/forum"
                className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-medium text-gray-100 transition hover:bg-white/10"
              >
                Explorar canais
              </Link>
              {isProfessional && (
                <Link
                  href="/conteudos/new"
                  className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
                >
                  Novo conteudo
                </Link>
              )}
              <Link
                href="/blog/new"
                className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20"
              >
                Publicar no blog
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <MetricCard title="Modulos ativos" value={String(moduleCount)} description="Acessos liberados para sua conta" />
            <MetricCard title="Perfil" value={getRoleLabel(session.user.role)} description="Conta ativa para acompanhar sua rotina" />
            <MetricCard title="Trilhas liberadas" value={String(visibleChannels.length)} description="Fontes ativas de treino e acompanhamento" />
            <MetricCard title="Conteudos disponiveis" value={String(contents.length)} description="Aulas, guias, checklists e videos liberados" />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Trilha liberada</p>
                <h2 className="text-2xl font-semibold">Biblioteca do seu momento</h2>
              </div>
              <span className="text-sm text-slate-400">{contents.length} itens</span>
            </div>

              {contents.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-slate-300">
                  Nenhum conteudo liberado ainda. A equipe K9 libera as aulas conforme o seu acompanhamento.
                </div>
              )}

            <div className="grid gap-4 md:grid-cols-2">
              {contents.map((content) => (
                <Link
                  key={content.id}
                  href={`/conteudos/${content.slug}`}
                  className="rounded-[24px] border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
                >
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-100">
                      {getChannelContentTypeLabel(content.contentType)}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">
                      {getChannelContentAccessLabel(content.accessLevel)}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">
                      {getChannelContentCategoryLabel(content.category)}
                    </span>
                    {content.durationMinutes && (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{content.durationMinutes} min</span>
                    )}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">{content.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{content.summary || content.body.slice(0, 150)}...</p>
                  <div className="mt-4 text-xs text-slate-400">
                    <p>{content.channel.name}</p>
                    <p>
                      {content.author.name} • {new Date(content.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Canais ativos</p>
                  <h2 className="text-2xl font-semibold">Quem guia sua rotina</h2>
                </div>
                <Link href="/forum" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                  Ver forum
                </Link>
              </div>

              {visibleChannels.length === 0 && <p className="text-sm text-slate-300">Nenhuma trilha liberada ainda.</p>}

              <div className="space-y-3">
                {visibleChannels.map((channel) => (
                  <Link
                    key={channel.id}
                    href={`/forum/channels/${channel.slug}`}
                    className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold">{channel.name}</p>
                        <p className="text-sm text-slate-300">{channel.owner?.name || "Equipe K9"}</p>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-100">Ativo</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{channel.description}</p>
                    <p className="mt-3 text-xs text-slate-400">
                      {channel._count?.contents ?? 0} conteudos • {channel._count?.threads ?? 0} posts
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Pratica</p>
                  <h2 className="text-2xl font-semibold">Treinos e agenda</h2>
                </div>
                <Link href="/training" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                  Ver treinos
                </Link>
              </div>

              <div className="space-y-3">
                {recentTrainings.map((training) => (
                  <Link
                    key={training.id}
                    href={`/training/${training.id}`}
                    className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{training.title}</p>
                      <span className="text-sm text-cyan-200">{training.progress}%</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{training.dog?.name || "Sem cao"} • {new Date(training.executedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
                  </Link>
                ))}
                {recentTrainings.length === 0 && <p className="text-sm text-slate-300">Nenhum treino recente por aqui.</p>}
              </div>

              <div className="mt-5 space-y-3">
                {schedules.map((item) => (
                  <Link
                    key={item.id}
                    href="/calendar"
                    className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-300">
                      {new Date(item.date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{item.dog?.name || item.user?.name || "Sem referencia"} • {item.status}</p>
                  </Link>
                ))}
                {schedules.length === 0 && <p className="text-sm text-slate-300">Nenhum agendamento futuro.</p>}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Blog aberto</p>
              <h2 className="text-2xl font-semibold">Leituras e eventos abertos</h2>
            </div>
            <Link href="/blog" className="text-sm text-cyan-300 hover:underline underline-offset-4">
              Ver blog
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {blogPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/80">{post.category}</p>
                <h3 className="mt-2 text-lg font-semibold">{post.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{post.excerpt || post.content.slice(0, 120)}...</p>
                <p className="mt-3 text-xs text-slate-400">{post.author.name}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function MetricCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
    </div>
  )
}
