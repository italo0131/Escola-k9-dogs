"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

type UserRow = {
  id: string
  name: string
  email: string
  role: string
  status: string
  emailVerifiedAt?: string | null
  phoneVerifiedAt?: string | null
  twoFactorEnabled?: boolean
  createdAt?: string
}

export default function UsersTable({ initialUsers }: { initialUsers: UserRow[] }) {
  const [rows, setRows] = useState<UserRow[]>(initialUsers)
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState<Record<string, boolean>>({})

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesQuery = !q || row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q)
      const matchesRole = roleFilter === "all" || row.role === roleFilter
      const matchesStatus = statusFilter === "all" || (row.status || "ACTIVE") === statusFilter
      return matchesQuery && matchesRole && matchesStatus
    })
  }, [rows, query, roleFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const paged = filtered.slice(start, start + pageSize)

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
        setMessage(data.message || "Erro ao atualizar usuario")
        return
      }
      const user = data.user
      setRows((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
                ...row,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                emailVerifiedAt: user.emailVerifiedAt,
                phoneVerifiedAt: user.phoneVerifiedAt,
                twoFactorEnabled: user.twoFactorEnabled,
              }
            : row
        )
      )
      setMessage("Usuario atualizado")
    } catch (err) {
      console.error(err)
      setMessage("Erro ao atualizar usuario")
    } finally {
      setLoading(id, false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Usuarios</h1>
          <p className="text-sm text-gray-300">Controle de papis, status e verificacoes.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Buscar por nome ou email"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
          />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
          >
            <option value="all">Todos os papeis</option>
            <option value="CLIENT">CLIENT</option>
            <option value="TRAINER">TRAINER</option>
            <option value="VET">VET</option>
            <option value="ADMIN">ADMIN</option>
            <option value="ROOT">ROOT</option>
            <option value="SUPERADMIN">SUPERADMIN</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
          >
            <option value="all">Todos os status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
      </div>

      {message && <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm">{message}</div>}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="min-w-full text-sm">
          <thead className="text-gray-300">
            <tr className="border-b border-white/10">
              <th className="p-3 text-left">Usuario</th>
              <th className="p-3 text-left">Papel</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Verificacoes</th>
              <th className="p-3 text-left">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((user) => {
              const emailOk = !!user.emailVerifiedAt
              const phoneOk = !!user.phoneVerifiedAt
              return (
                <tr key={user.id} className="border-b border-white/5">
                  <td className="p-3">
                    <Link href={`/admin/users/${user.id}`} className="block hover:text-cyan-200 transition">
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </Link>
                  </td>
                  <td className="p-3">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((row) => (row.id === user.id ? { ...row, role: e.target.value } : row))
                        )
                      }
                      className="rounded-lg border border-white/10 bg-white/10 px-2 py-2 text-white text-xs"
                    >
                      <option value="CLIENT">CLIENT</option>
                      <option value="TRAINER">TRAINER</option>
                      <option value="VET">VET</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="ROOT">ROOT</option>
                      <option value="SUPERADMIN">SUPERADMIN</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <select
                      value={user.status || "ACTIVE"}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((row) => (row.id === user.id ? { ...row, status: e.target.value } : row))
                        )
                      }
                      className="rounded-lg border border-white/10 bg-white/10 px-2 py-2 text-white text-xs"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </td>
                  <td className="p-3 text-xs">
                    <div>Email: {emailOk ? "ok" : "pendente"}</div>
                    <div>Telefone: {phoneOk ? "ok" : "pendente"}</div>
                    <div>2FA: {user.twoFactorEnabled ? "ativo" : "off"}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white hover:bg-white/10"
                      >
                        Ver
                      </Link>
                      <button
                        disabled={!!busy[user.id]}
                        onClick={() => updateUser(user.id, { role: user.role, status: user.status })}
                        className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        Salvar
                      </button>
                      <button
                        disabled={!!busy[user.id]}
                        onClick={() => updateUser(user.id, { emailVerified: !emailOk })}
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white hover:bg-white/10"
                      >
                        Email
                      </button>
                      <button
                        disabled={!!busy[user.id]}
                        onClick={() => updateUser(user.id, { phoneVerified: !phoneOk })}
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white hover:bg-white/10"
                      >
                        Telefone
                      </button>
                      <button
                        disabled={!!busy[user.id]}
                        onClick={() => updateUser(user.id, { twoFactorEnabled: false })}
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white hover:bg-white/10"
                      >
                        Reset 2FA
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-300">
        <div>
          Pagina {currentPage} de {totalPages} • {filtered.length} usuarios
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-white/10 px-3 py-1 text-xs disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-white/10 px-3 py-1 text-xs disabled:opacity-50"
          >
            Proxima
          </button>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
            className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-xs text-white"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>
  )
}
