"use client"

import Link from "next/link"
import { useState } from "react"

type Props = {
  reactionEndpoint: string
  initialLiked: boolean
  initialReactionCount: number
  conversationCount: number
  conversationLabel: string
  canInteract: boolean
  loginHref?: string
  lockedHref?: string
  lockedLabel?: string
}

export default function EngagementBar({
  reactionEndpoint,
  initialLiked,
  initialReactionCount,
  conversationCount,
  conversationLabel,
  canInteract,
  loginHref = "/login",
  lockedHref,
  lockedLabel = "Ativar acesso",
}: Props) {
  const [liked, setLiked] = useState(initialLiked)
  const [reactionCount, setReactionCount] = useState(initialReactionCount)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleToggle = async () => {
    if (!canInteract) return

    setLoading(true)
    setMessage("")

    try {
      const response = await fetch(reactionEndpoint, { method: "POST" })
      const data = await response.json()

      if (!response.ok || !data?.success) {
        setMessage(data?.message || "Nao foi possivel atualizar a curtida")
        return
      }

      setLiked(Boolean(data.liked))
      setReactionCount(Number(data.count || 0))
    } catch (error) {
      console.error(error)
      setMessage("Erro ao atualizar curtida")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setMessage("Link copiado.")
    } catch (error) {
      console.error(error)
      setMessage("Nao foi possivel copiar o link")
    }
  }

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap gap-3">
        {canInteract ? (
          <button
            type="button"
            onClick={handleToggle}
            disabled={loading}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              liked
                ? "border border-rose-300/20 bg-rose-500/10 text-rose-100"
                : "border border-white/10 bg-white/10 text-white hover:bg-white/15"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {loading ? "Atualizando..." : liked ? `Curtido • ${reactionCount}` : `Curtir • ${reactionCount}`}
          </button>
        ) : (
          <Link
            href={lockedHref || loginHref}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            {lockedHref ? `${lockedLabel} • ${reactionCount}` : `Entrar para curtir • ${reactionCount}`}
          </Link>
        )}

        <a
          href="#comments"
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/15"
        >
          {conversationLabel} • {conversationCount}
        </a>

        <button
          type="button"
          onClick={handleCopy}
          className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20"
        >
          Compartilhar
        </button>
      </div>

      {message && <p className="mt-3 text-xs text-cyan-100">{message}</p>}
    </div>
  )
}
