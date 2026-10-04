const BUILTIN_PLUGINS = [
  { id: 'mcp-local-files', name: 'Local Files MCP', description: 'Scoped project file search and analysis.', protocol: 'MCP', version: '1.2.0', capabilities: ['files', 'search'], scopes: ['project'], permissions: ['read'], status: 'connected', trust: 'verified', builtin: true },
  { id: 'sdk-simulation', name: 'Simulation SDK', description: 'Digital twin and sandbox simulation adapters.', protocol: 'SDK', version: '2.0.0', capabilities: ['simulation', 'digital-twin'], scopes: ['sandbox'], permissions: ['compute'], status: 'connected', trust: 'verified', builtin: true },
  { id: 'mcp-project-git', name: 'Project Git MCP', description: 'Local repository history, branches, and change analysis.', protocol: 'MCP', version: '1.0.0', capabilities: ['git', 'repository', 'diff'], scopes: ['project'], permissions: ['read'], status: 'connected', trust: 'verified', builtin: true },
  { id: 'sdk-local-media', name: 'Local Media SDK', description: 'Offline image, audio, video, and document preview adapters.', protocol: 'SDK', version: '1.1.0', capabilities: ['image', 'audio', 'video', 'media'], scopes: ['sandbox', 'project'], permissions: ['read', 'write'], status: 'connected', trust: 'verified', builtin: true },
  { id: 'sdk-embeddings', name: 'Local Embeddings SDK', description: 'Local vectorization and semantic retrieval.', protocol: 'SDK', version: '1.0.0', capabilities: ['embeddings', 'semantic-search'], scopes: ['memory'], permissions: ['read', 'compute'], status: 'connected', trust: 'verified', builtin: true },
  { id: 'mcp-local-data', name: 'Local Data MCP', description: 'Relational, graph, vector, and object data access.', protocol: 'MCP', version: '1.0.0', capabilities: ['data', 'sql', 'graph'], scopes: ['project'], permissions: ['read', 'write'], status: 'connected', trust: 'verified', builtin: true },
  { id: 'mcp-lab-telemetry', name: 'Lab Telemetry MCP', description: 'Read-only MQTT and OPC-UA sensor observations.', protocol: 'MCP', version: '0.9.0', capabilities: ['telemetry', 'iot', 'sensors'], scopes: ['device'], permissions: ['read'], status: 'connected', trust: 'verified', builtin: true },
  { id: 'sdk-ocr-local', name: 'Local OCR SDK', description: 'Local document and image text extraction.', protocol: 'SDK', version: '1.0.0', capabilities: ['ocr', 'document-analysis'], scopes: ['sandbox'], permissions: ['read', 'compute'], status: 'available', trust: 'verified', builtin: true },
  { id: 'sdk-local-voice', name: 'Local Voice SDK', description: 'Offline speech recognition and voice preview adapters.', protocol: 'SDK', version: '0.8.0', capabilities: ['speech', 'audio', 'voice'], scopes: ['sandbox'], permissions: ['read', 'compute'], status: 'available', trust: 'verified', builtin: true },
  { id: 'api-weather', name: 'Approved Weather API', description: 'Optional external weather lookup with explicit network approval.', protocol: 'API', version: '1.0.0', capabilities: ['weather'], scopes: ['network'], permissions: ['network'], status: 'available', trust: 'review-required', builtin: true },
  { id: 'mcp-browser-automation', name: 'Browser Automation MCP', description: 'Observed browser actions behind an online and application gate.', protocol: 'MCP', version: '0.7.0', capabilities: ['browser', 'web-research'], scopes: ['network', 'application'], permissions: ['network', 'automation'], status: 'available', trust: 'review-required', builtin: true },
  { id: 'sdk-calendar-local', name: 'Local Calendar SDK', description: 'Scoped local calendar and reminder operations.', protocol: 'SDK', version: '0.5.0', capabilities: ['calendar', 'reminders'], scopes: ['project'], permissions: ['read', 'write'], status: 'available', trust: 'verified', builtin: true },
]

const VALID_PROTOCOLS = ['MCP', 'API', 'SDK', 'WASM', 'LOCAL']
const VALID_SCOPES = ['project', 'sandbox', 'memory', 'network', 'device', 'industrial', 'application', 'ui']

export class PluginFabric {
  constructor({ network, security, storage = null, adapters = {}, emit = () => {} } = {}) {
    this.network = network
    this.security = security
    this.emit = emit
    this.storage = storage || (typeof localStorage !== 'undefined' ? localStorage : null)
    this.adapters = adapters
    this.plugins = new Map()
    this.invocations = []
    this.events = []
    this.hydrate()
    BUILTIN_PLUGINS.forEach((plugin) => {
      if (!this.plugins.has(plugin.id)) this.plugins.set(plugin.id, { ...plugin, installedAt: new Date().toISOString() })
    })
    this.persist()
  }

  register(plugin, { source = 'local' } = {}) {
    const normalized = {
      protocol: 'SDK',
      version: '0.1.0',
      capabilities: [],
      scopes: ['sandbox'],
      permissions: ['compute'],
      status: 'registered',
      trust: source === 'local' ? 'local' : 'review-required',
      builtin: false,
      source,
      ...plugin,
    }
    normalized.validation = this.validate(normalized)
    normalized.status = normalized.validation.valid ? (normalized.status === 'disabled' ? 'disabled' : 'registered') : 'invalid'
    normalized.registeredAt = new Date().toISOString()
    this.plugins.set(normalized.id, normalized)
    this.record('plugin.registered', { pluginId: normalized.id, status: normalized.status })
    this.persist()
    return normalized
  }

  validate(manifest = {}) {
    const errors = []
    if (!manifest.id || !/^[a-z0-9][a-z0-9._-]+$/.test(manifest.id)) errors.push('id must use lowercase letters, numbers, dots, hyphens, or underscores')
    if (!manifest.name) errors.push('name is required')
    if (!manifest.version) errors.push('version is required')
    if (!VALID_PROTOCOLS.includes(manifest.protocol)) errors.push(`protocol must be one of ${VALID_PROTOCOLS.join(', ')}`)
    if (!Array.isArray(manifest.capabilities) || manifest.capabilities.length === 0) errors.push('at least one capability is required')
    if (!Array.isArray(manifest.scopes) || manifest.scopes.length === 0) errors.push('at least one scope is required')
    if (manifest.scopes?.some((scope) => !VALID_SCOPES.includes(scope))) errors.push('scope contains an unsupported value')
    if (!Array.isArray(manifest.permissions) || manifest.permissions.length === 0) errors.push('permissions are required')
    return { valid: errors.length === 0, errors }
  }

  install(pluginId, { approved = false } = {}) {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return { status: 'not-found', pluginId }
    const needsNetwork = plugin.scopes.includes('network')
    if (needsNetwork && (!this.network?.online || (!approved && !this.network?.approvedServices?.has(pluginId)))) return this.event({ pluginId, status: 'blocked', reason: 'Network scope requires approved online mode' })
    if (!plugin.validation?.valid && !plugin.builtin) return this.event({ pluginId, status: 'blocked', reason: 'Plugin manifest is invalid' })
    plugin.status = 'connected'
    plugin.installedAt = new Date().toISOString()
    plugin.enabledAt = plugin.installedAt
    this.record('plugin.installed', { pluginId })
    this.persist()
    return { ...plugin }
  }

  enable(pluginId) {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return { status: 'not-found', pluginId }
    if (plugin.status === 'invalid') return { status: 'blocked', pluginId, reason: 'Plugin manifest is invalid' }
    plugin.status = 'connected'
    plugin.enabledAt = new Date().toISOString()
    this.record('plugin.enabled', { pluginId })
    this.persist()
    return { ...plugin }
  }

  disable(pluginId) {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return { status: 'not-found', pluginId }
    plugin.status = 'disabled'
    plugin.disabledAt = new Date().toISOString()
    this.record('plugin.disabled', { pluginId })
    this.persist()
    return { ...plugin }
  }

  uninstall(pluginId) {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return { status: 'not-found', pluginId }
    if (plugin.builtin) return { status: 'blocked', pluginId, reason: 'Built-in plugins cannot be uninstalled; disable them instead' }
    this.plugins.delete(pluginId)
    this.record('plugin.uninstalled', { pluginId })
    this.persist()
    return { status: 'uninstalled', pluginId }
  }

  resolve(capability, { includeDisabled = false } = {}) {
    return [...this.plugins.values()].filter((plugin) => plugin.capabilities.includes(capability) && (includeDisabled || ['connected', 'available', 'registered'].includes(plugin.status)))
  }

  discover({ query = '', protocol, scope, status } = {}) {
    const value = String(query).toLowerCase()
    return [...this.plugins.values()].filter((plugin) => {
      const matchesQuery = !value || `${plugin.id} ${plugin.name} ${plugin.description || ''} ${plugin.capabilities.join(' ')}`.toLowerCase().includes(value)
      return matchesQuery && (!protocol || plugin.protocol === protocol) && (!scope || plugin.scopes.includes(scope)) && (!status || plugin.status === status)
    })
  }

  invoke(pluginId, capability, input, { approved = false, context = {} } = {}) {
    const plugin = this.plugins.get(pluginId)
    const event = { pluginId, capability, input, context, createdAt: new Date().toISOString() }
    if (!plugin) return this.event({ ...event, status: 'not-found', output: null })
    if (!['connected', 'registered'].includes(plugin.status)) return this.event({ ...event, status: 'blocked', output: `${plugin.name} is not enabled` })
    if (!plugin.capabilities.includes(capability)) return this.event({ ...event, status: 'blocked', output: 'Capability is not declared by this plugin' })
    const network = plugin.scopes.includes('network')
    const physical = plugin.scopes.some((scope) => ['device', 'industrial'].includes(scope))
    const allowed = (!network || Boolean(this.network?.online)) && (!network || approved || this.network?.approvedServices?.has(pluginId)) && (!physical || approved)
    if (!allowed) return this.event({ ...event, status: 'blocked', output: network ? 'Plugin network scope requires approval' : 'Plugin device scope requires approval' })
    try {
      const adapter = this.adapters[pluginId] || plugin.adapter
      const output = typeof adapter === 'function' ? adapter({ capability, input, context }) : { status: 'adapter-ready', plugin: pluginId, capability, input }
      return this.event({ ...event, status: 'completed', output })
    } catch (error) {
      return this.event({ ...event, status: 'error', output: error.message })
    }
  }

  event(event) {
    this.invocations.unshift(event)
    this.invocations = this.invocations.slice(0, 200)
    this.persist()
    this.emit({ type: 'plugin.invocation', event })
    return event
  }

  record(type, data) {
    const event = { type, data, time: new Date().toISOString() }
    this.events.unshift(event)
    this.events = this.events.slice(0, 200)
    this.emit({ type: 'plugin.lifecycle', event })
  }

  snapshot() {
    return {
      registered: this.plugins.size,
      connected: [...this.plugins.values()].filter((plugin) => plugin.status === 'connected').length,
      available: [...this.plugins.values()].filter((plugin) => plugin.status === 'available').length,
      disabled: [...this.plugins.values()].filter((plugin) => plugin.status === 'disabled').length,
      invalid: [...this.plugins.values()].filter((plugin) => plugin.status === 'invalid').length,
      invocations: this.invocations.length,
      events: this.events.length,
      protocols: VALID_PROTOCOLS,
      scopes: VALID_SCOPES,
      plugins: [...this.plugins.values()].map(({ adapter, ...plugin }) => plugin),
    }
  }

  hydrate() {
    if (!this.storage) return
    try {
      const saved = JSON.parse(this.storage.getItem('aetheris.plugin-fabric') || '{}')
      ;(saved.plugins || []).forEach((plugin) => this.plugins.set(plugin.id, plugin))
      this.invocations = saved.invocations || []
      this.events = saved.events || []
    } catch { /* Local plugin state is best effort. */ }
  }

  persist() {
    if (!this.storage) return
    try { this.storage.setItem('aetheris.plugin-fabric', JSON.stringify({ plugins: [...this.plugins.values()].map(({ adapter, ...plugin }) => plugin), invocations: this.invocations.slice(0, 200), events: this.events.slice(0, 200) })) } catch { /* Local persistence is best effort. */ }
  }
}

export { BUILTIN_PLUGINS, VALID_PROTOCOLS, VALID_SCOPES }
