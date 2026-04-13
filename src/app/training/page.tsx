import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { requireUser, isStaffSession } from "@/lib/auth"
import {
  getChannelContentCategoryLabel,
  getTrainingDifficultyLabel,
  getTrainingFocusLabel,
} from "@/lib/platform"

type Props = {
  searchParams?: Promise<{ dog?: string | string[] }> | { dog?: string | string[] }
}

export default async function TrainingPage({ searchParams }: Props) {
  const session = await requireUser()
  const isStaff = isStaffSession(session)
  const resolvedSearchParams = (await searchParams) || {}
  const dogParam = resolvedSearchParams.dog
  const dogFilter = Array.isArray(dogParam) ? dogParam[0] : dogParam
  const dogWhere = isStaff ? {} : { ownerId: session.user.id }

  const dogs = await prisma.dog.findMany({
    where: dogWhere,
    select: { id: true, name: true, breed: true },
    orderBy: { createdAt: "desc" },
  })

  const validDogId = dogFilter && dogs.some((dog) => dog.id === dogFilter) ? dogFilter : null
  const sessionWhere =
    validDogId
      ? { dogId: validDogId }
      : isStaff
        ? { coachId: session.user.id }
        : { dog: { ownerId: session.user.id } }

  const subscriptions = !isStaff
    ? await prisma.channelSubscription.findMany({
        where: { userId: session.user.id, status: "ACTIVE" },
        select: { channelId: true },
      })
    : []
  const subscribedChannelIds = subscriptions.map((item) => item.channelId)

  const contentWhere = isStaff
    ? { channel: { ownerId: session.user.id } }
    : {
        published: true,
        OR: [
          { accessLevel: "FREE" },
          { channelId: { in: subscribedChannelIds.length ? subscribedChannelIds : ["__none__"] } },
        ],
      }

  const [sessions, library] = await Promise.all([
    prisma.trainingSession.findMany({
      where: sessionWhere,
      orderBy: [{ executedAt: "desc" }, { createdAt: "desc" }],
      include: { dog: true, coach: true },
    }),
    prisma.channelContent.findMany({
      where: contentWhere,
      orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }],
      include: { channel: true, author: true },
      take: 18,
    }),
  ])

  const avgProgress = sessions.length
    ? Math.round(sessions.reduce((sum, item) => sum + item.progress, 0) / sessions.length)
    : 0

  const buckets = [
    {
      key: "DICAS",
      title: "Dicas em video",
      description: "Ajustes rapidos para melhorar a rotina entre uma sessao e outra.",
    },
    {
      key: "TECNICAS",
      title: "Tecnicas guiadas",
      description: "Videos com execucao, correcao e progressao orientadas pelo adestrador.",
    },
    {
      key: "COMPORTAMENTO",
      title: "Leitura de comportamento",
      description: "Sinais do cao para decidir melhor o que repetir, pausar ou evoluir.",
    },
  ]

  const bucketedLibrary = buckets.map((bucket) => ({
    ...bucket,
    items: library.filter((item) => item.videoUrl && item.category === bucket.key).slice(0, 4),
  }))

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200/80">Treinos</p>
              <h1 className="text-3xl font-semibold md:text-4xl">Treino com direcao, video e registro de evolucao.</h1>
              <p className="max-w-2xl text-slate-300">
                Aqui ficam as sessoes registradas, os videos que orientam a pratica e a leitura de comportamento que
                sustenta a evolucao do cao.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dogs"
                className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-medium text-gray-100 transition hover:bg-white/10"
              >
                Ver caes
              </Link>
              <Link
                href="/training/new"
                className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
              >
                Nova sessao
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Metric title="Sessoes" value={String(sessions.length)} description="Historico pratico do que ja foi executado" />
            <Metric title="Progresso medio" value={`${avgProgress}%`} description="Media das sessoes do recorte atual" />
            <Metric title="Videos disponiveis" value={String(library.filter((item) => item.videoUrl).length)} description="Biblioteca entregue pelos canais e pela equipe" />
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/6 p-5 shadow-lg shadow-black/30">
          <label className="text-sm text-gray-200/80">Filtrar por cao</label>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href="/training"
              className={`rounded-2xl px-4 py-2 text-sm ${!validDogId ? "bg-cyan-500 text-white" : "bg-white/10 text-gray-100"}`}
            >
              Todos
            </Link>
            {dogs.map((dog) => (
              <Link
                key={dog.id}
                href={`/training?dog=${dog.id}`}
                className={`rounded-2xl px-4 py-2 text-sm ${validDogId === dog.id ? "bg-cyan-500 text-white" : "bg-white/10 text-gray-100"}`}
              >
                {dog.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          {bucketedLibrary.map((bucket) => (
            <div key={bucket.key} className="rounded-[28px] border border-white/10 bg-white/6 p-5 shadow-lg shadow-black/30">
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">{getChannelContentCategoryLabel(bucket.key)}</p>
              <h2 className="mt-2 text-2xl font-semibold">{bucket.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{bucket.description}</p>
              <div className="mt-4 space-y-4">
                {bucket.items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/conteudos/${item.slug}`}
                    className="block rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-300">{item.channel.name}</p>
                    <p className="mt-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                      Aula em video pronta para assistir.
                    </p>
                  </Link>
                ))}
                {bucket.items.length === 0 && <p className="text-sm text-slate-300">Nenhum video nesta trilha ainda.</p>}
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Execucao registrada</p>
            <h2 className="text-2xl font-semibold">Sessoes registradas</h2>
          </div>

          {sessions.length === 0 && <p className="text-gray-300">Nenhum treino registrado.</p>}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/training/${session.id}`}
                className="rounded-[28px] border border-white/10 bg-white/6 p-5 transition hover:bg-white/10"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {session.focusArea && <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-100">{getTrainingFocusLabel(session.focusArea)}</span>}
                  {session.difficulty && <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{getTrainingDifficultyLabel(session.difficulty)}</span>}
                  {session.durationMinutes && <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{session.durationMinutes} min</span>}
                  {session.videoUrl && <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">Video</span>}
                </div>

                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-semibold">{session.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{session.description}</p>
                  </div>
                  <span className="text-sm text-slate-400">
                    {new Date(session.executedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex justify-between text-sm text-gray-200">
                    <span>Progresso</span>
                    <span>{session.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${session.progress}%` }} />
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
                  <p>Cao: {session.dog?.name || "-"}</p>
                  <p>Responsavel: {session.coach?.name || "Nao informado"}</p>
                  <p className="md:col-span-2">{session.homework ? `Tarefa de casa: ${session.homework}` : "Sem tarefa de casa registrada."}</p>
                </div>
              </Link>
            ))}
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
