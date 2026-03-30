"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

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

export default function ClientsTable({ initialClients }: { initialClients: ClientRow[] }) {
  const [rows, setRows] = useState<ClientRow[]>(initialClients)
  const [query, setQuery] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState<Record<string, boolean>>({})

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q))
  }, [rows, query])

  const setLoading = (id: string, value: boolean) => {
    setBusy((prev) => ({ ...prev, [id]: value }))
  }

  const updateUser = async (id: string, payload: any) => {
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
        setMessage(data.message || "Erro ao atualizar cliente")
        return
      }
      const user = data.user
      setRows((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
                ...row,
                role: user.role,
                status: user.status,
                emailVerified: !!user.emailVerifiedAt,
                phoneVerified: !!user.phoneVerifiedAt,
                twoFactorEnabled: !!user.twoFactorEnabled,
              }
            : row
        )
      )
      setMessage("Cliente atualizado")
    } catch (err) {
      console.error(err)
      setMessage("Erro ao atualizar cliente")
    } finally {
      setLoading(id, false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-gray-300">Progresso, verificacoes e status da base.</p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou email"
          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
        />
      </div>

      {message && <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm">{message}</div>}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="min-w-full text-sm">
          <thead className="text-gray-300">
            <tr className="border-b border-white/10">
              <th className="p-3 text-left">Cliente</th>
              <th className="p-3 text-left">Dogs</th>
              <th className="p-3 text-left">Treinos</th>
              <th className="p-3 text-left">Progresso</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((client) => (
              <tr key={client.id} className="border-b border-white/5">
                <td className="p-3">
                  <Link href={`/admin/clients/${client.id}`} className="block hover:text-cyan-200 transition">
                    <div className="font-semibold">{client.name}</div>
                    <div className="text-xs text-gray-400">{client.email}</div>
                  </Link>
                </td>
                <td className="p-3">{client.dogs}</td>
                <td className="p-3">{client.trainings}</td>
                <td className="p-3">{client.progress}%</td>
                <td className="p-3">
                  <select
                    value={client.status || "ACTIVE"}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((row) => (row.id === client.id ? { ...row, status: e.target.value } : row))
                      )
                    }
                    className="rounded-lg border border-white/10 bg-white/10 px-2 py-2 text-white text-xs"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white hover:bg-white/10"
                    >
                      Ver
                    </Link>
                    <button
                      disabled={!!busy[client.id]}
                      onClick={() => updateUser(client.id, { status: client.status })}
                      className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      Salvar
                    </button>
                    <button
                      disabled={!!busy[client.id]}
                      onClick={() => updateUser(client.id, { emailVerified: !client.emailVerified })}
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white hover:bg-white/10"
                    >
                      Email
                    </button>
                    <button
                      disabled={!!busy[client.id]}
                      onClick={() => updateUser(client.id, { phoneVerified: !client.phoneVerified })}
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white hover:bg-white/10"
                    >
                      Telefone
                    </button>
                    <button
                      disabled={!!busy[client.id]}
                      onClick={() => updateUser(client.id, { twoFactorEnabled: false })}
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white hover:bg-white/10"
                    >
                      Reset 2FA
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
