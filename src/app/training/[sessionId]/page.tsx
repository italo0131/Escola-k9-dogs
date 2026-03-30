import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireUser, isStaffSession } from "@/lib/auth"
import VideoEmbed from "@/app/components/VideoEmbed"
import { getTrainingDifficultyLabel, getTrainingFocusLabel } from "@/lib/platform"

export default async function TrainingDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await requireUser()
  const isStaff = isStaffSession(session)

  const training = await prisma.trainingSession.findUnique({
    where: { id: sessionId },
    include: { dog: { include: { owner: true } }, coach: true },
  })

  if (!training || (!isStaff && training.dog.ownerId !== session.user.id)) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center text-white">
        <p>Sessao nao encontrada.</p>
      </div>
    )
  }

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.1),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link href="/training" className="text-cyan-300 hover:underline underline-offset-4">
          Voltar para treinos
        </Link>

        <section className="rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-2xl">
          <div className="flex flex-wrap gap-2 text-xs">
            {training.focusArea && (
              <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-100">{getTrainingFocusLabel(training.focusArea)}</span>
            )}
            {training.difficulty && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{getTrainingDifficultyLabel(training.difficulty)}</span>
            )}
            {training.durationMinutes && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-gray-100">{training.durationMinutes} min</span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-semibold md:text-4xl">{training.title}</h1>
          <p className="mt-3 text-slate-300">{training.description || "Sessao registrada sem descricao detalhada."}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <MetaCard title="Cao" value={training.dog.name} />
            <MetaCard title="Tutor" value={training.dog.owner.name} />
            <MetaCard title="Responsavel" value={training.coach?.name || "Nao informado"} />
            <MetaCard
              title="Data"
              value={new Date(training.executedAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-2 flex justify-between text-sm text-gray-200">
              <span>Progresso da sessao</span>
              <span>{training.progress}%</span>
            </div>
            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                style={{ width: `${training.progress}%` }}
              />
            </div>
          </div>
        </section>

        <VideoEmbed url={training.videoUrl} title={training.title} />

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Notas do treino</p>
            <p className="mt-4 whitespace-pre-wrap text-slate-100 leading-7">
              {training.trainerNotes || "Nenhuma nota registrada para esta sessao."}
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-lg shadow-black/30">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Tarefa de casa</p>
            <p className="mt-4 whitespace-pre-wrap text-slate-100 leading-7">
              {training.homework || "Nenhuma tarefa de casa registrada."}
            </p>
          </div>
        </section>

        <section className="flex flex-wrap gap-3">
          <Link
            href={`/training?dog=${training.dogId}`}
            className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-medium text-gray-100 transition hover:bg-white/10"
          >
            Ver historico deste cao
          </Link>
          <Link
            href="/training/new"
            className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
          >
            Registrar nova sessao
          </Link>
        </section>
      </div>
    </div>
  )
}

function MetaCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-2 text-sm text-white">{value}</p>
    </div>
  )
}
