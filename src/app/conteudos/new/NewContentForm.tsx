"use client"

import { FormEvent, ReactNode, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import VideoField from "@/app/components/VideoField"
import ImageField from "@/app/components/ImageField"
import {
  CHANNEL_CONTENT_CATEGORIES,
  CHANNEL_CONTENT_ACCESS,
  CHANNEL_CONTENT_TYPES,
  TRAINING_DIFFICULTIES,
  getChannelContentAccessLabel,
  getChannelContentCategoryLabel,
  getChannelContentTypeLabel,
  getTrainingDifficultyLabel,
} from "@/lib/platform"

type ChannelOption = {
  id: string
  slug: string
  name: string
  category: string
}

type Props = {
  channels: ChannelOption[]
  initialChannelSlug?: string
}

export default function NewContentForm({ channels, initialChannelSlug }: Props) {
  const router = useRouter()
  const initialChannelId = useMemo(
    () => channels.find((channel) => channel.slug === initialChannelSlug)?.id || channels[0]?.id || "",
    [channels, initialChannelSlug]
  )

  const [channelId, setChannelId] = useState(initialChannelId)
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [objective, setObjective] = useState("")
  const [category, setCategory] = useState<(typeof CHANNEL_CONTENT_CATEGORIES)[number]>("TRILHA")
  const [contentType, setContentType] = useState<(typeof CHANNEL_CONTENT_TYPES)[number]>("LESSON")
  const [accessLevel, setAccessLevel] = useState<(typeof CHANNEL_CONTENT_ACCESS)[number]>("SUBSCRIBER")
  const [difficulty, setDifficulty] = useState<(typeof TRAINING_DIFFICULTIES)[number]>("INICIANTE")
  const [durationMinutes, setDurationMinutes] = useState("20")
  const [orderIndex, setOrderIndex] = useState("")
  const [body, setBody] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage("")

    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          title,
          summary,
          objective,
          category,
          contentType,
          accessLevel,
          difficulty,
          durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
          orderIndex: orderIndex ? Number(orderIndex) : undefined,
          body,
          coverImageUrl,
          videoUrl,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data?.success) {
        setMessage(data?.message || "Nao foi possivel publicar o conteudo")
        return
      }

      router.push(`/conteudos/${data.content.slug}`)
    } catch (error) {
      console.error(error)
      setMessage("Erro ao publicar conteudo")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-2xl">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Canal">
            <select
              value={channelId}
              onChange={(event) => setChannelId(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
            >
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id} className="text-black">
                  {channel.name} • {channel.category}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Categoria">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as (typeof CHANNEL_CONTENT_CATEGORIES)[number])}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
            >
              {CHANNEL_CONTENT_CATEGORIES.map((item) => (
                <option key={item} value={item} className="text-black">
                  {getChannelContentCategoryLabel(item)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Titulo">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Resumo">
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
            />
          </Field>
          <Field label="Objetivo da aula">
            <textarea
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Formato">
            <select
              value={contentType}
              onChange={(event) => setContentType(event.target.value as (typeof CHANNEL_CONTENT_TYPES)[number])}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
            >
              {CHANNEL_CONTENT_TYPES.map((type) => (
                <option key={type} value={type} className="text-black">
                  {getChannelContentTypeLabel(type)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Acesso">
            <select
              value={accessLevel}
              onChange={(event) => setAccessLevel(event.target.value as (typeof CHANNEL_CONTENT_ACCESS)[number])}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
            >
              {CHANNEL_CONTENT_ACCESS.map((access) => (
                <option key={access} value={access} className="text-black">
                  {getChannelContentAccessLabel(access)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Nivel">
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as (typeof TRAINING_DIFFICULTIES)[number])}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
            >
              {TRAINING_DIFFICULTIES.map((item) => (
                <option key={item} value={item} className="text-black">
                  {getTrainingDifficultyLabel(item)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Duracao">
            <input
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Ordem na trilha">
            <input
              type="number"
              min={1}
              value={orderIndex}
              onChange={(event) => setOrderIndex(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
            />
          </Field>
          <Field label="Leitura da entrega">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              Use <strong className="text-white">Dicas</strong> para orientacoes curtas,
              <strong className="text-white"> Tecnicas</strong> para execucao,
              <strong className="text-white"> Comportamento</strong> para leitura do cao e
              <strong className="text-white"> Trilha</strong> para aulas centrais da assinatura.
            </div>
          </Field>
        </div>

        <Field label="Conteudo completo">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={10}
            required
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
          />
        </Field>

        <ImageField
          label="Imagem da aula"
          value={coverImageUrl}
          onChange={setCoverImageUrl}
          helperText="Use a capa para transformar a biblioteca do canal em uma experiencia mais visual."
        />

        <VideoField
          label="Video da aula"
          value={videoUrl}
          onChange={setVideoUrl}
          helperText="Aceita upload local ou link externo. Use para aula completa, correcao pratica ou replay."
        />

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-medium text-gray-100 transition hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Publicando..." : "Publicar conteudo"}
          </button>
        </div>
      </form>

      {message && <p className="mt-4 text-sm text-cyan-100">{message}</p>}
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
