import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatMoney, formatServiceMode } from "@/lib/community"

export default async function ContatoPage() {
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
    take: 4,
  })

  return (
    <div className="bg-k9-aurora-warm min-h-[100svh] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.96),rgba(17,24,39,0.76))] p-8 shadow-2xl shadow-black/25">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Contato</p>
          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Fale com a plataforma entrando pelos caminhos reais dela.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Em vez de uma pagina vazia, o contato agora orienta para o que ja funciona: cursos, canais, blog, cadastro
            e descoberta de profissionais. O objetivo e encurtar a distancia entre interesse e acao.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/courses"
              className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#22c55e)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
            >
              Encontrar um curso
            </Link>
            <Link
              href="/register"
              className="rounded-2xl border border-white/15 px-5 py-3 text-sm text-gray-100 transition hover:bg-white/10"
            >
              Criar conta
            </Link>
            <Link
              href="/blog"
              className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-5 py-3 text-sm text-amber-100 transition hover:bg-amber-500/20"
            >
              Ler dicas abertas
            </Link>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <ContactCard
            title="Quero estudar antes de contratar"
            description="Comece pelo catalogo de cursos, pelos conteudos livres e pela IA para entender qual trilha faz mais sentido."
            href="/courses"
            cta="Abrir cursos"
          />
          <ContactCard
            title="Quero entrar na plataforma"
            description="Crie a conta para liberar biblioteca, agenda, treinos, canais e toda a camada de acompanhamento."
            href="/register"
            cta="Criar conta"
          />
          <ContactCard
            title="Quero conhecer o tom da comunidade"
            description="Use o blog para descobrir eventos, casos reais, guias e a linguagem que a plataforma adota."
            href="/blog"
            cta="Ver blog"
          />
        </section>

        <section className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-amber-200/80">Profissionais publicados</p>
              <h2 className="mt-2 text-2xl font-semibold">Quem voce pode conhecer agora</h2>
            </div>
            <Link href="/courses" className="text-sm text-cyan-300 hover:underline underline-offset-4">
              Ver todos
            </Link>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
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
                <p className="mt-4 text-sm text-amber-200">{channel.contents.length} aulas publicadas</p>
              </Link>
            ))}

            {channels.length === 0 && (
              <div className="rounded-[24px] border border-dashed border-white/15 bg-white/5 p-5 text-slate-300 xl:col-span-2">
                Nenhum profissional publicou curso ainda. Quando isso acontecer, os contatos aparecerao aqui.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function ContactCard({
  title,
  description,
  href,
  cta,
}: {
  title: string
  description: string
  href: string
  cta: string
}) {
  return (
    <Link
      href={href}
      className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-white/10"
    >
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
      <p className="mt-5 text-sm font-medium text-cyan-200">{cta}</p>
    </Link>
  )
}
