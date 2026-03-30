import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatDateRange, formatServiceMode } from "@/lib/community"

export default async function AgendamentoPage() {
  const now = new Date()

  const [events, channels] = await Promise.all([
    prisma.blogPost.findMany({
      where: {
        published: true,
        postType: "EVENTO",
        eventStartsAt: { gte: now },
      },
      orderBy: { eventStartsAt: "asc" },
      take: 4,
      include: { author: true },
    }),
    prisma.forumChannel.findMany({
      where: {
        isPublic: true,
        serviceMode: { in: ["ONLINE", "PRESENTIAL", "HYBRID"] },
      },
      include: {
        owner: { select: { name: true, headline: true } },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
  ])

  return (
    <div className="bg-k9-aurora-warm min-h-[100svh] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.96),rgba(17,24,39,0.76))] p-8 shadow-2xl shadow-black/25">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Agendamento</p>
          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">O agendamento agora tem contexto, nao so uma tela vazia.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Esta area explica como o usuario sai do conteudo para o acompanhamento. Hoje o fluxo real passa pela
            descoberta do curso, pelo canal do profissional e pela agenda interna da conta quando o relacionamento
            avanca.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <StepCard
              step="01"
              title="Escolha o profissional"
              description="Comece pelas trilhas, pela forma de atendimento e pelo tom do conteudo."
            />
            <StepCard
              step="02"
              title="Entre no curso ou canal"
              description="Ali o usuario entende a didatica, o contexto e o tipo de acompanhamento oferecido."
            />
            <StepCard
              step="03"
              title="Avance para a agenda"
              description="Depois da entrada na plataforma, a area de calendario assume remarcacoes e rotina de sessao."
            />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-amber-200/80">Eventos e aulas ao vivo</p>
                <h2 className="mt-2 text-2xl font-semibold">Proximas datas abertas</h2>
              </div>
              <Link href="/blog" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                Ver blog
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/blog/${event.slug}`}
                  className="block rounded-[22px] border border-white/10 bg-slate-950/35 p-4 transition hover:bg-white/10"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/80">{event.category}</p>
                  <h3 className="mt-2 text-lg font-semibold">{event.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{formatDateRange(event.eventStartsAt, event.eventEndsAt)}</p>
                  <p className="mt-2 text-sm text-slate-400">{event.author.name}</p>
                </Link>
              ))}

              {events.length === 0 && (
                <div className="rounded-[22px] border border-dashed border-white/15 bg-white/5 p-4 text-slate-300">
                  Ainda nao ha eventos futuros publicados em aberto.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Profissionais com atendimento</p>
                <h2 className="mt-2 text-2xl font-semibold">Quem pode evoluir para sessao</h2>
              </div>
              <Link href="/courses" className="text-sm text-cyan-300 hover:underline underline-offset-4">
                Ver cursos
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {channels.map((channel) => (
                <Link
                  key={channel.id}
                  href={`/courses/${channel.slug}`}
                  className="block rounded-[22px] border border-white/10 bg-slate-950/35 p-4 transition hover:bg-white/10"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-amber-200/80">{formatServiceMode(channel.serviceMode)}</p>
                  <h3 className="mt-2 text-lg font-semibold">{channel.name}</h3>
                  <p className="mt-2 text-sm text-slate-300">{channel.owner.name}</p>
                  {channel.owner.headline && <p className="mt-2 text-sm text-slate-400">{channel.owner.headline}</p>}
                </Link>
              ))}

              {channels.length === 0 && (
                <div className="rounded-[22px] border border-dashed border-white/15 bg-white/5 p-4 text-slate-300">
                  Nenhum profissional com atendimento publicado ainda.
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/courses"
            className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#22c55e)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
          >
            Explorar cursos
          </Link>
          <Link
            href="/register"
            className="rounded-2xl border border-white/15 px-5 py-3 text-sm text-gray-100 transition hover:bg-white/10"
          >
            Criar conta para usar a agenda
          </Link>
        </div>
      </div>
    </div>
  )
}

function StepCard({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-amber-200/80">{step}</p>
      <h2 className="mt-3 text-xl font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
    </div>
  )
}
