import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { isRootRole } from "@/lib/role"
import { redirect } from "next/navigation"

export default async function AdminCompaniesPage() {
  const session = await requireUser()
  if (!isRootRole(session.user.role)) {
    redirect("/dashboard")
  }

  const companies = await prisma.company.findMany({
    include: { users: true, dogs: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 sm:px-6 py-10 text-white">
      <div className="max-w-6xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Empresas</h1>
          <p className="text-sm text-gray-300">Visao consolidada por empresa.</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="min-w-full text-sm">
            <thead className="text-gray-300">
              <tr className="border-b border-white/10">
                <th className="p-3 text-left">Empresa</th>
                <th className="p-3 text-left">Usuarios</th>
                <th className="p-3 text-left">Caes</th>
                <th className="p-3 text-left">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-b border-white/5">
                  <td className="p-3 font-semibold">{company.name}</td>
                  <td className="p-3">{company.users.length}</td>
                  <td className="p-3">{company.dogs.length}</td>
                  <td className="p-3">
                    <Link
                      href={`/admin/companies/${company.id}`}
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white hover:bg-white/10"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
