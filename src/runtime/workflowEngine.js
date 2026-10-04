export const WORKFLOW_NODE_STATUS = Object.freeze({
  QUEUED: 'queued',
  READY: 'ready',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled',
})

export class WorkflowEngine {
  constructor({ emit = () => {}, now = () => new Date().toISOString() } = {}) {
    this.emit = emit
    this.now = now
    this.workflows = new Map()
    this.runs = new Map()
    this.events = []
  }

  define(workflow) {
    const normalized = {
      id: workflow.id || `workflow-${this.workflows.size + 1}`,
      name: workflow.name || 'Untitled workflow',
      version: workflow.version || 1,
      nodes: (workflow.nodes || []).map((node, index) => normalizeNode(node, index)),
      triggers: workflow.triggers || [],
      retryPolicy: normalizeRetryPolicy(workflow.retryPolicy),
      timeoutMs: workflow.timeoutMs || 15 * 60 * 1000,
      checkpoints: workflow.checkpoints !== false,
      approval: Boolean(workflow.approval),
      compensation: workflow.compensation || [],
      createdAt: this.now(),
    }
    const validation = this.validate(normalized)
    normalized.status = validation.valid ? 'ready' : 'invalid'
    normalized.validation = validation
    this.workflows.set(normalized.id, normalized)
    this.emit({ type: 'workflow.defined', workflow: publicWorkflow(normalized) })
    return publicWorkflow(normalized)
  }

  validate(workflow) {
    const ids = new Set()
    const errors = []
    const warnings = []
    if (!workflow.nodes.length) errors.push('Workflow requires at least one node')
    workflow.nodes.forEach((node) => {
      if (!node.id || ids.has(node.id)) errors.push(`Duplicate or missing node id: ${node.id || 'unknown'}`)
      ids.add(node.id)
      if (node.retryPolicy.attempts < 1) errors.push(`${node.id} must allow at least one attempt`)
      if (node.timeoutMs <= 0) errors.push(`${node.id} timeout must be positive`)
    })
    workflow.nodes.forEach((node) => (node.dependsOn || []).forEach((dependency) => {
      if (!ids.has(dependency)) errors.push(`${node.id} depends on missing node ${dependency}`)
      if (dependency === node.id) errors.push(`${node.id} cannot depend on itself`)
    }))
    if (hasCycle(workflow.nodes)) errors.push('Workflow contains a dependency cycle')
    if (!workflow.nodes.some((node) => node.dependsOn.length === 0)) warnings.push('Workflow has no root node')
    if (workflow.timeoutMs <= 0) errors.push('Workflow timeout must be positive')
    return { valid: errors.length === 0, errors, warnings }
  }

  start(workflowId, context = {}) {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) return { status: 'not-found', workflowId }
    if (workflow.status !== 'ready') return { status: 'invalid', workflowId, validation: workflow.validation }
    const id = `workflow-run-${this.runs.size + 1}`
    const awaitingApproval = workflow.approval && !context.approved
    const run = {
      id,
      workflowId,
      status: awaitingApproval ? 'awaiting-approval' : 'running',
      context: { ...context },
      checkpoint: null,
      current: null,
      completed: [],
      actions: [],
      events: [],
      nodes: workflow.nodes.map((node) => ({ ...node, dependsOn: [...node.dependsOn], status: awaitingApproval ? WORKFLOW_NODE_STATUS.QUEUED : node.dependsOn.length ? WORKFLOW_NODE_STATUS.QUEUED : WORKFLOW_NODE_STATUS.READY, attempts: 0, output: null, error: null })),
      createdAt: this.now(),
      updatedAt: this.now(),
      approvalRequired: awaitingApproval,
      compensation: [],
    }
    this.runs.set(id, run)
    this.record(run, 'workflow.started', { approvalRequired: awaitingApproval })
    this.emit({ type: 'workflow.started', run: this.publicRun(run) })
    return this.publicRun(run)
  }

  approve(runId) {
    const run = this.runs.get(runId)
    if (!run || run.status !== 'awaiting-approval') return run ? this.publicRun(run) : null
    run.status = 'running'
    run.approvalRequired = false
    this.refreshReady(run)
    this.touch(run)
    this.record(run, 'workflow.approved', {})
    this.emit({ type: 'workflow.approved', run: this.publicRun(run) })
    return this.publicRun(run)
  }

  readyNodes(workflowId, completed = []) {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) return []
    const completedSet = new Set(completed)
    return workflow.nodes.filter((node) => (node.dependsOn || []).every((id) => completedSet.has(id))).map((node) => ({ ...node }))
  }

  runReadyNodes(runId) {
    const run = this.runs.get(runId)
    if (!run) return []
    return run.nodes.filter((node) => node.status === WORKFLOW_NODE_STATUS.READY).map((node) => ({ ...node }))
  }

  advance(runId, nodeId = null) {
    const run = this.runs.get(runId)
    if (!run || !['running'].includes(run.status)) return run ? this.publicRun(run) : null
    this.refreshReady(run)
    const node = nodeId ? run.nodes.find((item) => item.id === nodeId) : run.nodes.find((item) => item.status === WORKFLOW_NODE_STATUS.READY)
    if (!node) return this.publicRun(run)
    if (node.status !== WORKFLOW_NODE_STATUS.READY) return { ...this.publicRun(run), error: `Node ${node.id} is not ready` }
    node.status = WORKFLOW_NODE_STATUS.RUNNING
    node.attempts += 1
    node.startedAt = this.now()
    run.current = node.id
    run.checkpoint = node.id
    this.touch(run)
    this.record(run, 'node.started', { nodeId: node.id, attempt: node.attempts })
    this.emit({ type: 'workflow.node-started', run: this.publicRun(run) })
    return this.publicRun(run)
  }

  completeNode(runId, nodeId, output = null) {
    const run = this.runs.get(runId)
    const node = run?.nodes.find((item) => item.id === nodeId)
    if (!run || !node) return null
    if (node.status !== WORKFLOW_NODE_STATUS.RUNNING) return { ...this.publicRun(run), error: `Node ${nodeId} is not running` }
    node.status = WORKFLOW_NODE_STATUS.COMPLETED
    node.output = output
    node.completedAt = this.now()
    run.completed = [...new Set([...run.completed, node.id])]
    run.actions.push({ nodeId: node.id, status: node.status, attempt: node.attempts, completedAt: node.completedAt })
    run.current = null
    run.checkpoint = node.id
    this.refreshReady(run)
    if (run.completed.length === run.nodes.length) run.status = 'completed'
    this.touch(run)
    this.record(run, 'node.completed', { nodeId: node.id, output })
    if (run.status === 'completed') this.record(run, 'workflow.completed', { completed: run.completed.length })
    this.emit({ type: run.status === 'completed' ? 'workflow.completed' : 'workflow.node-completed', run: this.publicRun(run) })
    return this.publicRun(run)
  }

  failNode(runId, nodeId, error = 'node failed', { retry = true } = {}) {
    const run = this.runs.get(runId)
    const node = run?.nodes.find((item) => item.id === nodeId)
    if (!run || !node) return null
    const canRetry = retry && node.attempts < node.retryPolicy.attempts
    node.error = String(error)
    if (canRetry) {
      node.status = WORKFLOW_NODE_STATUS.READY
      run.current = null
      this.record(run, 'node.retry-scheduled', { nodeId, attempt: node.attempts, nextAttempt: node.attempts + 1, backoffMs: node.retryPolicy.backoffMs })
    } else {
      node.status = WORKFLOW_NODE_STATUS.FAILED
      run.status = 'failed'
      run.current = null
      this.record(run, 'node.failed', { nodeId, error: node.error, attempts: node.attempts })
      this.runCompensation(run, node)
    }
    this.touch(run)
    this.emit({ type: canRetry ? 'workflow.node-retry' : 'workflow.failed', run: this.publicRun(run) })
    return this.publicRun(run)
  }

  checkTimeout(runId, now = Date.now()) {
    const run = this.runs.get(runId)
    if (!run || run.status !== 'running' || !run.current) return run ? this.publicRun(run) : null
    const node = run.nodes.find((item) => item.id === run.current)
    const started = Date.parse(node?.startedAt || '')
    if (!node || !Number.isFinite(started)) return this.publicRun(run)
    if (now - started <= node.timeoutMs) return this.publicRun(run)
    return this.failNode(runId, node.id, `Node ${node.id} exceeded timeout`, { retry: true })
  }

  pause(runId, reason = 'paused by user') {
    const run = this.runs.get(runId)
    if (!run || ['completed', 'failed', 'cancelled'].includes(run.status)) return run ? this.publicRun(run) : null
    run.status = 'paused'
    run.pauseReason = reason
    this.touch(run)
    this.record(run, 'workflow.paused', { reason, checkpoint: run.checkpoint })
    this.emit({ type: 'workflow.paused', run: this.publicRun(run) })
    return this.publicRun(run)
  }

  resume(runId) {
    const run = this.runs.get(runId)
    if (!run || run.status !== 'paused') return run ? this.publicRun(run) : null
    run.status = 'running'
    run.pauseReason = null
    this.refreshReady(run)
    this.touch(run)
    this.record(run, 'workflow.resumed', { checkpoint: run.checkpoint })
    this.emit({ type: 'workflow.resumed', run: this.publicRun(run) })
    return this.publicRun(run)
  }

  cancel(runId, reason = 'cancelled by user') {
    const run = this.runs.get(runId)
    if (!run || ['completed', 'failed', 'cancelled'].includes(run.status)) return run ? this.publicRun(run) : null
    run.status = 'cancelled'
    run.cancelReason = reason
    run.nodes.forEach((node) => { if (![WORKFLOW_NODE_STATUS.COMPLETED, WORKFLOW_NODE_STATUS.FAILED].includes(node.status)) node.status = WORKFLOW_NODE_STATUS.CANCELLED })
    this.touch(run)
    this.record(run, 'workflow.cancelled', { reason, checkpoint: run.checkpoint })
    this.emit({ type: 'workflow.cancelled', run: this.publicRun(run) })
    return this.publicRun(run)
  }

  recover(runId) {
    const run = this.runs.get(runId)
    if (!run) return null
    return { runId, status: run.status, checkpoint: run.checkpoint, current: run.current, resumable: ['paused', 'running', 'awaiting-approval'].includes(run.status), ready: this.runReadyNodes(runId).map((node) => node.id), completed: [...run.completed] }
  }

  observe(runId) {
    return this.publicRun(this.runs.get(runId))
  }

  history(runId, { limit = 100 } = {}) {
    const run = this.runs.get(runId)
    if (!run) return null
    return { runId, events: run.events.slice(0, Math.min(Math.max(Number(limit) || 100, 1), 500)).map((event) => ({ ...event, data: { ...event.data } })), actions: run.actions.slice().reverse() }
  }

  refreshReady(run) {
    if (!['running', 'paused'].includes(run.status)) return
    const completed = new Set(run.completed)
    run.nodes.forEach((node) => {
      if (node.status === WORKFLOW_NODE_STATUS.QUEUED && node.dependsOn.every((dependency) => completed.has(dependency))) node.status = WORKFLOW_NODE_STATUS.READY
    })
  }

  runCompensation(run, failedNode) {
    const workflow = this.workflows.get(run.workflowId)
    const compensation = [failedNode.compensate, ...(workflow?.compensation || [])].filter(Boolean)
    run.compensation = compensation.map((action) => ({ action, status: 'planned', plannedAt: this.now() }))
    if (run.compensation.length) this.record(run, 'compensation.planned', { count: run.compensation.length })
  }

  touch(run) {
    run.updatedAt = this.now()
  }

  record(run, type, data = {}) {
    const event = { id: `workflow-event-${this.events.length + 1}`, runId: run.id, type, data, time: this.now() }
    run.events.unshift(event)
    run.events = run.events.slice(0, 500)
    this.events.unshift(event)
    this.events = this.events.slice(0, 1000)
  }

  publicRun(run) {
    if (!run) return null
    return { ...run, nodes: run.nodes.map((node) => ({ ...node, dependsOn: [...node.dependsOn] })), completed: [...run.completed], actions: run.actions.map((action) => ({ ...action })), events: run.events.map((event) => ({ ...event, data: { ...event.data } })), compensation: run.compensation.map((item) => ({ ...item })) }
  }

  snapshot() {
    const runs = [...this.runs.values()]
    return { workflows: this.workflows.size, runs: runs.length, active: runs.filter((run) => ['running', 'paused', 'awaiting-approval'].includes(run.status)).length, completed: runs.filter((run) => run.status === 'completed').length, failed: runs.filter((run) => run.status === 'failed').length, ready: [...this.workflows.values()].filter((workflow) => workflow.status === 'ready').length, events: this.events.length }
  }
}

function normalizeNode(node, index) {
  return {
    id: node.id || `node-${index + 1}`,
    label: node.label || node.name || node.id || `Node ${index + 1}`,
    kind: node.kind || 'operation',
    detail: node.detail || '',
    dependsOn: [...(node.dependsOn || [])],
    retryPolicy: normalizeRetryPolicy(node.retryPolicy),
    timeoutMs: node.timeoutMs || 15 * 60 * 1000,
    checkpoint: node.checkpoint !== false,
    compensate: node.compensate || null,
  }
}

function normalizeRetryPolicy(policy = {}) {
  return { attempts: Math.min(Math.max(Number(policy.attempts) || 2, 1), 10), backoffMs: Math.max(Number(policy.backoffMs) || 250, 0) }
}

function publicWorkflow(workflow) {
  return { ...workflow, nodes: workflow.nodes.map((node) => ({ ...node, dependsOn: [...node.dependsOn] })) }
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
