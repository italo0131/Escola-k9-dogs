import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatChannelLocation, formatMoney, formatServiceMode } from "@/lib/community"

export default async function ServicosPage() {
  const channels = await prisma.forumChannel.findMany({
    where: { isPublic: true },
    include: {
      owner: { select: { name: true, headline: true } },
      contents: {
        where: { published: true },
        select: { id: true },
      },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 6,
  })

  const serviceModes = [
    {
      title: "Cursos e comunidade",
      mode: "COMMUNITY",
      description: "Entrada por conteudo, mural e trilhas abertas para descoberta.",
    },
    {
      title: "Acompanhamento online",
      mode: "ONLINE",
      description: "Boa opcao para rotina guiada, revisao e acompanhamento remoto.",
    },
    {
      title: "Atendimento presencial",
      mode: "PRESENTIAL",
      description: "Indicado quando o caso pede observacao de ambiente e manejo ao vivo.",
    },
    {
      title: "Modelo hibrido",
      mode: "HYBRID",
      description: "Mistura estudo, suporte remoto e encontros presenciais quando necessario.",
    },
  ]

  return (
    <div className="bg-k9-aurora-warm min-h-[100svh] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.96),rgba(17,24,39,0.76))] p-8 shadow-2xl shadow-black/25">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Servicos</p>
          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">A plataforma agora explica servicos de forma clara, sem tela vazia.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Em vez de prometer algo abstrato, esta pagina mostra como os cursos, os canais e os formatos de atendimento
            se conectam. O usuario entende o que pode consumir livremente e quando vale entrar em acompanhamento.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/courses"
              className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#22c55e)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
            >
              Ver cursos
            </Link>
            <Link
              href="/agendamento"
              className="rounded-2xl border border-white/15 px-5 py-3 text-sm text-gray-100 transition hover:bg-white/10"
            >
              Entender o agendamento
            </Link>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {serviceModes.map((item) => {
            const total = channels.filter((channel) => channel.serviceMode === item.mode).length

            return (
              <div key={item.mode} className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-200/80">{item.title}</p>
                <p className="mt-4 text-4xl font-semibold">{total}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
              </div>
            )
          })}
        </section>

        <section className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Quem entrega servico hoje</p>
              <h2 className="mt-2 text-2xl font-semibold">Canais e profissionais publicados</h2>
            </div>
            <Link href="/courses" className="text-sm text-cyan-300 hover:underline underline-offset-4">
              Abrir catalogo completo
            </Link>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {channels.map((channel) => (
              <Link
                key={channel.id}
                href={`/courses/${channel.slug}`}
                className="rounded-[24px] border border-white/10 bg-slate-950/35 p-5 transition hover:bg-white/10"
              >
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-100">{formatServiceMode(channel.serviceMode)}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{formatMoney(channel.subscriptionPrice) || "Sem assinatura"}</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold">{channel.name}</h3>
                <p className="mt-2 text-sm text-slate-400">
                  {channel.owner.name}
                  {channel.owner.headline ? ` - ${channel.owner.headline}` : ""}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{channel.description}</p>
                <p className="mt-4 text-sm text-amber-200">{channel.contents.length} aulas - {formatChannelLocation(channel.city, channel.state)}</p>
              </Link>
            ))}

            {channels.length === 0 && (
              <div className="rounded-[24px] border border-dashed border-white/15 bg-white/5 p-5 text-slate-300 xl:col-span-3">
                Nenhum servico publicado ainda. Assim que os canais forem criados, eles aparecerao aqui automaticamente.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
