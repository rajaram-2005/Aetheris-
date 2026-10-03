const BUILTIN_PLUGINS = [
  { id: 'mcp-local-files', name: 'Local Files MCP', protocol: 'MCP', capabilities: ['files', 'search'], scopes: ['project'], status: 'connected' },
  { id: 'api-weather', name: 'Approved Weather API', protocol: 'API', capabilities: ['weather'], scopes: ['network'], status: 'available' },
  { id: 'sdk-simulation', name: 'Simulation SDK', protocol: 'SDK', capabilities: ['simulation', 'digital-twin'], scopes: ['sandbox'], status: 'connected' },
]

export class PluginFabric {
  constructor({ network, security } = {}) {
    this.network = network
    this.security = security
    this.plugins = new Map(BUILTIN_PLUGINS.map((plugin) => [plugin.id, { ...plugin }]))
    this.invocations = []
  }

  register(plugin) {
    const normalized = { protocol: 'SDK', capabilities: [], scopes: ['sandbox'], status: 'registered', ...plugin }
    this.plugins.set(normalized.id, normalized)
    return normalized
  }

  resolve(capability) {
    return [...this.plugins.values()].filter((plugin) => plugin.capabilities.includes(capability) && ['connected', 'available', 'registered'].includes(plugin.status))
  }

  invoke(pluginId, capability, input, { approved = false } = {}) {
    const plugin = this.plugins.get(pluginId)
    const network = plugin?.scopes.includes('network')
    const allowed = Boolean(plugin) && (!network || this.network.online) && (!network || approved || this.network.approvedServices.has(pluginId))
    const event = { pluginId, capability, input, status: allowed ? 'simulated' : 'blocked', output: allowed ? 'Plugin adapter returned an observation' : 'Plugin scope requires approval', createdAt: new Date().toISOString() }
    this.invocations.unshift(event)
    return event
  }

  snapshot() {
    return { registered: this.plugins.size, connected: [...this.plugins.values()].filter((plugin) => plugin.status === 'connected').length, invocations: this.invocations.length, plugins: [...this.plugins.values()] }
  }
}
