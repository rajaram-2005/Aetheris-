import assert from 'node:assert/strict'
import test from 'node:test'
import { PhaseEngine } from '../src/runtime/phaseEngine.js'
import { migratePhaseSnapshot, PhaseRunSnapshotStore } from '../src/runtime/phasePersistence.js'
import { createAetherisRuntime } from '../src/runtime/index.js'

class MemoryStorage {
  constructor(initial = {}) {
    this.values = new Map(Object.entries(initial))
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null
  }

  setItem(key, value) {
    this.values.set(key, String(value))
  }

  removeItem(key) {
    this.values.delete(key)
  }
}

class BrokenStorage extends MemoryStorage {
  getItem() {
    throw new Error('storage read unavailable')
  }

  setItem() {
    throw new Error('storage write unavailable')
  }

  removeItem() {
    throw new Error('storage remove unavailable')
  }
}

test('phase snapshots persist versioned runs and recover interrupted running state safely', () => {
  const storage = new MemoryStorage()
  const engine = new PhaseEngine({ storage, storageKey: 'phase-test' })
  const plan = engine.plan({ fullRun: true })
  engine.start('PERSIST-001', plan)
  engine.advance('PERSIST-001', { checkpoint: 'phase-001' })
  const beforeRestart = engine.observe('PERSIST-001')
  assert.equal(beforeRestart.status, 'running')
  assert.equal(beforeRestart.current, 2)

  const persisted = JSON.parse(storage.getItem('phase-test'))
  assert.equal(persisted.version, 1)
  assert.equal(persisted.runs.length, 1)
  assert.equal(persisted.runs[0].taskId, 'PERSIST-001')

  const recovered = new PhaseEngine({ storage, storageKey: 'phase-test' })
  const afterRestart = recovered.observe('PERSIST-001')
  assert.equal(afterRestart.status, 'paused')
  assert.equal(afterRestart.current, 2)
  assert.equal(afterRestart.autoRunning, false)
  assert.equal(afterRestart.recoveredFrom, 'running')
  assert.equal(afterRestart.checkpointState.reason, 'Recovered after runtime restart')
  assert.equal(afterRestart.events.at(0).type, 'run.recovered')
  assert.equal(recovered.snapshot().persistence.available, true)
})

test('snapshot migration tolerates legacy arrays and malformed storage without throwing', () => {
  const legacy = migratePhaseSnapshot([{ taskId: 'LEGACY-001', status: 'completed', phases: [] }])
  assert.equal(legacy.version, 1)
  assert.equal(legacy.runs[0].taskId, 'LEGACY-001')
  assert.deepEqual(migratePhaseSnapshot(null).runs, [])
  assert.deepEqual(migratePhaseSnapshot('not an object').runs, [])

  const broken = new PhaseRunSnapshotStore({ storage: new BrokenStorage(), key: 'broken' })
  assert.deepEqual(broken.load().runs, [])
  assert.equal(broken.save({ runs: [] }).stored, false)
  assert.equal(broken.clear().cleared, false)
})

test('phase history supports bounded pagination and safe JSON or NDJSON audit export', () => {
  const engine = new PhaseEngine()
  const plan = engine.plan({ fullRun: true })
  engine.start('AUDIT-001', plan)
  engine.advance('AUDIT-001', { checkpoint: 'phase-001' })
  engine.advance('AUDIT-001', { checkpoint: 'phase-002' })
  engine.advance('AUDIT-001', { checkpoint: 'phase-003' })

  const firstPage = engine.history('AUDIT-001', { limit: 2, cursor: 0 })
  assert.equal(firstPage.events.length, 2)
  assert.equal(firstPage.actions.length, 2)
  assert.equal(firstPage.page.cursor, 0)
  assert.equal(firstPage.page.nextCursor, 2)
  const secondPage = engine.history('AUDIT-001', { limit: 2, cursor: firstPage.page.nextCursor })
  assert.equal(secondPage.page.cursor, 2)
  assert.equal(secondPage.events[0].id !== firstPage.events[0].id, true)

  const json = engine.exportAudit('AUDIT-001', { format: 'json', limit: 4 })
  assert.equal(json.format, 'json')
  assert.equal(JSON.parse(json.content).schemaVersion, 1)
  assert.equal(JSON.parse(json.content).taskId, 'AUDIT-001')
  const ndjson = engine.exportAudit('AUDIT-001', { format: 'ndjson', limit: 4 })
  assert.equal(ndjson.format, 'ndjson')
  assert.equal(ndjson.eventCount, 4)
  assert.equal(ndjson.content.split('\n').length, 4)
})

test('scheduler failure becomes an observable failed run instead of an uncaught timer error', () => {
  const scheduler = { setTimeout() { throw new Error('scheduler unavailable') } }
  const engine = new PhaseEngine({ scheduler })
  engine.start('FAULT-001', engine.plan({ fullRun: true }))
  const failed = engine.runToCompletion('FAULT-001', { delay: 1 })
  assert.equal(failed.status, 'failed')
  assert.equal(failed.error.code, 'PHASE_SCHEDULER_FAILURE')
  assert.equal(failed.error.message, 'scheduler unavailable')
  assert.equal(failed.events.at(0).type, 'run.failed')
  assert.equal(engine.snapshot().failedRuns, 1)
})

test('universal API and MCP transitions are idempotent when retried', () => {
  const runtime = createAetherisRuntime()
  const task = runtime.submit('Observe a local lifecycle.', { fullPhaseRun: true, phaseRunDelay: 20 })
  const firstPause = runtime.request('/phases', { method: 'POST', sessionId: 'operator-1', body: { action: 'pause', taskId: task.id, reason: 'operator checkpoint', idempotencyKey: 'pause-001' } })
  const replayedPause = runtime.request('/phases', { method: 'POST', sessionId: 'operator-1', body: { action: 'pause', taskId: task.id, reason: 'different retry text', idempotencyKey: 'pause-001' } })
  assert.equal(firstPause.data.status, 'paused')
  assert.equal(replayedPause.replayed, true)
  assert.equal(replayedPause.requestId, firstPause.requestId)
  assert.equal(runtime.observePhaseRun(task.id).events.filter((event) => event.type === 'run.paused').length, 1)

  const firstTool = runtime.callMcp('aetheris.experience.detect_language', { input: 'The local tool is ready.' }, { approved: true, sessionId: 'operator-1', idempotencyKey: 'language-001' })
  const replayedTool = runtime.callMcp('aetheris.experience.detect_language', { input: 'A different retry payload.' }, { approved: true, sessionId: 'operator-1', idempotencyKey: 'language-001' })
  assert.equal(firstTool.status, 'completed')
  assert.equal(replayedTool.replayed, true)
  assert.equal(replayedTool.id, firstTool.id)
  assert.equal(runtime.snapshot().mcp.idempotencyEntries, 1)
  runtime.cancelTask(task.id, 'cleanup after idempotency assertion')
})
