export const BILLING_PROVIDERS = ["ASAAS", "STRIPE"] as const

export type BillingProvider = (typeof BILLING_PROVIDERS)[number]

export function getBillingProvider(): BillingProvider {
  const value = String(process.env.BILLING_PROVIDER || process.env.PAYMENT_PROVIDER || "ASAAS").toUpperCase()
  return value === "STRIPE" ? "STRIPE" : "ASAAS"
}

export function getBillingProviderLabel(provider: BillingProvider = getBillingProvider()) {
  return provider === "STRIPE" ? "Stripe" : "Asaas"
}

export function isAsaasConfigured() {
  return Boolean(process.env.ASAAS_API_KEY)
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export function isBillingConfigured(provider: BillingProvider = getBillingProvider()) {
  return provider === "STRIPE" ? isStripeConfigured() : isAsaasConfigured()
}
