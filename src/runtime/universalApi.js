export const API_ROUTES = [
  '/chat', '/input', '/language', '/tasks', '/agents', '/models', '/memory', '/knowledge', '/files', '/vision', '/audio', '/image', '/video', '/3d', '/tools', '/mcp', '/workflows', '/apps', '/terminal', '/browser', '/devices', '/simulation', '/evaluate', '/plugins', '/health', '/architecture', '/phases',
]

export class UniversalApi {
  constructor({ runtime } = {}) {
    this.runtime = runtime
    this.requests = []
  }

  request(path, { method = 'GET', body = {}, sessionId = 'local-session' } = {}) {
    const route = normalizePath(path)
    const known = API_ROUTES.includes(route)
    let data = null
    if (known && route === '/chat' && method === 'POST' && body.message) data = this.runtime?.submit(body.message, body.context || {})
    else if (known && route === '/input' && method === 'POST') data = this.runtime?.inputReception?.receive(body.input || body, { source: body.source || 'api', sessionId })
    else if (known && route === '/language' && method === 'POST') data = this.runtime?.languageDetection?.detect(body.input || body)
    else if (known && route === '/tasks' && body.id && body.action === 'approve') data = this.runtime?.approve(body.id)
    else if (known && route === '/tasks' && body.id && body.action === 'pause') data = this.runtime?.pauseTask(body.id, body.reason)
    else if (known && route === '/tasks' && body.id && body.action === 'resume') data = this.runtime?.resumeTask(body.id)
    else if (known && route === '/tasks' && body.id && body.action === 'cancel') data = this.runtime?.cancelTask(body.id, body.reason)
    else if (known && route === '/tasks' && body.id) data = this.runtime?.getTask(body.id)
    else if (known && route === '/tasks' && method === 'GET') data = this.runtime?.snapshot().tasks || []
    else if (known && route === '/tools' && method === 'POST' && body.name) data = this.runtime?.mcp?.call(body.name, body.arguments || body.args || {}, { approved: Boolean(body.approved), sessionId })
    else if (known && route === '/tools') data = this.runtime?.mcp?.discover(body || {}) || []
    else if (known && route === '/mcp' && method === 'POST' && body.name) data = this.runtime?.mcp?.call(body.name, body.arguments || body.args || {}, { approved: Boolean(body.approved), sessionId })
    else if (known && route === '/mcp') data = { servers: this.runtime?.snapshot().mcp?.serversList || [], tools: this.runtime?.mcp?.discover(body || {}) || [] }
    else if (known && route === '/models') data = this.runtime?.mcp?.call('aetheris.models.list', {}, { approved: true }) || { status: 'adapter-ready', route }
    else if (known && route === '/knowledge' && body.action === 'plan') data = this.runtime?.openSourceKnowledge?.plan(body) || {}
    else if (known && route === '/knowledge' && body.action === 'synthesize') data = this.runtime?.openSourceKnowledge?.synthesize(body) || {}
    else if (known && route === '/knowledge' && body.action === 'configure') data = this.runtime?.openSourceKnowledge?.configure(body) || {}
    else if (known && route === '/knowledge') data = this.runtime?.knowledge?.search(body.query || '', body.options || {}) || []
    else if (known && route === '/memory') data = this.runtime?.memory?.contextFor(body.query || '') || {}
    else if (known && route === '/plugins') data = this.runtime?.plugins?.snapshot() || { status: 'adapter-ready', route }
    else if (known && route === '/health') data = this.runtime?.health() || { status: 'adapter-ready', route }
    else if (known && route === '/architecture') data = { phases: this.runtime?.phaseEngine?.snapshot(), nativeIntelligence: this.runtime?.nativeIntelligence?.snapshot() }
    else if (known && route === '/phases' && body.action === 'advance') data = this.runtime?.phaseEngine?.step(body.taskId) || {}
    else if (known && route === '/phases' && body.action === 'run') data = this.runtime?.phaseEngine?.runToCompletion(body.taskId, { delay: body.delay || 18 }) || {}
    else if (known && route === '/phases' && body.taskId) data = this.runtime?.phaseEngine?.observe(body.taskId) || {}
    else if (known && route === '/phases') data = this.runtime?.phaseEngine?.plan(body || {}) || {}
    else if (known) data = { status: 'adapter-ready', route }
    const response = { requestId: `api-${this.requests.length + 1}`, route, method, known, status: known ? 200 : 404, data, sessionId, createdAt: new Date().toISOString() }
    this.requests.unshift(response)
    return response
  }

  openApi() {
    return { version: '0.1', routes: API_ROUTES, auth: 'local session / adapter-defined', transport: 'HTTP or in-process contract' }
  }

  snapshot() {
    return { routes: API_ROUTES.length, requests: this.requests.length, spec: this.openApi() }
  }
}

function normalizePath(path) {
  const value = String(path || '').split('?')[0]
  return value.startsWith('/') ? value : `/${value}`
}
