import type { ReactNode } from "react"

import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import BillingClient from "./BillingClient"
import {
  ACCOUNT_PLAN_OPTIONS,
  getAccountPlanDescription,
  getAccountPlanLabel,
  getPlanUpgradeReason,
  getPlanStatusLabel,
} from "@/lib/platform"

function getStripePriceIdForPlan(planCode: string) {
  if (planCode === "STARTER") {
    return process.env.STRIPE_PRICE_ID_STARTER || process.env.STRIPE_PRICE_ID || null
  }

  if (planCode === "PRO") {
    return process.env.STRIPE_PRICE_ID_PRO || null
  }

  return null
}

function isHighlightedPlan(planCode: string) {
  return planCode === "PRO"
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: { locked?: string; status?: string; plan?: string }
}) {
  const session = await requireUser()
  const lockedPath = searchParams?.locked || ""
  const checkoutStatus = String(searchParams?.status || "").toLowerCase()
  const checkoutPlan = String(searchParams?.plan || "").toUpperCase()

  const [payments, user] = await Promise.all([
    prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: true,
        planStatus: true,
        planActivatedAt: true,
        emailVerifiedAt: true,
      },
    }),
  ])

  const plans = ACCOUNT_PLAN_OPTIONS.map((plan) => ({
    code: plan.code,
    name: plan.name,
    price: plan.priceLabel,
    description: plan.description,
    perks: [...plan.perks],
    priceId: getStripePriceIdForPlan(plan.code),
    highlight: isHighlightedPlan(plan.code),
  }))

  const currentPlan = String(user?.plan || "FREE").toUpperCase()
  const currentStatus = String(user?.planStatus || "ACTIVE").toUpperCase()
  const hasCheckoutConfig = plans.some((plan) => plan.code !== "FREE" && !!plan.priceId)
  const lastPayment = payments[0]
  const nextStep = !user?.emailVerifiedAt
    ? "Confirme seu email para proteger a conta."
    : currentPlan === "FREE"
      ? "Escolha um plano pago quando quiser liberar tudo."
      : currentStatus === "ACTIVE"
        ? "Sua assinatura esta pronta para uso."
        : "Conclua o checkout para liberar o plano escolhido."

  return (
    <div className="min-h-[100svh] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_24%),linear-gradient(145deg,#020617,#0f172a_55%,#020617)] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(160deg,rgba(8,145,178,0.12),rgba(255,255,255,0.03))] p-8 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Assinatura</p>
              <h1 className="text-3xl font-semibold md:text-4xl">Escolha o nivel de acesso da sua conta.</h1>
              <p className="max-w-2xl text-slate-300">
                Free libera blog, racas e ate 3 caes. Starter e Pro liberam o restante da plataforma.
              </p>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-slate-950/35 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Plano atual</p>
              <p className="mt-2 text-2xl font-semibold">{getAccountPlanLabel(currentPlan)}</p>
              <p className="mt-2 text-sm text-slate-300">{getPlanStatusLabel(currentStatus)}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <StatusTile title="Acesso atual" value={getAccountPlanLabel(currentPlan)} description={getAccountPlanDescription(currentPlan)} />
            <StatusTile title="Proximo passo" value={nextStep} description={user?.emailVerifiedAt ? "Conta protegida e pronta para seguir." : "Sem email confirmado, vale concluir essa etapa primeiro."} />
            <StatusTile
              title="Checkout"
              value={hasCheckoutConfig ? "Stripe conectado" : "Configurar Stripe"}
              description={hasCheckoutConfig ? "Os planos pagos ja podem abrir checkout." : "Faltando price ID para concluir a assinatura dos planos pagos."}
            />
          </div>
        </section>

        {checkoutStatus === "success" ? (
          <Notice tone="success">
            Pagamento enviado. Estamos confirmando a assinatura do plano <strong>{getAccountPlanLabel(checkoutPlan || currentPlan)}</strong>.
          </Notice>
        ) : null}

        {checkoutStatus === "cancel" ? (
          <Notice tone="warning">
            O checkout foi interrompido. Sua conta continua salva e voce pode retomar a assinatura quando quiser.
          </Notice>
        ) : null}

        {currentStatus === "CHECKOUT_REQUIRED" || currentStatus === "CHECKOUT_PENDING" ? (
          <Notice tone="warning">
            Sua conta ja esta vinculada ao plano <strong>{getAccountPlanLabel(currentPlan)}</strong>, mas a assinatura ainda nao foi concluida.
          </Notice>
        ) : null}

        {lockedPath ? (
          <Notice tone="info">
            <strong>Upgrade necessario:</strong> {getPlanUpgradeReason(lockedPath)}
          </Notice>
        ) : null}

        {!user?.emailVerifiedAt ? (
          <Notice tone="info">
            Confirme o email antes de depender da sua assinatura no dia a dia. Isso evita bloqueios e protege o acesso da conta.
          </Notice>
        ) : null}

        {lastPayment ? (
          <div className="rounded-[26px] border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-300">
            Ultimo evento financeiro: <strong className="text-white">{lastPayment.type}</strong> em{" "}
            {new Date(lastPayment.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}.
          </div>
        ) : null}

        <BillingClient plans={plans} currentPlan={currentPlan} planStatus={currentStatus} />
      </div>
    </div>
  )
}

function StatusTile({
  title,
  value,
  description,
}: {
  title: string
  value: string
  description: string
}) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </div>
  )
}

function Notice({
  children,
  tone,
}: {
  children: ReactNode
  tone: "success" | "warning" | "info"
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-300/20 bg-emerald-500/10 text-emerald-50"
      : tone === "warning"
        ? "border-amber-300/20 bg-amber-500/10 text-amber-50"
        : "border-cyan-300/20 bg-cyan-500/10 text-cyan-50"

  return <div className={`rounded-[26px] border p-5 text-sm leading-7 ${toneClass}`}>{children}</div>
}
