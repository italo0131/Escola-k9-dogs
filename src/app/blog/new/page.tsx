"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { BLOG_CATEGORIES } from "@/lib/community"
import { isProfessionalRole, isStaffRole, needsProfessionalApproval } from "@/lib/role"
import VideoField from "@/app/components/VideoField"
import ImageField from "@/app/components/ImageField"
import { BLOG_POST_TYPES, getBlogPostTypeLabel } from "@/lib/platform"

export default function NewBlogPostPage() {
  const router = useRouter()
  const { data, status } = useSession()
  const [title, setTitle] = useState("")
  const [postType, setPostType] = useState("POST")
  const [category, setCategory] = useState("GERAL")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [published, setPublished] = useState(true)
  const [featured, setFeatured] = useState(false)
  const [eventStartsAt, setEventStartsAt] = useState("")
  const [eventEndsAt, setEventEndsAt] = useState("")
  const [eventLocation, setEventLocation] = useState("")
  const [eventCity, setEventCity] = useState("")
  const [eventState, setEventState] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const canPublish = isStaffRole(data?.user?.role)
  const professionalPending = needsProfessionalApproval(data?.user?.role, data?.user?.status)
  const postTypeOptions = useMemo(
    () => BLOG_POST_TYPES.filter((item) => canPublish || item !== "EVENTO"),
    [canPublish]
  )

  useEffect(() => {
    if (status === "loading") return
    if (!data?.user) {
      router.replace("/login")
      return
    }
  }, [data, status, router])

  useEffect(() => {
    if (!canPublish) {
      setPublished(true)
      setFeatured(false)
      if (postType === "EVENTO") {
        setPostType("POST")
      }
    }
  }, [canPublish, postType])

  const isEvent = postType === "EVENTO"

  if (status !== "loading" && professionalPending && isProfessionalRole(data?.user?.role)) {
    return (
      <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-amber-300/20 bg-amber-500/10 p-8 shadow-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-amber-100/80">Analise profissional</p>
          <h1 className="mt-3 text-3xl font-semibold">Seu blog profissional ainda nao foi liberado</h1>
          <p className="mt-3 text-sm leading-7 text-amber-50">
            Enquanto a equipe valida seu perfil, voce continua navegando normalmente, mas publicacoes como profissional ficam bloqueadas.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-4 py-3 text-sm font-semibold text-white"
            >
              Ver meu perfil
            </button>
            <button
              type="button"
              onClick={() => router.push("/blog")}
              className="rounded-2xl border border-white/15 px-4 py-3 text-sm text-white"
            >
              Voltar ao blog
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setMessage("")
    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          postType,
          category,
          excerpt,
          content,
          coverImageUrl,
          videoUrl,
          published: canPublish ? published : true,
          featured: canPublish ? featured : false,
          eventStartsAt: isEvent ? eventStartsAt : undefined,
          eventEndsAt: isEvent ? eventEndsAt : undefined,
          eventLocation: isEvent ? eventLocation : undefined,
          eventCity: isEvent ? eventCity : undefined,
          eventState: isEvent ? eventState : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.success === false) {
        setMessage(data.message || "Erro ao salvar post")
        return
      }
      router.push(`/blog/${data.post.slug}`)
    } catch (err) {
      console.error(err)
      setMessage("Erro ao salvar post")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6 rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-2xl">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Blog</p>
          <h1 className="text-3xl font-semibold">Novo post da plataforma</h1>
          <p className="text-slate-300/80">
            Use o blog para publicar orientacao gratuita, aprendizados, relatos de rotina e eventos da comunidade.
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-200/80">Tipo de publicacao</label>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
              >
                {postTypeOptions.map((item) => (
                  <option key={item} value={item} className="text-black">
                    {getBlogPostTypeLabel(item)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-200/80">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
              >
                {BLOG_CATEGORIES.map((item) => (
                  <option key={item} value={item} className="text-black">
                    {item}
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-200/80">Resumo</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
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
          </div>

          {isEvent && (
            <div className="grid gap-4 rounded-[28px] border border-emerald-300/15 bg-emerald-500/10 p-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-emerald-50">Inicio do evento</label>
                <input
                  type="datetime-local"
                  value={eventStartsAt}
                  onChange={(e) => setEventStartsAt(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-emerald-50">Fim do evento</label>
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
                  placeholder="Parque das Nacoes, Zoom, centro de treinamento..."
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
            label={isEvent ? "Video de convite ou referencia" : "Video do post"}
            value={videoUrl}
            onChange={setVideoUrl}
            helperText="Use um video para complementar a orientacao ou apresentar melhor o evento."
          />

          <ImageField
            label={isEvent ? "Imagem do evento" : "Imagem de capa"}
            value={coverImageUrl}
            onChange={setCoverImageUrl}
            helperText="A imagem ajuda o post a ficar mais chamativo no feed e no compartilhamento."
          />

          {canPublish && (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200/80">
                <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
                Publicar agora
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200/80">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                Destacar na home do blog
              </label>
            </div>
          )}

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
              {saving ? "Salvando..." : isEvent ? "Publicar evento" : "Publicar no blog"}
            </button>
          </div>
        </form>

        {message && <p className="text-sm text-cyan-100">{message}</p>}
      </div>
    </div>
  )
}
