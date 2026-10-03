export const SAFETY_STEPS = ['AI decision', 'validation', 'policy', 'authorization', 'safety', 'action']

export class SafetyArchitecture {
  constructor({ security } = {}) {
    this.security = security
    this.actions = []
  }

  evaluate(decision, { policy = {}, approved = false, physical = false } = {}) {
    const validation = !decision?.uncertain && !decision?.invalid
    const authorization = approved || !policy.requiresApproval
    const safety = !physical || (policy.level >= 6 && approved)
    return {
      steps: SAFETY_STEPS,
      decision: decision || {},
      validation,
      policy: policy.reason || 'policy evaluated',
      authorization,
      safety,
      action: validation && authorization && safety ? 'permitted-by-contract' : 'blocked-until-reviewed',
      humanApproval: policy.requiresApproval || physical,
    }
  }

  record(action) {
    const event = { ...action, createdAt: new Date().toISOString() }
    this.actions.unshift(event)
    return event
  }

  snapshot() {
    return { steps: SAFETY_STEPS, actions: this.actions.length, physicalWrites: 0, bypasses: 0 }
  }
}
