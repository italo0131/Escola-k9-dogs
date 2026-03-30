"use client"

import { FormEvent, useState } from "react"

export function TrainingForm({ onSubmit }: { onSubmit: (payload: { title: string; description: string; progress: number }) => void }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [progress, setProgress] = useState(0)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ title, description, progress })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
        placeholder="Titulo"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
        placeholder="Descricao"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        type="number"
        className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
        placeholder="Progresso"
        value={progress}
        onChange={(e) => setProgress(Number(e.target.value))}
      />
      <button className="rounded-lg bg-cyan-500 px-4 py-2 text-white font-semibold">Salvar treino</button>
    </form>
  )
}
