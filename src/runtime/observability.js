export class ObservabilityLedger {
  constructor() {
    this.traces = new Map()
    this.events = []
  }

  startTask(task) {
    const trace = {
      taskId: task.id,
      sessionId: task.sessionId,
      agents: task.plan.routes.map((route) => route.agent.id),
      models: task.models,
      tools: task.tools,
      memoryRefs: task.plan.contextSources,
      startedAt: new Date().toISOString(),
      endedAt: null,
      resource: { cpu: 'tracked by runtime adapter', gpu: 'tracked by runtime adapter', ram: 'tracked by runtime adapter' },
      events: [],
      verification: 'pending',
      state: 'running',
    }
    this.traces.set(task.id, trace)
    this.record(task.id, 'task.started', { checkpoint: task.checkpoint })
    return trace
  }

  record(taskId, type, data = {}) {
    const event = { taskId, type, data, time: new Date().toISOString() }
    this.events.unshift(event)
    const trace = this.traces.get(taskId)
    if (trace) trace.events.unshift(event)
    this.events = this.events.slice(0, 300)
    return event
  }

  completeTask(taskId, { status, verification = 'pending' } = {}) {
    const trace = this.traces.get(taskId)
    if (!trace) return null
    trace.endedAt = new Date().toISOString()
    trace.state = status
    trace.verification = verification
    this.record(taskId, 'task.ended', { status, verification })
    return trace
  }

  get(taskId) {
    return this.traces.get(taskId) || null
  }

  snapshot() {
    return { traces: this.traces.size, events: this.events.length, active: [...this.traces.values()].filter((trace) => trace.state === 'running').length, privateReasoningStored: false }
  }
}
