import assert from 'node:assert/strict'
import test from 'node:test'
import { API_ROUTES } from '../src/runtime/universalApi.js'
import { createAetherisRuntime } from '../src/runtime/index.js'
import { assertLocalOnly, waitFor } from './helpers.js'

test('runtime health and snapshot expose the native architecture contracts', () => {
  const runtime = createAetherisRuntime()
  const health = runtime.health()
  const snapshot = runtime.snapshot()
  assert.equal(health.status, 'healthy')
  assert.equal(health.localFirst, true)
  assert.equal(snapshot.phaseEngine.totalPhases, 150)
  assert.equal(snapshot.nativeIntelligence.moduleCount, 15)
  assert.equal(snapshot.mcp.tools, 57)
  assert.equal(snapshot.mcp.servers, 26)
  assert.equal(snapshot.languageDetection.offline, true)
  assert.equal(snapshot.observability.privateReasoningStored, false)
})

test('universal API exposes local language, phase, and observability routes', () => {
  const runtime = createAetherisRuntime()
  assert.equal(API_ROUTES.includes('/language'), true)
  assert.equal(API_ROUTES.includes('/phases'), true)
  assert.equal(API_ROUTES.includes('/observability'), true)

  const language = runtime.request('/language', { method: 'POST', body: { input: 'இது ஒரு சோதனை.' } })
  assert.equal(language.status, 200)
  assert.equal(language.data.language, 'ta')
  assertLocalOnly(language.data)

  const plan = runtime.request('/phases', { method: 'POST', body: { fullRun: true } })
  assert.equal(plan.status, 200)
  assert.equal(plan.data.activePhases, 150)
  assert.equal(plan.data.fullRun, true)

  const overview = runtime.request('/observability')
  assert.equal(overview.status, 200)
  assert.equal(overview.data.phaseEngine.totalPhases, 150)
  assert.equal(typeof overview.data.taskLedger.events, 'number')
})

test('a submitted full run is observable through runtime methods and API history', async () => {
  const runtime = createAetherisRuntime()
  const task = runtime.submit('Run a full local lifecycle for contract verification.', { fullPhaseRun: true, phaseRunDelay: 0 })
  const initial = runtime.observePhaseRun(task.id)
  assert.equal(initial.currentPhase.number, 3)
  assert.equal(initial.completed.length, 2)
  assert.equal(initial.checkpoint, 'language-detection')
  assert.equal(initial.events.some((event) => event.type === 'phase.started'), true)

  const observed = runtime.request('/phases', { method: 'POST', body: { taskId: task.id } })
  assert.equal(observed.status, 200)
  assert.equal(observed.data.taskId, task.id)
  assert.equal(observed.data.currentPhase.number >= 3, true)

  await waitFor(() => runtime.observePhaseRun(task.id)?.status === 'completed', { timeout: 3500, label: 'runtime full run' })
  const final = runtime.observePhaseRun(task.id)
  assert.equal(final.completed.length, 150)
  assert.equal(final.actions.length, 150)
  assert.equal(final.progress, 100)

  const history = runtime.phaseRunHistory(task.id, { limit: 6 })
  assert.equal(history.actions.length, 6)
  assert.equal(history.events.length, 6)
  const apiHistory = runtime.request('/observability', { method: 'POST', body: { taskId: task.id, limit: 4 } })
  assert.equal(apiHistory.status, 200)
  assert.equal(apiHistory.data.checkpoint, 'final-response')
  assert.equal(apiHistory.data.actions.length, 4)
  assert.equal(apiHistory.data.events.length, 4)
  assert.equal(runtime.observePhaseRuns({ status: 'completed' }).some((run) => run.taskId === task.id), true)
})

test('universal API controls keep task and phase state aligned', async () => {
  const runtime = createAetherisRuntime()
  const task = runtime.submit('Run a monitored lifecycle that can be paused.', { fullPhaseRun: true, phaseRunDelay: 3 })
  await waitFor(() => (runtime.observePhaseRun(task.id)?.completed.length || 0) >= 1, { label: 'phase before API pause' })

  const paused = runtime.request('/phases', { method: 'POST', body: { action: 'pause', taskId: task.id, reason: 'API checkpoint test' } })
  assert.equal(paused.status, 200)
  assert.equal(paused.data.status, 'paused')
  assert.equal(runtime.getTask(task.id).status, 'Paused')

  const resumed = runtime.request('/phases', { method: 'POST', body: { action: 'resume', taskId: task.id } })
  assert.equal(resumed.status, 200)
  assert.equal(resumed.data.status, 'running')
  assert.equal(runtime.getTask(task.id).status, 'Running')

  const cancelled = runtime.request('/phases', { method: 'POST', body: { action: 'cancel', taskId: task.id, reason: 'API cancellation test' } })
  assert.equal(cancelled.status, 200)
  assert.equal(cancelled.data.status, 'cancelled')
  assert.equal(runtime.getTask(task.id).status, 'Cancelled')
  assert.equal(cancelled.data.checkpointState.reason, 'API cancellation test')
})
