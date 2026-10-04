export class MetaLearningEngine {
  constructor({ memory } = {}) {
    this.memory = memory
    this.evaluations = []
  }

  evaluate(task) {
    const graph = task.graph.toJSON()
    const completed = graph.filter((node) => node.status === 'completed').length
    const total = graph.length || 1
    const verification = graph.find((node) => node.id === 'verify')
    const score = Math.round(((completed / total) * 0.75 + (verification?.status === 'completed' ? 0.25 : 0)) * 100)
    const evaluation = {
      taskId: task.id,
      intent: task.intent,
      score,
      success: task.status === 'Completed',
      completedNodes: completed,
      totalNodes: total,
      createdAt: new Date().toISOString(),
    }
    this.evaluations.unshift(evaluation)
    this.evaluations = this.evaluations.slice(0, 100)
    return evaluation
  }

  updateStrategy(task, evaluation) {
    const routes = task.plan.routes.map((route) => route.agent.name)
    const strategy = {
      key: `${task.intent}:${task.plan.multimodal.output}`,
      intent: task.intent,
      output: task.plan.multimodal.output,
      route: routes,
      score: evaluation.score,
      note: evaluation.success ? 'Reuse route; verification passed.' : 'Keep route but add critique and verification coverage.',
      automaticWeightUpdate: false,
    }
    this.memory?.rememberStrategy(strategy)
    return strategy
  }

  recommend(intent, output = 'default') {
    return this.memory?.strategy.find((item) => item.intent === intent && item.output === output)
      || this.memory?.strategy.find((item) => item.intent === intent)
      || null
  }

  snapshot() {
    return {
      evaluations: this.evaluations.length,
      averageScore: this.evaluations.length ? Math.round(this.evaluations.reduce((sum, item) => sum + item.score, 0) / this.evaluations.length) : null,
      strategies: this.memory?.strategy.length || 0,
      weightsChanged: false,
    }
  }
}
