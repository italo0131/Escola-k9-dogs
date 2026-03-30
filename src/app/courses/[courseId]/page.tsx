import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatChannelLocation, formatMoney, formatServiceMode } from "@/lib/community"
import { getChannelContentAccessLabel, getChannelContentCategoryLabel } from "@/lib/platform"
import AICoachPanel from "@/app/components/AICoachPanel"

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params

  const channel = await prisma.forumChannel.findUnique({
    where: { slug: courseId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          headline: true,
          bio: true,
          city: true,
          state: true,
        },
      },
      contents: {
        where: { published: true },
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          category: true,
          accessLevel: true,
          contentType: true,
          durationMinutes: true,
          orderIndex: true,
          createdAt: true,
        },
        orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
      },
      _count: { select: { subscriptions: true, threads: true } },
    },
  })

  if (!channel) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center px-4 text-white">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Curso</p>
          <h1 className="mt-3 text-3xl font-semibold">Trilha nao encontrada</h1>
          <p className="mt-3 text-slate-300">Esse curso nao existe ou ainda nao foi publicado no catalogo.</p>
          <Link
            href="/courses"
            className="mt-6 inline-flex rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
          >
            Voltar para cursos
          </Link>
        </div>
      </div>
    )
  }

  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      published: true,
      OR: [{ authorId: channel.owner.id }, { category: channel.category }],
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 3,
  })

  const totalDuration = channel.contents.reduce((sum, content) => sum + (content.durationMinutes || 0), 0)
  const freeCount = channel.contents.filter((content) => content.accessLevel === "FREE").length
  const groupedModules = Object.entries(
    channel.contents.reduce<Record<string, typeof channel.contents>>((acc, content) => {
      const key = content.category || "TRILHA"
      if (!acc[key]) acc[key] = []
      acc[key].push(content)
      return acc
    }, {})
  )

  return (
    <div className="bg-k9-aurora-warm min-h-[100svh] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <Link href="/courses" className="text-cyan-300 hover:underline underline-offset-4">
          Voltar para cursos
        </Link>

        <section className="rounded-[36px] border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.96),rgba(17,24,39,0.78)),radial-gradient(circle_at_top_right,rgba(251,191,36,0.15),transparent_30%)] p-8 shadow-2xl shadow-black/25">
          <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr] xl:items-end">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-100">{channel.category}</span>
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-100">{formatServiceMode(channel.serviceMode)}</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">
                  {formatMoney(channel.subscriptionPrice) || "Entrada gratuita"}
                </span>
              </div>

              <div>
                <h1 className="text-4xl font-semibold md:text-5xl">{channel.name}</h1>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">{channel.description}</p>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Quem conduz a trilha</p>
                <h2 className="mt-3 text-xl font-semibold">{channel.owner.name}</h2>
                {channel.owner.headline && <p className="mt-2 text-sm text-amber-200">{channel.owner.headline}</p>}
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {truncate(channel.owner.bio, 220) || "Perfil profissional em construcao, mas a trilha ja esta pronta para receber aulas e dicas."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#22c55e)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
                >
                  Entrar para continuar
                </Link>
                <Link
                  href="#coach-k9"
                  className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-5 py-3 text-sm font-medium text-amber-100 transition hover:bg-amber-500/20"
                >
                  Perguntar para a IA
                </Link>
                <Link
                  href={`/forum/channels/${channel.slug}`}
                  className="rounded-2xl border border-white/15 px-5 py-3 text-sm text-gray-100 transition hover:bg-white/10"
                >
                  Abrir canal do curso
                </Link>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Metric title="Aulas" value={String(channel.contents.length)} description="Itens reais publicados no curso." />
              <Metric title="Acesso livre" value={String(freeCount)} description="Portas de entrada para descoberta." />
              <Metric title="Duracao estimada" value={totalDuration ? `${totalDuration} min` : "Livre"} description="Soma das aulas que ja possuem tempo informado." />
              <Metric title="Comunidade" value={`${channel._count.subscriptions}`} description={`${channel._count.threads} posts no canal e alunos em volta da trilha.`} />
              <Metric title="Atendimento" value={formatServiceMode(channel.serviceMode)} description={formatChannelLocation(channel.city, channel.state)} />
              <Metric title="Formato comercial" value={formatMoney(channel.subscriptionPrice) || "Sem assinatura"} description={channel.acceptsRemote ? "Aceita acompanhamento remoto" : "Atendimento local ou comunidade"} />
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/25">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Mapa do curso</p>
                <h2 className="mt-2 text-2xl font-semibold">Aulas, modulos e o que ja pode ser estudado</h2>
              </div>
              <span className="text-sm text-slate-400">{channel.contents.length} itens</span>
            </div>

            <div className="mt-5 space-y-4">
              {groupedModules.map(([category, items], index) => (
                <div key={`${category}-${index}`} className="rounded-[24px] border border-white/10 bg-slate-950/35 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-amber-200/80">Modulo {index + 1}</p>
                      <h3 className="mt-2 text-xl font-semibold">{getChannelContentCategoryLabel(category)}</h3>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-gray-100">{items.length} aulas</span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[20px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {item.orderIndex ? `${item.orderIndex}. ` : ""}
                              {item.title}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-300">{truncate(item.summary, 130)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-100">
                              {getChannelContentAccessLabel(item.accessLevel)}
                            </span>
                            {item.durationMinutes && (
                              <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{item.durationMinutes} min</span>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          {item.accessLevel === "FREE" ? (
                            <Link
                              href={`/conteudos/${item.slug}`}
                              className="rounded-2xl border border-white/15 px-4 py-2 text-sm text-gray-100 transition hover:bg-white/10"
                            >
                              Abrir aula livre
                            </Link>
                          ) : (
                            <Link
                              href="/register"
                              className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-500/20"
                            >
                              Desbloquear trilha
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {channel.contents.length === 0 && (
                <div className="rounded-[24px] border border-dashed border-white/15 bg-white/5 p-5 text-slate-300">
                  A trilha ja existe, mas ainda nao recebeu aulas. Quando o canal publicar os modulos, eles aparecerao aqui.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/25">
              <p className="text-sm uppercase tracking-[0.2em] text-amber-200/80">Proposta da trilha</p>
              <h2 className="mt-2 text-2xl font-semibold">O que esse curso pode entregar</h2>
              <div className="mt-5 space-y-3">
                <Outcome
                  title="Clareza de sequencia"
                  description="O aluno entende o que ver primeiro, o que revisar depois e quando faz sentido aprofundar."
                />
                <Outcome
                  title="Mistura de curso e consulta"
                  description="Aulas estruturadas convivem com dicas curtas e materiais de consulta para o dia a dia."
                />
                <Outcome
                  title="Transicao natural para pratica"
                  description="A trilha conversa com treinos, agenda, canal e IA, sem parecer uma area isolada do produto."
                />
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(17,24,39,0.82))] p-6 shadow-lg shadow-black/25">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Leituras relacionadas</p>
                  <h2 className="mt-2 text-2xl font-semibold">Dicas que reforcam a trilha</h2>
                </div>
                <Link href="/blog" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                  Ver blog
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {relatedPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="block rounded-[22px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/80">{post.category}</p>
                    <h3 className="mt-2 text-lg font-semibold">{post.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{truncate(post.excerpt || post.content, 120)}</p>
                  </Link>
                ))}

                {relatedPosts.length === 0 && (
                  <div className="rounded-[22px] border border-dashed border-white/15 bg-white/5 p-4 text-slate-300">
                    Ainda nao ha leituras relacionadas publicadas para esta trilha.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <AICoachPanel
          courseSlug={channel.slug}
          title={`Pergunte para a IA sobre "${channel.name}"`}
          description="Use o contexto desta trilha para pedir ordem de estudo, plano semanal, interpretacao de modulos e proximos passos."
          suggestions={[
            {
              label: "Ordem de estudo",
              prompt: `Me diga por qual aula deste curso eu deveria comecar e como organizar a primeira semana de estudo.`,
            },
            {
              label: "Plano de pratica",
              prompt: `Transforme este curso em um plano simples de pratica para os proximos 7 dias.`,
            },
            {
              label: "Dica + curso",
              prompt: `Como combinar uma aula desta trilha com dicas rapidas do blog para acelerar resultados?`,
            },
            {
              label: "O que destrava",
              prompt: `Que tipo de problema este curso ajuda a destravar melhor e como perceber progresso?`,
            },
          ]}
        />
      </div>
    </div>
  )
}

function Metric({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </div>
  )
}

function Outcome({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-300">{description}</p>
    </div>
  )
}

function truncate(value: string | null | undefined, max = 160) {
  if (!value) return ""
  return value.length > max ? `${value.slice(0, max).trim()}...` : value
}
