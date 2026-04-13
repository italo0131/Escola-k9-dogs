import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-12 text-white sm:px-6">
      <div className="mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30">
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-200/80">Acesso administrado</p>
        <h1 className="mt-4 text-3xl font-semibold md:text-4xl">A K9 Training nao usa mais cadastro publico.</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
          Agora a equipe K9 cria cada conta manualmente, define os modulos liberados e acompanha a jornada do cliente
          de forma mais proxima. Se voce ainda nao recebeu seu acesso, fala com o admin ou com a equipe comercial.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <InfoCard title="Conta criada pela equipe" description="Email, senha temporaria e modulos saem da administracao da K9." />
          <InfoCard title="Acesso por modulo" description="Cada cliente ve apenas o que foi liberado para o seu acompanhamento." />
          <InfoCard title="Forum e conhecimento" description="Blog e racas seguem abertos, enquanto o forum fica para clientes logados." />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5"
          >
            Entrar com minha conta
          </Link>
          <Link
            href="/"
            className="rounded-2xl border border-white/15 px-5 py-3 text-sm text-slate-100 transition hover:bg-white/10"
          >
            Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  )
}

function InfoCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </div>
  )
}
