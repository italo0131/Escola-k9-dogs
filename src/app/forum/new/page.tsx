"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import VideoField from "@/app/components/VideoField"
import ImageField from "@/app/components/ImageField"
import { FORUM_POST_TYPES, getForumPostTypeLabel } from "@/lib/platform"
import { isStaffRole } from "@/lib/role"

type Channel = {
  id: string
  name: string
  slug: string
  category: string
}

export default function NewThreadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data } = useSession()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [channelId, setChannelId] = useState("")
  const [postType, setPostType] = useState("POST")
  const [imageUrl, setImageUrl] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [eventStartsAt, setEventStartsAt] = useState("")
  const [eventEndsAt, setEventEndsAt] = useState("")
  const [eventLocation, setEventLocation] = useState("")
  const [eventCity, setEventCity] = useState("")
  const [eventState, setEventState] = useState("")
  const [channels, setChannels] = useState<Channel[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const canCreateEvent = isStaffRole(data?.user?.role)
  const postTypes = useMemo(
    () => FORUM_POST_TYPES.filter((item) => canCreateEvent || item !== "EVENTO"),
    [canCreateEvent]
  )

  useEffect(() => {
    async function loadChannels() {
      try {
        const res = await fetch("/api/forum/channels")
        const data = await res.json()
        setChannels(data || [])

        const slugFromQuery = searchParams.get("channel")
        if (slugFromQuery && Array.isArray(data)) {
          const selected = data.find((channel: Channel) => channel.slug === slugFromQuery)
          if (selected) {
            setChannelId(selected.id)
          }
        }
      } catch (error) {
        console.error(error)
      }
    }
    loadChannels()
  }, [searchParams])

  const isEvent = postType === "EVENTO"

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setMessage("")
    try {
      const res = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          channelId,
          postType,
          imageUrl,
          videoUrl,
          eventStartsAt: isEvent ? eventStartsAt : undefined,
          eventEndsAt: isEvent ? eventEndsAt : undefined,
          eventLocation: isEvent ? eventLocation : undefined,
          eventCity: isEvent ? eventCity : undefined,
          eventState: isEvent ? eventState : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.success === false) {
        setMessage(data.message || "Erro ao criar post")
        return
      }
      router.push(`/forum/${data.thread.id}`)
    } catch (err) {
      console.error(err)
      setMessage("Erro ao criar post")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6 rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-2xl">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Forum</p>
          <h1 className="text-3xl font-semibold">Novo post da comunidade</h1>
          <p className="text-gray-300/80">Publique no mural geral ou dentro de um canal que voce acompanha.</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-200/80">Canal</label>
              <select
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
              >
                <option value="" className="text-black">
                  Comunidade geral
                </option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id} className="text-black">
                    {channel.name} • {channel.category}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-200/80">Tipo de post</label>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
              >
                {postTypes.map((item) => (
                  <option key={item} value={item} className="text-black">
                    {getForumPostTypeLabel(item)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-200/80">Titulo</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-200/80">Conteudo</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              required
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
            />
          </div>

          {isEvent && (
            <div className="grid gap-4 rounded-[28px] border border-emerald-300/15 bg-emerald-500/10 p-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-emerald-50">Inicio</label>
                <input
                  type="datetime-local"
                  value={eventStartsAt}
                  onChange={(e) => setEventStartsAt(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-emerald-50">Fim</label>
                <input
                  type="datetime-local"
                  value={eventEndsAt}
                  onChange={(e) => setEventEndsAt(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm text-emerald-50">Local ou link</label>
                <input
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-emerald-50">Cidade</label>
                <input
                  value={eventCity}
                  onChange={(e) => setEventCity(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-emerald-50">Estado</label>
                <input
                  value={eventState}
                  onChange={(e) => setEventState(e.target.value.toUpperCase())}
                  maxLength={2}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                />
              </div>
            </div>
          )}

          <VideoField
            label="Video opcional"
            value={videoUrl}
            onChange={setVideoUrl}
            helperText="Use o video para explicar a tecnica, mostrar a execucao ou apresentar o evento."
          />

          <ImageField
            label="Imagem opcional"
            value={imageUrl}
            onChange={setImageUrl}
            helperText="Imagens deixam o feed mais social e ajudam a chamar a comunidade para a conversa."
          />

          <div className="flex gap-3 justify-end">
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
              className="rounded-2xl bg-cyan-500 px-5 py-3 text-white font-semibold shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:shadow-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Publicando..." : "Publicar no forum"}
            </button>
          </div>
        </form>

        {message && <p className="text-sm text-cyan-100">{message}</p>}
      </div>
    </div>
  )
}
