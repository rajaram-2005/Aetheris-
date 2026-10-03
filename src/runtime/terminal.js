const BLOCKED_PATTERNS = [/\brm\s+-rf\b/i, /\bformat\b/i, /\bshutdown\b/i, /\bdel\s+\/f\b/i, /\bmkfs\b/i, /\bdrop\s+database\b/i, /\bcurl\b.*\|\s*(sh|bash)/i]

export class UniversalTerminal {
  constructor({ system, security } = {}) {
    this.system = system
    this.security = security
    this.history = []
  }

  plan(command, { approved = false, sandbox = true } = {}) {
    const system = this.system.detect()
    const translated = this.system.translateCommand(command, 'posix', system.id)
    const destructive = BLOCKED_PATTERNS.some((pattern) => pattern.test(translated.command))
    const network = /\b(curl|wget|invoke-webrequest|npm\s+install|pip\s+install)\b/i.test(translated.command)
    const allowed = !destructive && (!network || this.security.online || approved)
    return {
      shell: system.shell,
      adapter: system.id,
      command: translated.command,
      translated: translated.changed,
      sandbox,
      destructive,
      network,
      allowed,
      reason: destructive ? 'Destructive command requires explicit confirmation' : !allowed ? 'Network command blocked by local-only policy' : 'Sandbox execution permitted',
    }
  }

  execute(command, options = {}) {
    const plan = this.plan(command, options)
    const event = {
      id: `terminal-${this.history.length + 1}`,
      plan,
      status: plan.allowed ? 'simulated' : 'blocked',
      stdout: plan.allowed ? `[sandbox] ${plan.command}\nExecution adapter ready; no host side effect was performed.` : '',
      stderr: plan.allowed ? '' : plan.reason,
      createdAt: new Date().toISOString(),
    }
    this.history.unshift(event)
    return event
  }

  snapshot() {
    return { shell: this.system.detect().shell, executions: this.history.length, last: this.history[0] || null }
  }
}
