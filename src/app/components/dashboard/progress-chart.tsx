export function ProgressChart({ value }: { value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between text-sm text-gray-300">
        <span>Progresso geral</span>
        <span>{value}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
