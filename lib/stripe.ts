import Stripe from "stripe"

let _client: Stripe | undefined

function getClient(): Stripe {
  if (_client) return _client
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.")
  }
  return (_client = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-03-25.dahlia",
  }))
}

// Lazily-initialized proxy — the Stripe client is created on first method call,
// not at module load time. This lets `next build` succeed without the key in the
// build environment; the error surfaces at runtime if the key is truly absent.
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    const c = getClient()
    const val = Reflect.get(c, prop)
    return typeof val === "function" ? (val as (...a: unknown[]) => unknown).bind(c) : val
  },
})
