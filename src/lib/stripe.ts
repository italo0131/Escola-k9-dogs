import Stripe from "stripe"

const key = process.env.STRIPE_SECRET_KEY
const defaultApiVersion: Stripe.LatestApiVersion = "2024-04-10"
const apiVersion = (process.env.STRIPE_API_VERSION || defaultApiVersion) as Stripe.StripeConfig["apiVersion"]

export const stripe = key
  ? new Stripe(key, {
      apiVersion,
      typescript: true,
    })
  : null
