const DEFAULT_APPLICATIONS = [
  { id: 'file-manager', name: 'File Manager', aliases: ['files', 'explorer', 'finder'], capabilities: ['files'], launch: 'native-file-manager' },
  { id: 'terminal', name: 'Terminal', aliases: ['shell', 'powershell', 'bash', 'zsh'], capabilities: ['terminal'], launch: 'native-terminal' },
  { id: 'browser', name: 'Browser', aliases: ['web', 'chrome', 'firefox', 'safari'], capabilities: ['browser'], launch: 'native-browser' },
  { id: 'code-editor', name: 'Code Editor', aliases: ['editor', 'vscode', 'ide'], capabilities: ['code', 'repository'], launch: 'native-editor' },
  { id: 'simulation-suite', name: 'Simulation Suite', aliases: ['simulation', 'spice', 'matlab', 'simulink'], capabilities: ['simulation', 'engineering'], launch: 'native-application' },
]

export class ApplicationControl {
  constructor({ applications = DEFAULT_APPLICATIONS, security } = {}) {
    this.security = security
    this.registry = new Map(applications.map((application) => [application.id, { ...application, status: 'installed', path: null }]))
    this.audit = []
  }

  register(application) {
    const normalized = { status: 'installed', path: null, aliases: [], capabilities: [], ...application }
    this.registry.set(normalized.id, normalized)
    return normalized
  }

  resolve(query) {
    const value = String(query || '').toLowerCase()
    return [...this.registry.values()].filter((application) => application.name.toLowerCase().includes(value) || application.aliases.some((alias) => alias.includes(value)))
  }

  planLaunch(query, { approved = false } = {}) {
    const normalizedQuery = String(query || '').replace(/^(open|launch)\s+/i, '').trim()
    const candidates = this.resolve(normalizedQuery)
    const application = candidates[0]
    const allowed = Boolean(application) && (approved || this.security.isAllowed(5, { approved, scope: `app:${application?.id}` }))
    return {
      query,
      normalizedQuery,
      application: application || null,
      candidates,
      allowed,
      status: application ? (allowed ? 'ready' : 'approval-required') : 'not-found',
      action: application ? `launch:${application.id}` : 'resolve',
    }
  }

  launch(query, options = {}) {
    const plan = this.planLaunch(query, options)
    const event = { id: `app-${this.audit.length + 1}`, plan, status: plan.allowed ? 'simulated' : plan.status, createdAt: new Date().toISOString() }
    this.audit.unshift(event)
    return event
  }

  snapshot() {
    return { registered: this.registry.size, installed: [...this.registry.values()].filter((app) => app.status === 'installed').length, auditEvents: this.audit.length, applications: [...this.registry.values()] }
  }
}
