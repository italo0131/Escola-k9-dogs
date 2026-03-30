"use client"

import Link from "next/link"
import { useState } from "react"

type RootStats = {
  userCount: number
  clientCount: number
  staffCount: number
  dogCount: number
  trainingCount: number
  scheduleCount: number
  companyCount: number
  unverifiedCount: number
  avgProgress: number
  paymentsCount: number
  totalPaid: number
}

type ClientRow = {
  id: string
  name: string
  email: string
  role: string
  status: string
  dogs: number
  trainings: number
  progress: number
  emailVerified: boolean
  phoneVerified: boolean
  twoFactorEnabled: boolean
  lastScheduleDate?: string | null
}

type UpcomingSchedule = {
  id: string
  date: string
  status: string
  userName?: string | null
}

type RecentUser = {
  id: string
  name: string
  createdAt: string
}

type StatLink = {
  title: string
  value: string | number
  href: string
  accent?: boolean
}

export default function RootConsole({
  stats,
  clients,
  upcoming,
  recentUsers,
}: {
  stats: RootStats
  clients: ClientRow[]
  upcoming: UpcomingSchedule[]
  recentUsers: RecentUser[]
}) {
  const [clientRows, setClientRows] = useState<ClientRow[]>(clients)
  const [scheduleRows, setScheduleRows] = useState<UpcomingSchedule[]>(upcoming)
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState<Record<string, boolean>>({})

  const setLoading = (key: string, value: boolean) => {
    setBusy((prev) => ({ ...prev, [key]: value }))
  }

  const updateUser = async (id: string, payload: any) => {
    setLoading(`user-${id}`, true)
    setMessage("")
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setMessage(data.message || "Erro ao atualizar usuario")
        return
      }
      const user = data.user
      setClientRows((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
                ...row,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                emailVerified: !!user.emailVerifiedAt,
                phoneVerified: !!user.phoneVerifiedAt,
                twoFactorEnabled: !!user.twoFactorEnabled,
              }
            : row
        )
      )
      setMessage("Atualizado com sucesso")
    } catch (err) {
      console.error(err)
      setMessage("Erro ao atualizar usuario")
    } finally {
      setLoading(`user-${id}`, false)
    }
  }

  const updateSchedule = async (id: string, payload: any) => {
    setLoading(`schedule-${id}`, true)
    setMessage("")
    try {
      const res = await fetch(`/api/admin/schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setMessage(data.message || "Erro ao atualizar agenda")
        return
      }
      const schedule = data.schedule
      setScheduleRows((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, status: schedule.status, date: schedule.date } : row
        )
      )
      setMessage("Agenda atualizada")
    } catch (err) {
      console.error(err)
      setMessage("Erro ao atualizar agenda")
    } finally {
      setLoading(`schedule-${id}`, false)
    }
  }

  const statCards: StatLink[] = [
    { title: "Clientes", value: stats.clientCount, href: "/admin/clients" },
    { title: "Staff", value: stats.staffCount, href: "/admin/users" },
    { title: "Caes", value: stats.dogCount, href: "/admin/dogs" },
    { title: "Treinos", value: stats.trainingCount, href: "/admin/trainings" },
    { title: "Agendamentos", value: stats.scheduleCount, href: "/admin/schedule" },
    { title: "Empresas", value: stats.companyCount, href: "/admin/companies" },
    { title: "Emails nao verificados", value: stats.unverifiedCount, href: "/admin/security" },
    { title: "Progresso medio", value: `${stats.avgProgress}%`, href: "/admin/clients", accent: true },
  ]

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-950 via-amber-950/30 to-slate-950 text-white px-4 sm:px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-amber-200/80">Root console</p>
            <h1 className="text-3xl font-semibold">Controle total da plataforma</h1>
            <p className="text-gray-300/80">Visao completa de clientes, caes, treinos, agenda e seguranca.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin"
              className="rounded-lg bg-amber-500 px-4 py-2 text-slate-900 font-semibold hover:-translate-y-0.5 transition shadow-lg shadow-amber-500/25"
            >
              Painel root
            </Link>
            <Link
              href="/billing"
              className="rounded-lg border border-amber-200/30 px-4 py-2 text-amber-100 hover:bg-amber-500/10 transition"
            >
              Assinaturas
            </Link>
          </div>
        </div>

        {message && (
          <div className="rounded-xl border border-amber-200/20 bg-amber-500/10 px-4 py-3 text-sm">{message}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <RootStatCard key={card.title} {...card} />
          ))}
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-amber-200/15 bg-white/5 p-5 shadow-lg shadow-black/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Clientes em foco</h2>
              <span className="text-xs text-amber-100/70">Controle direto</span>
            </div>
            {clientRows.length === 0 && <p className="text-gray-300">Sem clientes cadastrados.</p>}
            <div className="space-y-3">
              {clientRows.map((client) => (
                <div key={client.id} className="rounded-xl border border-amber-200/10 bg-white/5 p-3 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Link href={`/admin/clients/${client.id}`} className="font-semibold hover:text-amber-200 transition">
                        {client.name}
                      </Link>
                      <p className="text-xs text-gray-400">{client.email}</p>
                    </div>
                    <div className="text-xs text-amber-100/80">
                      {client.emailVerified ? "Email ok" : "Email pendente"}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-300">
                    <div>Caes: {client.dogs}</div>
                    <div>Treinos: {client.trainings}</div>
                    <div>Progresso: {client.progress}%</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                    <label className="flex flex-col gap-1">
                      Papel
                      <select
                        value={client.role}
                        onChange={(e) =>
                          setClientRows((prev) =>
                            prev.map((row) => (row.id === client.id ? { ...row, role: e.target.value } : row))
                          )
                        }
                        className="rounded-lg border border-amber-200/15 bg-white/5 px-2 py-2 text-white"
                      >
                        <option value="CLIENT">CLIENT</option>
                        <option value="TRAINER">TRAINER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="ROOT">ROOT</option>
                        <option value="SUPERADMIN">SUPERADMIN</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      Status
                      <select
                        value={client.status}
                        onChange={(e) =>
                          setClientRows((prev) =>
                            prev.map((row) => (row.id === client.id ? { ...row, status: e.target.value } : row))
                          )
                        }
                        className="rounded-lg border border-amber-200/15 bg-white/5 px-2 py-2 text-white"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                      </select>
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="rounded-lg border border-amber-200/20 px-3 py-2 text-amber-100 hover:bg-amber-500/10"
                    >
                      Ver perfil
                    </Link>
                    <button
                      onClick={() => updateUser(client.id, { role: client.role, status: client.status })}
                      disabled={busy[`user-${client.id}`]}
                      className="rounded-lg bg-amber-500 px-3 py-2 text-slate-900 font-semibold disabled:opacity-60"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => updateUser(client.id, { emailVerified: !client.emailVerified })}
                      disabled={busy[`user-${client.id}`]}
                      className="rounded-lg border border-amber-200/20 px-3 py-2 text-amber-100 hover:bg-amber-500/10 disabled:opacity-60"
                    >
                      {client.emailVerified ? "Marcar pendente" : "Verificar email"}
                    </button>
                    <button
                      onClick={() => updateUser(client.id, { twoFactorEnabled: false })}
                      disabled={busy[`user-${client.id}`]}
                      className="rounded-lg border border-amber-200/20 px-3 py-2 text-amber-100 hover:bg-amber-500/10 disabled:opacity-60"
                    >
                      Resetar 2FA
                    </button>
                    <button
                      onClick={() => updateUser(client.id, { phoneVerified: !client.phoneVerified })}
                      disabled={busy[`user-${client.id}`]}
                      className="rounded-lg border border-amber-200/20 px-3 py-2 text-amber-100 hover:bg-amber-500/10 disabled:opacity-60"
                    >
                      {client.phoneVerified ? "Telefone pendente" : "Verificar telefone"}
                    </button>
                  </div>

                  <p className="text-xs text-gray-400">
                    Ultimo treino agendado:{" "}
                    {client.lastScheduleDate
                      ? new Date(client.lastScheduleDate).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })
                      : "Nao ha"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200/15 bg-white/5 p-5 shadow-lg shadow-black/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Agenda global</h2>
              <Link href="/admin/schedule" className="text-xs text-amber-100/70 hover:underline underline-offset-4">
                Ver agenda
              </Link>
            </div>
            {scheduleRows.length === 0 && <p className="text-gray-300">Nenhum agendamento.</p>}
            <div className="space-y-3">
              {scheduleRows.map((item) => (
                <div key={item.id} className="rounded-xl border border-amber-200/10 bg-white/5 p-3 space-y-2">
                  <p className="text-sm font-semibold">
                    {new Date(item.date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-gray-300 text-sm">Status atual: {item.status}</p>
                  {item.userName && <p className="text-gray-400 text-sm">Tutor: {item.userName}</p>}
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={item.status}
                      onChange={(e) =>
                        setScheduleRows((prev) =>
                          prev.map((row) => (row.id === item.id ? { ...row, status: e.target.value } : row))
                        )
                      }
                      className="rounded-lg border border-amber-200/15 bg-white/5 px-2 py-2 text-white text-xs"
                    >
                      <option value="scheduled">scheduled</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                    <button
                      onClick={() => updateSchedule(item.id, { status: item.status })}
                      disabled={busy[`schedule-${item.id}`]}
                      className="rounded-lg bg-amber-500 px-3 py-2 text-slate-900 text-xs font-semibold disabled:opacity-60"
                    >
                      Atualizar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/security"
            className="rounded-2xl border border-amber-200/15 bg-white/5 p-5 shadow-lg shadow-black/30 hover:bg-white/10 transition"
          >
            <h3 className="text-lg font-semibold mb-3">Saude da seguranca</h3>
            <p className="text-sm text-gray-300">Usuarios totais: {stats.userCount}</p>
            <p className="text-sm text-gray-300">Emails pendentes: {stats.unverifiedCount}</p>
            <p className="text-sm text-gray-300">
              Taxa de verificacao:{" "}
              {stats.userCount ? Math.round(((stats.userCount - stats.unverifiedCount) / stats.userCount) * 100) : 0}%
            </p>
          </Link>
          <div className="rounded-2xl border border-amber-200/15 bg-white/5 p-5 shadow-lg shadow-black/30">
            <h3 className="text-lg font-semibold mb-3">Crescimento recente</h3>
            {recentUsers.length === 0 && <p className="text-gray-300 text-sm">Sem cadastros recentes.</p>}
            <ul className="space-y-2 text-sm text-gray-300">
              {recentUsers.map((user) => (
                <li key={user.id} className="flex items-center justify-between">
                  <Link href={`/admin/users/${user.id}`} className="hover:text-amber-200 transition">
                    {user.name}
                  </Link>
                  <span className="text-xs text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <Link
            href="/admin/finance"
            className="rounded-2xl border border-amber-200/15 bg-white/5 p-5 shadow-lg shadow-black/30 hover:bg-white/10 transition"
          >
            <h3 className="text-lg font-semibold mb-3">Financeiro</h3>
            <p className="text-sm text-gray-300">Eventos Stripe: {stats.paymentsCount}</p>
            <p className="text-sm text-gray-300">Total pago (centavos): {stats.totalPaid}</p>
            <p className="text-xs text-amber-100/80 mt-2">Dados reais via webhook Stripe.</p>
          </Link>
        </section>
      </div>
    </div>
  )
}

function RootStatCard({ title, value, accent, href }: StatLink) {
  const content = (
    <div className="rounded-2xl border border-amber-200/15 bg-white/5 p-5 shadow-lg shadow-black/30">
      <p className="text-amber-100/70 text-sm">{title}</p>
      <p className={`text-3xl font-semibold ${accent ? "text-amber-300" : ""}`}>{value}</p>
    </div>
  )
  return (
    <Link href={href} className="block hover:-translate-y-0.5 transition">
      {content}
    </Link>
  )
}
