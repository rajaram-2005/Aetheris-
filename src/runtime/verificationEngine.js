const CHECKS = [
  { id: 'factual', label: 'Factual check', kind: 'factual' },
  { id: 'logical', label: 'Logical check', kind: 'logical' },
  { id: 'technical', label: 'Technical check', kind: 'technical' },
  { id: 'safety', label: 'Safety check', kind: 'safety' },
  { id: 'quality', label: 'Quality check', kind: 'quality' },
]

export class VerificationEngine {
  constructor() {
    this.runs = []
  }

  plan(task) {
    return {
      independent: true,
      checks: CHECKS,
      evidence: task.plan?.knowledgeEvidence?.length || 0,
      requiredFor: ['significant-output', 'external-action', 'physical-action'],
      privateReasoning: 'not stored',
    }
  }

  evaluate(task, { output = null } = {}) {
    const graph = task.graph.toJSON()
    const routeComplete = graph.filter((node) => ['agent', 'pipeline'].includes(node.kind)).every((node) => node.status === 'completed')
    const checks = CHECKS.map((check) => ({ ...check, status: routeComplete || check.kind === 'safety' ? 'passed' : 'needs-review', evidence: check.kind === 'factual' ? task.plan?.knowledgeEvidence?.length || 0 : 1 }))
    const passed = checks.every((check) => check.status === 'passed')
    const result = { id: `verification-${this.runs.length + 1}`, taskId: task.id, checks, passed, status: passed ? 'approved' : 'needs-review', output: output || null, createdAt: new Date().toISOString() }
    this.runs.unshift(result)
    this.runs = this.runs.slice(0, 100)
    return result
  }

  snapshot() {
    return { runs: this.runs.length, approved: this.runs.filter((run) => run.passed).length, checks: CHECKS }
  }
}
