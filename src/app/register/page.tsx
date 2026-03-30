"use client"

import { type FormEvent, type ReactNode, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

import { useAppToast } from "@/app/components/AppToastProvider"
import { ACCOUNT_PLAN_OPTIONS } from "@/lib/platform"
import { isProfessionalRole } from "@/lib/role"

const roleCards = [
  {
    value: "CLIENT",
    title: "Sou tutor",
    description: "Quero cuidar melhor do meu cao, aprender e acompanhar a rotina.",
  },
  {
    value: "TRAINER",
    title: "Sou adestrador",
    description: "Quero atender clientes, publicar conteudo e organizar minha operacao.",
  },
  {
    value: "VET",
    title: "Sou veterinario",
    description: "Quero orientar responsaveis e participar da jornada de cuidado.",
  },
] as const

const roleSummaryMap: Record<(typeof roleCards)[number]["value"], string> = {
  CLIENT: "Perfil voltado para estudo, rotina do cao e acompanhamento.",
  TRAINER: "Perfil voltado para atendimento, conteudo e relacionamento com clientes.",
  VET: "Perfil voltado para saude, orientacao e apoio tecnico dentro da plataforma.",
}

export default function RegisterPage() {
  const router = useRouter()
  const { pushToast } = useAppToast()

  const [role, setRole] = useState<(typeof roleCards)[number]["value"]>("CLIENT")
  const [plan, setPlan] = useState<(typeof ACCOUNT_PLAN_OPTIONS)[number]["code"]>("FREE")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [headline, setHeadline] = useState("")
  const [specialties, setSpecialties] = useState("")
  const [experienceYears, setExperienceYears] = useState("")
  const [bio, setBio] = useState("")
  const [availabilityNotes, setAvailabilityNotes] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [instagramHandle, setInstagramHandle] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const selectedPlan = useMemo(() => ACCOUNT_PLAN_OPTIONS.find((item) => item.code === plan) || ACCOUNT_PLAN_OPTIONS[0], [plan])
  const isProfessional = isProfessionalRole(role)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage("")

    const normalizedEmail = email.trim().toLowerCase()

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email: normalizedEmail,
          password,
          phone,
          role,
          plan,
          city,
          state,
          headline,
          specialties,
          experienceYears: experienceYears ? Number(experienceYears) : null,
          bio,
          availabilityNotes,
          websiteUrl,
          instagramHandle,
        }),
      })

      const data = await res.json().catch(() => null)

      if (res.ok && data?.success) {
        const note =
          isProfessional
            ? "Conta criada. Confirme seu email e aguarde a analise profissional da equipe."
            : plan === "FREE"
            ? "Conta criada. Agora so falta confirmar seu email para entrar com seguranca."
            : `Conta criada. Vamos confirmar seu email e seguir para a assinatura ${selectedPlan.name}.`

        setMessage(note)
        pushToast({ title: "Conta criada", description: note, variant: "success" })

        const login = await signIn("credentials", { email: normalizedEmail, password, redirect: false })
        if (login?.error) {
          const fallback = "Sua conta foi criada, mas o login automatico nao aconteceu. Voce pode entrar manualmente sem problema."
          setMessage(fallback)
          pushToast({ title: "Login manual necessario", description: fallback, variant: "info" })
          return
        }

        router.push(!isProfessional && plan !== "FREE" ? `/verify?next=billing&plan=${plan}` : "/verify")
        return
      }

      const note = data?.message || "Nao foi possivel criar sua conta agora. Tente novamente em alguns instantes."
      setMessage(note)
      pushToast({ title: "Cadastro nao concluido", description: note, variant: "error" })
    } catch (error) {
      console.error(error)
      const note = "Ops, algo deu errado ao criar sua conta. Tente novamente em alguns instantes."
      setMessage(note)
      pushToast({ title: "Falha no cadastro", description: note, variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_26%),linear-gradient(145deg,#020617,#0f172a_52%,#020617)] px-4 py-12 text-white sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
        <section className="space-y-6">
          <div className="space-y-4">
            <span className="inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan-100">
              Cadastro K9
            </span>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">Entre com o perfil certo e siga com clareza.</h1>
            <p className="max-w-xl text-base leading-7 text-slate-300">
              O fluxo agora e simples: escolha quem voce e, defina o plano inicial e confirme o email.
            </p>
          </div>

          <div className="grid gap-3">
            <StepCard number="01" title="Escolha seu papel" description="Tutor, adestrador ou veterinario. A plataforma muda junto com esse contexto." />
            <StepCard number="02" title="Confirme seu email" description="Essa etapa protege a conta e evita travas no uso real." />
            <StepCard
              number="03"
              title={isProfessional ? "Passe pela analise profissional" : "Ative o plano se quiser liberar tudo"}
              description={
                isProfessional
                  ? "Adestradores e veterinarios passam por validacao da equipe antes de operar como profissionais."
                  : "No Free voce entra. Nos pagos voce abre toda a operacao da plataforma."
              }
            />
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Resumo da escolha</p>
            <p className="mt-3 text-xl font-semibold">{roleCards.find((item) => item.value === role)?.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{roleSummaryMap[role]}</p>
            <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-50">
              Plano selecionado: <strong>{selectedPlan.name}</strong> • {selectedPlan.priceLabel}
            </div>
            {isProfessional ? (
              <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
                Seu perfil profissional entra em analise antes de criar canal, publicar conteudo exclusivo e atuar como especialista.
              </div>
            ) : null}
          </div>
        </section>

        <section className="surface-card rounded-[32px] p-8 shadow-2xl">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Criar conta</p>
            <h2 className="text-2xl font-semibold">Preencha o essencial</h2>
            <p className="text-sm leading-6 text-slate-300">Menos atrito na entrada, mais foco no uso real da plataforma.</p>
          </div>

          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm text-slate-200/80">Tipo de conta</label>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {roleCards.map((item) => {
                  const active = role === item.value
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setRole(item.value)}
                      className={`rounded-[24px] border p-4 text-left transition ${
                        active ? "border-cyan-300/50 bg-cyan-500/15 shadow-lg shadow-cyan-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <p className="text-base font-semibold">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-200/80">Plano inicial</label>
              <div className="mt-3 grid gap-3">
                {ACCOUNT_PLAN_OPTIONS.map((item) => {
                  const active = plan === item.code
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setPlan(item.code)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        active ? "border-cyan-300/50 bg-cyan-500/15 shadow-lg shadow-cyan-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold">{item.name}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-300">{item.description}</p>
                        </div>
                        <span className="text-sm font-semibold text-cyan-100">{item.priceLabel}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome" htmlFor="name">
                <input
                  id="name"
                  type="text"
                  placeholder="Como voce quer aparecer?"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </Field>

              <Field label="Email" htmlFor="email">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </Field>

              <Field label="Senha" htmlFor="password">
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Crie uma senha segura"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </Field>

              <Field label="Telefone" htmlFor="phone">
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+55 67 9xxxx-xxxx"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </Field>

              <Field label="Cidade" htmlFor="city">
                <input
                  id="city"
                  type="text"
                  placeholder="Sua cidade"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </Field>

              <Field label="Estado" htmlFor="state">
                <input
                  id="state"
                  type="text"
                  placeholder="UF"
                  value={state}
                  onChange={(event) => setState(event.target.value.toUpperCase())}
                  maxLength={2}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
              </Field>
            </div>

            {isProfessional ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Headline profissional" htmlFor="headline">
                  <input
                    id="headline"
                    type="text"
                    placeholder="Ex.: adestramento funcional e comportamento"
                    value={headline}
                    onChange={(event) => setHeadline(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </Field>

                <Field label="Especialidades" htmlFor="specialties">
                  <input
                    id="specialties"
                    type="text"
                    placeholder="Ex.: obediencia, socializacao, reabilitacao"
                    value={specialties}
                    onChange={(event) => setSpecialties(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </Field>

                <Field label="Anos de experiencia" htmlFor="experienceYears">
                  <input
                    id="experienceYears"
                    type="number"
                    min={0}
                    value={experienceYears}
                    onChange={(event) => setExperienceYears(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </Field>

                <Field label="Instagram" htmlFor="instagramHandle">
                  <input
                    id="instagramHandle"
                    type="text"
                    placeholder="@seuperfil"
                    value={instagramHandle}
                    onChange={(event) => setInstagramHandle(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </Field>

                <Field label="Site" htmlFor="websiteUrl">
                  <input
                    id="websiteUrl"
                    type="url"
                    placeholder="https://"
                    value={websiteUrl}
                    onChange={(event) => setWebsiteUrl(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </Field>

                <Field label="Disponibilidade" htmlFor="availabilityNotes">
                  <input
                    id="availabilityNotes"
                    type="text"
                    placeholder="Ex.: online e presencial em Campo Grande"
                    value={availabilityNotes}
                    onChange={(event) => setAvailabilityNotes(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Apresentacao profissional" htmlFor="bio">
                    <textarea
                      id="bio"
                      rows={4}
                      placeholder="Conte sua experiencia, sua abordagem e como voce trabalha."
                      value={bio}
                      onChange={(event) => setBio(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    />
                  </Field>
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-500/10 p-4 text-sm leading-7 text-emerald-50">
              {isProfessional
                ? "Seu cadastro profissional entra primeiro em verificacao e analise. Depois da aprovacao, o canal e os conteudos exclusivos ficam liberados."
                : plan === "FREE"
                ? "Voce entra no Free e ja pode montar sua base. Quando quiser liberar tudo, a assinatura pode ser feita depois."
                : `Sua conta ja nasce no fluxo ${selectedPlan.name}. Depois da verificacao de email, seguimos para o checkout.`}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#06b6d4,#10b981)] px-4 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Criando sua conta..." : "Criar minha conta"}
            </button>
          </form>

          {message ? <p className="mt-4 text-sm leading-7 text-cyan-100">{message}</p> : null}
        </section>
      </div>
    </div>
  )
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">{number}</p>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm text-slate-200/80">
        {label}
      </label>
      {children}
    </div>
  )
}
