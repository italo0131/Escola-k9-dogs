import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import type Stripe from "stripe"
import { NextResponse } from "next/server"
import { requireApiUser } from "../../_auth"

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ success: false, message: "Stripe nao configurado" }, { status: 500 })
  }

  try {
    const { session: authSession, error } = await requireApiUser()
    if (error) return error

    const body = await req.json()
    const requestedPlan = String(body.plan || "STARTER").toUpperCase()
    const fallbackPriceId =
      requestedPlan === "PRO"
        ? process.env.STRIPE_PRICE_ID_PRO || ""
        : process.env.STRIPE_PRICE_ID_STARTER || process.env.STRIPE_PRICE_ID || ""
    const priceId = String(body.priceId || fallbackPriceId || "").trim()

    if (requestedPlan !== "STARTER" && requestedPlan !== "PRO") {
      return NextResponse.json({ success: false, message: "Escolha um plano pago valido para iniciar a assinatura." }, { status: 400 })
    }

    if (!priceId) {
      return NextResponse.json({ success: false, message: "O plano escolhido ainda nao foi configurado no Stripe." }, { status: 400 })
    }

    const userId = authSession.user.id!
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planStatus: true },
    })
    const hasActivePaidPlan =
      !!currentUser &&
      String(currentUser.plan || "FREE").toUpperCase() !== "FREE" &&
      String(currentUser.planStatus || "ACTIVE").toUpperCase() === "ACTIVE"
    const isPlanSwitch = String(currentUser?.plan || "FREE").toUpperCase() !== requestedPlan
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const successUrl = new URL(process.env.STRIPE_SUCCESS_URL || `${baseUrl}/billing`)
    successUrl.searchParams.set("status", "success")
    successUrl.searchParams.set("plan", requestedPlan)

    const cancelUrl = new URL(process.env.STRIPE_CANCEL_URL || `${baseUrl}/billing`)
    cancelUrl.searchParams.set("status", "cancel")
    cancelUrl.searchParams.set("plan", requestedPlan)

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: authSession.user.email ?? undefined,
      client_reference_id: userId,
      metadata: { userId, plan: requestedPlan },
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
    }

    if (!(hasActivePaidPlan && isPlanSwitch)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: requestedPlan,
          planStatus: "CHECKOUT_PENDING",
          planActivatedAt: null,
        },
      })
    }

    const session = await stripe.checkout.sessions.create(params)

    return NextResponse.json({ success: true, url: session.url })
  } catch (error) {
    console.error("ERRO CHECKOUT STRIPE:", error)
    return NextResponse.json({ success: false, message: "Erro ao criar checkout" }, { status: 500 })
  }
}
