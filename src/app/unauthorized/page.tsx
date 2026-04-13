import Link from "next/link"

import { getAccountPlanDescription } from "@/lib/platform"

type UnauthorizedPageProps = {
  searchParams?: Promise<{ from?: string | string[] }> | { from?: string | string[] }
}

function getSingleValue(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] || ""
  return value || ""
}

export default async function UnauthorizedPage({ searchParams }: UnauthorizedPageProps) {
  const resolvedSearchParams = (await searchParams) || {}
  const from = getSingleValue(resolvedSearchParams.from)

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-12 text-white sm:px-6">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30">
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-200/80">Acesso controlado</p>
        <h1 className="mt-4 text-3xl font-semibold md:text-4xl">Essa area ainda nao foi liberada para a sua conta.</h1>
        <p className="mt-4 text-base leading-8 text-slate-300">
          A K9 Training libera modulos de forma manual conforme o acompanhamento contratado. Se voce precisa dessa area,
          fala com a nossa equipe para ajustarmos seu acesso.
        </p>

        {from ? (
          <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-50">
            Origem bloqueada: <strong>{from}</strong>
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/35 px-5 py-4 text-sm text-slate-300">
          {getAccountPlanDescription("FREE")}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5"
          >
            Voltar ao dashboard
          </Link>
          <Link
            href="/"
            className="rounded-2xl border border-white/15 px-5 py-3 text-sm text-slate-100 transition hover:bg-white/10"
          >
            Ir para a pagina inicial
          </Link>
        </div>
      </div>
    </div>
  )
}
