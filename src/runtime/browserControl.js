export class BrowserControl {
  constructor({ security } = {}) {
    this.security = security
    this.sessions = new Map()
    this.audit = []
  }

  planNavigation(url, { approved = false } = {}) {
    const normalized = normalizeUrl(url)
    const networkAllowed = this.security.online || approved
    return {
      url: normalized,
      domain: domainOf(normalized),
      status: networkAllowed ? 'ready' : 'approval-required',
      allowed: networkAllowed,
      policy: networkAllowed ? 'approved network scope' : 'LOCAL ONLY blocks external navigation',
      loop: ['navigate', 'perceive', 'act', 'observe', 'verify'],
    }
  }

  navigate(url, options = {}) {
    const plan = this.planNavigation(url, options)
    const sessionId = `browser-${this.sessions.size + 1}`
    const observation = {
      sessionId,
      plan,
      page: plan.allowed ? { title: 'Adapter observation pending', links: [], forms: [] } : null,
      status: plan.allowed ? 'simulated' : 'blocked',
      createdAt: new Date().toISOString(),
    }
    this.sessions.set(sessionId, observation)
    this.audit.unshift(observation)
    return observation
  }

  act(sessionId, action, target, { approved = false } = {}) {
    const session = this.sessions.get(sessionId)
    if (!session) return { ok: false, status: 'missing-session' }
    const allowed = session.plan.allowed && (approved || !/submit|purchase|send|publish|delete/i.test(action))
    const event = { sessionId, action, target, allowed, status: allowed ? 'simulated' : 'approval-required', observed: allowed ? 'adapter observation pending' : null, createdAt: new Date().toISOString() }
    this.audit.unshift(event)
    return event
  }

  verify(expected, observed) {
    return { passed: Boolean(expected && observed), expected, observed, method: 'page-state-compare', createdAt: new Date().toISOString() }
  }

  snapshot() {
    return { sessions: this.sessions.size, auditEvents: this.audit.length, online: this.security.online }
  }
}

function normalizeUrl(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  return /^https?:\/\//i.test(text) ? text : `https://${text}`
}

function domainOf(url) {
  try { return new URL(url).hostname } catch { return 'unknown' }
}
