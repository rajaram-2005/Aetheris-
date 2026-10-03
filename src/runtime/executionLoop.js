export const EXECUTION_STAGES = ['chat input', 'intent understanding', 'context load', 'task planning', 'capability routing', 'agent / model / tool routing', 'execution', 'observation', 'verification', 'synthesize', 'store learning', 'chat response']

export class ExecutionLoop {
  constructor({ observability } = {}) {
    this.observability = observability
    this.runs = new Map()
  }

  start(task) {
    const run = { id: `loop-${task.id}`, taskId: task.id, stages: EXECUTION_STAGES.map((label, index) => ({ id: `stage-${index + 1}`, label, status: index === 0 ? 'active' : 'queued' })), current: 'chat input', status: 'running', createdAt: new Date().toISOString() }
    this.runs.set(task.id, run)
    this.observability?.record(task.id, 'execution-loop.started', { stage: run.current })
    return run
  }

  transition(taskId, stageLabel, status = 'completed') {
    const run = this.runs.get(taskId)
    if (!run) return null
    const stage = run.stages.find((item) => item.label === stageLabel || item.id === stageLabel)
    if (stage) stage.status = status
    const currentIndex = run.stages.findIndex((item) => item.status === 'active')
    if (status === 'completed' && currentIndex >= 0) {
      run.stages[currentIndex].status = 'completed'
      if (run.stages[currentIndex + 1]) run.stages[currentIndex + 1].status = 'active'
      run.current = run.stages[currentIndex + 1]?.label || 'complete'
    }
    this.observability?.record(taskId, 'execution-loop.transition', { stage: stageLabel, status, current: run.current })
    return run
  }

  pause(taskId, reason = 'paused by user') {
    const run = this.runs.get(taskId)
    if (!run) return null
    run.status = 'paused'
    run.pauseReason = reason
    this.observability?.record(taskId, 'execution-loop.paused', { reason, current: run.current })
    return run
  }

  resume(taskId) {
    const run = this.runs.get(taskId)
    if (!run) return null
    run.status = 'running'
    run.pauseReason = null
    this.observability?.record(taskId, 'execution-loop.resumed', { current: run.current })
    return run
  }

  cancel(taskId, reason = 'cancelled by user') {
    const run = this.runs.get(taskId)
    if (!run) return null
    run.status = 'cancelled'
    run.cancelReason = reason
    this.observability?.record(taskId, 'execution-loop.cancelled', { reason, current: run.current })
    return run
  }

  fail(taskId, reason) {
    const run = this.runs.get(taskId)
    if (!run) return null
    run.status = 'replan'
    run.error = reason
    this.observability?.record(taskId, 'execution-loop.replan', { reason })
    return run
  }

  complete(taskId) {
    const run = this.runs.get(taskId)
    if (!run) return null
    run.status = 'completed'
    run.current = 'complete'
    run.stages.forEach((stage) => { if (stage.status !== 'queued') stage.status = 'completed' })
    return run
  }

  snapshot() {
    return { stages: EXECUTION_STAGES, runs: this.runs.size, active: [...this.runs.values()].filter((run) => run.status === 'running').length }
  }
}
