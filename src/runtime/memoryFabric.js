export class MemoryFabric {
  constructor({ knowledge } = {}) {
    this.knowledge = knowledge
    this.working = new Map()
    this.episodic = []
    this.semantic = []
    this.procedural = []
    this.strategy = []
  }

  setWorking(key, value) {
    this.working.set(key, { key, value, updatedAt: new Date().toISOString() })
  }

  rememberEpisode(event) {
    this.episodic.unshift({ id: `episode-${this.episodic.length + 1}`, ...event, createdAt: new Date().toISOString() })
    this.episodic = this.episodic.slice(0, 100)
  }

  rememberSemantic(fact, metadata = {}) {
    this.semantic.unshift({ id: `fact-${this.semantic.length + 1}`, fact, ...metadata, createdAt: new Date().toISOString() })
    this.semantic = this.semantic.slice(0, 500)
  }

  rememberProcedure(name, steps, metadata = {}) {
    this.procedural.unshift({ id: `procedure-${this.procedural.length + 1}`, name, steps, ...metadata, updatedAt: new Date().toISOString() })
    this.procedural = this.procedural.slice(0, 100)
  }

  rememberStrategy(strategy) {
    const existing = this.strategy.find((item) => item.key === strategy.key)
    if (existing) Object.assign(existing, strategy, { updatedAt: new Date().toISOString() })
    else this.strategy.unshift({ id: `strategy-${this.strategy.length + 1}`, ...strategy, updatedAt: new Date().toISOString() })
    this.strategy = this.strategy.slice(0, 100)
  }

  rememberTask(task, evaluation = {}) {
    this.rememberEpisode({ taskId: task.id, objective: task.objective, intent: task.intent, outcome: task.status, score: evaluation.score })
    this.setWorking('lastTask', { id: task.id, objective: task.objective, status: task.status })
    this.rememberProcedure(`${task.intent} orchestration`, task.plan.multimodal.stages.map((stage) => stage.label), { taskId: task.id })
  }

  retrieve(query, { limit = 8 } = {}) {
    const text = String(query || '').toLowerCase()
    const matches = []
    const add = (type, item, value) => {
      const haystack = JSON.stringify(value).toLowerCase()
      const score = text.split(/\s+/).filter((term) => term.length > 2 && haystack.includes(term)).length
      if (score) matches.push({ type, score, item })
    }
    this.episodic.forEach((item) => add('episodic', item, item.objective))
    this.semantic.forEach((item) => add('semantic', item, item.fact))
    this.procedural.forEach((item) => add('procedural', item, item.name))
    this.strategy.forEach((item) => add('strategy', item, item.key))
    if (this.knowledge) this.knowledge.search(query, { limit }).forEach((item) => add('knowledge', item, item.evidence))
    return matches.sort((a, b) => b.score - a.score).slice(0, limit).map(({ type, score, item }) => ({ type, score, ...item }))
  }

  contextFor(query) {
    return {
      working: [...this.working.values()],
      retrieved: this.retrieve(query),
      memoryRefs: ['working', 'episodic', 'semantic', 'procedural', 'strategy'],
    }
  }

  snapshot() {
    return {
      working: this.working.size,
      episodic: this.episodic.length,
      semantic: this.semantic.length,
      procedural: this.procedural.length,
      strategy: this.strategy.length,
    }
  }
}
