"use client"

import Link from "next/link"
import { useState } from "react"

type AdminCard = {
  href: string
  title: string
  desc: string
}

const adminCards: AdminCard[] = [
  { href: "/dashboard", title: "Dashboard", desc: "Resumo geral da operacao e da conta" },
  { href: "/admin/approvals", title: "Aprovacoes", desc: "Liberar emails, planos e acesso" },
  { href: "/billing", title: "Assinaturas", desc: "Ver planos e comportamento da recorrencia" },
]

const rootCards: AdminCard[] = [
  { href: "/admin/users", title: "Usuarios", desc: "Papeis, status, 2FA e verificacoes" },
  { href: "/admin/clients", title: "Clientes", desc: "Progresso, verificacoes e historico" },
  { href: "/admin/dogs", title: "Caes", desc: "Dados, tutor e saude operacional" },
  { href: "/admin/trainings", title: "Treinos", desc: "Conteudo, progresso e entregas" },
  { href: "/admin/schedule", title: "Agenda", desc: "Atendimentos, horarios e status" },
  { href: "/admin/finance", title: "Financeiro", desc: "Pagamentos e trilha financeira" },
  { href: "/admin/security", title: "Seguranca", desc: "Auditoria e contas pendentes" },
  { href: "/admin/companies", title: "Empresas", desc: "Visao por unidade e operacao" },
]

export default function AdminConsoleClient({
  viewerName,
  viewerRole,
  isRoot,
}: {
  viewerName: string
  viewerRole: string
  isRoot: boolean
}) {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [key, setKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState("ADMIN")

  const cards = isRoot ? [...adminCards, ...rootCards] : adminCards

  const promote = async () => {
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/admin/promote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": key,
        },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.success) {
        setMessage(data.message || "Erro ao promover usuario")
        return
      }

      setMessage("Usuario promovido com sucesso.")
      setEmail("")
      setKey("")
    } catch (error) {
      console.error(error)
      setMessage("Erro ao promover usuario")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-[30px] border border-cyan-300/15 bg-[linear-gradient(145deg,rgba(8,145,178,0.14),rgba(15,23,42,0.92))] p-6 shadow-2xl shadow-black/30">
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-100/80">Perfil admin</p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-semibold">Centro de controle da plataforma</h1>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {viewerName}, seu acesso como {viewerRole} agora concentra o que mais pesa na operacao:
                aprovacao de conta, liberacao de assinatura e leitura rapida do que precisa de atencao.
              </p>
            </div>
            <Link
              href="/admin/approvals"
              className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5"
            >
              Abrir aprovacoes
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-white/8"
            >
              <p className="text-lg font-semibold">{card.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{card.desc}</p>
            </Link>
          ))}
        </div>

        {isRoot ? (
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/30">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Acesso tecnico</p>
              <h2 className="mt-2 text-2xl font-semibold">Promover usuario</h2>
              <p className="mt-2 text-sm text-slate-300">
                Use a chave de ambiente para liberar um novo admin ou elevar o papel de um membro da equipe.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-200/80">Email do usuario</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-200/80">Novo papel</span>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="TRAINER">TRAINER</option>
                  <option value="CLIENT">CLIENT</option>
                  <option value="ROOT">ROOT</option>
                  <option value="SUPERADMIN">SUPERADMIN</option>
                </select>
              </label>
            </div>

            <label className="mt-4 flex flex-col gap-2">
              <span className="text-sm text-slate-200/80">Chave secreta (ADMIN_API_KEY)</span>
              <input
                type="password"
                value={key}
                onChange={(event) => setKey(event.target.value)}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </label>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={promote}
                disabled={loading}
                className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Processando..." : "Promover usuario"}
              </button>
              {message ? <p className="text-sm text-cyan-100">{message}</p> : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
