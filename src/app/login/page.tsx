"use client"

import Link from "next/link"
import { type FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSession, signIn, useSession } from "next-auth/react"

import { useAppToast } from "@/app/components/AppToastProvider"

export default function LoginPage() {
  const router = useRouter()
  const { status } = useSession()
  const { pushToast } = useAppToast()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard")
    }
  }, [status, router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        twoFactorCode: needsTwoFactor ? twoFactorCode : undefined,
        redirect: false,
      })

      if (res?.error) {
        if (res.error === "2FA_REQUIRED") {
          const note = "Enviamos um codigo extra para confirmar que e voce."
          setNeedsTwoFactor(true)
          setMessage(note)
          pushToast({ title: "Confirmacao extra ativada", description: note, variant: "info" })
          return
        }

        if (res.error === "2FA_INVALID") {
          const note = "O codigo informado nao bateu. Vale conferir e tentar de novo."
          setMessage(note)
          pushToast({ title: "Codigo invalido", description: note, variant: "error" })
          return
        }

        if (res.error === "ACCOUNT_SUSPENDED") {
          const note = "Sua conta esta temporariamente indisponivel. Se precisar, chame o suporte para entendermos juntos."
          setMessage(note)
          pushToast({ title: "Conta indisponivel", description: note, variant: "error" })
          return
        }

        if (res.error === "TOO_MANY_ATTEMPTS") {
          const note = "Houve muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente."
          setMessage(note)
          pushToast({ title: "Muitas tentativas", description: note, variant: "error" })
          return
        }

        const note = "Nao consegui entrar com esses dados. Vale revisar email e senha com calma."
        setMessage(note)
        pushToast({ title: "Acesso nao confirmado", description: note, variant: "error" })
        return
      }

      const session = await getSession()
      const destination = session?.user?.emailVerifiedAt ? "/dashboard" : "/verify"
      pushToast({
        title: "Tudo certo por aqui",
        description: session?.user?.emailVerifiedAt
          ? "Seu acesso foi liberado. Vamos continuar de onde voce parou."
          : "Seu acesso foi liberado. Falta so confirmar o email para liberar tudo.",
        variant: "success",
      })
      router.push(destination)
    } catch (error) {
      console.error("Erro ao logar", error)
      const note = "Ops, algo deu errado ao entrar. Tente novamente em alguns instantes."
      setMessage(note)
      pushToast({ title: "Falha no login", description: note, variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-10 top-10 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.12),transparent_25%),radial-gradient(circle_at_60%_80%,rgba(16,185,129,0.12),transparent_30%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col px-4 py-12 sm:px-6 md:flex-row md:items-center md:gap-8 lg:gap-10">
        <div className="flex-1 space-y-6 fade-in-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-cyan-200/80">
            Acesso K9 Training
          </span>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">Entre e siga no seu ritmo, com clareza sobre o proximo passo.</h1>
          <p className="max-w-xl text-lg leading-8 text-gray-300/85">
            Tutores acompanham rotina e progresso. Profissionais organizam agenda, conteudo e relacionamento. A plataforma te guia sem pressa e sem ruido.
          </p>
          <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            <Badge title="Tutor" value="Treinos, caes e agenda no mesmo lugar" />
            <Badge title="Profissional" value="Conteudos, atendimentos e comunidade" />
            <Badge title="Seguranca" value="Email verificado e protecao extra quando necessario" />
          </div>
        </div>

        <div className="flex-1 fade-in-up">
          <div className="surface-card mx-auto w-full max-w-lg rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6">
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Entrar</p>
              <h2 className="text-2xl font-semibold">Que bom te ver por aqui.</h2>
              <p className="mt-2 text-sm leading-7 text-gray-300/80">
                Use suas credenciais para continuar de onde parou. Se ainda faltar alguma confirmacao, a plataforma vai te orientar sem te deixar perdido.
              </p>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm text-gray-200/80">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-gray-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-sm text-gray-200/80">Senha</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-gray-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition"
                />
              </div>

              {needsTwoFactor ? (
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4">
                  <label htmlFor="two-factor-code" className="text-sm text-cyan-50">Codigo de confirmacao</label>
                  <input
                    id="two-factor-code"
                    value={twoFactorCode}
                    onChange={(event) => setTwoFactorCode(event.target.value)}
                    placeholder="Digite o codigo que enviamos"
                    autoComplete="one-time-code"
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-gray-400 focus:border-cyan-300/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition"
                  />
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="interactive-button mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-3 font-semibold text-white shadow-lg shadow-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Entrando com seguranca..." : needsTwoFactor ? "Confirmar e entrar" : "Entrar no meu painel"}
              </button>
            </form>

            {message ? <p className="mt-4 text-sm leading-7 text-cyan-100">{message}</p> : null}

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-300">
              Se a plataforma te pedir verificacao de email ou codigo extra, isso e so uma camada de protecao para a sua conta e para a comunidade.
            </div>

            <div className="mt-6 flex items-center justify-between text-sm text-gray-300/80">
              <span>Ainda nao tem conta?</span>
              <Link href="/register" className="text-cyan-300 underline-offset-4 hover:text-cyan-200 hover:underline">
                Criar conta
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Badge({ title, value }: { title: string; value: string }) {
  return (
    <div className="surface-card rounded-2xl px-4 py-3 shadow-inner shadow-black/20">
      <p className="text-xs uppercase tracking-wide text-gray-300/70">{title}</p>
      <p className="text-base font-semibold text-white">{value}</p>
    </div>
  )
}
