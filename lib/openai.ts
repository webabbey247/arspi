import OpenAI from "openai"

let _client: OpenAI | undefined

function getClient(): OpenAI {
  if (_client) return _client
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY environment variable.")
  }
  return (_client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }))
}

// Lazily-initialized proxy — the OpenAI client is created on first method call,
// not at module load time. This lets `next build` succeed without the key in the
// build environment; the error surfaces at runtime if the key is truly absent.
export const openai = new Proxy({} as OpenAI, {
  get(_, prop) {
    const c = getClient()
    const val = Reflect.get(c, prop)
    return typeof val === "function" ? (val as (...a: unknown[]) => unknown).bind(c) : val
  },
})
