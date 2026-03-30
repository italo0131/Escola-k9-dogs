import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ success: false, message: "Stripe nao configurado" }, { status: 500 })
  }

  const signature = req.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature || !webhookSecret) {
    return NextResponse.json({ success: false, message: "Webhook secret ausente" }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: any
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err: any) {
    console.error("Stripe webhook signature error:", err?.message)
    return NextResponse.json({ success: false, message: "Assinatura invalida" }, { status: 400 })
  }

  const data = event.data?.object || {}
  const type = event.type || "unknown"
  const amount = data.amount_paid || data.amount_total || data.amount_due || data.amount || null
  const currency = data.currency || null
  const status = data.status || null
  const customerEmail = data.customer_email || data.customer_details?.email || null
  const customerId = data.customer || null
  const metadataUserId = data.metadata?.userId || null
  const metadataPlan = String(data.metadata?.plan || "").toUpperCase() || null

  let userId: string | null = null
  if (metadataUserId) {
    userId = metadataUserId
  } else if (customerEmail) {
    const user = await prisma.user.findUnique({ where: { email: customerEmail } })
    userId = user?.id || null
  }

  try {
    await prisma.payment.upsert({
      where: { stripeEventId: event.id },
      update: {
        type,
        status,
        amount,
        currency,
        customerEmail,
        customerId,
        userId,
        raw: JSON.stringify(event),
      },
      create: {
        stripeEventId: event.id,
        type,
        status,
        amount,
        currency,
        customerEmail,
        customerId,
        userId,
        raw: JSON.stringify(event),
      },
    })

    if (userId) {
      if (type === "checkout.session.completed") {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: metadataPlan || "STARTER",
            planStatus: "ACTIVE",
            planActivatedAt: new Date(),
          },
        })
      }

      if (type === "invoice.payment_failed") {
        await prisma.user.update({
          where: { id: userId },
          data: {
            planStatus: "PAST_DUE",
          },
        })
      }

      if (type === "customer.subscription.deleted") {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "FREE",
            planStatus: "ACTIVE",
          },
        })
      }
    }
  } catch (err) {
    console.error("Erro ao salvar evento Stripe:", err)
    return NextResponse.json({ success: false, message: "Erro ao salvar evento" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
