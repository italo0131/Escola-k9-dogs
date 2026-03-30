import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { isRootRole } from "@/lib/role"
import { redirect } from "next/navigation"

type Props = { params: Promise<{ dogId: string }> }

export default async function AdminDogDetailPage({ params }: Props) {
  const { dogId } = await params
  const session = await requireUser()
  if (!isRootRole(session.user.role)) {
    redirect("/dashboard")
  }

  const dog = await prisma.dog.findUnique({
    where: { id: dogId },
    include: {
      owner: true,
      trainings: true,
      company: true,
    },
  })

  if (!dog) {
    return (
      <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 py-10 text-white">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="text-gray-300">Cao nao encontrado.</p>
          <Link href="/admin/dogs" className="text-cyan-300 hover:underline underline-offset-4">
            Voltar
          </Link>
        </div>
      </div>
    )
  }

  const avgProgress =
    dog.trainings.length > 0
      ? Math.round(dog.trainings.reduce((sum, t) => sum + t.progress, 0) / dog.trainings.length)
      : 0

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 py-10 text-white">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Cao</p>
            <h1 className="text-3xl font-semibold">{dog.name}</h1>
            <p className="text-gray-300/80">Raca: {dog.breed} • Idade: {dog.age}</p>
          </div>
          <Link href="/admin/dogs" className="text-cyan-300 hover:underline underline-offset-4">
            Voltar
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-gray-300">Tutor</p>
            <p className="text-lg font-semibold">{dog.owner?.name || "-"}</p>
            <p className="text-xs text-gray-400">{dog.owner?.email || ""}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-gray-300">Empresa</p>
            <p className="text-lg font-semibold">{dog.company?.name || "-"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-gray-300">Progresso medio</p>
            <p className="text-3xl font-semibold">{avgProgress}%</p>
          </div>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold">Treinos</h2>
          {dog.trainings.length === 0 && <p className="text-gray-300 text-sm mt-2">Sem treinos.</p>}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dog.trainings.map((training) => (
              <Link
                key={training.id}
                href={`/training/${training.id}`}
                className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
              >
                <p className="font-semibold">{training.title}</p>
                <p className="text-xs text-gray-400">{training.description}</p>
                <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                    style={{ width: `${training.progress}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
