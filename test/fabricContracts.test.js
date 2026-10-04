import assert from 'node:assert/strict'
import test from 'node:test'
import { MCP_SERVERS, MCP_TOOLS } from '../src/runtime/mcpFabric.js'
import { NATIVE_INTELLIGENCE } from '../src/runtime/nativeIntelligence.js'
import { SecurityPolicy } from '../src/runtime/securityPolicy.js'
import { createAetherisRuntime } from '../src/runtime/index.js'

test('native intelligence catalog stays distinct from replaceable model providers', () => {
  assert.equal(NATIVE_INTELLIGENCE.length, 15)
  assert.equal(new Set(NATIVE_INTELLIGENCE.map((module) => module.id)).size, 15)
  assert.equal(NATIVE_INTELLIGENCE.every((module) => module.status === 'native-contract'), true)
  assert.equal(NATIVE_INTELLIGENCE.every((module) => module.modelPolicy.includes('pluggable')), true)

  const runtime = createAetherisRuntime()
  const plan = runtime.planNativeIntelligence({ intent: 'software', text: 'inspect repository code and run tests', output: 'text' })
  assert.equal(plan.modules.some((module) => module.id === 'aether-code'), true)
  assert.equal(plan.externalModels.includes('pluggable'), true)
  assert.equal(plan.privateReasoningStored, false)
})

test('MCP fabric exposes all registered in-process servers and tools', () => {
  const runtime = createAetherisRuntime()
  const snapshot = runtime.snapshot().mcp
  assert.equal(MCP_SERVERS.length, 26)
  assert.equal(MCP_TOOLS.length, 57)
  assert.equal(snapshot.servers, 26)
  assert.equal(snapshot.tools, 57)
  assert.equal(snapshot.connectedServers, 26)
  assert.equal(runtime.discoverMcp({ query: 'language' }).some((tool) => tool.name === 'aetheris.experience.detect_language'), true)
  assert.equal(runtime.discoverMcp({ plane: 'lifecycle' }).length >= 4, true)
  assert.equal(runtime.discoverMcp({ offlineOnly: true }).every((tool) => tool.serverInfo.offline), true)
})

test('MCP calls return structured audit envelopes and enforce local policy', () => {
  const runtime = createAetherisRuntime()
  const language = runtime.callMcp('aetheris.experience.detect_language', { input: 'The local contract is ready.' }, { approved: true })
  assert.equal(language.jsonrpc, '2.0')
  assert.equal(language.status, 'completed')
  assert.equal(language.data.localOnly, true)
  assert.equal(language.data.networkUsed, false)

  const browser = runtime.callMcp('aetheris.browser.navigate', { url: 'https://example.invalid' })
  assert.equal(browser.status, 'blocked')
  assert.equal(browser.offline, true)
  assert.equal(browser.reason.includes('APPROVED ONLINE'), true)

  const industrial = runtime.callMcp('aetheris.industrial.plan_action', { deviceId: 'test-device', action: 'validate' })
  assert.equal(industrial.status, 'blocked')
  assert.equal(industrial.reason.includes('authorization'), true)

  const telemetry = runtime.callMcp('aetheris.industrial.read_telemetry', { deviceId: 'lab-gateway' }, { approved: true })
  assert.equal(telemetry.status, 'completed')
  assert.equal(telemetry.data.readOnly, true)
})

test('knowledge search and offline memory preserve local provenance', () => {
  const runtime = createAetherisRuntime()
  const evidence = runtime.searchKnowledge('converter waveform thermal')
  assert.equal(evidence.length > 0, true)
  assert.equal(evidence[0].source, 'EV converter simulation notes')
  assert.equal(typeof evidence[0].chunkId, 'string')

  const update = runtime.importModelKnowledge({
    modelId: 'aetheris-reasoner-32b',
    prompt: 'Summarize the converter notes.',
    content: 'The verified fixture output is retained locally.',
    verified: true,
  })
  assert.equal(update.status, 'accepted')
  assert.equal(update.offlineMemory.flush.mode, 'LOCAL ONLY')
  assert.equal(update.offlineMemory.flush.applied >= 1, true)
  assert.equal(runtime.memoryStatus().mode, 'LOCAL ONLY')
})

test('security policy records consent gates without weakening local defaults', () => {
  const policy = new SecurityPolicy({ online: false, defaultLevel: 3 })
  const safe = policy.assess({ text: 'summarize local notes', risk: {} })
  assert.equal(safe.requiresApproval, false)
  assert.equal(safe.level <= 3, true)

  const network = policy.assess({ text: 'browse external sources', risk: { networkRequested: true } })
  assert.equal(network.requiresApproval, true)
  assert.equal(network.network, false)
  assert.equal(network.reasons.some((reason) => reason.includes('LOCAL ONLY')), true)

  const physical = policy.assess({ text: 'operate the industrial robot', risk: { physicalAction: true } }, { approved: false })
  assert.equal(physical.requiresApproval, true)
  assert.equal(physical.level >= 6, true)
  assert.equal(policy.snapshot().auditEvents, 3)
})
