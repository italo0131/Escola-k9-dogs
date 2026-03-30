"use client"

import { FormEvent, ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import VideoField from "@/app/components/VideoField"
import {
  TRAINING_DIFFICULTIES,
  TRAINING_FOCUS_AREAS,
  getTrainingDifficultyLabel,
  getTrainingFocusLabel,
} from "@/lib/platform"

type Dog = { id: string; name: string }

export default function NewTrainingPage() {
  const router = useRouter()
  const [dogs, setDogs] = useState<Dog[]>([])
  const [dogId, setDogId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [focusArea, setFocusArea] = useState("OBEDIENCIA")
  const [difficulty, setDifficulty] = useState("INICIANTE")
  const [durationMinutes, setDurationMinutes] = useState("25")
  const [progress, setProgress] = useState("0")
  const [executedAt, setExecutedAt] = useState("")
  const [trainerNotes, setTrainerNotes] = useState("")
  const [homework, setHomework] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetch("/api/dogs")
      .then((r) => r.json())
      .then((data) => {
        setDogs(data || [])
        if (data?.length) setDogId(data[0].id)
      })
      .catch(() => setMessage("Erro ao carregar caes"))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setMessage("")
    try {
      const res = await fetch("/api/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dogId,
          title,
          description,
          focusArea,
          difficulty,
          durationMinutes: Number(durationMinutes),
          progress: Number(progress),
          executedAt: executedAt || undefined,
          trainerNotes,
          homework,
          videoUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.success === false) {
        setMessage(data.message || "Erro ao salvar treino")
        return
      }
      router.push(`/training/${data.id}`)
    } catch (err) {
      console.error(err)
      setMessage("Erro ao salvar treino")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center text-white">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!dogs.length) {
    return (
      <div className="min-h-[100svh] flex flex-col items-center justify-center gap-4 text-white">
        <p>Nenhum cao disponivel. Cadastre um cao primeiro.</p>
        <button
          onClick={() => router.push("/dogs/new")}
          className="rounded-2xl bg-cyan-500 px-4 py-2 text-white font-semibold"
        >
          Cadastrar cao
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6 rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-2xl">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Treinos</p>
          <h1 className="text-3xl font-semibold">Registrar sessao com metodo</h1>
          <p className="mt-2 text-slate-300">
            Descreva o objetivo, o que funcionou, a tarefa de casa e o material em video para criar consistencia.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Cao">
              <select
                value={dogId}
                onChange={(e) => setDogId(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
              >
                {dogs.map((dog) => (
                  <option key={dog.id} value={dog.id} className="text-black">
                    {dog.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Data e hora da sessao">
              <input
                type="datetime-local"
                value={executedAt}
                onChange={(e) => setExecutedAt(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Titulo">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Obediencia com distracao controlada"
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
              />
            </Field>

            <Field label="Duracao">
              <input
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
              />
            </Field>
          </div>

          <Field label="Descricao">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
              placeholder="Contexto da sessao, comando trabalhado e comportamento observado."
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Foco">
              <select
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
              >
                {TRAINING_FOCUS_AREAS.map((item) => (
                  <option key={item} value={item} className="text-black">
                    {getTrainingFocusLabel(item)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Nivel">
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
              >
                {TRAINING_DIFFICULTIES.map((item) => (
                  <option key={item} value={item} className="text-black">
                    {getTrainingDifficultyLabel(item)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Progresso">
              <input
                type="number"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Notas do condutor">
              <textarea
                value={trainerNotes}
                onChange={(e) => setTrainerNotes(e.target.value)}
                rows={4}
                placeholder="Sinais que funcionaram, reforco usado, ritmo do cao."
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
              />
            </Field>

            <Field label="Tarefa de casa">
              <textarea
                value={homework}
                onChange={(e) => setHomework(e.target.value)}
                rows={4}
                placeholder="O que repetir ate a proxima sessao, quantas vezes e em qual contexto."
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
              />
            </Field>
          </div>

          <VideoField
            label="Video da sessao"
            value={videoUrl}
            onChange={setVideoUrl}
            helperText="Suba um video da pratica ou cole um link para registrar o padrao do treino."
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-2xl border border-white/15 px-4 py-3 text-gray-100 hover:bg-white/10 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-5 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar treino"}
            </button>
          </div>
        </form>

        {message && <p className="text-sm text-cyan-100">{message}</p>}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-gray-200/80">{label}</span>
      {children}
    </label>
  )
}
