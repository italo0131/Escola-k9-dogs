"use client"

import { useState } from "react"

type ModuleRow = {
  id: string
  key: string
  name: string
  description?: string | null
  contentIds: string[]
  _count: {
    users: number
  }
}

export default function ModulesManager({ initialModules }: { initialModules: ModuleRow[] }) {
  const [rows, setRows] = useState(initialModules)
  const [contentInputs, setContentInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialModules.map((module) => [module.id, module.contentIds.join("\n")])),
  )
  const [message, setMessage] = useState("")
  const [creating, setCreating] = useState(false)
  const [newModule, setNewModule] = useState({
    key: "",
    name: "",
    description: "",
  })

  const createModule = async () => {
    setCreating(true)
    setMessage("")
    try {
      const res = await fetch("/api/admin/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newModule),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setMessage(data.message || "Erro ao criar modulo")
        return
      }
      setRows((prev) => [...prev, data.module])
      setNewModule({ key: "", name: "", description: "" })
      setMessage("Modulo criado")
    } catch (error) {
      console.error(error)
      setMessage("Erro ao criar modulo")
    } finally {
      setCreating(false)
    }
  }

  const removeModule = async (id: string) => {
    setMessage("")
    const res = await fetch(`/api/admin/modules/${id}`, { method: "DELETE" })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.success) {
      setMessage(data.message || "Erro ao remover modulo")
      return
    }
    setRows((prev) => prev.filter((row) => row.id !== id))
    setMessage("Modulo removido")
  }

  const parseContentIds = (value: string) =>
    value
      .split(/\r?\n|,/g)
      .map((entry) => entry.trim())
      .filter(Boolean)

  const updateContentIds = async (id: string) => {
    setMessage("")
    const contentIds = parseContentIds(contentInputs[id] || "")
    const res = await fetch(`/api/admin/modules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentIds }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.success) {
      setMessage(data.message || "Erro ao atualizar acessos")
      return
    }
    setRows((prev) => prev.map((row) => (row.id === id ? data.module : row)))
    setContentInputs((prev) => ({ ...prev, [id]: data.module.contentIds.join("\n") }))
    setMessage("Acessos atualizados")
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/25">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Modulos</p>
        <h1 className="mt-2 text-3xl font-semibold">Catalogo de acesso da K9 Training</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Crie modulos que representam cursos, treinos, agenda ou pacotes internos. Depois eles podem ser atribuídos
          diretamente aos clientes.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <input
            value={newModule.key}
            onChange={(e) => setNewModule((prev) => ({ ...prev, key: e.target.value }))}
            placeholder="CHAVE_MODULO"
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white"
          />
          <input
            value={newModule.name}
            onChange={(e) => setNewModule((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Nome do modulo"
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white"
          />
          <input
            value={newModule.description}
            onChange={(e) => setNewModule((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Descricao opcional"
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={createModule}
            disabled={creating}
            className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 disabled:opacity-60"
          >
            {creating ? "Criando..." : "Criar modulo"}
          </button>
          {message ? <p className="text-sm text-cyan-50">{message}</p> : null}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((module) => (
          <article key={module.id} className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-white">{module.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan-200/80">{module.key}</p>
              </div>
              <button
                type="button"
                onClick={() => removeModule(module.id)}
                className="rounded-xl border border-red-300/20 bg-red-500/10 px-3 py-2 text-xs text-red-100"
              >
                Remover
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{module.description || "Modulo sem descricao."}</p>
            <div className="mt-4 space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">IDs liberados</p>
              <textarea
                value={contentInputs[module.id] || ""}
                onChange={(e) => setContentInputs((prev) => ({ ...prev, [module.id]: e.target.value }))}
                rows={4}
                placeholder="Cole IDs ou slugs de cursos/aulas (um por linha)"
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs text-white"
              />
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span>Deixe vazio para liberar todas as aulas deste modulo.</span>
                <button
                  type="button"
                  onClick={() => updateContentIds(module.id)}
                  className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100"
                >
                  Salvar acessos
                </button>
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400">{module._count.users} usuarios vinculados</div>
          </article>
        ))}
      </div>
    </div>
  )
}
