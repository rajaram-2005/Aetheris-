export class OfflineMemoryJournal {
  constructor({ memory, knowledge, storage = null, key = 'aetheris.offline-memory-journal' } = {}) {
    this.memory = memory
    this.knowledge = knowledge
    this.storage = storage || (typeof localStorage !== 'undefined' ? localStorage : null)
    this.key = key
    this.queue = []
    this.applied = []
    this.hydrate()
  }

  enqueue(update) {
    const entry = { id: `memory-update-${Date.now()}-${this.queue.length}`, type: update.type || 'semantic', payload: update.payload || update, source: update.source || 'aetheris-local', status: 'queued', createdAt: new Date().toISOString() }
    this.queue.push(entry)
    this.persist()
    return entry
  }

  enqueueTask(task, { verification = 'pending', consolidation = null } = {}) {
    return this.enqueue({
      type: 'task-outcome',
      source: 'offline-task-memory',
      payload: { taskId: task.id, objective: task.objective, intent: task.intent, status: task.status, verification, consolidationId: consolidation?.id || null },
    })
  }

  flush({ localOnly = true } = {}) {
    const pending = this.queue.filter((entry) => entry.status === 'queued')
    pending.forEach((entry) => {
      this.apply(entry, { localOnly })
      entry.status = 'applied'
      entry.appliedAt = new Date().toISOString()
      this.applied.unshift(entry)
    })
    this.queue = this.queue.filter((entry) => entry.status !== 'applied')
    this.applied = this.applied.slice(0, 200)
    this.persist()
    return { applied: pending.length, remaining: this.queue.length, mode: localOnly ? 'LOCAL ONLY' : 'approved sync' }
  }

  apply(entry) {
    const payload = entry.payload || {}
    if (entry.type === 'semantic' || entry.type === 'task-outcome') this.memory?.rememberSemantic(JSON.stringify(payload), { source: entry.source, offline: true })
    if (entry.type === 'knowledge' && payload.text) this.knowledge?.ingest({ id: payload.id, title: payload.title, type: payload.type || 'offline', text: payload.text })
  }

  status() {
    return { mode: 'LOCAL ONLY', pending: this.queue.length, applied: this.applied.length, lastUpdate: this.applied[0]?.appliedAt || null, persisted: Boolean(this.storage), safeToSync: true }
  }

  hydrate() {
    if (!this.storage) return
    try {
      const saved = JSON.parse(this.storage.getItem(this.key) || '{}')
      this.queue = saved.queue || []
      this.applied = saved.applied || []
    } catch {
      this.queue = []
      this.applied = []
    }
  }

  persist() {
    if (!this.storage) return
    try { this.storage.setItem(this.key, JSON.stringify({ queue: this.queue, applied: this.applied.slice(0, 200) })) } catch { /* best effort */ }
  }
}
