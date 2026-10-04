export const API_ROUTES = [
  '/chat', '/input', '/language', '/tasks', '/agents', '/models', '/memory', '/knowledge', '/files', '/vision', '/audio', '/image', '/video', '/3d', '/tools', '/mcp', '/workflows', '/apps', '/terminal', '/browser', '/devices', '/simulation', '/evaluate', '/plugins', '/health', '/ready', '/architecture', '/native', '/phases', '/observability',
]

export class UniversalApi {
  constructor({ runtime, maxIdempotencyEntries = 300 } = {}) {
    this.runtime = runtime
    this.requests = []
    this.idempotency = new Map()
    this.maxIdempotencyEntries = maxIdempotencyEntries
  }

  request(path, { method = 'GET', body = {}, sessionId = 'local-session' } = {}) {
    const route = normalizePath(path)
    const known = API_ROUTES.includes(route)
    const idempotencyKey = body?.idempotencyKey || body?.requestKey || null
    const replayKey = idempotencyKey ? `${sessionId}:${method}:${route}:${idempotencyKey}` : null
    if (replayKey && this.idempotency.has(replayKey)) return { ...this.idempotency.get(replayKey), replayed: true }
    let data = null
    if (known && route === '/chat' && method === 'POST' && body.message) data = this.runtime?.submit(body.message, body.context || {})
    else if (known && route === '/chat' && method === 'POST') data = null
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
    else if (known && route === '/workflows' && body.action === 'define') data = this.runtime?.workflow?.define(body.workflow || body) || {}
    else if (known && route === '/workflows' && body.action === 'start') data = this.runtime?.workflow?.start(body.workflowId, body.context || {}) || {}
    else if (known && route === '/workflows' && body.action === 'approve') data = this.runtime?.workflow?.approve(body.runId) || {}
    else if (known && route === '/workflows' && body.action === 'advance') data = this.runtime?.workflow?.advance(body.runId, body.nodeId) || {}
    else if (known && route === '/workflows' && body.action === 'complete') data = this.runtime?.workflow?.completeNode(body.runId, body.nodeId, body.output || null) || {}
    else if (known && route === '/workflows' && body.action === 'fail') data = this.runtime?.workflow?.failNode(body.runId, body.nodeId, body.error, { retry: body.retry !== false }) || {}
    else if (known && route === '/workflows' && body.action === 'pause') data = this.runtime?.workflow?.pause(body.runId, body.reason) || {}
    else if (known && route === '/workflows' && body.action === 'resume') data = this.runtime?.workflow?.resume(body.runId) || {}
    else if (known && route === '/workflows' && body.action === 'cancel') data = this.runtime?.workflow?.cancel(body.runId, body.reason) || {}
    else if (known && route === '/workflows' && body.action === 'history') data = this.runtime?.workflow?.history(body.runId, { limit: body.limit || 100 }) || {}
    else if (known && route === '/workflows' && body.runId) data = this.runtime?.workflow?.observe(body.runId) || {}
    else if (known && route === '/knowledge' && body.action === 'plan') data = this.runtime?.openSourceKnowledge?.plan(body) || {}
    else if (known && route === '/knowledge' && body.action === 'synthesize') data = this.runtime?.openSourceKnowledge?.synthesize(body) || {}
    else if (known && route === '/knowledge' && body.action === 'configure') data = this.runtime?.openSourceKnowledge?.configure(body) || {}
    else if (known && route === '/knowledge') data = this.runtime?.knowledge?.search(body.query || '', body.options || {}) || []
    else if (known && route === '/memory') data = this.runtime?.memory?.contextFor(body.query || '') || {}
    else if (known && route === '/plugins') data = this.runtime?.plugins?.snapshot() || { status: 'adapter-ready', route }
    else if (known && route === '/health') data = this.runtime?.health() || { status: 'adapter-ready', route }
    else if (known && route === '/ready') data = this.runtime?.readiness() || { status: 'adapter-ready', route }
    else if (known && route === '/architecture') data = { phases: this.runtime?.phaseEngine?.snapshot(), nativeIntelligence: this.runtime?.nativeIntelligence?.snapshot() }
    else if (known && route === '/native' && body.action === 'contract') data = this.runtime?.nativeIntelligence?.contract(body.moduleId) || {}
    else if (known && route === '/native' && body.action === 'validate') data = this.runtime?.nativeIntelligence?.validate(body.moduleId, body.operation, body.input || {}) || {}
    else if (known && route === '/native' && body.action === 'execute') data = this.runtime?.nativeIntelligence?.execute(body.moduleId, body.operation, body.input || {}, { approved: Boolean(body.approved), sandbox: body.sandbox !== false }) || {}
    else if (known && route === '/native') data = this.runtime?.nativeIntelligence?.discover(body || {}) || []
    else if (known && route === '/phases' && body.action === 'advance') data = this.runtime?.phaseEngine?.step(body.taskId) || {}
    else if (known && route === '/phases' && body.action === 'run') data = this.runtime?.phaseEngine?.runToCompletion(body.taskId, { delay: body.delay || 18 }) || {}
    else if (known && route === '/phases' && body.action === 'pause') data = controlPhaseRun(this.runtime, 'pause', body.taskId, body.reason)
    else if (known && route === '/phases' && body.action === 'resume') data = controlPhaseRun(this.runtime, 'resume', body.taskId)
    else if (known && route === '/phases' && body.action === 'cancel') data = controlPhaseRun(this.runtime, 'cancel', body.taskId, body.reason)
    else if (known && route === '/phases' && body.action === 'history') data = this.runtime?.phaseEngine?.history(body.taskId, { limit: body.limit || 100, cursor: body.cursor || 0 }) || {}
    else if (known && route === '/phases' && body.action === 'export') data = this.runtime?.phaseEngine?.exportAudit(body.taskId, { format: body.format || 'json', limit: body.limit || 500 }) || {}
    else if (known && route === '/phases' && body.action === 'list') data = this.runtime?.phaseEngine?.observeAll({ limit: body.limit || 12, status: body.status }) || []
    else if (known && route === '/phases' && body.taskId) data = this.runtime?.phaseEngine?.observe(body.taskId) || {}
    else if (known && route === '/phases') data = this.runtime?.phaseEngine?.plan(body || {}) || {}
    else if (known && route === '/observability' && body.action === 'export') data = this.runtime?.phaseEngine?.exportAudit(body.taskId, { format: body.format || 'json', limit: body.limit || 500 }) || {}
    else if (known && route === '/observability' && body.taskId) data = this.runtime?.phaseEngine?.history(body.taskId, { limit: body.limit || 100, cursor: body.cursor || 0 }) || {}
    else if (known && route === '/observability') data = { phaseEngine: this.runtime?.phaseEngine?.snapshot(), taskLedger: this.runtime?.observability?.snapshot() }
    else if (known) data = { status: 'adapter-ready', route }
    const error = !known ? { code: 'ROUTE_NOT_FOUND', message: `Route ${route} is not registered` } : data === null ? { code: 'INVALID_REQUEST', message: `Request did not match an operation for ${route}` } : null
    const response = { requestId: `api-${this.requests.length + 1}`, route, method, known, status: error ? (!known ? 404 : 400) : 200, data: error ? null : data, error, sessionId, createdAt: new Date().toISOString() }
    this.requests.unshift(response)
    if (replayKey) {
      this.idempotency.set(replayKey, response)
      while (this.idempotency.size > this.maxIdempotencyEntries) this.idempotency.delete(this.idempotency.keys().next().value)
    }
    return response
  }

  openApi() {
    return {
      version: '0.2',
      routes: API_ROUTES,
      auth: 'local session / adapter-defined',
      transport: 'HTTP or in-process contract',
      envelopes: { success: ['requestId', 'route', 'status', 'data', 'createdAt'], error: ['requestId', 'route', 'status', 'error', 'createdAt'] },
      idempotency: { field: 'idempotencyKey', scope: 'session + method + route', retention: this.maxIdempotencyEntries },
      phaseControls: ['advance', 'run', 'pause', 'resume', 'cancel', 'history', 'export', 'list'],
      workflowControls: ['define', 'start', 'approve', 'advance', 'complete', 'fail', 'pause', 'resume', 'cancel', 'history'],
      nativeControls: ['discover', 'contract', 'validate', 'execute'],
    }
  }

  snapshot() {
    return { routes: API_ROUTES.length, requests: this.requests.length, idempotencyEntries: this.idempotency.size, spec: this.openApi() }
  }
}

function controlPhaseRun(runtime, action, taskId, reason) {
  if (!runtime || !taskId) return {}
  const taskExists = runtime.tasks?.has?.(taskId)
  const controller = taskExists && typeof runtime[action] === 'function' ? runtime[action].bind(runtime) : runtime.phaseEngine?.[action]?.bind(runtime.phaseEngine)
  const result = controller ? controller(taskId, reason) : null
  return runtime.phaseEngine?.observe(taskId) || result || {}
}

function normalizePath(path) {
  const value = String(path || '').split('?')[0]
  return value.startsWith('/') ? value : `/${value}`
}
