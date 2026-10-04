const DEFAULT_SYSTEM_PROMPT = `You are the Aetheris full coding agent. Work as a careful senior engineer. Understand the request, inspect only the provided context, propose a plan, make minimal correct changes, and report tests and risks. Never invent files, test results, credentials, or tool access. Return implementation-ready code and patches when asked. Keep secrets out of source code and logs.`

export class CodingAgentClient {
  constructor({ basePath = '/api/agent', fetchImpl = globalThis.fetch } = {}) {
    this.basePath = basePath.replace(/\/$/, '')
    this.fetchImpl = fetchImpl
  }

  async health() {
    if (!this.fetchImpl) return { status: 'unavailable', message: 'Fetch is not available in this runtime.' }
    try {
      const response = await this.fetchImpl(`${this.basePath}/health`, { headers: { accept: 'application/json' } })
      return await response.json()
    } catch {
      return { status: 'offline', message: 'The local coding-agent gateway is not reachable.' }
    }
  }

  async chat({ prompt, messages = [], context = '', model, temperature = 0.2, maxTokens = 4096 } = {}) {
    if (!this.fetchImpl) throw new Error('Fetch is not available in this runtime.')
    const normalized = messages.length ? messages : [
      { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
      ...(context ? [{ role: 'user', content: `Project context:\n${context}` }] : []),
      { role: 'user', content: String(prompt || '') },
    ]
    const response = await this.fetchImpl(`${this.basePath}/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ messages: normalized, model, temperature, max_tokens: maxTokens }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || data.error || `Coding agent request failed with ${response.status}.`)
    return data
  }

  async run(prompt, options = {}) {
    const response = await this.chat({ prompt, ...options })
    const content = response.choices?.[0]?.message?.content || response.output || response.message || ''
    return { ...response, content, provider: response._aetheris?.provider || 'server gateway', model: response._aetheris?.model || options.model || null }
  }
}

export { DEFAULT_SYSTEM_PROMPT }
