import Link from "next/link"

export default function BillingPage() {
  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_22%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-12 text-white sm:px-6">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30">
        <p className="text-sm uppercase tracking-[0.24em] text-emerald-200/80">Modelo comercial</p>
        <h1 className="mt-4 text-3xl font-semibold md:text-4xl">O acesso agora e administrado pela equipe K9.</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
          A plataforma deixou de usar assinatura publica para clientes. Pagamentos e contratos sao tratados offline,
          e a equipe libera os modulos manualmente em cada conta.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card title="Sem checkout publico" description="Os fluxos de assinatura online foram desativados neste ambiente." />
          <Card title="Acesso por modulo" description="O cliente enxerga apenas cursos, treinos e agenda liberados pela K9." />
          <Card title="Suporte centralizado" description="Qualquer ajuste comercial ou de acesso passa pelo admin da plataforma." />
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
            Pagina inicial
          </Link>
        </div>
      </div>
    </div>
  )
}

function Card({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </div>
  )
}
