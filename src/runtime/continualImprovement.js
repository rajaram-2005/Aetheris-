export class ContinualImprovement {
  constructor({ memory, knowledge } = {}) {
    this.memory = memory
    this.knowledge = knowledge
    this.outcomes = []
  }

  record(task, { useful = true, strategy = true, feedback = null } = {}) {
    const outcome = { taskId: task.id, intent: task.intent, useful, strategy, feedback, createdAt: new Date().toISOString(), weightsChanged: false }
    this.outcomes.unshift(outcome)
    if (useful) this.memory?.rememberSemantic(`Useful outcome: ${task.objective}`, { taskId: task.id, source: 'continual-improvement' })
    if (strategy) this.memory?.rememberStrategy({ key: `${task.intent}:${task.plan.multimodal.output}`, intent: task.intent, output: task.plan.multimodal.output, source: 'continual-improvement', score: task.evaluation?.score || 0, automaticWeightUpdate: false })
    return outcome
  }

  snapshot() {
    return { outcomes: this.outcomes.length, useful: this.outcomes.filter((item) => item.useful).length, knowledgeUpdates: this.outcomes.filter((item) => item.useful).length, strategyUpdates: this.outcomes.filter((item) => item.strategy).length, weightsChanged: false }
  }
}
