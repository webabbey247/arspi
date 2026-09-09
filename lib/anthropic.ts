import Anthropic from "@anthropic-ai/sdk"

let _client: Anthropic | undefined

function getClient(): Anthropic {
  if (_client) return _client
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable.")
  }
  return (_client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }))
}

// Lazily-initialized proxy — the Anthropic client is created on first method call,
// not at module load time. This lets `next build` succeed without the key in the
// build environment; the error surfaces at runtime if the key is truly absent.
export const anthropic = new Proxy({} as Anthropic, {
  get(_, prop) {
    const c = getClient()
    const val = Reflect.get(c, prop)
    return typeof val === "function" ? (val as (...a: unknown[]) => unknown).bind(c) : val
  },
})
