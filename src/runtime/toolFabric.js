import { TOOL_DEFINITIONS } from './registry.js'

export class ToolFabric {
  constructor({ online = false } = {}) {
    this.online = online
    this.registry = new Map(TOOL_DEFINITIONS.map((tool) => [tool.id, { ...tool, status: 'available' }]))
    this.audit = []
  }

  setOnline(online) {
    this.online = Boolean(online)
  }

  plan(understanding, { approved = false } = {}) {
    const requested = new Set(['files'])
    const text = understanding.text.toLowerCase()
    if (understanding.intent === 'software' || text.includes('terminal') || text.includes('run')) requested.add('terminal')
    if (understanding.intent === 'computer-control') requested.add('files')
    if (understanding.risk.networkRequested) requested.add('browser')
    if (['engineering', 'science'].includes(understanding.intent)) requested.add('python').add('simulation')
    if (understanding.risk.physicalAction) requested.add('devices')
    return [...requested].map((toolId) => {
      const tool = this.registry.get(toolId)
      const allowed = Boolean(tool) && this.isAllowed(tool, understanding, approved)
      return { toolId, name: tool?.name || toolId, scope: tool?.scope || 'unknown', risk: tool?.risk || 'unknown', allowed, mode: allowed ? 'sandboxed' : 'blocked' }
    })
  }

  invoke(toolId, input, { approved = false } = {}) {
    const tool = this.registry.get(toolId)
    if (!tool) return { ok: false, status: 'missing', toolId, message: 'Tool is not registered' }
    if (!this.isAllowed(tool, { risk: { networkRequested: tool.risk === 'network', physicalAction: tool.risk === 'physical-control', destructive: false } }, approved)) {
      const blocked = { ok: false, status: 'blocked', toolId, message: 'Policy blocked this tool invocation' }
      this.audit.push({ ...blocked, input, time: new Date().toISOString() })
      return blocked
    }
    const observation = { ok: true, status: 'simulated', toolId, tool: tool.name, input, output: `Observation captured from ${tool.name} sandbox`, time: new Date().toISOString() }
    this.audit.push(observation)
    return observation
  }

  isAllowed(tool, understanding, approved) {
    if (tool.risk === 'network') return this.online || approved
    if (tool.risk === 'physical-control') return approved
    if (understanding.risk?.destructive) return approved
    return true
  }

  snapshot() {
    return {
      registered: this.registry.size,
      available: [...this.registry.values()].filter((tool) => tool.status === 'available').length,
      auditEvents: this.audit.length,
      online: this.online,
      tools: [...this.registry.values()],
    }
  }
}
