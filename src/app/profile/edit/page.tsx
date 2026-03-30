"use client"

import { FormEvent, ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type UserProfile = {
  id: string
  name: string
  email: string
  phone?: string | null
  role?: string
  plan?: string
  headline?: string | null
  bio?: string | null
  city?: string | null
  state?: string | null
  specialties?: string | null
  experienceYears?: number | null
  availabilityNotes?: string | null
  websiteUrl?: string | null
  instagramHandle?: string | null
  emailVerifiedAt?: string | null
  phoneVerifiedAt?: string | null
  twoFactorEnabled?: boolean
}

export default function EditProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [headline, setHeadline] = useState("")
  const [bio, setBio] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [specialties, setSpecialties] = useState("")
  const [experienceYears, setExperienceYears] = useState("")
  const [availabilityNotes, setAvailabilityNotes] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [instagramHandle, setInstagramHandle] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetch("/api/profile")
      .then(async (res) => {
        const text = await res.text()
        const data = text ? JSON.parse(text) : null
        if (!res.ok || !data?.success) {
          setMessage(data?.message || "Nao foi possivel carregar o perfil")
          return
        }
        setUser(data.user)
        setName(data.user.name)
        setEmail(data.user.email)
        setPhone(data.user.phone || "")
        setHeadline(data.user.headline || "")
        setBio(data.user.bio || "")
        setCity(data.user.city || "")
        setState(data.user.state || "")
        setSpecialties(data.user.specialties || "")
        setExperienceYears(data.user.experienceYears ? String(data.user.experienceYears) : "")
        setAvailabilityNotes(data.user.availabilityNotes || "")
        setWebsiteUrl(data.user.websiteUrl || "")
        setInstagramHandle(data.user.instagramHandle || "")
        setTwoFactorEnabled(!!data.user.twoFactorEnabled)
      })
      .catch((err) => {
        console.error("Erro carregando perfil", err)
        setMessage("Erro ao carregar perfil")
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (newPassword && newPassword !== confirmPassword) {
      setMessage("As senhas nao coincidem")
      return
    }

    const wantsEmailChange = email !== user?.email
    const wantsPasswordChange = !!newPassword
    if ((wantsEmailChange || wantsPasswordChange) && !currentPassword) {
      setMessage("Informe a senha atual para alterar email ou senha")
      return
    }

    setSaving(true)
    setMessage("")
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          headline,
          bio,
          city,
          state,
          specialties,
          experienceYears: experienceYears ? Number(experienceYears) : null,
          availabilityNotes,
          websiteUrl,
          instagramHandle,
          twoFactorEnabled,
          password: newPassword || undefined,
          currentPassword: currentPassword || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        setMessage(data.message || "Erro ao salvar")
        return
      }

      setMessage(
        wantsEmailChange
          ? "Perfil atualizado. Seu email precisa ser confirmado novamente."
          : "Dados atualizados com sucesso"
      )
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      router.refresh()
      router.push("/profile")
    } catch (err) {
      console.error("Erro ao salvar perfil", err)
      setMessage("Erro ao salvar perfil")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl rounded-[32px] border border-white/10 bg-white/6 p-8 shadow-2xl">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Perfil</p>
          <h1 className="text-2xl font-semibold text-white">Editar perfil com posicionamento claro</h1>
          <p className="mt-2 text-sm text-slate-300">Atualize sua identidade, disponibilidade e os dados de acesso da conta.</p>
        </div>

        {loading ? (
          <p className="text-gray-300">Carregando...</p>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                />
              </Field>

              <Field label="Headline">
                <input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Ex.: Adestramento com rotina, clareza e leitura comportamental"
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                />
              </Field>
            </div>

            <Field label="Bio">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                />
              </Field>

              <Field label="Telefone">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Cidade">
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                />
              </Field>

              <Field label="Estado">
                <input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                />
              </Field>

              <Field label="Especialidades">
                <input
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                />
              </Field>

              <Field label="Experiencia">
                <input
                  type="number"
                  min={0}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Website">
                <input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                />
              </Field>

              <Field label="Instagram">
                <input
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                />
              </Field>
            </div>

            <Field label="Disponibilidade e observacoes">
              <textarea
                value={availabilityNotes}
                onChange={(e) => setAvailabilityNotes(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
              />
            </Field>

            <label className="flex items-center gap-2 text-sm text-gray-200/80">
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={(e) => setTwoFactorEnabled(e.target.checked)}
              />
              Ativar 2FA por codigo no email
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Senha atual (obrigatoria para alterar email/senha)">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                />
              </Field>

              <div className="grid gap-4">
                <Field label="Nova senha">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Preencha para trocar a senha"
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                  />
                </Field>

                <Field label="Confirmar nova senha">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white"
                  />
                </Field>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="rounded-2xl border border-white/15 px-4 py-3 text-gray-100 hover:bg-white/10 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-5 py-3 text-white font-semibold shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar alteracoes"}
              </button>
            </div>
          </form>
        )}

        {message && <p className="mt-4 text-sm text-cyan-100">{message}</p>}
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
