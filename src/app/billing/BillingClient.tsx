"use client"

import { useState } from "react"

import { usePlatformSession } from "@/app/components/PlatformSessionProvider"

type Plan = {
  code: string
  name: string
  price: string
  description: string
  priceId?: string | null
  highlight?: boolean
  perks: string[]
}

function getButtonLabel({
  isCurrent,
  isPending,
  isLoading,
  planCode,
  checkoutReady,
}: {
  isCurrent: boolean
  isPending: boolean
  isLoading: boolean
  planCode: string
  checkoutReady: boolean
}) {
  if (isCurrent) return "Plano atual"
  if (isLoading) return "Processando..."
  if (!checkoutReady && planCode !== "FREE") return "Indisponivel agora"
  if (isPending) return "Concluir assinatura"
  return planCode === "FREE" ? "Ficar no Free" : `Escolher ${planCode === "PRO" ? "Pro" : "Starter"}`
}

export default function BillingClient({
  plans,
  currentPlan,
  planStatus,
}: {
  plans: Plan[]
  currentPlan: string
  planStatus: string
}) {
  const [message, setMessage] = useState("")
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const { refreshSession } = usePlatformSession()

  const handleSelect = async (plan: Plan) => {
    const checkoutReady = plan.code === "FREE" || !!plan.priceId
    if (!checkoutReady) {
      setMessage("Esse plano ainda nao foi conectado ao Stripe. Configure o price ID antes de liberar a assinatura.")
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
        body: JSON.stringify({ priceId: plan.priceId, plan: plan.code }),
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

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const isSelected = currentPlan === plan.code
          const isCurrent = isSelected && planStatus === "ACTIVE"
          const isPending = isSelected && (planStatus === "CHECKOUT_REQUIRED" || planStatus === "CHECKOUT_PENDING")
          const checkoutReady = plan.code === "FREE" || !!plan.priceId

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
                  Faltando integrar o price ID desse plano no Stripe.
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
                  checkoutReady,
                })}
              </button>
            </article>
          )
        })}
      </div>

      {message ? <p className="text-sm text-cyan-100">{message}</p> : null}
    </div>
  )
}
