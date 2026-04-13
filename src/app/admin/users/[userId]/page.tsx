import Link from "next/link"
import { redirect } from "next/navigation"

import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdminRole } from "@/lib/role"

type Props = { params: Promise<{ userId: string }> }

export default async function AdminUserDetailPage({ params }: Props) {
  const { userId } = await params
  const session = await requireUser()
  if (!isAdminRole(session.user.role)) {
    redirect("/dashboard")
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      dogs: true,
      schedules: true,
      modules: {
        orderBy: { name: "asc" },
      },
    },
  })

  if (!user) {
    return (
      <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <p className="text-slate-300">Usuario nao encontrado.</p>
          <Link href="/admin/users" className="text-cyan-300 hover:underline underline-offset-4">
            Voltar
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Usuario</p>
            <h1 className="text-3xl font-semibold">{user.name}</h1>
            <p className="text-slate-300/80">{user.email}</p>
          </div>
          <Link href="/admin/users" className="text-cyan-300 hover:underline underline-offset-4">
            Voltar
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Metric title="Papel" value={user.role} />
          <Metric title="Status" value={user.status} />
          <Metric title="2FA" value={user.twoFactorEnabled ? "ativo" : "off"} />
          <Metric title="Origem" value={user.createdByAdmin ? "Admin" : "Legado"} />
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold">Modulos liberados</h2>
          {user.modules.length === 0 ? <p className="mt-2 text-sm text-slate-300">Nenhum modulo atribuido.</p> : null}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {user.modules.map((module) => (
              <div key={module.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <p className="font-semibold">{module.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan-200/80">{module.key}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{module.description || "Modulo sem descricao."}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          <Metric title="Caes" value={String(user.dogs.length)} />
          <Metric title="Agendamentos" value={String(user.schedules.length)} />
          <Metric title="Email" value={user.emailVerifiedAt ? "confirmado" : "pendente"} />
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold">Caes vinculados</h2>
          {user.dogs.length === 0 ? <p className="mt-2 text-sm text-slate-300">Sem caes cadastrados.</p> : null}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {user.dogs.map((dog) => (
              <div key={dog.id} className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
                <p className="font-semibold">{dog.name}</p>
                <p className="text-xs text-slate-400">Raca: {dog.breed}</p>
                <p className="text-xs text-slate-500">Idade: {dog.age}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-300">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}
