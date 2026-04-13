"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useMemo, useState } from "react"

type ModuleOption = {
  id: string
  key: string
  name: string
  description?: string | null
}

type UserRow = {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdByAdmin: boolean
  emailVerifiedAt?: string | null
  phoneVerifiedAt?: string | null
  twoFactorEnabled?: boolean
  createdAt?: string
  moduleIds: string[]
  modules: Array<Pick<ModuleOption, "id" | "key" | "name">>
}

const ROLE_OPTIONS = ["CLIENT", "TRAINER", "VET", "ADMIN", "ROOT", "SUPERADMIN"]
const STATUS_OPTIONS = ["ACTIVE", "PENDING_APPROVAL", "SUSPENDED"]

export default function UsersTable({
  initialUsers,
  moduleOptions,
}: {
  initialUsers: UserRow[]
  moduleOptions: ModuleOption[]
}) {
  const [rows, setRows] = useState<UserRow[]>(initialUsers)
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [creating, setCreating] = useState(false)
  const [bulkCsv, setBulkCsv] = useState("")
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkResult, setBulkResult] = useState("")
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({})
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "CLIENT",
    moduleIds: [] as string[],
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesQuery = !q || row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q)
      const matchesRole = roleFilter === "all" || row.role === roleFilter
      const matchesStatus = statusFilter === "all" || row.status === statusFilter
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

  const updateUser = async (id: string, payload: Record<string, unknown>) => {
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
      const user = data.user as UserRow
      setRows((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
                ...row,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                createdByAdmin: user.createdByAdmin,
                emailVerifiedAt: user.emailVerifiedAt,
                phoneVerifiedAt: user.phoneVerifiedAt,
                twoFactorEnabled: user.twoFactorEnabled,
                moduleIds: user.modules.map((module) => module.id),
                modules: user.modules,
              }
            : row,
        ),
      )
      setMessage("Usuario atualizado")
    } catch (err) {
      console.error(err)
      setMessage("Erro ao atualizar usuario")
    } finally {
      setLoading(id, false)
    }
  }

  const createUser = async () => {
    setCreating(true)
    setMessage("")
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setMessage(data.message || "Erro ao criar usuario")
        return
      }

      const user = data.user as UserRow
      setRows((prev) => [
        {
          ...user,
          emailVerifiedAt: user.emailVerifiedAt || null,
          phoneVerifiedAt: user.phoneVerifiedAt || null,
          twoFactorEnabled: user.twoFactorEnabled || false,
          createdAt: user.createdAt || new Date().toISOString(),
          moduleIds: user.modules.map((module) => module.id),
          modules: user.modules,
        },
        ...prev,
      ])
      setNewUser({ name: "", email: "", password: "", role: "CLIENT", moduleIds: [] })
      setMessage(`Conta criada. Senha temporaria: ${data.temporaryPassword}`)
    } catch (error) {
      console.error(error)
      setMessage("Erro ao criar usuario")
    } finally {
      setCreating(false)
    }
  }

  const toggleModule = (moduleIds: string[], moduleId: string) =>
    moduleIds.includes(moduleId) ? moduleIds.filter((id) => id !== moduleId) : [...moduleIds, moduleId]

  const parseCsv = (value: string) => {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(",").map((part) => part.trim()))
      .filter((parts) => parts.length >= 2)
      .map((parts) => ({
        name: parts[0] || "",
        email: parts[1] || "",
        role: (parts[2] || "CLIENT").toUpperCase(),
        moduleKeys: parts[3] ? parts[3].split("|").map((item) => item.trim()).filter(Boolean) : [],
      }))
  }

  const moduleKeyToId = (key: string) => moduleOptions.find((module) => module.key === key)?.id

  const importCsv = async () => {
    setBulkBusy(true)
    setBulkResult("")
    const rowsToCreate = parseCsv(bulkCsv)
    if (!rowsToCreate.length) {
      setBulkResult("Nenhuma linha valida encontrada.")
      setBulkBusy(false)
      return
    }

    let created = 0
    let failed = 0
    for (const row of rowsToCreate) {
      const moduleIds = row.moduleKeys.map(moduleKeyToId).filter(Boolean) as string[]
      try {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: row.name,
            email: row.email,
            role: row.role,
            moduleIds,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.success) {
          failed += 1
          continue
        }
        const user = data.user as UserRow
        setRows((prev) => [
          {
            ...user,
            emailVerifiedAt: user.emailVerifiedAt || null,
            phoneVerifiedAt: user.phoneVerifiedAt || null,
            twoFactorEnabled: user.twoFactorEnabled || false,
            createdAt: user.createdAt || new Date().toISOString(),
            moduleIds: user.modules.map((module) => module.id),
            modules: user.modules,
          },
          ...prev,
        ])
        created += 1
      } catch (error) {
        console.error(error)
        failed += 1
      }
    }

    setBulkResult(`Importacao concluida: ${created} criados, ${failed} falhas.`)
    setBulkBusy(false)
  }

  const resetPassword = async (user: UserRow) => {
    const newPassword = (passwordDrafts[user.id] || "").trim()
    if (!newPassword) {
      setMessage("Informe a nova senha antes de salvar.")
      return
    }

    setLoading(user.id, true)
    setMessage("")
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setMessage(data.message || "Erro ao redefinir senha")
        return
      }
      setPasswordDrafts((prev) => ({ ...prev, [user.id]: "" }))
      setMessage(`Senha redefinida para ${user.email}`)
    } catch (error) {
      console.error(error)
      setMessage("Erro ao redefinir senha")
    } finally {
      setLoading(user.id, false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/25">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Usuarios</p>
          <h1 className="mt-2 text-3xl font-semibold">Contas administradas pela equipe K9</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Crie clientes manualmente, defina senha temporaria e atribua os modulos que cada pessoa pode acessar.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Nome">
              <input
                value={newUser.name}
                onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do cliente"
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white"
              />
            </Field>
            <Field label="Email">
              <input
                value={newUser.email}
                onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="cliente@k9training.com.br"
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white"
              />
            </Field>
            <Field label="Senha temporaria">
              <input
                value={newUser.password}
                onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Se vazio, a plataforma gera"
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white"
              />
            </Field>
            <Field label="Papel">
              <select
                value={newUser.role}
                onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-6">
            <p className="text-sm text-slate-200/80">Modulos liberados</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {moduleOptions.map((module) => {
                const active = newUser.moduleIds.includes(module.id)
                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => setNewUser((prev) => ({ ...prev, moduleIds: toggleModule(prev.moduleIds, module.id) }))}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active ? "border-cyan-300/40 bg-cyan-500/15" : "border-white/10 bg-slate-950/35 hover:bg-white/10"
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">{module.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan-200/80">{module.key}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{module.description || "Modulo sem descricao."}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              disabled={creating}
              onClick={createUser}
              className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 disabled:opacity-60"
            >
              {creating ? "Criando conta..." : "Criar conta manualmente"}
            </button>
          </div>
        </section>

        <section className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/25">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Filtros</p>
          <div className="mt-4 space-y-4">
            <Field label="Buscar">
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
                placeholder="Nome ou email"
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white"
              />
            </Field>
            <Field label="Papel">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white"
              >
                <option value="all">Todos</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white"
              >
                <option value="all">Todos</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {message ? <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-cyan-50">{message}</div> : null}
        </section>
      </div>

      <section className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/25">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Importacao rapida</p>
        <h2 className="mt-2 text-xl font-semibold">Criar usuarios via CSV</h2>
        <p className="mt-2 text-sm text-slate-300">
          Formato: <strong>nome,email,role,modulos</strong> (modulos separados por <code>|</code>). Exemplo:
        </p>
        <pre className="mt-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-xs text-slate-200">
{"Ana Silva,ana@email.com,CLIENT,COURSES|CONTENT_LIBRARY\nCarlos Souza,carlos@email.com,CLIENT,DOGS|TRAINING"}
        </pre>
        <textarea
          value={bulkCsv}
          onChange={(e) => setBulkCsv(e.target.value)}
          rows={6}
          placeholder="Cole o CSV aqui"
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={bulkBusy}
            onClick={importCsv}
            className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {bulkBusy ? "Importando..." : "Importar CSV"}
          </button>
          {bulkResult ? <span className="text-sm text-cyan-100">{bulkResult}</span> : null}
        </div>
      </section>

      <div className="overflow-x-auto rounded-[28px] border border-white/10 bg-white/5">
        <table className="min-w-full text-sm">
          <thead className="text-slate-300">
            <tr className="border-b border-white/10">
              <th className="p-4 text-left">Usuario</th>
              <th className="p-4 text-left">Papel</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Modulos</th>
              <th className="p-4 text-left">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((user) => {
              const emailOk = !!user.emailVerifiedAt
              const phoneOk = !!user.phoneVerifiedAt
              return (
                <tr key={user.id} className="border-b border-white/5 align-top">
                  <td className="p-4">
                    <Link href={`/admin/users/${user.id}`} className="block transition hover:text-cyan-200">
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-xs text-slate-400">{user.email}</div>
                    </Link>
                    <div className="mt-2 text-xs text-slate-500">
                      {user.createdByAdmin ? "Conta criada pelo admin" : "Conta legada"}
                    </div>
                  </td>
                  <td className="p-4">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        setRows((prev) => prev.map((row) => (row.id === user.id ? { ...row, role: e.target.value } : row)))
                      }
                      className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs text-white"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4">
                    <select
                      value={user.status}
                      onChange={(e) =>
                        setRows((prev) => prev.map((row) => (row.id === user.id ? { ...row, status: e.target.value } : row)))
                      }
                      className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs text-white"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 text-xs text-slate-400">
                      Email: {emailOk ? "ok" : "pendente"} • Telefone: {phoneOk ? "ok" : "pendente"}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="grid gap-2">
                      {moduleOptions.map((module) => {
                        const checked = user.moduleIds.includes(module.id)
                        return (
                          <label key={module.id} className="flex items-center gap-2 text-xs text-slate-300">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setRows((prev) =>
                                  prev.map((row) =>
                                    row.id === user.id
                                      ? {
                                          ...row,
                                          moduleIds: toggleModule(row.moduleIds, module.id),
                                          modules: toggleModule(row.moduleIds, module.id).map((moduleId) => {
                                            const option = moduleOptions.find((item) => item.id === moduleId)
                                            return {
                                              id: option?.id || moduleId,
                                              key: option?.key || moduleId,
                                              name: option?.name || moduleId,
                                            }
                                          }),
                                        }
                                      : row,
                                  ),
                                )
                              }
                            />
                            <span>{module.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white hover:bg-white/10"
                      >
                        Ver
                      </Link>
                      <button
                        disabled={!!busy[user.id]}
                        onClick={() =>
                          updateUser(user.id, {
                            role: user.role,
                            status: user.status,
                            moduleIds: user.moduleIds,
                          })
                        }
                        className="rounded-xl bg-cyan-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        Salvar
                      </button>
                      <button
                        disabled={!!busy[user.id]}
                        onClick={() => updateUser(user.id, { emailVerified: !emailOk })}
                        className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white hover:bg-white/10"
                      >
                        Email
                      </button>
                      <button
                        disabled={!!busy[user.id]}
                        onClick={() => updateUser(user.id, { phoneVerified: !phoneOk })}
                        className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white hover:bg-white/10"
                      >
                        Telefone
                      </button>
                      <button
                        disabled={!!busy[user.id]}
                        onClick={() => updateUser(user.id, { twoFactorEnabled: false })}
                        className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white hover:bg-white/10"
                      >
                        Reset 2FA
                      </button>
                      <button
                        disabled={!!busy[user.id]}
                        onClick={() => resetPassword(user)}
                        className="rounded-xl border border-amber-300/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100"
                      >
                        Reset senha
                      </button>
                    </div>
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Nova senha"
                        value={passwordDrafts[user.id] || ""}
                        onChange={(e) => setPasswordDrafts((prev) => ({ ...prev, [user.id]: e.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-slate-200/80">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  )
}
