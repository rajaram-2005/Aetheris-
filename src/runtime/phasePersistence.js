export const PHASE_SNAPSHOT_VERSION = 1

export class PhaseRunSnapshotStore {
  constructor({ storage = null, key = 'aetheris.phase-runs', maxRuns = 24, now = () => new Date().toISOString() } = {}) {
    this.storage = storage || defaultStorage()
    this.key = key
    this.maxRuns = maxRuns
    this.now = now
  }

  load() {
    if (!this.storage || typeof this.storage.getItem !== 'function') return emptySnapshot()
    try {
      const raw = this.storage.getItem(this.key)
      return migratePhaseSnapshot(raw ? JSON.parse(raw) : null)
    } catch {
      return emptySnapshot()
    }
  }

  save({ runs = [], eventSequence = 0 } = {}) {
    const payload = {
      version: PHASE_SNAPSHOT_VERSION,
      savedAt: this.now(),
      eventSequence,
      runs: runs.slice(-this.maxRuns),
    }
    if (!this.storage || typeof this.storage.setItem !== 'function') return { stored: false, reason: 'storage-unavailable', payload }
    try {
      this.storage.setItem(this.key, JSON.stringify(payload))
      return { stored: true, version: payload.version, savedAt: payload.savedAt, runCount: payload.runs.length }
    } catch (error) {
      return { stored: false, reason: 'storage-write-failed', message: error?.message || 'storage write failed', payload }
    }
  }

  clear() {
    if (!this.storage || typeof this.storage.removeItem !== 'function') return { cleared: false, reason: 'storage-unavailable' }
    try {
      this.storage.removeItem(this.key)
      return { cleared: true }
    } catch (error) {
      return { cleared: false, reason: 'storage-remove-failed', message: error?.message || 'storage remove failed' }
    }
  }

  export() {
    return this.load()
  }
}

export function migratePhaseSnapshot(input) {
  if (!input) return emptySnapshot()
  if (Array.isArray(input)) return normalizeSnapshot({ version: 0, runs: input })
  if (typeof input !== 'object') return emptySnapshot()
  return normalizeSnapshot(input)
}

function normalizeSnapshot(input) {
  return {
    version: PHASE_SNAPSHOT_VERSION,
    savedAt: input.savedAt || null,
    eventSequence: Number.isFinite(input.eventSequence) ? input.eventSequence : 0,
    runs: Array.isArray(input.runs) ? input.runs.filter((run) => run && typeof run === 'object').map(normalizeRun) : [],
  }
}

function normalizeRun(run) {
  return {
    ...run,
    completed: Array.isArray(run.completed) ? run.completed : [],
    actions: Array.isArray(run.actions) ? run.actions : [],
    events: Array.isArray(run.events) ? run.events : [],
    phases: Array.isArray(run.phases) ? run.phases : [],
    autoRunning: false,
    autoRequested: Boolean(run.autoRequested),
    checkpointState: run.checkpointState || null,
  }
}

function emptySnapshot() {
  return { version: PHASE_SNAPSHOT_VERSION, savedAt: null, eventSequence: 0, runs: [] }
}

function defaultStorage() {
  return typeof globalThis !== 'undefined' && globalThis.localStorage ? globalThis.localStorage : null
}
