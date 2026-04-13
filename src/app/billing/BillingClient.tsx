"use client"

import { useState } from "react"

import { usePlatformSession } from "@/app/components/PlatformSessionProvider"

type Plan = {
  code: string
  name: string
  price: string
  description: string
  checkoutReady: boolean
  highlight?: boolean
  perks: string[]
}

function getButtonLabel({
  isCurrent,
  isPending,
  isLoading,
  planCode,
  planName,
  checkoutReady,
}: {
  isCurrent: boolean
  isPending: boolean
  isLoading: boolean
  planCode: string
  planName: string
  checkoutReady: boolean
}) {
  if (isCurrent) return "Plano atual"
  if (isLoading) return "Processando..."
  if (!checkoutReady && planCode !== "FREE") return "Indisponivel agora"
  if (isPending) return "Concluir pagamento"
  return planCode === "FREE" ? "Ficar no Free" : `Escolher ${planName}`
}

export default function BillingClient({
  plans,
  currentPlan,
  planStatus,
  billingProvider,
  providerLabel,
}: {
  plans: Plan[]
  currentPlan: string
  planStatus: string
  billingProvider: string
  providerLabel: string
}) {
  const [message, setMessage] = useState("")
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [managing, setManaging] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const { refreshSession } = usePlatformSession()

  const canManageCurrentPlan = currentPlan !== "FREE" && (planStatus === "ACTIVE" || planStatus === "PAST_DUE")
  const hasStripePortal = billingProvider === "STRIPE"

  const handleSelect = async (plan: Plan) => {
    const checkoutReady = plan.code === "FREE" || plan.checkoutReady
    if (!checkoutReady) {
      setMessage(`Esse plano ainda nao foi conectado ao ${providerLabel}. Configure o ambiente antes de liberar a assinatura.`)
      return
    }

    setLoadingPlan(plan.code)
    setMessage("")

    try {
      if (plan.code === "FREE") {
        const response = await fetch("/api/billing/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: "FREE" }),
        })
        const data = await response.json().catch(() => null)
        if (!response.ok || !data?.success) {
          setMessage(data?.message || "Nao foi possivel ativar o plano free agora.")
          return
        }
        setMessage("Plano Free ativo. Seu acesso basico ja esta liberado.")
        await refreshSession()
        window.location.reload()
        return
      }

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.code }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success || !data?.url) {
        setMessage(data?.message || "Nao foi possivel iniciar o checkout agora.")
        return
      }

      window.location.href = data.url
    } catch (err) {
      console.error("Erro checkout", err)
      setMessage("Erro ao iniciar a assinatura.")
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleManageSubscription = async () => {
    setManaging(true)
    setMessage("")

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.success || !data?.url) {
        setMessage(data?.message || "Nao foi possivel abrir o autoatendimento agora.")
        return
      }

      window.location.href = data.url
    } catch (error) {
      console.error("Erro portal billing", error)
      setMessage("Erro ao abrir o autoatendimento da assinatura.")
    } finally {
      setManaging(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!window.confirm("Tem certeza de que deseja cancelar a assinatura agora?")) return

    setCanceling(true)
    setMessage("")

    try {
      const response = await fetch("/api/billing/subscription", {
        method: "DELETE",
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.success) {
        setMessage(data?.message || "Nao foi possivel cancelar a assinatura agora.")
        return
      }

      setMessage(data?.message || "Assinatura cancelada com sucesso.")
      await refreshSession()
      window.location.reload()
    } catch (error) {
      console.error("Erro cancelamento billing", error)
      setMessage("Erro ao cancelar a assinatura.")
    } finally {
      setCanceling(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const isSelected = currentPlan === plan.code
          const isCurrent = isSelected && planStatus === "ACTIVE"
          const isPending = isSelected && (planStatus === "CHECKOUT_REQUIRED" || planStatus === "CHECKOUT_PENDING")
          const checkoutReady = plan.code === "FREE" || plan.checkoutReady

          return (
            <article
              key={plan.code}
              className={`rounded-[30px] border p-6 shadow-lg shadow-black/25 ${
                plan.highlight
                  ? "border-cyan-300/25 bg-[linear-gradient(150deg,rgba(8,145,178,0.16),rgba(255,255,255,0.04))]"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold">{plan.name}</h2>
                    {plan.highlight ? <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs text-cyan-100">Mais forte</span> : null}
                    {isCurrent ? <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-100">Ativo</span> : null}
                    {isPending ? <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-100">Pendente</span> : null}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{plan.description}</p>
                </div>
                <p className="text-xl font-semibold text-cyan-200">{plan.price}</p>
              </div>

              <div className="mt-5 space-y-2">
                {plan.perks.map((perk) => (
                  <p key={perk} className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-slate-100">
                    {perk}
                  </p>
                ))}
              </div>

              {!checkoutReady ? (
                <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
                  Faltando conectar esse plano ao {providerLabel}.
                </div>
              ) : null}

              <button
                onClick={() => handleSelect(plan)}
                disabled={!!loadingPlan || isCurrent || (!checkoutReady && plan.code !== "FREE")}
                className={`mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isCurrent
                    ? "border border-emerald-300/20 bg-emerald-500/10 text-emerald-100"
                    : "bg-[linear-gradient(135deg,#06b6d4,#10b981)] text-white shadow-lg shadow-cyan-500/20 hover:-translate-y-0.5"
                } disabled:cursor-not-allowed disabled:opacity-70`}
              >
                {getButtonLabel({
                  isCurrent,
                  isPending,
                  isLoading: loadingPlan === plan.code,
                  planCode: plan.code,
                  planName: plan.name,
                  checkoutReady,
                })}
              </button>
            </article>
          )
        })}
      </div>

      {message ? <p className="text-sm text-cyan-100">{message}</p> : null}

      {canManageCurrentPlan ? (
        <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Gerenciar assinatura</p>
              <p className="text-sm leading-6 text-slate-300">
                {hasStripePortal
                  ? "Abra o portal para trocar cartao, atualizar cobranca, cancelar ou reativar quando o Stripe estiver no comando."
                  : "Com o provedor atual, o cancelamento ja pode ser feito aqui. Para troca de cartao e reativacao, ainda falta a camada de autoatendimento completa."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {hasStripePortal ? (
                <button
                  type="button"
                  onClick={handleManageSubscription}
                  disabled={managing || canceling}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {managing ? "Abrindo portal..." : "Gerenciar no Stripe"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={managing || canceling}
                className="rounded-2xl bg-[linear-gradient(135deg,#f97316,#ef4444)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {canceling ? "Cancelando..." : "Cancelar assinatura"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
