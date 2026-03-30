"use client"

import { FormEvent, useState } from "react"

export function LoginForm({ onSubmit }: { onSubmit: (payload: { email: string; password: string }) => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ email, password })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="email"
        className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="rounded-lg bg-cyan-500 px-4 py-2 text-white font-semibold">Entrar</button>
    </form>
  )
}
