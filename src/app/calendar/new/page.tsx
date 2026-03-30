"use client"

import { FormEvent, ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { isStaffRole } from "@/lib/role"
import { SCHEDULE_FORMATS, getScheduleFormatLabel } from "@/lib/platform"

type Dog = {
  id: string
  name: string
  ownerId: string
  owner?: { id: string; name: string }
}

type UserOption = {
  id: string
  name: string
  email: string
}

export default function NewSchedulePage() {
  const router = useRouter()
  const { data } = useSession()
  const isStaff = isStaffRole(data?.user?.role)
  const [users, setUsers] = useState<UserOption[]>([])
  const [dogs, setDogs] = useState<Dog[]>([])
  const [userId, setUserId] = useState("")
  const [dogId, setDogId] = useState("")
  const [title, setTitle] = useState("Sessao de treino")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [status, setStatus] = useState("Confirmado")
  const [format, setFormat] = useState("PRESENTIAL")
  const [durationMinutes, setDurationMinutes] = useState("60")
  const [location, setLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const dogsRes = await fetch("/api/dogs")
        const dogsData = await dogsRes.json()
        setDogs(Array.isArray(dogsData) ? dogsData : [])

        if (Array.isArray(dogsData) && dogsData[0]) {
          setDogId(dogsData[0].id)
          if (isStaff && dogsData[0].ownerId) {
            setUserId(dogsData[0].ownerId)
          }
        }

        if (isStaff) {
          const usersRes = await fetch("/api/users")
          const usersData = await usersRes.json()
          if (Array.isArray(usersData)) {
            setUsers(usersData)
            if (!userId && usersData[0]) {
              setUserId(usersData[0].id)
            }
          }
        }
      } catch (error) {
        console.error(error)
        setMessage("Erro ao carregar dados de agenda")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isStaff])

  const handleDogChange = (value: string) => {
    setDogId(value)
    const selectedDog = dogs.find((dog) => dog.id === value)
    if (isStaff && selectedDog?.ownerId) {
      setUserId(selectedDog.ownerId)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setMessage("")
    try {
      const iso = date && time ? `${date}T${time}:00` : date
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date: iso,
          status,
          format,
          durationMinutes: Number(durationMinutes),
          location,
          notes,
          dogId: dogId || undefined,
          userId: isStaff ? userId || undefined : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.success === false) {
        setMessage(data.message || "Erro ao salvar agendamento")
        return
      }
      router.push("/calendar")
    } catch (err) {
      console.error(err)
      setMessage("Erro ao salvar agendamento")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6 rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-2xl">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Agenda</p>
          <h1 className="text-3xl font-semibold">Novo agendamento disciplinado</h1>
          <p className="mt-2 text-slate-300">Marque a sessao com contexto, local, formato e responsavel para manter a rotina organizada.</p>
        </div>

        {loading ? (
          <p className="text-slate-300">Carregando...</p>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Titulo">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                />
              </Field>

              <Field label="Status">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                >
                  <option className="text-black">Pendente</option>
                  <option className="text-black">Confirmado</option>
                  <option className="text-black">Concluido</option>
                  <option className="text-black">Cancelado</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Data">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                />
              </Field>

              <Field label="Hora">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Formato">
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                >
                  {SCHEDULE_FORMATS.map((item) => (
                    <option key={item} value={item} className="text-black">
                      {getScheduleFormatLabel(item)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Duracao (min)">
                <input
                  type="number"
                  min={15}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                />
              </Field>

              <Field label="Local">
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Studio, parque, online..."
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {isStaff && (
                <Field label="Tutor">
                  <select
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                  >
                    <option value="" className="text-black">
                      Selecionar tutor
                    </option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id} className="text-black">
                        {user.name} • {user.email}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <Field label="Cao">
                <select
                  value={dogId}
                  onChange={(e) => handleDogChange(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                >
                  <option value="" className="text-black">
                    Sem cao vinculado
                  </option>
                  {dogs.map((dog) => (
                    <option key={dog.id} value={dog.id} className="text-black">
                      {dog.name} {dog.owner?.name ? `• ${dog.owner.name}` : ""}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Notas operacionais">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Objetivo da sessao, material necessario, condicoes do ambiente."
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
              />
            </Field>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-2xl border border-white/15 px-4 py-3 text-gray-100 hover:bg-white/10 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-5 py-3 text-white font-semibold shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar agendamento"}
              </button>
            </div>
          </form>
        )}

        {message && <p className="text-sm text-cyan-100">{message}</p>}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-gray-200/80">{label}</span>
      {children}
    </label>
  )
}
