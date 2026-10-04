import assert from 'node:assert/strict'
import test from 'node:test'
import { WORKFLOW_NODE_STATUS, WorkflowEngine } from '../src/runtime/workflowEngine.js'
import { createAetherisRuntime } from '../src/runtime/index.js'

test('workflow definitions validate dependencies, cycles, retries, and timeouts', () => {
  const engine = new WorkflowEngine()
  const valid = engine.define({
    id: 'workflow-contract',
    name: 'Contract workflow',
    nodes: [
      { id: 'research', label: 'Research' },
      { id: 'verify', label: 'Verify', dependsOn: ['research'], retryPolicy: { attempts: 3 }, timeoutMs: 1000 },
      { id: 'deliver', label: 'Deliver', dependsOn: ['verify'], compensate: 'remove-draft' },
    ],
  })
  assert.equal(valid.status, 'ready')
  assert.equal(valid.validation.valid, true)
  assert.equal(valid.nodes[1].retryPolicy.attempts, 3)
  assert.equal(valid.nodes[2].compensate, 'remove-draft')

  const invalid = engine.define({ id: 'workflow-cycle', nodes: [{ id: 'a', dependsOn: ['b'] }, { id: 'b', dependsOn: ['a'] }] })
  assert.equal(invalid.status, 'invalid')
  assert.equal(invalid.validation.errors.includes('Workflow contains a dependency cycle'), true)
})

test('workflow runs expose sequential checkpoints and complete through the DAG', () => {
  const engine = new WorkflowEngine()
  engine.define({ id: 'workflow-dag', nodes: [{ id: 'one' }, { id: 'two', dependsOn: ['one'] }, { id: 'three', dependsOn: ['two'] }] })
  const started = engine.start('workflow-dag')
  assert.equal(started.status, 'running')
  assert.deepEqual(started.nodes.filter((node) => node.status === WORKFLOW_NODE_STATUS.READY).map((node) => node.id), ['one'])

  const first = engine.advance(started.id)
  assert.equal(first.current, 'one')
  assert.equal(first.nodes.find((node) => node.id === 'one').status, 'running')
  const second = engine.completeNode(started.id, 'one', { output: 'one-result' })
  assert.equal(second.checkpoint, 'one')
  assert.deepEqual(engine.runReadyNodes(started.id).map((node) => node.id), ['two'])

  engine.advance(started.id, 'two')
  engine.completeNode(started.id, 'two', { output: 'two-result' })
  engine.advance(started.id, 'three')
  const completed = engine.completeNode(started.id, 'three', { output: 'final-result' })
  assert.equal(completed.status, 'completed')
  assert.deepEqual(completed.completed, ['one', 'two', 'three'])
  assert.equal(completed.events.at(0).type, 'workflow.completed')
  assert.equal(engine.recover(started.id).resumable, false)
})

test('workflow approval, pause, resume, cancel, and recovery remain explicit', () => {
  const engine = new WorkflowEngine()
  engine.define({ id: 'workflow-gated', approval: true, nodes: [{ id: 'safe-node' }] })
  const started = engine.start('workflow-gated')
  assert.equal(started.status, 'awaiting-approval')
  assert.equal(engine.runReadyNodes(started.id).length, 0)
  const approved = engine.approve(started.id)
  assert.equal(approved.status, 'running')
  assert.equal(engine.runReadyNodes(started.id).length, 1)

  const paused = engine.pause(started.id, 'operator review')
  assert.equal(paused.status, 'paused')
  assert.equal(engine.recover(started.id).resumable, true)
  const resumed = engine.resume(started.id)
  assert.equal(resumed.status, 'running')
  const cancelled = engine.cancel(started.id, 'operator stopped')
  assert.equal(cancelled.status, 'cancelled')
  assert.equal(cancelled.cancelReason, 'operator stopped')
  assert.equal(cancelled.nodes[0].status, WORKFLOW_NODE_STATUS.CANCELLED)
})

test('workflow retries failed nodes, plans compensation, and detects timeouts', () => {
  const engine = new WorkflowEngine()
  engine.define({ id: 'workflow-retry', compensation: ['restore-checkpoint'], nodes: [{ id: 'fragile', retryPolicy: { attempts: 2 }, timeoutMs: 1, compensate: 'release-sandbox' }] })
  const started = engine.start('workflow-retry')
  engine.advance(started.id, 'fragile')
  const timedOut = engine.checkTimeout(started.id, Date.parse(engine.observe(started.id).nodes[0].startedAt) + 10)
  assert.equal(timedOut.nodes[0].status, WORKFLOW_NODE_STATUS.READY)
  assert.equal(timedOut.status, 'running')

  engine.advance(started.id, 'fragile')
  const failed = engine.failNode(started.id, 'fragile', 'verification failed', { retry: false })
  assert.equal(failed.status, 'failed')
  assert.equal(failed.nodes[0].status, WORKFLOW_NODE_STATUS.FAILED)
  assert.deepEqual(failed.compensation.map((item) => item.action), ['release-sandbox', 'restore-checkpoint'])
  assert.equal(failed.events.some((event) => event.type === 'compensation.planned'), true)
})

test('workflow API routes expose definitions and controlled run transitions', () => {
  const runtime = createAetherisRuntime()
  const definition = runtime.request('/workflows', { method: 'POST', body: { action: 'define', workflow: { id: 'api-workflow', nodes: [{ id: 'step' }] } } })
  assert.equal(definition.status, 200)
  assert.equal(definition.data.status, 'ready')
  const started = runtime.request('/workflows', { method: 'POST', body: { action: 'start', workflowId: 'api-workflow' } })
  assert.equal(started.data.status, 'running')
  const advanced = runtime.request('/workflows', { method: 'POST', body: { action: 'advance', runId: started.data.id, nodeId: 'step' } })
  assert.equal(advanced.data.current, 'step')
  const completed = runtime.request('/workflows', { method: 'POST', body: { action: 'complete', runId: started.data.id, nodeId: 'step', output: 'api-result' } })
  assert.equal(completed.data.status, 'completed')
  const history = runtime.request('/workflows', { method: 'POST', body: { action: 'history', runId: started.data.id } })
  assert.equal(history.data.events.some((event) => event.type === 'workflow.completed'), true)
})
