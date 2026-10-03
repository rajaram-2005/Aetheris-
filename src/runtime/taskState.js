export class TaskStateStore {
  constructor({ storage = null, key = 'aetheris.task-state' } = {}) {
    this.storage = storage || (typeof localStorage !== 'undefined' ? localStorage : null)
    this.key = key
    this.tasks = new Map()
    this.events = []
    this.hydrate()
  }

  create(task) {
    const state = {
      id: task.id,
      parent: task.parent || null,
      objective: task.objective,
      context: task.plan?.contextSources || 0,
      agents: task.agents,
      models: task.models,
      tools: task.tools,
      dependencies: task.graph?.toJSON?.().map((node) => ({ id: node.id, dependsOn: node.dependsOn })) || [],
      status: task.status,
      checkpoint: task.checkpoint || 'intent',
      outputs: [],
      errors: [],
      verification: 'pending',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.tasks.set(state.id, state)
    this.record(state.id, 'task.created', { checkpoint: state.checkpoint })
    this.persist()
    return state
  }

  update(taskId, patch = {}) {
    const state = this.tasks.get(taskId)
    if (!state) return null
    Object.assign(state, patch, { updatedAt: new Date().toISOString() })
    this.persist()
    return state
  }

  checkpoint(taskId, checkpoint, patch = {}) {
    return this.update(taskId, { checkpoint, ...patch })
  }

  pause(taskId, reason = 'paused by user') {
    const state = this.update(taskId, { status: 'Paused', pauseReason: reason })
    if (state) this.record(taskId, 'task.paused', { reason })
    return state
  }

  resume(taskId) {
    const state = this.update(taskId, { status: 'Running', pauseReason: null })
    if (state) this.record(taskId, 'task.resumed', { checkpoint: state.checkpoint })
    return state
  }

  cancel(taskId, reason = 'cancelled by user') {
    const state = this.update(taskId, { status: 'Cancelled', cancelReason: reason, cancelledAt: new Date().toISOString(), checkpoint: 'cancelled' })
    if (state) this.record(taskId, 'task.cancelled', { reason })
    return state
  }

  complete(taskId, { status = 'Completed', verification = 'approved', outputs = [] } = {}) {
    const state = this.update(taskId, { status, verification, outputs, completedAt: new Date().toISOString(), checkpoint: 'complete' })
    if (state) this.record(taskId, 'task.completed', { status, verification })
    return state
  }

  recover(taskId) {
    const state = this.tasks.get(taskId)
    if (!state) return null
    return { taskId, checkpoint: state.checkpoint, status: state.status, resumable: !['Completed', 'Failed', 'Cancelled'].includes(state.status), dependencies: state.dependencies }
  }

  get(taskId) {
    return this.tasks.get(taskId) || null
  }

  record(taskId, type, data = {}) {
    this.events.unshift({ taskId, type, data, time: new Date().toISOString() })
    this.events = this.events.slice(0, 200)
    this.persist()
  }

  snapshot() {
    return { tasks: this.tasks.size, resumable: [...this.tasks.values()].filter((task) => !['Completed', 'Failed'].includes(task.status)).length, events: this.events.length, persisted: Boolean(this.storage) }
  }

  hydrate() {
    if (!this.storage) return
    try {
      const saved = JSON.parse(this.storage.getItem(this.key) || '{}')
      ;(saved.tasks || []).forEach((task) => this.tasks.set(task.id, task))
      this.events = saved.events || []
    } catch {
      this.tasks.clear()
      this.events = []
    }
  }

  persist() {
    if (!this.storage) return
    try { this.storage.setItem(this.key, JSON.stringify({ tasks: [...this.tasks.values()], events: this.events.slice(0, 200) })) } catch { /* Persistence is best effort. */ }
  }
}
