import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { isRootRole } from "@/lib/role"
import { redirect } from "next/navigation"

type Props = { params: Promise<{ userId: string }> }

export default async function AdminUserDetailPage({ params }: Props) {
  const { userId } = await params
  const session = await requireUser()
  if (!isRootRole(session.user.role)) {
    redirect("/dashboard")
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      dogs: true,
      schedules: true,
      payments: true,
    },
  })

  if (!user) {
    return (
      <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 py-10 text-white">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="text-gray-300">Usuario nao encontrado.</p>
          <Link href="/admin/users" className="text-cyan-300 hover:underline underline-offset-4">
            Voltar
          </Link>
        </div>
      </div>
    )
  }

  const totalPaid = user.payments
    .filter((p) => (p.status || "").toLowerCase() === "paid")
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 py-10 text-white">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Usuario</p>
            <h1 className="text-3xl font-semibold">{user.name}</h1>
            <p className="text-gray-300/80">{user.email}</p>
          </div>
          <Link href="/admin/users" className="text-cyan-300 hover:underline underline-offset-4">
            Voltar
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-gray-300">Papel</p>
            <p className="text-2xl font-semibold">{user.role}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-gray-300">Status</p>
            <p className="text-2xl font-semibold">{user.status}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-gray-300">2FA</p>
            <p className="text-2xl font-semibold">{user.twoFactorEnabled ? "ativo" : "off"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-gray-300">Caes</p>
            <p className="text-3xl font-semibold">{user.dogs.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-gray-300">Agendamentos</p>
            <p className="text-3xl font-semibold">{user.schedules.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-gray-300">Total pago (centavos)</p>
            <p className="text-2xl font-semibold">{totalPaid}</p>
          </div>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold">Caes</h2>
          {user.dogs.length === 0 && <p className="text-gray-300 text-sm mt-2">Sem caes.</p>}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {user.dogs.map((dog) => (
              <Link
                key={dog.id}
                href={`/admin/dogs/${dog.id}`}
                className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
              >
                <p className="font-semibold">{dog.name}</p>
                <p className="text-xs text-gray-400">Raca: {dog.breed}</p>
                <p className="text-xs text-gray-500">Idade: {dog.age}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold">Agenda</h2>
          {user.schedules.length === 0 && <p className="text-gray-300 text-sm mt-2">Sem agendamentos.</p>}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {user.schedules.map((item) => (
              <Link
                key={item.id}
                href="/calendar"
                className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
              >
                <p className="text-sm font-semibold">
                  {new Date(item.date).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-xs text-gray-400">Status: {item.status}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
