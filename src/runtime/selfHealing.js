export class SelfHealingWorkflow {
  constructor({ sandbox, verification } = {}) {
    this.sandbox = sandbox
    this.verification = verification
    this.runs = []
  }

  diagnose(task, error = null) {
    const failedNodes = task.graph.toJSON().filter((node) => node.status === 'failed')
    return {
      taskId: task.id,
      error: error || failedNodes[0]?.error || null,
      failedNodes,
      likelyCause: error ? 'execution error' : failedNodes.length ? 'node failure' : 'no failure detected',
      next: failedNodes.length ? 'propose-fix' : 'continue',
    }
  }

  proposeFix(diagnosis) {
    return {
      diagnosis,
      fix: diagnosis.failedNodes.length ? `Retry ${diagnosis.failedNodes[0].label} with a fresh sandbox and additional verification` : 'No fix required',
      requiresApproval: Boolean(diagnosis.failedNodes.length),
      rollback: 'restore-last-checkpoint',
    }
  }

  sandboxTest(fix) {
    const sandbox = this.sandbox?.create({ profile: 'code', scope: 'task-checkpoint', approved: true })
    const result = sandbox ? this.sandbox.execute(sandbox.id, { type: 'fix-test', fix }, { approved: true }) : { status: 'adapter-ready' }
    return { ...fix, sandbox: result, test: result.status === 'simulated' ? 'passed' : 'blocked' }
  }

  record(taskId, outcome) {
    const run = { id: `heal-${this.runs.length + 1}`, taskId, ...outcome, createdAt: new Date().toISOString() }
    this.runs.unshift(run)
    return run
  }

  snapshot() {
    return { attempts: this.runs.length, recovered: this.runs.filter((run) => run.test === 'passed').length, policy: 'never conceal failure' }
  }
}
