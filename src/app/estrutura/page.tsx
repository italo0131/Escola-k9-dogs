import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function EstruturaPage() {
  const [users, channels, contents, trainings, posts] = await Promise.all([
    prisma.user.count(),
    prisma.forumChannel.count({ where: { isPublic: true } }),
    prisma.channelContent.count({ where: { published: true } }),
    prisma.trainingSession.count(),
    prisma.blogPost.count({ where: { published: true } }),
  ])

  return (
    <div className="bg-k9-aurora-warm min-h-[100svh] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[34px] border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.96),rgba(17,24,39,0.76))] p-8 shadow-2xl shadow-black/25">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Estrutura</p>
          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">A plataforma foi reorganizada para girar em torno de cursos, dicas, pratica e IA.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Em vez de uma colecao de telas soltas, a estrutura agora conta uma historia unica: descobrir, estudar,
            praticar, perguntar e continuar. Esta pagina existe para mostrar essa arquitetura de forma direta.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Usuarios" value={String(users)} description="Contas dentro do ecossistema." />
          <StatCard title="Cursos" value={String(channels)} description="Canais publicos virando trilhas." />
          <StatCard title="Conteudos" value={String(contents)} description="Aulas, guias e checklists publicados." />
          <StatCard title="Treinos" value={String(trainings)} description="Pratica registrada na plataforma." />
          <StatCard title="Posts" value={String(posts)} description="Dicas e eventos abertos no blog." />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-200/80">Camadas do produto</p>
            <div className="mt-5 space-y-4">
              <LayerCard
                title="Descoberta"
                description="Home, cursos, blog e conteudos livres ajudam o usuario a entrar sem se sentir travado."
              />
              <LayerCard
                title="Aprendizado"
                description="Trilhas publicas e bibliotecas privadas organizam o conhecimento em sequencia."
              />
              <LayerCard
                title="Pratica"
                description="Treinos e agenda conectam o estudo com execucao, revisao e constancia."
              />
              <LayerCard
                title="Inteligencia"
                description="A IA conversa com cursos e aulas para responder perguntas e sugerir o proximo passo."
              />
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Jornada ideal</p>
            <div className="mt-5 space-y-4">
              <JourneyCard title="1. Ver valor rapido" description="O usuario bate em uma dica, curso ou pergunta para a IA antes de qualquer burocracia." />
              <JourneyCard title="2. Escolher trilha" description="A navegacao deixa claro que cursos, canais e conteudos fazem parte do mesmo fluxo." />
              <JourneyCard title="3. Entrar em rotina" description="Depois do cadastro, biblioteca, treinos e agenda assumem a experiencia recorrente." />
              <JourneyCard title="4. Permanecer motivado" description="Visual mais forte, progresso mais claro e proximos passos sugeridos ajudam na retencao." />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#22c55e)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
              >
                Ver cursos
              </Link>
              <Link
                href="/"
                className="rounded-2xl border border-white/15 px-5 py-3 text-sm text-gray-100 transition hover:bg-white/10"
              >
                Voltar para a home
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </div>
  )
}

function LayerCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-slate-950/35 p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-300">{description}</p>
    </div>
  )
}

function JourneyCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-slate-950/35 p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-300">{description}</p>
    </div>
  )
}
