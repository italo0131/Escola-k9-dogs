type AsaasRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE"
  body?: string
}

type AsaasErrorResponse = {
  errors?: Array<{
    code?: string
    description?: string
  }>
}

export type AsaasCheckoutPayload = {
  billingTypes: string[]
  chargeTypes: string[]
  minutesToExpire?: number
  callback: {
    successUrl: string
    cancelUrl: string
    expiredUrl: string
  }
  items: Array<{
    name: string
    description?: string
    quantity: number
    value: number
  }>
  customer?: string
  customerData?: {
    name: string
    email?: string
  }
  subscription?: {
    cycle: "MONTHLY" | "YEARLY"
    nextDueDate: string
  }
}

export type AsaasCheckoutResponse = {
  id: string
  status?: string
  customer?: string
}

export class AsaasApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = "AsaasApiError"
    this.status = status
    this.payload = payload
  }
}

export function hasAsaasConfig() {
  return Boolean(process.env.ASAAS_API_KEY)
}

export function getAsaasEnvironment() {
  const value = String(process.env.ASAAS_ENVIRONMENT || "SANDBOX").toUpperCase()
  return value === "PRODUCTION" ? "PRODUCTION" : "SANDBOX"
}

export function getAsaasApiBaseUrl() {
  return getAsaasEnvironment() === "PRODUCTION" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3"
}

export function getAsaasCheckoutBaseUrl() {
  return getAsaasEnvironment() === "PRODUCTION" ? "https://asaas.com" : "https://sandbox.asaas.com"
}

export function getAsaasCheckoutUrl(checkoutId: string) {
  return `${getAsaasCheckoutBaseUrl()}/checkoutSession/show?id=${encodeURIComponent(checkoutId)}`
}

function getAsaasErrorMessage(payload: AsaasErrorResponse | null, fallback: string) {
  const message = payload?.errors?.map((item) => item.description).filter(Boolean).join(" ")
  return message || fallback
}

async function asaasRequest<T>(path: string, options: AsaasRequestOptions = {}) {
  const apiKey = process.env.ASAAS_API_KEY

  if (!apiKey) {
    throw new AsaasApiError("ASAAS_API_KEY nao configurada.", 500, null)
  }

  const response = await fetch(`${getAsaasApiBaseUrl()}${path}`, {
    method: options.method || "GET",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      access_token: apiKey,
    },
    body: options.body,
    cache: "no-store",
  })

  const payload = (await response.json().catch(() => null)) as T | AsaasErrorResponse | null

  if (!response.ok) {
    throw new AsaasApiError(
      getAsaasErrorMessage(payload as AsaasErrorResponse | null, "Falha ao comunicar com o Asaas."),
      response.status,
      payload,
    )
  }

  return payload as T
}

export async function createAsaasCheckout(payload: AsaasCheckoutPayload) {
  return asaasRequest<AsaasCheckoutResponse>("/checkouts", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function cancelAsaasSubscription(subscriptionId: string) {
  return asaasRequest(`/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: "DELETE",
  })
}
