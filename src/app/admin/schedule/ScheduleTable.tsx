"use client"

import Link from "next/link"
import { useState } from "react"

type ScheduleRow = {
  id: string
  date: string
  status: string
  userName?: string | null
}

export default function ScheduleTable({ initialSchedules }: { initialSchedules: ScheduleRow[] }) {
  const [rows, setRows] = useState<ScheduleRow[]>(initialSchedules)
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState<Record<string, boolean>>({})

  const setLoading = (id: string, value: boolean) => {
    setBusy((prev) => ({ ...prev, [id]: value }))
  }

  const updateSchedule = async (id: string, payload: any) => {
    setLoading(id, true)
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
      setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status: schedule.status, date: schedule.date } : row)))
      setMessage("Agenda atualizada")
    } catch (err) {
      console.error(err)
      setMessage("Erro ao atualizar agenda")
    } finally {
      setLoading(id, false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <p className="text-sm text-gray-300">Atualize status e horarios.</p>
      </div>

      {message && <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm">{message}</div>}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="min-w-full text-sm">
          <thead className="text-gray-300">
            <tr className="border-b border-white/10">
              <th className="p-3 text-left">Data</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Tutor</th>
              <th className="p-3 text-left">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-white/5">
                <td className="p-3 text-sm">
                  <input
                    value={new Date(row.date).toISOString().slice(0, 16)}
                    onChange={(e) =>
                      setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, date: e.target.value } : item)))
                    }
                    type="datetime-local"
                    className="rounded-lg border border-white/10 bg-white/10 px-2 py-2 text-white text-xs"
                  />
                </td>
                <td className="p-3">
                  <select
                    value={row.status}
                    onChange={(e) =>
                      setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, status: e.target.value } : item)))
                    }
                    className="rounded-lg border border-white/10 bg-white/10 px-2 py-2 text-white text-xs"
                  >
                    <option value="scheduled">scheduled</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </td>
                <td className="p-3 text-xs text-gray-300">{row.userName || "-"}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/calendar"
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white hover:bg-white/10"
                    >
                      Ver
                    </Link>
                    <button
                      disabled={!!busy[row.id]}
                      onClick={() => updateSchedule(row.id, { status: row.status, date: row.date })}
                      className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      Salvar
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
