export const SECURITY_LEVELS = [
  { level: 0, id: 'reasoning', label: 'Reasoning', description: 'No external side effects' },
  { level: 1, id: 'read-only', label: 'Read-only', description: 'Inspect approved context' },
  { level: 2, id: 'create-edit', label: 'Create / edit', description: 'Write user-scoped files' },
  { level: 3, id: 'sandbox', label: 'Sandboxed execution', description: 'Run isolated code and tools' },
  { level: 4, id: 'network', label: 'Network', description: 'Use approved external sources' },
  { level: 5, id: 'application', label: 'Application automation', description: 'Launch and operate apps' },
  { level: 6, id: 'device', label: 'Device control', description: 'Operate authorized devices' },
  { level: 7, id: 'industrial', label: 'Industrial systems', description: 'PLC / SCADA actions' },
]

export class SecurityPolicy {
  constructor({ online = false, defaultLevel = 3 } = {}) {
    this.online = Boolean(online)
    this.defaultLevel = defaultLevel
    this.approvals = new Map()
    this.audit = []
  }

  setOnline(online) {
    this.online = Boolean(online)
  }

  assess(understanding, { approved = false } = {}) {
    const text = understanding.text.toLowerCase()
    const risk = understanding.risk || {}
    const requestedLevel = inferLevel(understanding, text)
    const reasons = []
    if (risk.networkRequested && !this.online) reasons.push('Network access is disabled in LOCAL ONLY mode')
    if (risk.destructive) reasons.push('Destructive operation requires explicit confirmation')
    if (risk.physicalAction) reasons.push('Physical or industrial action requires authorization')
    if (requestedLevel >= 5) reasons.push('Application or system automation needs a scoped consent')
    const requiresApproval = !approved && reasons.length > 0
    const policy = {
      level: requestedLevel,
      levelLabel: SECURITY_LEVELS[requestedLevel]?.label || SECURITY_LEVELS[0].label,
      requiresApproval,
      approved: Boolean(approved),
      sandbox: requestedLevel >= 3 && requestedLevel < 5,
      network: requestedLevel >= 4 && this.online,
      reason: requiresApproval ? reasons[0] : 'Scope approved by local policy',
      reasons,
    }
    this.audit.unshift({ type: 'assessment', level: requestedLevel, requiresApproval, time: new Date().toISOString(), request: understanding.text })
    this.audit = this.audit.slice(0, 100)
    return policy
  }

  approve(scopeId, metadata = {}) {
    this.approvals.set(scopeId, { scopeId, approvedAt: new Date().toISOString(), ...metadata })
    this.audit.unshift({ type: 'approval', scopeId, time: new Date().toISOString() })
    return this.approvals.get(scopeId)
  }

  isAllowed(level, { approved = false, scope = 'project' } = {}) {
    if (level <= this.defaultLevel) return true
    return approved || this.approvals.has(scope)
  }

  snapshot() {
    return {
      online: this.online,
      defaultLevel: this.defaultLevel,
      defaultLabel: SECURITY_LEVELS[this.defaultLevel].label,
      approvals: this.approvals.size,
      auditEvents: this.audit.length,
      levels: SECURITY_LEVELS,
    }
  }
}

function inferLevel(understanding, text) {
  const risk = understanding.risk || {}
  if (/(plc|scada|industrial|actuator|robot|factory)/.test(text)) return 7
  if (risk.physicalAction) return 6
  if (/(open|launch|click|type|application|desktop)/.test(text)) return 5
  if (risk.networkRequested) return 4
  if (/(run|execute|terminal|python|simulate|test|build)/.test(text)) return 3
  if (risk.destructive || /(write|edit|create|save|generate)/.test(text)) return 2
  return 1
}
