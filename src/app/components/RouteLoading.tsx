type Props = {
  eyebrow?: string
  title?: string
  accent?: "cyan" | "amber" | "emerald"
}

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/10 ${className}`} />
}

export default function RouteLoading({
  eyebrow = "Carregando experiencia",
  title = "Estamos preparando uma leitura mais fluida para voce.",
  accent = "cyan",
}: Props) {
  const accentClass =
    accent === "amber"
      ? "text-amber-200/80"
      : accent === "emerald"
        ? "text-emerald-200/80"
        : "text-cyan-200/80"

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_26%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-2xl">
          <p className={`text-sm uppercase tracking-[0.22em] ${accentClass}`}>{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold md:text-4xl">{title}</h1>
          <div className="mt-5 max-w-2xl space-y-3">
            <Pulse className="h-4 w-full" />
            <Pulse className="h-4 w-11/12" />
            <Pulse className="h-4 w-8/12" />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <Pulse className="h-3 w-28" />
                <Pulse className="mt-4 h-8 w-20" />
                <Pulse className="mt-3 h-3 w-full" />
                <Pulse className="mt-2 h-3 w-4/5" />
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/25">
            <Pulse className="h-4 w-36" />
            <Pulse className="mt-4 h-8 w-3/4" />
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-[24px] border border-white/10 bg-slate-950/35 p-5">
                  <Pulse className="h-3 w-24" />
                  <Pulse className="mt-4 h-6 w-3/4" />
                  <Pulse className="mt-4 h-3 w-full" />
                  <Pulse className="mt-2 h-3 w-5/6" />
                  <Pulse className="mt-2 h-3 w-2/3" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/25">
            <Pulse className="h-4 w-32" />
            <Pulse className="mt-4 h-8 w-2/3" />
            <div className="mt-6 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-3">
                    <Pulse className="h-10 w-10 rounded-xl" />
                    <Pulse className="h-5 w-40" />
                  </div>
                  <Pulse className="mt-4 h-3 w-full" />
                  <Pulse className="mt-2 h-3 w-11/12" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
