"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { FORUM_CHANNEL_CATEGORIES, FORUM_SERVICE_MODES } from "@/lib/community"
import { isApprovedProfessional, isProfessionalRole } from "@/lib/role"

export default function NewForumChannelPage() {
  const router = useRouter()
  const { data, status } = useSession()
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "ADESTRAMENTO",
    serviceMode: "HYBRID",
    subscriptionPrice: "",
    onlinePrice: "",
    inPersonPrice: "",
    city: "",
    state: "",
    acceptsRemote: true,
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const professionalApproved = isApprovedProfessional(data?.user?.role, data?.user?.status)
  const professionalRole = isProfessionalRole(data?.user?.role)

  useEffect(() => {
    if (status === "loading") return
    if (!data?.user) {
      router.replace("/login")
      return
    }
    if (!professionalRole) {
      router.replace("/forum")
      return
    }
    if (!professionalApproved) {
      setMessage("Seu perfil profissional ainda esta em analise. Assim que for aprovado, o canal sera liberado.")
    }
  }, [data, status, router, professionalApproved, professionalRole])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setMessage("")
    try {
      const res = await fetch("/api/forum/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          subscriptionPrice: form.subscriptionPrice ? Math.round(Number(form.subscriptionPrice) * 100) : null,
          onlinePrice: form.onlinePrice ? Math.round(Number(form.onlinePrice) * 100) : null,
          inPersonPrice: form.inPersonPrice ? Math.round(Number(form.inPersonPrice) * 100) : null,
        }),
      })
      const payload = await res.json()
      if (!res.ok || payload.success === false) {
        setMessage(payload.message || "Erro ao criar canal")
        return
      }
      router.push(`/forum/channels/${payload.channel.slug}`)
    } catch (error) {
      console.error(error)
      setMessage("Erro ao criar canal")
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading") {
    return null
  }

  if (data?.user && professionalRole && !professionalApproved) {
    return (
      <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-amber-300/20 bg-amber-500/10 p-8 shadow-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-amber-100/80">Aprovacao profissional</p>
          <h1 className="mt-3 text-3xl font-semibold">Seu canal sera liberado depois da validacao da equipe.</h1>
          <p className="mt-3 text-sm leading-7 text-amber-50/90">
            A K9 revisa os dados do profissional antes de abrir canal publico. Enquanto isso, voce pode completar seu
            perfil e acompanhar a plataforma normalmente.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            >
              Ir para meu perfil
            </button>
            <button
              type="button"
              onClick={() => router.push("/forum")}
              className="rounded-lg border border-white/15 px-4 py-3 text-sm text-white"
            >
              Voltar ao forum
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-6 rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Canal</p>
          <h1 className="text-3xl font-semibold">Criar canal de adestramento</h1>
          <p className="text-gray-300/80">Monte seu espaço no fórum para captar clientes, tirar dúvidas e apresentar seus formatos de atendimento.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm text-gray-200/80">Nome do canal</label>
              <input
                value={form.name}
                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                required
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-3 text-white"
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm text-gray-200/80">Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                rows={5}
                required
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-3 text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-200/80">Categoria</label>
              <select value={form.category} onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-3 text-white">
                {FORUM_CHANNEL_CATEGORIES.map((category) => (
                  <option key={category} value={category} className="text-black">
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-200/80">Formato</label>
              <select value={form.serviceMode} onChange={(e) => setForm((current) => ({ ...current, serviceMode: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-3 text-white">
                {FORUM_SERVICE_MODES.map((mode) => (
                  <option key={mode} value={mode} className="text-black">
                    {mode}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-200/80">Assinatura mensal (R$)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.subscriptionPrice}
                onChange={(e) => setForm((current) => ({ ...current, subscriptionPrice: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-3 text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-200/80">Preço online (R$)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.onlinePrice}
                onChange={(e) => setForm((current) => ({ ...current, onlinePrice: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-3 text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-200/80">Preço presencial (R$)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.inPersonPrice}
                onChange={(e) => setForm((current) => ({ ...current, inPersonPrice: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-3 text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-200/80">Cidade</label>
              <input
                value={form.city}
                onChange={(e) => setForm((current) => ({ ...current, city: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-3 text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-200/80">Estado</label>
              <input
                value={form.state}
                onChange={(e) => setForm((current) => ({ ...current, state: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-3 text-white"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-gray-200/80">
            <input
              type="checkbox"
              checked={form.acceptsRemote}
              onChange={(e) => setForm((current) => ({ ...current, acceptsRemote: e.target.checked }))}
            />
            Aceito atendimento remoto
          </label>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-white/15 px-4 py-3 text-gray-100 hover:bg-white/10 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-cyan-500 px-5 py-3 text-white font-semibold shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:shadow-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Criando..." : "Publicar canal"}
            </button>
          </div>
        </form>

        {message && <p className="text-sm text-cyan-100">{message}</p>}
      </div>
    </div>
  )
}
