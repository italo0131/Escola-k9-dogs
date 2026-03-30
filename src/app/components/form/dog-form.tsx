"use client"

import { FormEvent, useState } from "react"

export function DogForm({ onSubmit }: { onSubmit: (payload: { name: string; breed: string; age: number }) => void }) {
  const [name, setName] = useState("")
  const [breed, setBreed] = useState("")
  const [age, setAge] = useState(1)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ name, breed, age })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
        placeholder="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
        placeholder="Raca"
        value={breed}
        onChange={(e) => setBreed(e.target.value)}
      />
      <input
        type="number"
        className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
        placeholder="Idade"
        value={age}
        onChange={(e) => setAge(Number(e.target.value))}
      />
      <button className="rounded-lg bg-cyan-500 px-4 py-2 text-white font-semibold">Salvar</button>
    </form>
  )
}
