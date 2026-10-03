export const SANDBOX_PROFILES = {
  readonly: { id: 'readonly', label: 'Read-only inspection', network: false, write: false, execute: false },
  code: { id: 'code', label: 'Sandboxed code', network: false, write: true, execute: true },
  tool: { id: 'tool', label: 'Scoped tool access', network: false, write: true, execute: true },
  file: { id: 'file', label: 'Project file scope', network: false, write: true, execute: false },
  network: { id: 'network', label: 'Approved network sandbox', network: true, write: true, execute: true },
}

export class SandboxRuntime {
  constructor({ security, resources = {} } = {}) {
    this.security = security
    this.resources = { cpu: 2, ramGb: 4, storageGb: 10, timeoutMs: 120000, ...resources }
    this.instances = new Map()
    this.events = []
  }

  create({ taskId, profile = 'readonly', scope = 'project', approved = false } = {}) {
    const definition = SANDBOX_PROFILES[profile] || SANDBOX_PROFILES.readonly
    const allowed = definition.network ? this.security?.online || approved : true
    const instance = {
      id: `sandbox-${this.instances.size + 1}`,
      taskId,
      profile: definition.id,
      scope,
      status: allowed ? 'ready' : 'blocked',
      limits: this.resources,
      mounts: [scope],
      network: definition.network && allowed,
      createdAt: new Date().toISOString(),
    }
    this.instances.set(instance.id, instance)
    this.record({ type: 'sandbox.created', sandboxId: instance.id, status: instance.status })
    return instance
  }

  execute(sandboxId, operation, { approved = false } = {}) {
    const instance = this.instances.get(sandboxId)
    if (!instance) return { ok: false, status: 'missing-sandbox' }
    const profile = SANDBOX_PROFILES[instance.profile]
    const allowed = instance.status === 'ready' && (operation.type !== 'network' || instance.network || approved)
    const event = {
      sandboxId,
      operation,
      status: allowed ? 'simulated' : 'blocked',
      output: allowed ? `[sandbox:${instance.profile}] isolated operation complete` : 'Sandbox policy blocked operation',
      limits: instance.limits,
      createdAt: new Date().toISOString(),
    }
    this.record({ type: 'sandbox.execute', ...event })
    return { ok: allowed, ...event, profile: profile?.label }
  }

  terminate(sandboxId) {
    const instance = this.instances.get(sandboxId)
    if (!instance) return null
    instance.status = 'terminated'
    instance.terminatedAt = new Date().toISOString()
    return instance
  }

  record(event) {
    this.events.unshift({ ...event, time: new Date().toISOString() })
    this.events = this.events.slice(0, 100)
  }

  snapshot() {
    return { instances: this.instances.size, active: [...this.instances.values()].filter((item) => item.status === 'ready').length, events: this.events.length, profiles: SANDBOX_PROFILES }
  }
}
