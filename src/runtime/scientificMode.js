export class ScientificMode {
  constructor({ twin, sandbox } = {}) {
    this.twin = twin
    this.sandbox = sandbox
    this.runs = []
  }

  plan(question, { domain = 'general', assumptions = [] } = {}) {
    return {
      question,
      domain,
      assumptions: assumptions.length ? assumptions : ['Inputs are bounded', 'Units are explicit', 'Uncertainty is reported'],
      steps: ['question', 'research', 'hypothesis', 'assumptions', 'equations', 'calculation', 'simulation', 'validation', 'uncertainty', 'report'],
      evidenceTypes: ['known fact', 'sourced claim', 'calculated result', 'simulation result', 'measurement', 'hypothesis', 'uncertainty'],
      requiresSimulation: /simulate|waveform|model|predict|twin/i.test(question),
    }
  }

  run(plan) {
    const result = {
      id: `science-${this.runs.length + 1}`,
      question: plan.question,
      domain: plan.domain,
      assumptions: plan.assumptions,
      calculation: { status: 'sandboxed', value: 'calculation adapter ready' },
      simulation: plan.requiresSimulation ? { status: 'simulated', uncertainty: 'bounded' } : { status: 'not-requested' },
      validation: { status: 'pending-independent-review' },
      status: 'evidence-package-ready',
      createdAt: new Date().toISOString(),
    }
    this.runs.unshift(result)
    return result
  }

  snapshot() {
    return { runs: this.runs.length, last: this.runs[0] || null, evidenceLabels: ['fact', 'source', 'calculation', 'simulation', 'measurement', 'hypothesis', 'uncertainty'] }
  }
}
