"use client"

import Link from "next/link"
import { useDeferredValue, useState } from "react"

import { ACCOUNT_PLANS, getAccountPlanLabel, getPlanStatusLabel } from "@/lib/platform"
import { getRoleLabel, getUserStatusLabel, needsProfessionalApproval } from "@/lib/role"

type PaymentSummary = {
  id: string
  status?: string | null
  amount?: number | null
  currency?: string | null
  createdAt: string
}

type ApprovalRow = {
  id: string
  name: string
  email: string
  role: string
  status: string
  plan: string
  planStatus: string
  planActivatedAt?: string | null
  emailVerifiedAt?: string | null
  phoneVerifiedAt?: string | null
  createdAt: string
  isProfessional: boolean
  headline?: string | null
  bio?: string | null
  city?: string | null
  state?: string | null
  specialties?: string | null
  experienceYears?: number | null
  availabilityNotes?: string | null
  websiteUrl?: string | null
  instagramHandle?: string | null
  lastPayment?: PaymentSummary | null
}

const PLAN_STATUS_OPTIONS = ["ACTIVE", "CHECKOUT_REQUIRED", "CHECKOUT_PENDING", "PAST_DUE", "CANCELED"] as const
const STATUS_OPTIONS = ["ACTIVE", "PENDING_APPROVAL", "SUSPENDED"] as const

function needsPlanApproval(row: ApprovalRow) {
  return row.plan !== "FREE" && row.planStatus !== "ACTIVE"
}

function needsEmailApproval(row: ApprovalRow) {
  return !row.emailVerifiedAt
}

function needsProfessionalReview(row: ApprovalRow) {
  return needsProfessionalApproval(row.role, row.status)
}

function formatMoney(amount?: number | null, currency?: string | null) {
  if (typeof amount !== "number") return "Sem valor"

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: String(currency || "BRL").toUpperCase(),
  }).format(amount / 100)
}

export default function ApprovalsBoard({
  initialRows,
  isRoot,
}: {
  initialRows: ApprovalRow[]
  isRoot: boolean
}) {
  const [rows, setRows] = useState<ApprovalRow[]>(initialRows)
  const [query, setQuery] = useState("")
  const [scope, setScope] = useState("all")
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState("")
  const deferredQuery = useDeferredValue(query)

  const filtered = rows.filter((row) => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()
    const matchesQuery =
      !normalizedQuery ||
      row.name.toLowerCase().includes(normalizedQuery) ||
      row.email.toLowerCase().includes(normalizedQuery)

    const emailPending = needsEmailApproval(row)
    const planPending = needsPlanApproval(row)
    const professionalPending = needsProfessionalReview(row)

    if (scope === "email") return matchesQuery && emailPending
    if (scope === "plan") return matchesQuery && planPending
    if (scope === "professional") return matchesQuery && professionalPending
    if (scope === "approved") return matchesQuery && !emailPending && !planPending && !professionalPending
    if (scope === "attention") return matchesQuery && (emailPending || planPending || professionalPending)

    return matchesQuery
  })

  const pendingEmailCount = rows.filter(needsEmailApproval).length
  const pendingPlanCount = rows.filter(needsPlanApproval).length
  const pendingProfessionalCount = rows.filter(needsProfessionalReview).length
  const readyCount = rows.filter((row) => !needsEmailApproval(row) && !needsPlanApproval(row) && !needsProfessionalReview(row)).length

  const setLoading = (id: string, value: boolean) => {
    setBusy((current) => ({ ...current, [id]: value }))
  }

  const updateRowFromResponse = (id: string, user: any) => {
    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              name: user.name,
              email: user.email,
              role: user.role,
              status: user.status,
              plan: user.plan,
              planStatus: user.planStatus,
              planActivatedAt: user.planActivatedAt,
              emailVerifiedAt: user.emailVerifiedAt,
              phoneVerifiedAt: user.phoneVerifiedAt,
              isProfessional: user.role === "TRAINER" || user.role === "VET",
              headline: user.headline,
              bio: user.bio,
              city: user.city,
              state: user.state,
              specialties: user.specialties,
              experienceYears: user.experienceYears,
              availabilityNotes: user.availabilityNotes,
              websiteUrl: user.websiteUrl,
              instagramHandle: user.instagramHandle,
            }
          : row,
      ),
    )
  }

  const updateUser = async (id: string, payload: Record<string, unknown>, successMessage: string) => {
    setLoading(id, true)
    setMessage("")

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.success) {
        setMessage(data.message || "Nao foi possivel atualizar esse usuario agora.")
        return
      }

      updateRowFromResponse(id, data.user)
      setMessage(successMessage)
    } catch (error) {
      console.error(error)
      setMessage("Nao foi possivel atualizar esse usuario agora.")
    } finally {
      setLoading(id, false)
    }
  }

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.12),transparent_24%),linear-gradient(145deg,#020617,#0f172a_58%,#020617)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[32px] border border-cyan-300/15 bg-[linear-gradient(145deg,rgba(8,145,178,0.16),rgba(15,23,42,0.96))] p-6 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.32em] text-cyan-100/80">Aprovacoes</p>
              <h1 className="mt-3 text-3xl font-semibold">Fila real de email, plano e credencial profissional</h1>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Aqui o admin separa o que e verificacao de conta, o que e ativacao comercial e o que e validacao de
                adestradores e veterinarios antes de abrir canal, conteudo e presenca profissional na plataforma.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="rounded-2xl border border-white/15 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10"
              >
                Voltar ao painel
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Emails pendentes" value={pendingEmailCount} description="Contas aguardando confirmacao do proprio usuario ou revisao manual." />
            <StatCard title="Planos pendentes" value={pendingPlanCount} description="Assinaturas pagas ainda sem ativacao comercial completa." />
            <StatCard title="Profissionais em analise" value={pendingProfessionalCount} description="Adestradores e veterinarios esperando validacao do time." />
            <StatCard title="Tudo pronto" value={readyCount} description="Contas sem pendencia operacional ou profissional." />
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/30">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Filtrar a fila</h2>
              <p className="mt-1 text-sm text-slate-300">Busque por nome, email ou foque na pendencia que pede decisao.</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nome ou email"
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
              />
              <select
                value={scope}
                onChange={(event) => setScope(event.target.value)}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
              >
                <option value="all">Todos</option>
                <option value="attention">Com pendencias</option>
                <option value="professional">Profissionais em analise</option>
                <option value="email">Email pendente</option>
                <option value="plan">Plano pendente</option>
                <option value="approved">Tudo aprovado</option>
              </select>
            </div>
          </div>

          {message ? <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-50">{message}</div> : null}
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/15 bg-white/5 p-8 text-center text-slate-300">
              Nenhuma conta encontrada para esse filtro.
            </div>
          ) : null}

          {filtered.map((row) => {
            const emailPending = needsEmailApproval(row)
            const planPending = needsPlanApproval(row)
            const professionalPending = needsProfessionalReview(row)
            const isBusy = !!busy[row.id]
            const location = [row.city, row.state].filter(Boolean).join(" / ") || "Nao informado"

            return (
              <article
                key={row.id}
                className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.95),rgba(15,23,42,0.7)),radial-gradient(circle_at_top_right,rgba(34,197,94,0.12),transparent_24%)] p-6 shadow-lg shadow-black/30"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold">{row.name}</h2>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                          {getRoleLabel(row.role)}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            professionalPending
                              ? "bg-amber-500/15 text-amber-100"
                              : row.status === "ACTIVE"
                                ? "bg-emerald-500/15 text-emerald-100"
                                : "bg-rose-500/15 text-rose-100"
                          }`}
                        >
                          {getUserStatusLabel(row.status, row.role)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{row.email}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`rounded-full px-3 py-1 ${emailPending ? "bg-amber-500/15 text-amber-100" : "bg-emerald-500/15 text-emerald-100"}`}>
                        {emailPending ? "Email pendente" : "Email confirmado"}
                      </span>
                      <span className={`rounded-full px-3 py-1 ${planPending ? "bg-amber-500/15 text-amber-100" : "bg-cyan-500/15 text-cyan-100"}`}>
                        {getAccountPlanLabel(row.plan)} • {getPlanStatusLabel(row.planStatus)}
                      </span>
                      {professionalPending ? (
                        <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-100">Credencial profissional pendente</span>
                      ) : row.isProfessional ? (
                        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-100">Profissional aprovado</span>
                      ) : (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-slate-300">Conta cliente</span>
                      )}
                      {row.phoneVerifiedAt ? (
                        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-100">Telefone ok</span>
                      ) : (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-slate-300">Telefone pendente</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      <InfoBlock title="Criado em" value={new Date(row.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })} />
                      <InfoBlock title="Plano ativo desde" value={row.planActivatedAt ? new Date(row.planActivatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "Ainda nao ativado"} />
                      <InfoBlock title="Regiao" value={location} />
                      <InfoBlock
                        title="Ultimo pagamento"
                        value={
                          row.lastPayment
                            ? `${formatMoney(row.lastPayment.amount, row.lastPayment.currency)} • ${String(row.lastPayment.status || "sem status").toUpperCase()}`
                            : "Sem pagamento registrado"
                        }
                      />
                    </div>
                  </div>

                  {isRoot ? (
                    <Link
                      href={`/admin/users/${row.id}`}
                      className="rounded-2xl border border-white/15 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10"
                    >
                      Ver perfil completo
                    </Link>
                  ) : null}
                </div>

                {row.isProfessional && (
                  <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                      <p className="text-sm text-slate-200/80">Resumo profissional</p>
                      <h3 className="mt-2 text-lg font-semibold">{row.headline || "Headline ainda nao preenchida"}</h3>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <InfoBlock title="Especialidades" value={row.specialties || "Nao informado"} />
                        <InfoBlock title="Experiencia" value={row.experienceYears ? `${row.experienceYears} anos` : "Nao informado"} />
                        <InfoBlock title="Instagram" value={row.instagramHandle || "Nao informado"} />
                        <InfoBlock title="Site" value={row.websiteUrl || "Nao informado"} />
                      </div>
                      {row.bio ? <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-200">{row.bio}</p> : null}
                    </div>

                    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                      <p className="text-sm text-slate-200/80">Disponibilidade e operacao</p>
                      <p className="mt-3 text-sm leading-7 text-slate-200">
                        {row.availabilityNotes || "Sem observacoes adicionais sobre agenda ou formato de atendimento."}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_1.4fr]">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm text-slate-200/80">Plano em uso</span>
                    <select
                      value={row.plan}
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((item) =>
                            item.id === row.id
                              ? { ...item, plan: event.target.value, planStatus: event.target.value === "FREE" ? "ACTIVE" : item.planStatus }
                              : item,
                          ),
                        )
                      }
                      className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
                    >
                      {ACCOUNT_PLANS.map((plan) => (
                        <option key={plan} value={plan}>
                          {getAccountPlanLabel(plan)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-2">
                      <span className="text-sm text-slate-200/80">Status da assinatura</span>
                      <select
                        value={row.planStatus}
                        onChange={(event) =>
                          setRows((current) =>
                            current.map((item) => (item.id === row.id ? { ...item, planStatus: event.target.value } : item)),
                          )
                        }
                        className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
                      >
                        {PLAN_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {getPlanStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm text-slate-200/80">Status da conta</span>
                      <select
                        value={row.status}
                        onChange={(event) =>
                          setRows((current) =>
                            current.map((item) => (item.id === row.id ? { ...item, status: event.target.value } : item)),
                          )
                        }
                        className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {getUserStatusLabel(status, row.role)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-200/80">Acoes rapidas</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {professionalPending && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            updateUser(
                              row.id,
                              {
                                status: "ACTIVE",
                                sendApprovalEmail: true,
                              },
                              "Credencial profissional aprovada.",
                            )
                          }
                          className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Aprovar profissional
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          updateUser(
                            row.id,
                            {
                              approveAccess: true,
                              plan: row.plan,
                              sendApprovalEmail: true,
                            },
                            "Conta aprovada e liberada.",
                          )
                        }
                        className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Aprovar tudo
                      </button>
                      <button
                        type="button"
                        disabled={isBusy || !emailPending}
                        onClick={() =>
                          updateUser(
                            row.id,
                            { emailVerified: true },
                            "Email confirmado manualmente.",
                          )
                        }
                        className="rounded-2xl border border-white/15 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Aprovar email
                      </button>
                      <button
                        type="button"
                        disabled={isBusy || row.plan === "FREE"}
                        onClick={() =>
                          updateUser(
                            row.id,
                            {
                              plan: row.plan,
                              planStatus: "ACTIVE",
                              sendApprovalEmail: true,
                            },
                            "Assinatura ativada com sucesso.",
                          )
                        }
                        className="rounded-2xl border border-white/15 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Ativar plano
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          updateUser(
                            row.id,
                            {
                              plan: row.plan,
                              planStatus: row.planStatus,
                              status: row.status,
                            },
                            "Ajustes salvos com sucesso.",
                          )
                        }
                        className="rounded-2xl border border-cyan-300/20 px-4 py-3 text-sm text-cyan-100 transition hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Salvar ajustes
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, description }: { title: string; value: number; description: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-300">{title}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  )
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/70">{title}</p>
      <p className="mt-2 text-sm text-slate-100">{value}</p>
    </div>
  )
}
