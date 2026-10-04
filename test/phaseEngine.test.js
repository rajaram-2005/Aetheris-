import assert from 'node:assert/strict'
import test from 'node:test'
import { PHASE_GROUPS, UNIVERSAL_PHASES, PhaseEngine } from '../src/runtime/phaseEngine.js'
import { assertOrdered, sleep, waitFor } from './helpers.js'

function makeEngine() {
  return new PhaseEngine()
}

function fullPlan(engine, overrides = {}) {
  return engine.plan({ intent: 'general', text: 'run the complete lifecycle', fullRun: true, ...overrides })
}

test('the universal phase catalog has 150 ordered definitions and 14 groups', () => {
  assert.equal(UNIVERSAL_PHASES.length, 150)
  assert.equal(PHASE_GROUPS.length, 14)
  assert.equal(UNIVERSAL_PHASES[0].number, 1)
  assert.equal(UNIVERSAL_PHASES.at(-1).number, 150)
  assertOrdered(UNIVERSAL_PHASES, (phase) => phase.number)
  assert.equal(PHASE_GROUPS.reduce((total, group) => total + group.count, 0), 150)
  assert.equal(new Set(UNIVERSAL_PHASES.map((phase) => phase.id)).size, 150)
})

test('a full plan marks every phase as active without mutating the catalog', () => {
  const engine = makeEngine()
  const plan = fullPlan(engine)
  assert.equal(plan.totalPhases, 150)
  assert.equal(plan.activePhases, 150)
  assert.equal(plan.fullRun, true)
  assert.equal(plan.phases.every((phase) => phase.status === 'queued'), true)
  assert.equal(plan.groups.every((group) => group.active === group.count), true)
  assert.equal(UNIVERSAL_PHASES.every((phase) => phase.status === 'defined'), true)
})

test('manual advancement completes exactly one phase at a time', () => {
  const engine = makeEngine()
  const plan = engine.plan({ intent: 'general', text: 'summarize this request' })
  const started = engine.start('MANUAL-001', plan)
  assert.equal(started.current, 1)
  assert.equal(started.completed.length, 0)

  const first = engine.step('MANUAL-001')
  assert.deepEqual(first.completed, [1])
  assert.equal(first.current, 2)
  assert.equal(first.currentPhase.name, 'Language Detection')
  assert.equal(first.status, 'running')

  const second = engine.step('MANUAL-001')
  assert.deepEqual(second.completed, [1, 2])
  assert.equal(second.current, 3)
  assert.equal(second.checkpoint, 'manual-phase-step')
  assert.equal(second.actions.length, 2)
  assert.equal(second.actions[0].operation.includes('conversation'), true)
  assert.equal(second.events.some((event) => event.type === 'manual.step-requested'), true)
})

test('continuous execution reaches the final response with ordered actions and events', async () => {
  const engine = makeEngine()
  const plan = fullPlan(engine)
  engine.start('FULL-001', plan)
  engine.advance('FULL-001', { checkpoint: 'input-reception' })
  engine.advance('FULL-001', { checkpoint: 'language-detection' })
  engine.runToCompletion('FULL-001', { delay: 0 })

  await waitFor(() => engine.observe('FULL-001')?.status === 'completed', { timeout: 3000, label: 'full phase run' })
  const run = engine.observe('FULL-001')
  assert.equal(run.status, 'completed')
  assert.equal(run.progress, 100)
  assert.equal(run.current, null)
  assert.equal(run.currentPhase, null)
  assert.equal(run.completed.length, 150)
  assert.equal(run.actions.length, 150)
  assert.equal(run.actions.at(-1).phase, 150)
  assert.equal(run.actions.at(-1).name, 'Final Response')
  assert.equal(run.checkpoint, 'final-response')
  assert.equal(run.checkpointState.status, 'completed')
  assert.equal(run.events.at(0).type, 'run.completed')
  assert.equal(run.events.some((event) => event.type === 'phase.started' && event.phase === 150), true)
  assert.equal(run.events.some((event) => event.type === 'phase.completed' && event.phase === 150), true)
  assert.equal(run.events.length >= 453, true)
  assertOrdered(run.completed)
  assertOrdered(run.actions, (action) => action.phase)
})

test('pause retains a checkpoint and resume continues automatic execution', async () => {
  const engine = makeEngine()
  engine.start('PAUSE-001', fullPlan(engine))
  engine.runToCompletion('PAUSE-001', { delay: 2 })
  await waitFor(() => (engine.observe('PAUSE-001')?.completed.length || 0) >= 2, { label: 'initial phase progress' })

  const paused = engine.pause('PAUSE-001', 'test checkpoint')
  const completedAtPause = paused.completed.length
  assert.equal(paused.status, 'paused')
  assert.equal(paused.autoRunning, false)
  assert.equal(paused.checkpointState.status, 'paused')
  assert.equal(paused.checkpointState.reason, 'test checkpoint')
  assert.equal(paused.events.at(0).type, 'run.paused')

  await sleep(30)
  assert.equal(engine.observe('PAUSE-001').completed.length, completedAtPause)

  engine.resume('PAUSE-001')
  assert.equal(engine.observe('PAUSE-001').status, 'running')
  await waitFor(() => engine.observe('PAUSE-001')?.status === 'completed', { timeout: 3000, label: 'resumed phase run' })
  const resumed = engine.observe('PAUSE-001')
  assert.equal(resumed.completed.length, 150)
  assert.equal(resumed.events.some((event) => event.type === 'run.resumed'), true)
})

test('cancellation stops a continuous run and preserves the last completed phase', async () => {
  const engine = makeEngine()
  engine.start('CANCEL-001', fullPlan(engine))
  engine.runToCompletion('CANCEL-001', { delay: 3 })
  await waitFor(() => (engine.observe('CANCEL-001')?.completed.length || 0) >= 1, { label: 'phase before cancellation' })

  const cancelled = engine.cancel('CANCEL-001', 'test cancellation')
  const completedAtCancel = cancelled.completed.length
  assert.equal(cancelled.status, 'cancelled')
  assert.equal(cancelled.autoRunning, false)
  assert.equal(cancelled.checkpointState.status, 'cancelled')
  assert.equal(cancelled.checkpointState.reason, 'test cancellation')
  await sleep(35)
  assert.equal(engine.observe('CANCEL-001').completed.length, completedAtCancel)
  assert.equal(engine.observe('CANCEL-001').events.at(0).type, 'run.cancelled')
})

test('history and run listings provide bounded observability views', async () => {
  const engine = makeEngine()
  engine.start('HISTORY-001', fullPlan(engine))
  engine.advance('HISTORY-001', { checkpoint: 'phase-001' })
  engine.advance('HISTORY-001', { checkpoint: 'phase-002' })
  const history = engine.history('HISTORY-001', { limit: 3 })
  assert.equal(history.taskId, 'HISTORY-001')
  assert.equal(history.actions.length, 2)
  assert.equal(history.events.length, 3)
  assert.equal(history.actions[0].phase, 2)
  assert.equal(engine.observeAll({ status: 'running' }).length, 1)
  assert.equal(engine.snapshot().activeRuns, 1)
  assert.equal(engine.snapshot().pausedRuns, 0)
})
