"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

type Props = {
  slug: string
  canComment: boolean
}

export default function BlogCommentForm({ slug, canComment }: Props) {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canComment) return

    setSaving(true)
    setMessage("")

    try {
      const response = await fetch(`/api/blog/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      const data = await response.json()

      if (!response.ok || !data?.success) {
        setMessage(data?.message || "Nao foi possivel comentar")
        return
      }

      setContent("")
      router.refresh()
    } catch (error) {
      console.error(error)
      setMessage("Erro ao comentar")
    } finally {
      setSaving(false)
    }
  }

  if (!canComment) {
    return (
      <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
        Entre na sua conta para comentar e participar da conversa.
        <Link href="/login" className="ml-2 text-cyan-300 hover:underline underline-offset-4">
          Fazer login
        </Link>
      </div>
    )
  }

  return (
    <form className="mt-6 flex flex-col gap-3" onSubmit={handleSubmit}>
      <label className="text-sm text-gray-200/80">Sua resposta</label>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={4}
        required
        placeholder="Compartilhe sua experiencia, uma duvida ou uma dica complementar..."
        className="w-full rounded-[24px] border border-white/10 bg-white/10 px-4 py-4 text-white placeholder:text-slate-400"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Publicando..." : "Publicar comentario"}
        </button>
      </div>
      {message && <p className="text-sm text-cyan-100">{message}</p>}
    </form>
  )
}
