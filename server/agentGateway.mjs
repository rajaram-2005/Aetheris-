import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

loadDotEnv()

const PORT = Number(process.env.AETHERIS_AGENT_PORT || 8787)
const HOST = process.env.AETHERIS_AGENT_HOST || '0.0.0.0'
const BASE_URL = String(process.env.AETHERIS_API_BASE_URL || '').replace(/\/$/, '')
const MODEL = process.env.AETHERIS_MODEL || 'local-coding-agent'
const ALLOWED_ORIGIN = process.env.AETHERIS_ALLOWED_ORIGIN || '*'
const MAX_BODY_BYTES = 1_500_000

function readApiKey() {
  if (process.env.AETHERIS_API_KEY_FILE) {
    try { return readFileSync(resolve(process.env.AETHERIS_API_KEY_FILE), 'utf8').trim() } catch { return '' }
  }
  return String(process.env.AETHERIS_API_KEY || '').trim()
}

function configured() {
  return Boolean(readApiKey() && BASE_URL)
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': ALLOWED_ORIGIN,
    'access-control-allow-headers': 'content-type',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
  })
  response.end(JSON.stringify(payload))
}

function safeHealth() {
  return {
    status: configured() ? 'ready' : 'needs-configuration',
    providerConfigured: Boolean(BASE_URL),
    keyConfigured: Boolean(readApiKey()),
    keyTransport: process.env.AETHERIS_API_KEY_FILE ? 'file' : 'server environment',
    model: MODEL,
    endpoint: BASE_URL ? redactEndpoint(BASE_URL) : null,
    browserKeyExposure: false,
    localGateway: true,
  }
}

function redactEndpoint(value) {
  try {
    const url = new URL(value)
    return `${url.protocol}//${url.host}${url.pathname}`
  } catch {
    return '[configured endpoint]'
  }
}

async function handleChat(body) {
  if (!configured()) return { status: 503, payload: { error: 'agent_not_configured', message: 'Configure AETHERIS_API_KEY or AETHERIS_API_KEY_FILE and AETHERIS_API_BASE_URL on the server. Secrets are never accepted from the browser.' } }
  const messages = Array.isArray(body.messages)
    ? body.messages.filter((message) => message && ['system', 'user', 'assistant', 'tool'].includes(message.role) && typeof message.content === 'string').slice(-40)
    : body.prompt ? [{ role: 'user', content: String(body.prompt) }] : []
  if (!messages.length) return { status: 400, payload: { error: 'messages_required', message: 'Provide messages or a prompt.' } }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120_000)
  try {
    const upstream = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { authorization: `Bearer ${readApiKey()}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: body.model || MODEL, messages, temperature: body.temperature ?? 0.2, max_tokens: body.max_tokens ?? 4096, stream: false }),
      signal: controller.signal,
    })
    const text = await upstream.text()
    let data
    try { data = JSON.parse(text) } catch { data = { raw: text.slice(0, 20_000) } }
    return { status: upstream.status, payload: { ...data, _aetheris: { provider: redactEndpoint(BASE_URL), model: body.model || MODEL, keyExposed: false } } }
  } catch (error) {
    return { status: error.name === 'AbortError' ? 504 : 502, payload: { error: 'provider_unreachable', message: error.name === 'AbortError' ? 'Provider request timed out.' : 'The configured provider could not be reached.' } }
  } finally {
    clearTimeout(timeout)
  }
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return sendJson(response, 204, {})
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)
  if (url.pathname === '/api/agent/health' && request.method === 'GET') return sendJson(response, 200, safeHealth())
  if (url.pathname === '/api/agent/chat' && request.method === 'POST') {
    try {
      const body = await readBody(request)
      const result = await handleChat(body)
      return sendJson(response, result.status, result.payload)
    } catch (error) {
      return sendJson(response, error.code === 'BODY_TOO_LARGE' ? 413 : 400, { error: error.code === 'BODY_TOO_LARGE' ? 'body_too_large' : 'invalid_json', message: error.message })
    }
  }
  return sendJson(response, 404, { error: 'not_found' })
})

server.listen(PORT, HOST, () => {
  console.log(`Aetheris coding-agent gateway listening on ${HOST}:${PORT}`)
  console.log(`Provider configured: ${configured() ? 'yes' : 'no'} · browser key exposure: no`)
})

function readBody(request) {
  return new Promise((resolveBody, reject) => {
    let size = 0
    let body = ''
    request.setEncoding('utf8')
    request.on('data', (chunk) => {
      size += Buffer.byteLength(chunk)
      if (size > MAX_BODY_BYTES) {
        const error = new Error('Request body exceeds the local gateway limit.')
        error.code = 'BODY_TOO_LARGE'
        reject(error)
        request.destroy()
        return
      }
      body += chunk
    })
    request.on('end', () => {
      try { resolveBody(body ? JSON.parse(body) : {}) } catch (error) { reject(error) }
    })
    request.on('error', reject)
  })
}

function loadDotEnv() {
  const path = resolve(process.cwd(), '.env')
  if (!existsSync(path)) return
  const lines = readFileSync(path, 'utf8').split(/\r?\n/)
  lines.forEach((line) => {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match || process.env[match[1]]) return
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  })
}
