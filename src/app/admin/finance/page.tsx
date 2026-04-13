import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { isRootRole } from "@/lib/role"
import { redirect } from "next/navigation"

type AdminFinanceSearchParams = {
  event?: string | string[]
}

type Props = {
  searchParams?: Promise<AdminFinanceSearchParams> | AdminFinanceSearchParams
}

async function resolveSearchParams(input?: Promise<AdminFinanceSearchParams> | AdminFinanceSearchParams) {
  return (await input) || {}
}

function getSingleParam(value?: string | string[]) {
  if (Array.isArray(value)) return String(value[0] || "")
  return String(value || "")
}

export default async function AdminFinancePage({ searchParams }: Props) {
  const session = await requireUser()
  if (!isRootRole(session.user.role)) {
    redirect("/dashboard")
  }

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const totalPaid = payments
    .filter((p) => (p.status || "").toLowerCase() === "paid")
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const resolvedSearchParams = await resolveSearchParams(searchParams)
  const selectedEventId = getSingleParam(resolvedSearchParams.event)
  const selected = selectedEventId ? payments.find((p) => p.id === selectedEventId) : null

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Financeiro</h1>
          <p className="text-sm text-gray-300">Eventos reais recebidos do Stripe.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat title="Eventos" value={payments.length} href="/admin/finance" />
          <Stat title="Total pago (centavos)" value={totalPaid} href="/admin/finance" />
          <Stat title="Ultimos 50 eventos" value={payments.length} href="/admin/finance" />
        </div>

        {selected && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-300">Detalhes do evento</p>
                <p className="text-lg font-semibold">{selected.type}</p>
              </div>
              <Link href="/admin/finance" className="text-cyan-300 text-sm underline-offset-4 hover:underline">
                Fechar
              </Link>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-gray-300 sm:grid-cols-2">
              <div>Status: {selected.status || "-"}</div>
              <div>Valor: {selected.amount ?? "-"}</div>
              <div>Moeda: {selected.currency || "-"}</div>
              <div>Cliente: {selected.customerEmail || selected.customerId || "-"}</div>
            </div>
            {selected.raw && (
              <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-black/30 p-3 text-xs text-gray-200">
                {selected.raw}
              </pre>
            )}
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="min-w-full text-sm">
            <thead className="text-gray-300">
              <tr className="border-b border-white/10">
                <th className="p-3 text-left">Tipo</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Valor</th>
                <th className="p-3 text-left">Moeda</th>
                <th className="p-3 text-left">Cliente</th>
                <th className="p-3 text-left">Data</th>
                <th className="p-3 text-left">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-white/5">
                  <td className="p-3 text-xs text-gray-200">{payment.type}</td>
                  <td className="p-3 text-xs text-gray-300">{payment.status || "-"}</td>
                  <td className="p-3 text-xs text-gray-300">{payment.amount ?? "-"}</td>
                  <td className="p-3 text-xs text-gray-300">{payment.currency || "-"}</td>
                  <td className="p-3 text-xs text-gray-300">{payment.customerEmail || payment.customerId || "-"}</td>
                  <td className="p-3 text-xs text-gray-300">
                    {payment.createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </td>
                  <td className="p-3 text-xs">
                    <Link
                      href={`/admin/finance?event=${payment.id}`}
                      className="rounded-lg border border-white/10 px-3 py-2 text-white hover:bg-white/10"
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

function Stat({ title, value, href }: { title: string; value: number; href?: string }) {
  const content = (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-gray-300">{title}</p>
      <p className="text-3xl font-semibold">{value}</p>
    </div>
  )
  if (!href) return content
  return (
    <Link href={href} className="block transition hover:-translate-y-0.5">
      {content}
    </Link>
  )
}
