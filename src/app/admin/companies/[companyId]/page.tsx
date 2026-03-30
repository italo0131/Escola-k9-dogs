import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { isRootRole } from "@/lib/role"
import { redirect } from "next/navigation"

type Props = { params: Promise<{ companyId: string }> }

export default async function AdminCompanyDetailPage({ params }: Props) {
  const { companyId } = await params
  const session = await requireUser()
  if (!isRootRole(session.user.role)) {
    redirect("/dashboard")
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      users: true,
      dogs: { include: { owner: true } },
    },
  })

  if (!company) {
    return (
      <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 py-10 text-white">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="text-gray-300">Empresa nao encontrada.</p>
          <Link href="/admin/companies" className="text-cyan-300 hover:underline underline-offset-4">
            Voltar
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 py-10 text-white">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Empresa</p>
            <h1 className="text-3xl font-semibold">{company.name}</h1>
            <p className="text-gray-300/80">Resumo de usuarios e caes vinculados.</p>
          </div>
          <Link href="/admin/companies" className="text-cyan-300 hover:underline underline-offset-4">
            Voltar
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-gray-300">Usuarios</p>
            <p className="text-3xl font-semibold">{company.users.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-gray-300">Caes</p>
            <p className="text-3xl font-semibold">{company.dogs.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-gray-300">Criada em</p>
            <p className="text-lg font-semibold">
              {company.createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold">Usuarios</h2>
          {company.users.length === 0 && <p className="text-gray-300 text-sm mt-2">Sem usuarios.</p>}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {company.users.map((user) => (
              <Link
                key={user.id}
                href={`/admin/users/${user.id}`}
                className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
              >
                <p className="font-semibold">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
                <p className="text-xs text-gray-500">Papel: {user.role}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold">Caes</h2>
          {company.dogs.length === 0 && <p className="text-gray-300 text-sm mt-2">Sem caes.</p>}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {company.dogs.map((dog) => (
              <Link
                key={dog.id}
                href={`/admin/dogs/${dog.id}`}
                className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
              >
                <p className="font-semibold">{dog.name}</p>
                <p className="text-xs text-gray-400">Raca: {dog.breed}</p>
                <p className="text-xs text-gray-500">Tutor: {dog.owner?.name || "-"}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
