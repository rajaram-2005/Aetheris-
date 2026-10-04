export const MCP_SERVERS = [
  { id: 'aetheris.core', name: 'Aetheris Core MCP', plane: 'conversation / cognitive', transport: 'in-process', offline: true },
  { id: 'aetheris.experience', name: 'Experience Input MCP', plane: 'experience / input', transport: 'in-process', offline: true },
  { id: 'aetheris.native', name: 'Native Intelligence MCP', plane: 'native agents', transport: 'in-process', offline: true },
  { id: 'aetheris.phases', name: '150-Phase Engine MCP', plane: 'lifecycle', transport: 'in-process', offline: true },
  { id: 'aetheris.knowledge', name: 'Knowledge MCP', plane: 'memory / knowledge', transport: 'in-process', offline: true },
  { id: 'aetheris.memory', name: 'Memory MCP', plane: 'memory / knowledge', transport: 'in-process', offline: true },
  { id: 'aetheris.models', name: 'Model Fabric MCP', plane: 'model', transport: 'in-process', offline: true },
  { id: 'aetheris.media', name: 'Multimodal Media MCP', plane: 'creation', transport: 'in-process', offline: true },
  { id: 'aetheris.computer', name: 'Computer Control MCP', plane: 'computer-control', transport: 'in-process', offline: true },
  { id: 'aetheris.files', name: 'Files MCP', plane: 'tool', transport: 'in-process', offline: true },
  { id: 'aetheris.terminal', name: 'Terminal MCP', plane: 'tool', transport: 'in-process', offline: true },
  { id: 'aetheris.browser', name: 'Browser MCP', plane: 'computer-control', transport: 'in-process', offline: false },
  { id: 'aetheris.workflow', name: 'Workflow MCP', plane: 'workflow', transport: 'in-process', offline: true },
  { id: 'aetheris.agents', name: 'Agent Swarm MCP', plane: 'agent', transport: 'in-process', offline: true },
  { id: 'aetheris.science', name: 'Science MCP', plane: 'scientific', transport: 'in-process', offline: true },
  { id: 'aetheris.education', name: 'Education MCP', plane: 'education', transport: 'in-process', offline: true },
  { id: 'aetheris.research', name: 'Research MCP', plane: 'research', transport: 'in-process', offline: true },
  { id: 'aetheris.verification', name: 'Verification MCP', plane: 'verification', transport: 'in-process', offline: true },
  { id: 'aetheris.safety', name: 'Safety MCP', plane: 'security', transport: 'in-process', offline: true },
  { id: 'aetheris.hardware', name: 'Hardware MCP', plane: 'hardware', transport: 'in-process', offline: true },
  { id: 'aetheris.industrial', name: 'Industrial Gateway MCP', plane: 'industrial / IoT', transport: 'in-process', offline: true },
  { id: 'aetheris.twin', name: 'Digital Twin MCP', plane: 'simulation', transport: 'in-process', offline: true },
  { id: 'aetheris.data', name: 'Data Layer MCP', plane: 'data', transport: 'in-process', offline: true },
  { id: 'aetheris.plugins', name: 'Plugin Fabric MCP', plane: 'developer platform', transport: 'in-process', offline: true },
  { id: 'aetheris.training', name: 'Training MCP', plane: 'training', transport: 'in-process', offline: true },
  { id: 'aetheris.observability', name: 'Observability MCP', plane: 'verification', transport: 'in-process', offline: true },
]

export const MCP_TOOLS = [
  tool('aetheris.core.plan_task', 'Plan task', 'aetheris.core', 'conversation', 0, 'Convert a request into an observable execution plan.'),
  tool('aetheris.core.observe_task', 'Observe task', 'aetheris.core', 'conversation', 1, 'Read current task state and checkpoint.'),
  tool('aetheris.core.list_tasks', 'List tasks', 'aetheris.core', 'conversation', 0, 'List task state without private chain-of-thought.'),
  tool('aetheris.core.pause_task', 'Pause task', 'aetheris.core', 'conversation', 2, 'Pause a running task at a safe checkpoint.'),
  tool('aetheris.core.resume_task', 'Resume task', 'aetheris.core', 'conversation', 2, 'Resume a paused task from its last safe checkpoint.'),
  tool('aetheris.core.cancel_task', 'Cancel task', 'aetheris.core', 'conversation', 2, 'Cancel a run and release its local resources.'),
  tool('aetheris.experience.receive_input', 'Receive input', 'aetheris.experience', 'experience', 0, 'Normalize text, voice, image, video, file, screen, or multimodal input.'),
  tool('aetheris.experience.detect_language', 'Detect language', 'aetheris.experience', 'experience', 0, 'Detect language and communication mode offline.'),
  tool('aetheris.native.discover', 'Discover native intelligence', 'aetheris.native', 'native', 0, 'Discover first-party Aetheris intelligence contracts.'),
  tool('aetheris.native.plan', 'Plan native intelligence', 'aetheris.native', 'native', 0, 'Select native Aether modules for an intent.'),
  tool('aetheris.phases.plan', 'Plan 150 phases', 'aetheris.phases', 'lifecycle', 0, 'Create a complete 150-phase lifecycle plan.'),
  tool('aetheris.phases.observe', 'Observe phase run', 'aetheris.phases', 'lifecycle', 1, 'Read phase progress without private reasoning.'),
  tool('aetheris.phases.advance', 'Advance one phase', 'aetheris.phases', 'lifecycle', 2, 'Advance a paused phase run by exactly one phase.'),
  tool('aetheris.knowledge.search', 'Search knowledge', 'aetheris.knowledge', 'memory', 1, 'Search the local vector and graph indexes.'),
  tool('aetheris.knowledge.ingest', 'Ingest knowledge', 'aetheris.knowledge', 'memory', 2, 'Parse and index an approved local source.'),
  tool('aetheris.knowledge.plan', 'Plan open-source RAG', 'aetheris.knowledge', 'memory', 0, 'Plan retrieval, citation, synthesis, verification, and memory write.'),
  tool('aetheris.knowledge.synthesize', 'Synthesize knowledge', 'aetheris.knowledge', 'memory', 1, 'Prepare a cited synthesis using the configured open-source model.'),
  tool('aetheris.knowledge.configure_model', 'Configure knowledge model', 'aetheris.knowledge', 'memory', 2, 'Configure a local open-source knowledge model adapter.'),
  tool('aetheris.memory.retrieve', 'Retrieve memory', 'aetheris.memory', 'memory', 1, 'Retrieve working, episodic, semantic, and strategy memory.'),
  tool('aetheris.memory.update_offline', 'Update offline memory', 'aetheris.memory', 'memory', 2, 'Apply a verified memory journal entry locally.'),
  tool('aetheris.models.list', 'List models', 'aetheris.models', 'models', 0, 'List registered local and approved models.'),
  tool('aetheris.models.route', 'Route model', 'aetheris.models', 'models', 0, 'Select a model using capability, latency, privacy, and resources.'),
  tool('aetheris.models.prepare_knowledge', 'Prepare knowledge model', 'aetheris.models', 'models', 2, 'Prepare the local adapter without downloading weights.'),
  tool('aetheris.media.plan', 'Plan media', 'aetheris.media', 'creation', 0, 'Plan image, video, audio, 3D, or document generation.'),
  tool('aetheris.media.render', 'Render media', 'aetheris.media', 'creation', 3, 'Render a local media preview through an approved pipeline.'),
  tool('aetheris.files.search', 'Search files', 'aetheris.files', 'files', 1, 'Search the scoped project file index.'),
  tool('aetheris.files.analyze', 'Analyze file', 'aetheris.files', 'files', 1, 'Inspect and understand an approved project file.'),
  tool('aetheris.files.operate', 'Operate file', 'aetheris.files', 'files', 2, 'Create, edit, move, or delete within an approved scope.'),
  tool('aetheris.terminal.plan', 'Plan terminal', 'aetheris.terminal', 'terminal', 3, 'Translate a command to the local shell and sandbox policy.'),
  tool('aetheris.terminal.execute', 'Execute terminal', 'aetheris.terminal', 'terminal', 3, 'Run an approved command inside a sandbox.'),
  tool('aetheris.browser.navigate', 'Navigate browser', 'aetheris.browser', 'browser', 4, 'Navigate an approved external domain.'),
  tool('aetheris.browser.act', 'Act in browser', 'aetheris.browser', 'browser', 5, 'Perform an observed browser action.'),
  tool('aetheris.apps.resolve', 'Resolve application', 'aetheris.computer', 'applications', 1, 'Find an installed application by capability.'),
  tool('aetheris.apps.launch', 'Launch application', 'aetheris.computer', 'applications', 5, 'Launch an approved local application.'),
  tool('aetheris.workflow.define', 'Define workflow', 'aetheris.workflow', 'workflow', 2, 'Validate a DAG with retries, checkpoints, and approvals.'),
  tool('aetheris.workflow.run', 'Run workflow', 'aetheris.workflow', 'workflow', 3, 'Start an approved workflow run.'),
  tool('aetheris.agents.form_swarm', 'Form agent swarm', 'aetheris.agents', 'agent', 0, 'Assemble a temporary specialist team.'),
  tool('aetheris.science.plan', 'Plan scientific mode', 'aetheris.science', 'science', 0, 'Plan assumptions, equations, calculation, simulation, and uncertainty.'),
  tool('aetheris.education.plan', 'Plan lesson', 'aetheris.education', 'education', 0, 'Create an adaptive teaching plan.'),
  tool('aetheris.research.run', 'Run research', 'aetheris.research', 'research', 1, 'Retrieve, cross-check, synthesize, and cite evidence.'),
  tool('aetheris.verification.evaluate', 'Evaluate output', 'aetheris.verification', 'verification', 0, 'Run independent factual, logical, technical, safety, and quality checks.'),
  tool('aetheris.safety.assess', 'Assess safety', 'aetheris.safety', 'security', 0, 'Evaluate validation, policy, authorization, and safety gates.'),
  tool('aetheris.hardware.snapshot', 'Read hardware', 'aetheris.hardware', 'hardware', 1, 'Read local hardware and resource availability.'),
  tool('aetheris.industrial.read_telemetry', 'Read industrial telemetry', 'aetheris.industrial', 'industrial', 1, 'Read safe, read-only device telemetry.'),
  tool('aetheris.industrial.plan_action', 'Plan industrial action', 'aetheris.industrial', 'industrial', 6, 'Validate an industrial action in simulation before authorization.'),
  tool('aetheris.twin.simulate', 'Simulate digital twin', 'aetheris.twin', 'simulation', 3, 'Run a scenario against a digital twin before physical action.'),
  tool('aetheris.data.query', 'Query data layer', 'aetheris.data', 'data', 1, 'Query scoped relational, vector, graph, file, or object data.'),
  tool('aetheris.plugins.discover', 'Discover plugins', 'aetheris.plugins', 'developer', 0, 'Discover MCP, API, and SDK capabilities.'),
  tool('aetheris.plugins.register', 'Register plugin', 'aetheris.plugins', 'developer', 2, 'Register a validated capability plugin.'),
  tool('aetheris.plugins.install', 'Install plugin', 'aetheris.plugins', 'developer', 2, 'Install a local or approved plugin package.'),
  tool('aetheris.plugins.enable', 'Enable plugin', 'aetheris.plugins', 'developer', 2, 'Enable a validated plugin for routing.'),
  tool('aetheris.plugins.disable', 'Disable plugin', 'aetheris.plugins', 'developer', 2, 'Disable a plugin without deleting its manifest.'),
  tool('aetheris.plugins.uninstall', 'Uninstall plugin', 'aetheris.plugins', 'developer', 2, 'Remove a user-installed plugin package.'),
  tool('aetheris.plugins.invoke', 'Invoke plugin', 'aetheris.plugins', 'developer', 3, 'Invoke a declared plugin capability inside its policy scope.'),
  tool('aetheris.training.plan', 'Plan training', 'aetheris.training', 'training', 2, 'Create a safe training and evaluation plan.'),
  tool('aetheris.observability.trace', 'Read trace', 'aetheris.observability', 'observability', 1, 'Read audit events without private chain-of-thought.'),
]

export class McpFabric {
  constructor({ security, network, handlers = {}, emit = () => {} } = {}) {
    this.security = security
    this.network = network
    this.handlers = handlers
    this.emit = emit
    this.servers = new Map(MCP_SERVERS.map((server) => [server.id, { ...server, status: 'connected' }]))
    this.tools = new Map(MCP_TOOLS.map((entry) => [entry.name, { ...entry }]))
    this.audit = []
    this.sequence = 1
  }

  registerServer(server) {
    const normalized = { transport: 'in-process', offline: true, status: 'connected', ...server }
    this.servers.set(normalized.id, normalized)
    return normalized
  }

  registerTool(entry, handler = null) {
    const normalized = { ...entry, status: 'registered' }
    this.tools.set(normalized.name, normalized)
    if (handler) this.handlers[normalized.name] = handler
    return normalized
  }

  discover({ plane, query, offlineOnly = false } = {}) {
    const value = String(query || '').toLowerCase()
    return [...this.tools.values()].filter((entry) => {
      const server = this.servers.get(entry.server)
      const matchesPlane = !plane || entry.plane === plane
      const matchesQuery = !value || `${entry.name} ${entry.title} ${entry.description}`.toLowerCase().includes(value)
      const matchesOffline = !offlineOnly || server?.offline
      return matchesPlane && matchesQuery && matchesOffline
    }).map((entry) => ({ ...entry, serverInfo: this.servers.get(entry.server) }))
  }

  planForIntent(understanding) {
    const intentQueries = {
      creation: 'media',
      engineering: 'science simulation twin',
      software: 'terminal files workflow',
      'computer-control': 'computer files terminal browser applications',
      research: 'research knowledge',
      document: 'files media',
      education: 'education knowledge',
      general: 'core memory models',
    }
    const query = intentQueries[understanding.intent] || 'core'
    const tools = query.split(/\s+/).flatMap((term) => this.discover({ query: term, offlineOnly: !this.network.online })).filter((entry, index, list) => list.findIndex((candidate) => candidate.name === entry.name) === index).slice(0, 8)
    return { intent: understanding.intent, tools, count: tools.length, transport: 'MCP in-process', offlineOnly: !this.network.online }
  }

  call(name, args = {}, context = {}) {
    const id = `mcp-${this.sequence++}`
    const entry = this.tools.get(name)
    if (!entry) return this.publish(this.result(id, name, null, { status: 'not-found', message: 'MCP tool is not registered' }))
    const server = this.servers.get(entry.server)
    const onlineBlocked = !server?.offline && !this.network.online
    const needsApproval = entry.level > (this.security.defaultLevel ?? 3) && !context.approved
    const physical = entry.level >= 6 && !context.approved
    if (onlineBlocked || needsApproval || physical) {
      const reason = onlineBlocked ? 'Tool requires APPROVED ONLINE mode' : physical ? 'Tool requires device or industrial authorization' : `Tool requires security level ${entry.level} approval`
      const blocked = this.result(id, name, entry, { status: 'blocked', reason, offline: !this.network.online })
      this.audit.unshift(blocked)
      return this.publish(blocked)
    }
    let data = { status: 'adapter-ready', tool: name, args }
    const handler = this.handlers[name]
    if (handler) {
      try { data = { status: 'completed', data: handler(args, context) } } catch (error) { data = { status: 'error', message: error.message } }
    }
    const response = this.result(id, name, entry, data)
    this.audit.unshift(response)
    this.audit = this.audit.slice(0, 300)
    return this.publish(response)
  }

  publish(response) {
    this.emit({ type: 'mcp.call', response })
    return response
  }

  result(id, name, entry, result) {
    return { jsonrpc: '2.0', id, tool: name, server: entry?.server || null, scope: entry?.plane || null, offline: !this.network.online, ...result, createdAt: new Date().toISOString() }
  }

  snapshot() {
    return { servers: this.servers.size, connectedServers: [...this.servers.values()].filter((server) => server.status === 'connected').length, tools: this.tools.size, auditEvents: this.audit.length, offlineAvailable: this.discover({ offlineOnly: true }).length, serversList: [...this.servers.values()] }
  }
}

function tool(name, title, server, plane, level, description) {
  return { name, title, server, plane, level, description, inputSchema: { type: 'object' }, outputSchema: { type: 'object' }, status: 'connected' }
}
