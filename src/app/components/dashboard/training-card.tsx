import { TrainingSession } from "@/app/types/training"

export function TrainingCard({ training }: { training: TrainingSession }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-lg font-semibold">{training.title}</p>
      <p className="text-sm text-gray-300">Progresso: {training.progress}%</p>
      <p className="text-xs text-gray-400">{training.description}</p>
    </div>
  )
}
