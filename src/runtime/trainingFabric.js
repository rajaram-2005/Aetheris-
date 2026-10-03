export const TRAINING_STAGES = ['collection', 'cleaning', 'deduplication', 'filtering', 'annotation', 'evaluation', 'training', 'validation', 'benchmark', 'safety evaluation', 'model registry', 'deployment']

export class TrainingFabric {
  constructor({ modelRegistry = [] } = {}) {
    this.modelRegistry = modelRegistry
    this.jobs = []
  }

  plan({ dataset = 'local project data', objective = 'specialized capability', privacy = 'local-only' } = {}) {
    return {
      dataset,
      objective,
      privacy,
      stages: TRAINING_STAGES.map((label, index) => ({ id: `stage-${index + 1}`, label, status: index === 0 ? 'ready' : 'queued' })),
      inferenceSeparated: true,
      automaticWeightUpdate: false,
      approval: 'human review before deployment',
    }
  }

  createJob(plan) {
    const job = { id: `training-${this.jobs.length + 1}`, ...plan, status: 'planned', createdAt: new Date().toISOString() }
    this.jobs.unshift(job)
    return job
  }

  snapshot() {
    return { jobs: this.jobs.length, stages: TRAINING_STAGES, inferenceSeparated: true, automaticWeightUpdate: false }
  }
}
