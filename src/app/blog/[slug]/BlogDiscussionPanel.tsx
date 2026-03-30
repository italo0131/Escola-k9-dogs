"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"

import { getRoleLabel } from "@/lib/role"

type CommentItem = {
  id: string
  content: string
  createdAt: string
  author: {
    name: string
    role: string
  }
}

export default function BlogDiscussionPanel({
  slug,
  canComment,
  initialComments,
}: {
  slug: string
  canComment: boolean
  initialComments: CommentItem[]
}) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments)
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
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data?.success || !data?.comment) {
        setMessage(data?.message || "Nao foi possivel comentar agora.")
        return
      }

      setComments((current) => [
        ...current,
        {
          id: data.comment.id,
          content: data.comment.content,
          createdAt: data.comment.createdAt,
          author: {
            name: data.comment.author.name,
            role: data.comment.author.role,
          },
        },
      ])
      setContent("")
      setMessage("Comentario publicado.")
    } catch (error) {
      console.error(error)
      setMessage("Nao foi possivel comentar agora.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="comments" className="rounded-[32px] border border-white/10 bg-white/6 p-6 shadow-2xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Conversa</p>
          <h2 className="text-2xl font-semibold">Comentarios ({comments.length})</h2>
        </div>
        <p className="text-sm text-slate-300">Clientes, adestradores e equipe podem construir a conversa juntos.</p>
      </div>

      {comments.length === 0 && <p className="mt-4 text-slate-300">Nenhum comentario ainda. Abra a conversa.</p>}

      <div className="mt-4 space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span className="font-semibold text-white">{comment.author.name}</span>
              <span>{getRoleLabel(comment.author.role)}</span>
              <span>
                {new Date(comment.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-slate-200">{comment.content}</p>
          </div>
        ))}
      </div>

      {!canComment ? (
        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
          Entre na sua conta para comentar e participar da conversa.
          <Link href="/login" className="ml-2 text-cyan-300 hover:underline underline-offset-4">
            Fazer login
          </Link>
        </div>
      ) : (
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
      )}
    </section>
  )
}
