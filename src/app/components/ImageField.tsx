"use client"

import { ChangeEvent, useRef, useState } from "react"

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  helperText?: string
}

export default function ImageField({ label, value, onChange, helperText }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (!response.ok || !data?.success || !data?.url) {
        setMessage(data?.message || "Nao foi possivel enviar a imagem")
        return
      }

      onChange(data.url)
      setMessage("Imagem enviada com sucesso.")
    } catch (error) {
      console.error(error)
      setMessage("Erro ao enviar imagem")
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-200/80">{label}</label>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Cole um link de imagem ou envie do seu dispositivo"
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
        />
      </div>

      {value && (
        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/40">
          <img src={value} alt="Preview da imagem" className="h-56 w-full object-cover" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-medium text-gray-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? "Enviando imagem..." : "Enviar imagem"}
        </button>
        {helperText && <p className="text-xs text-slate-400">{helperText}</p>}
      </div>

      {message && <p className="text-xs text-cyan-100">{message}</p>}
    </div>
  )
}
