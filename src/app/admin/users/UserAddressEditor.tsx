"use client"

import { useState } from "react"

type AddressPayload = {
  zipCode?: string | null
  addressStreet?: string | null
  addressNumber?: string | null
  addressNeighborhood?: string | null
  addressCity?: string | null
  addressState?: string | null
  addressComplement?: string | null
  addressCountry?: string | null
  addressNotes?: string | null
}

type Props = {
  userId: string
  initial: AddressPayload
}

export default function UserAddressEditor({ userId, initial }: Props) {
  const [form, setForm] = useState<AddressPayload>(initial)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const updateField = (key: keyof AddressPayload) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const lookupCep = async () => {
    const zip = String(form.zipCode || "").replace(/\D/g, "")
    if (zip.length < 8) {
      setMessage("Informe um CEP valido para buscar.")
      return
    }
    setMessage("")
    try {
      const res = await fetch(`/api/cep/${zip}`)
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setMessage(data?.message || "Nao foi possivel consultar o CEP.")
        return
      }
      setForm((prev) => ({
        ...prev,
        addressStreet: data.street || prev.addressStreet,
        addressNeighborhood: data.neighborhood || prev.addressNeighborhood,
        addressCity: data.city || prev.addressCity,
        addressState: data.state || prev.addressState,
        addressCountry: data.country || prev.addressCountry || "Brasil",
      }))
    } catch (error) {
      console.error(error)
      setMessage("Erro ao consultar o CEP.")
    }
  }

  const save = async () => {
    setLoading(true)
    setMessage("")
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setMessage(data.message || "Erro ao salvar endereco")
        return
      }
      setMessage("Endereco atualizado")
    } catch (error) {
      console.error(error)
      setMessage("Erro ao salvar endereco")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-lg font-semibold">Endereco e contato</h2>
      <p className="mt-2 text-sm text-slate-300">Use o CEP para preencher automaticamente o endereco do cliente.</p>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Field label="CEP">
          <input
            value={form.zipCode || ""}
            onChange={(e) => updateField("zipCode")(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
          />
        </Field>
        <Field label="Rua">
          <input
            value={form.addressStreet || ""}
            onChange={(e) => updateField("addressStreet")(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
          />
        </Field>
        <Field label="Numero">
          <input
            value={form.addressNumber || ""}
            onChange={(e) => updateField("addressNumber")(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
          />
        </Field>
        <Field label="Bairro">
          <input
            value={form.addressNeighborhood || ""}
            onChange={(e) => updateField("addressNeighborhood")(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
          />
        </Field>
        <Field label="Cidade">
          <input
            value={form.addressCity || ""}
            onChange={(e) => updateField("addressCity")(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
          />
        </Field>
        <Field label="Estado">
          <input
            value={form.addressState || ""}
            onChange={(e) => updateField("addressState")(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
          />
        </Field>
        <Field label="Complemento">
          <input
            value={form.addressComplement || ""}
            onChange={(e) => updateField("addressComplement")(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
          />
        </Field>
        <Field label="Pais">
          <input
            value={form.addressCountry || ""}
            onChange={(e) => updateField("addressCountry")(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
          />
        </Field>
      </div>

      <Field label="Observacoes">
        <textarea
          value={form.addressNotes || ""}
          onChange={(e) => updateField("addressNotes")(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
        />
      </Field>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={lookupCep}
          className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100"
        >
          Buscar CEP
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={save}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Salvar endereco"}
        </button>
        {message ? <span className="text-sm text-cyan-100">{message}</span> : null}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-slate-300">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  )
}
