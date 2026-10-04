import assert from 'node:assert/strict'
import test from 'node:test'
import { createAetherisRuntime } from '../src/runtime/index.js'
import { waitFor } from './helpers.js'

test('task submission preserves input, language, policy, phase, and provenance contracts', () => {
  const runtime = createAetherisRuntime()
  const task = runtime.submit('Analyze the local converter notes and verify the waveform.', { context: { source: 'contract-test' } })
  assert.match(task.id, /^RUN-/)
  assert.equal(task.status, 'Running')
  assert.equal(task.input.localOnly, true)
  assert.equal(task.input.networkUsed, false)
  assert.equal(task.plan.languageDetection.localOnly, true)
  assert.equal(task.plan.executionPlan.privateReasoningStored, false)
  assert.equal(task.plan.nativePlan.privateReasoningStored, false)
  assert.equal(task.plan.phasePlan.totalPhases, 150)
  assert.equal(task.plan.phasePlan.activePhases < 150, true)
  assert.equal(runtime.getTask(task.id).objective, task.objective)
  assert.equal(runtime.getTrace(task.id).state, 'running')
  runtime.cancelTask(task.id, 'cleanup after contract assertion')
})

test('approval gates pause both task execution and phase execution', () => {
  const runtime = createAetherisRuntime()
  const task = runtime.submit('Open a browser and inspect an external source.')
  assert.equal(task.status, 'Awaiting approval')
  assert.equal(task.plan.policy.requiresApproval, true)
  assert.equal(task.plan.policy.approved, false)
  const phase = runtime.observePhaseRun(task.id)
  assert.equal(phase.status, 'paused')
  assert.equal(phase.checkpointState.status, 'paused')
  assert.equal(phase.events.some((event) => event.type === 'run.paused'), true)
  assert.equal(runtime.getTrace(task.id).state, 'running')

  const approved = runtime.approve(task.id)
  assert.equal(approved.status, 'Running')
  assert.equal(approved.plan.policy.approved, true)
  assert.equal(runtime.observePhaseRun(task.id).status, 'running')
  runtime.cancelTask(task.id, 'cleanup after approval assertion')
})

test('pause, resume, and cancel update task state, resource state, and traces', async () => {
  const runtime = createAetherisRuntime()
  const task = runtime.submit('Run a local sandboxed analysis.', { fullPhaseRun: true, phaseRunDelay: 5 })
  await waitFor(() => (runtime.observePhaseRun(task.id)?.completed.length || 0) >= 1, { label: 'phase before task pause' })

  const paused = runtime.pauseTask(task.id, 'operator checkpoint')
  assert.equal(paused.status, 'Paused')
  assert.equal(runtime.getTask(task.id).status, 'Paused')
  assert.equal(runtime.recoverTask(task.id).resumable, true)

  const resumed = runtime.resumeTask(task.id)
  assert.equal(resumed.status, 'Running')
  assert.equal(runtime.getTask(task.id).status, 'Running')

  const cancelled = runtime.cancelTask(task.id, 'operator stopped run')
  assert.equal(cancelled.status, 'Cancelled')
  assert.equal(runtime.getTask(task.id).status, 'Cancelled')
  assert.equal(runtime.recoverTask(task.id).resumable, false)
  assert.equal(runtime.getTrace(task.id).state, 'Cancelled')
  const resources = runtime.snapshot().resources
  assert.equal(resources.allocations, 0)
  assert.equal(resources.usage.cpuCores, 0)
  assert.equal(resources.usage.ramGb, 0)
})

test('task completion writes verification and offline outcome memory', async () => {
  const runtime = createAetherisRuntime()
  const task = runtime.submit('Produce a short local summary.', { fullPhaseRun: false })
  await waitFor(() => runtime.getTask(task.id)?.status === 'Completed', { timeout: 10000, label: 'task graph completion' })
  const completed = runtime.getTask(task.id)
  assert.equal(completed.status, 'Completed')
  assert.equal(completed.progress, 100)
  assert.equal(completed.verification.status, 'approved')
  assert.equal(completed.offlineMemory.flush.mode, 'LOCAL ONLY')
  assert.equal(runtime.getTrace(task.id).verification, 'approved')
})
