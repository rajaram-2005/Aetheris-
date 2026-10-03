export class WorkflowEngine {
  constructor() {
    this.workflows = new Map()
    this.runs = []
  }

  define(workflow) {
    const normalized = {
      id: workflow.id || `workflow-${this.workflows.size + 1}`,
      name: workflow.name || 'Untitled workflow',
      version: workflow.version || 1,
      nodes: workflow.nodes || [],
      triggers: workflow.triggers || [],
      retryPolicy: { attempts: 2, backoffMs: 250, ...workflow.retryPolicy },
      timeoutMs: workflow.timeoutMs || 15 * 60 * 1000,
      checkpoints: workflow.checkpoints !== false,
      approval: Boolean(workflow.approval),
    }
    const validation = this.validate(normalized)
    normalized.status = validation.valid ? 'ready' : 'invalid'
    normalized.validation = validation
    this.workflows.set(normalized.id, normalized)
    return normalized
  }

  validate(workflow) {
    const ids = new Set()
    const errors = []
    workflow.nodes.forEach((node) => {
      if (!node.id || ids.has(node.id)) errors.push(`Duplicate or missing node id: ${node.id || 'unknown'}`)
      ids.add(node.id)
    })
    workflow.nodes.forEach((node) => (node.dependsOn || []).forEach((dependency) => {
      if (!ids.has(dependency)) errors.push(`${node.id} depends on missing node ${dependency}`)
    }))
    if (hasCycle(workflow.nodes)) errors.push('Workflow contains a dependency cycle')
    return { valid: errors.length === 0, errors }
  }

  start(workflowId, context = {}) {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) return { status: 'not-found', workflowId }
    if (workflow.status !== 'ready') return { status: 'invalid', workflowId, validation: workflow.validation }
    const run = {
      id: `workflow-run-${this.runs.length + 1}`,
      workflowId,
      status: workflow.approval ? 'awaiting-approval' : 'running',
      context,
      checkpoint: workflow.nodes[0]?.id || null,
      attempts: 0,
      createdAt: new Date().toISOString(),
    }
    this.runs.unshift(run)
    return run
  }

  readyNodes(workflowId, completed = []) {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) return []
    const completedSet = new Set(completed)
    return workflow.nodes.filter((node) => (node.dependsOn || []).every((id) => completedSet.has(id)))
  }

  snapshot() {
    return { workflows: this.workflows.size, runs: this.runs.length, ready: [...this.workflows.values()].filter((workflow) => workflow.status === 'ready').length }
  }
}

function hasCycle(nodes) {
  const state = new Map()
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const visit = (id) => {
    if (state.get(id) === 'visiting') return true
    if (state.get(id) === 'visited') return false
    state.set(id, 'visiting')
    for (const dependency of byId.get(id)?.dependsOn || []) if (visit(dependency)) return true
    state.set(id, 'visited')
    return false
  }
  return nodes.some((node) => visit(node.id))
}
