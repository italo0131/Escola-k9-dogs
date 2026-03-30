import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { requireUser, isStaffSession } from "@/lib/auth"
import {
  formatDogAthleteSummary,
  formatDogFeedingSummary,
  formatDogHealthSummary,
  getActivityProfileLabel,
} from "@/lib/dog-profile"
import { getDogLimit, getRemainingDogSlots, hasPremiumPlatformAccess } from "@/lib/platform"

export default async function DogsPage() {
  const session = await requireUser()
  const where = isStaffSession(session) ? {} : { ownerId: session.user.id }

  const dogs = await prisma.dog.findMany({
    where,
    include: { owner: true, trainings: true },
    orderBy: { createdAt: "desc" },
  })

  const vaccinatedCount = dogs.filter((dog) => dog.vaccinated).length
  const nutritionReadyCount = dogs.filter((dog) => dog.foodName || dog.portionSize || dog.feedingTimes).length
  const athleteCount = dogs.filter((dog) => dog.activityProfile === "ATHLETE").length
  const hasPremium = hasPremiumPlatformAccess(session.user.plan, session.user.role, session.user.planStatus)
  const dogLimit = getDogLimit(session.user.plan, session.user.role, session.user.planStatus)
  const remainingSlots = getRemainingDogSlots(dogs.length, session.user.plan, session.user.role, session.user.planStatus)

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Caes</p>
            <h1 className="text-3xl font-semibold">Conte um pouco sobre seus companheiros e acompanhe o que importa no dia a dia.</h1>
            <p className="text-gray-300/80">
              Aqui voce acompanha saude, rotina, treino e contexto de raca em um so lugar, com espaco para respeitar o ritmo de cada cao.
            </p>
          </div>
          <Link
            href="/dogs/new"
            className="rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5"
          >
            Cadastrar cao
          </Link>
        </div>

        {!hasPremium && (
          <div className="rounded-[28px] border border-amber-300/20 bg-amber-500/10 p-5 text-amber-50">
            Seu plano Free permite <strong>ate {dogLimit} caes</strong>. Hoje sua conta usa {dogs.length}/{dogLimit}
            {remainingSlots > 0 ? ` e ainda tem ${remainingSlots} vaga${remainingSlots === 1 ? "" : "s"}.` : "."}
            <Link href="/billing" className="ml-2 underline underline-offset-4">
              Ativar plano pago para liberar tudo
            </Link>
          </div>
        )}

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Aprendizado</p>
              <h2 className="text-2xl font-semibold">Encontre a raca que combina com sua rotina, sem achismo.</h2>
              <p className="mt-2 text-sm text-slate-300">
                A biblioteca de racas cruza dados reais, contexto de vida e apoio com IA para orientar sua escolha com mais clareza.
              </p>
            </div>
            <Link
              href="/racas"
              className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-100"
            >
              Abrir area de racas
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <SummaryCard title="Perfis ativos" value={String(dogs.length)} desc="Caes com ficha cadastrada" />
          <SummaryCard title="Vacinas em dia" value={String(vaccinatedCount)} desc="Base rapida de saude" />
          <SummaryCard title="Nutricao detalhada" value={String(nutritionReadyCount)} desc="Perfis com rotina alimentar" />
          <SummaryCard title="Atletas" value={String(athleteCount)} desc="Caes com perfil esportivo" />
        </div>

        {dogs.length === 0 && (
          <div className="rounded-[28px] border border-dashed border-white/15 bg-white/5 p-6 text-slate-300">
            <p className="text-lg font-semibold text-white">Ainda nao ha caes cadastrados.</p>
            <p className="mt-2 leading-7">Que tal adicionar o primeiro agora? Assim a plataforma consegue personalizar melhor treinos, leituras e proximos passos para voce.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {dogs.map((dog) => {
            const progress =
              dog.trainings.length > 0
                ? Math.round(dog.trainings.reduce((s, t) => s + t.progress, 0) / dog.trainings.length)
                : 0

            return (
              <article
                key={dog.id}
                className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.92),rgba(15,23,42,0.74)),radial-gradient(circle_at_top_right,rgba(34,197,94,0.18),transparent_30%)] shadow-lg shadow-black/30"
              >
                {dog.breedReferenceImageUrl && (
                  <img src={dog.breedReferenceImageUrl} alt={dog.breed} className="h-44 w-full object-cover" />
                )}

                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{dog.name}</h3>
                      <p className="text-xs text-cyan-200/80">{dog.breed}</p>
                      {(dog.breedGroup || dog.breedOrigin) && (
                        <p className="mt-1 text-xs text-slate-400">
                          {[dog.breedGroup, dog.breedOrigin].filter(Boolean).join(" • ")}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                        #{dog.id.slice(0, 6)}
                      </span>
                      <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs text-cyan-100">
                        {getActivityProfileLabel(dog.activityProfile)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-100">Idade {dog.age} anos</span>
                    {dog.size && <span className="rounded-full bg-white/10 px-3 py-1 text-gray-200">{dog.size}</span>}
                    {dog.weightKg ? <span className="rounded-full bg-white/10 px-3 py-1 text-gray-200">{dog.weightKg} kg</span> : null}
                    {dog.energyLevel && <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-100">Energia {dog.energyLevel.toLowerCase()}</span>}
                    {dog.athleteClearance && <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-100">Liberado para esporte</span>}
                  </div>

                  {dog.owner && <p className="text-sm text-gray-400">Tutor: {dog.owner.name}</p>}

                  <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Saude</p>
                    <p className="text-sm text-gray-200">{formatDogHealthSummary(dog)}</p>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Alimentacao</p>
                    <p className="text-sm text-gray-200">{formatDogFeedingSummary(dog)}</p>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Performance</p>
                    <p className="text-sm text-gray-200">{formatDogAthleteSummary(dog)}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Treinos: {dog.trainings.length}</p>
                    <div className="flex justify-between text-sm text-gray-200">
                      <span>Progresso</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/training?dog=${dog.id}`}
                      className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5"
                    >
                      Abrir treinos
                    </Link>
                    <Link
                      href={`/dogs/${dog.id}/edit`}
                      className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-medium text-gray-100 transition hover:bg-white/10"
                    >
                      Editar dados
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ title, value, desc }: { title: string; value: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30">
      <p className="text-sm text-gray-300">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-gray-400">{desc}</p>
    </div>
  )
}
