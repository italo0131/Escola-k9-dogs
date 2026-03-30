import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatMoney, formatServiceMode } from "@/lib/community"
import { getChannelContentAccessLabel, getChannelContentCategoryLabel } from "@/lib/platform"
import AICoachPanel from "@/app/components/AICoachPanel"

export const revalidate = 300

export default async function CoursesPage() {
  const [channels, freeLessons, blogPosts] = await Promise.all([
    prisma.forumChannel.findMany({
      where: { isPublic: true },
      include: {
        owner: { select: { name: true, headline: true } },
        contents: {
          where: { published: true },
          select: {
            id: true,
            slug: true,
            title: true,
            summary: true,
            category: true,
            accessLevel: true,
            durationMinutes: true,
            orderIndex: true,
          },
          orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
        },
        _count: { select: { subscriptions: true, threads: true } },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    }),
    prisma.channelContent.findMany({
      where: { published: true, accessLevel: "FREE" },
      include: { channel: { select: { name: true, slug: true } } },
      orderBy: [{ createdAt: "desc" }],
      take: 6,
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 3,
    }),
  ])

  const totalLessons = channels.reduce((acc, channel) => acc + channel.contents.length, 0)
  const totalFreeLessons = channels.reduce(
    (acc, channel) => acc + channel.contents.filter((content) => content.accessLevel === "FREE").length,
    0
  )

  return (
    <div className="bg-k9-aurora-warm min-h-[100svh] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[36px] border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.96),rgba(17,24,39,0.76)),radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_28%)] p-8 shadow-2xl shadow-black/25">
          <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
            <div className="space-y-5">
              <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-cyan-100">
                Catalogo K9
              </div>
              <div>
                <h1 className="text-4xl font-semibold md:text-5xl">Aprenda no seu ritmo e transforme estudo em pratica com mais leveza.</h1>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
                  Aqui voce encontra trilhas organizadas por profissionais, com espaco para descobrir, testar e voltar sempre que precisar. A IA ajuda com sugestoes, mas a decisao final do que faz sentido continua com voce.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="#catalogo"
                  className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#22c55e)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
                >
                  Ver trilhas
                </Link>
                <Link
                  href="#coach-k9"
                  className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-5 py-3 text-sm font-medium text-amber-100 transition hover:bg-amber-500/20"
                >
                  Conversar com a IA
                </Link>
                <Link
                  href="/register"
                  className="rounded-2xl border border-white/15 px-5 py-3 text-sm text-gray-100 transition hover:bg-white/10"
                >
                  Criar conta
                </Link>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <MetricCard title="Cursos publicados" value={String(channels.length)} description="Trilhas organizadas a partir dos canais da plataforma." />
              <MetricCard title="Aulas disponiveis" value={String(totalLessons)} description="Modulos, guias, checklists e videos com contexto de treino." />
              <MetricCard title="Itens livres" value={String(totalFreeLessons)} description="Material aberto para descobertas." />
              <MetricCard title="Dicas no blog" value={String(blogPosts.length)} description="Leituras e eventos" />
            </div>
          </div>
        </section>

        <section id="catalogo" className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-amber-200/80">Trilhas publicadas</p>
              <h2 className="mt-2 text-3xl font-semibold">Escolha o que faz sentido para o seu momento e avance sem achismo.</h2>
            </div>
            <Link href="/servicos" className="text-sm text-cyan-300 hover:underline underline-offset-4">
              Ver servicos e formatos
            </Link>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {channels.map((channel) => {
              const freeCount = channel.contents.filter((content) => content.accessLevel === "FREE").length

              return (
                <Link
                  key={channel.id}
                  href={`/courses/${channel.slug}`}
                  className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(17,24,39,0.78))] p-6 shadow-lg shadow-black/25 transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-100">{formatServiceMode(channel.serviceMode)}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{formatMoney(channel.subscriptionPrice) || "Entrada gratuita"}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{channel.contents.length} aulas</span>
                  </div>

                  <h3 className="mt-4 text-2xl font-semibold">{channel.name}</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    {channel.owner.name}
                    {channel.owner.headline ? ` - ${channel.owner.headline}` : ""}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-slate-300">{truncate(channel.description, 170)}</p>

                  <div className="mt-5 rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Primeiros modulos</p>
                    <div className="mt-3 space-y-2">
                      {channel.contents.slice(0, 3).map((content) => (
                        <div key={content.id} className="flex items-center justify-between gap-3 text-sm text-slate-200">
                          <span className="min-w-0 truncate">
                            {content.orderIndex ? `${content.orderIndex}. ` : ""}
                            {content.title}
                          </span>
                          <span className="whitespace-nowrap text-xs text-slate-400">
                            {content.durationMinutes ? `${content.durationMinutes} min` : "Leitura"}
                          </span>
                        </div>
                      ))}
                      {channel.contents.length === 0 && (
                        <p className="text-sm text-slate-300">As aulas aparecerao aqui quando a trilha receber publicacoes.</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                    <span className="text-amber-200">{freeCount} itens livres</span>
                    <span className="text-slate-400">{channel._count.subscriptions} assinaturas - {channel._count.threads} posts</span>
                  </div>
                </Link>
              )
            })}

            {channels.length === 0 && (
              <div className="rounded-[30px] border border-dashed border-white/15 bg-white/5 p-6 text-slate-300 xl:col-span-3">
                Nenhuma trilha foi publicada ainda. Quando os primeiros canais liberarem cursos, o catalogo aparecera aqui automaticamente.
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/25">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Descoberta livre</p>
                <h2 className="mt-2 text-2xl font-semibold">Comece pelas dicas abertas</h2>
              </div>
              <Link href="/blog" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                Ver blog
              </Link>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {freeLessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/conteudos/${lesson.slug}`}
                  className="rounded-[24px] border border-white/10 bg-slate-950/35 p-5 transition hover:bg-white/10"
                >
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-100">
                      {getChannelContentCategoryLabel(lesson.category)}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">
                      {getChannelContentAccessLabel(lesson.accessLevel)}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{lesson.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{lesson.channel.name}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{truncate(lesson.summary || "", 130)}</p>
                </Link>
              ))}

              {freeLessons.length === 0 && (
                <div className="rounded-[24px] border border-dashed border-white/15 bg-white/5 p-5 text-slate-300 md:col-span-2">
                  Ainda nao ha aulas livres publicadas. Assim que entrarem no ar, elas aparecerao aqui.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(17,24,39,0.82))] p-6 shadow-lg shadow-black/25">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-200/80">Como navegar</p>
            <h2 className="mt-2 text-2xl font-semibold">Uma jornada mais intuitiva para cursos e dicas</h2>
            <div className="mt-5 space-y-4">
              <JourneyStep
                step="01"
                title="Escolha a trilha"
                description="Veja o nome do curso, formato do atendimento, quantidade de aulas e os primeiros modulos."
              />
              <JourneyStep
                step="02"
                title="Experimente algo livre"
                description="Se houver conteudo aberto, entre por ele para sentir o tom e a didatica do profissional."
              />
              <JourneyStep
                step="03"
                title="Pergunte para a IA"
                description="Use a IA para entender por onde comecar, montar uma rotina e achar a proxima aula."
              />
              <JourneyStep
                step="04"
                title="Entre no acompanhamento"
                description="Quando fizer sentido, ative o plano e siga a trilha completa com treinos, agenda e canal."
              />
            </div>
          </div>
        </section>

        <AICoachPanel
          title="Descubra o melhor curso para o seu momento"
          description="Pergunte qual trilha combina com o seu caso, qual dica ver primeiro ou como organizar um mini plano de estudo para a semana."
          suggestions={[
            {
              label: "Por onde comeco",
              prompt: "Quero saber por onde comecar na plataforma para melhorar obediencia basica com constancia.",
            },
            {
              label: "Curso ideal",
              prompt: "Que tipo de curso faz mais sentido para quem precisa melhorar passeio, foco e rotina em casa?",
            },
            {
              label: "Plano semanal",
              prompt: "Monte um plano de 7 dias usando as trilhas e dicas da plataforma para um cao com energia alta.",
            },
            {
              label: "Aula certa",
              prompt: "Qual aula ou dica devo procurar primeiro para lidar com agitacao antes do passeio?",
            },
          ]}
        />
      </div>
    </div>
  )
}

function MetricCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </div>
  )
}

function JourneyStep({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/15 text-sm font-semibold text-amber-100">
          {step}
        </span>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
    </div>
  )
}

function truncate(value: string | null | undefined, max = 160) {
  if (!value) return ""
  return value.length > max ? `${value.slice(0, max).trim()}...` : value
}
