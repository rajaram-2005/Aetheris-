export const NATIVE_CONTRACT_VERSION = '1.0.0'

export const NATIVE_CONTRACTS = [
  contract('aether-code', 'coding', [21, 40], ['repository', 'request'], ['inspect', 'plan-change', 'generate', 'test', 'repair']),
  contract('aether-research', 'research', [51, 60], ['question', 'context'], ['search', 'compare', 'extract-evidence', 'cite', 'verify']),
  contract('aether-vision', 'vision', [111, 115], ['visual-input', 'context'], ['understand', 'describe', 'fuse', 'verify']),
  contract('aether-image', 'image', [71, 80], ['brief', 'style'], ['compose', 'generate', 'critique', 'revise', 'validate']),
  contract('aether-video', 'video', [81, 90], ['brief', 'story'], ['script', 'storyboard', 'render', 'edit', 'qa']),
  contract('aether-audio', 'audio', [91, 100], ['brief', 'audio-input'], ['transcribe', 'voice', 'music', 'mix', 'master']),
  contract('aether-science', 'science', [101, 110], ['question', 'assumptions'], ['model', 'compute', 'simulate', 'quantify', 'report']),
  contract('aether-engineering', 'engineering', [101, 110], ['problem', 'parameters'], ['define', 'calculate', 'simulate', 'verify', 'report']),
  contract('aether-computer', 'computer', [41, 50], ['observation', 'action'], ['observe', 'plan-action', 'interact', 'verify', 'recover']),
  contract('aether-terminal', 'terminal', [121, 130], ['command', 'environment'], ['inspect', 'plan-command', 'execute', 'capture', 'verify']),
  contract('aether-knowledge', 'knowledge', [61, 70], ['source', 'query'], ['ingest', 'index', 'retrieve', 'resolve', 'assemble']),
  contract('aether-3d', '3d', [111, 120], ['brief', 'geometry'], ['plan', 'generate', 'validate', 'animate', 'render']),
  contract('aether-device', 'device', [121, 130], ['device', 'telemetry'], ['read-telemetry', 'simulate-action', 'authorize', 'execute', 'verify']),
  contract('aether-industrial', 'industrial', [101, 130], ['device', 'scenario'], ['twin-simulate', 'policy-check', 'plan-action', 'authorize', 'recover']),
  contract('aether-meta', 'meta', [131, 140], ['outcome', 'strategy'], ['evaluate-agent', 'evaluate-model', 'evaluate-tool', 'optimize-strategy', 'adapt']),
]

export const NATIVE_CONTRACT_MAP = new Map(NATIVE_CONTRACTS.map((item) => [item.id, item]))

export function getNativeContract(moduleId) {
  return NATIVE_CONTRACT_MAP.get(moduleId) || null
}

export function validateNativeRequest(moduleId, operation, input = {}) {
  const selected = getNativeContract(moduleId)
  if (!selected) return { valid: false, status: 'unknown-contract', moduleId, operation, missing: [] }
  const definition = selected.operations.find((candidate) => candidate.name === operation)
  if (!definition) return { valid: false, status: 'unsupported-operation', moduleId, operation, contractVersion: selected.version, missing: [] }
  const missing = selected.requiredInput.filter((field) => input[field] === undefined || input[field] === null || input[field] === '')
  return { valid: missing.length === 0, status: missing.length ? 'missing-input' : 'valid', moduleId, operation, contractVersion: selected.version, requiredInput: selected.requiredInput, missing, risk: definition.risk, requiresApproval: definition.requiresApproval }
}

function contract(id, domain, phases, requiredInput, operationNames) {
  return {
    id,
    version: NATIVE_CONTRACT_VERSION,
    domain,
    phases,
    requiredInput,
    localOnly: true,
    networkUsed: false,
    privateReasoningStored: false,
    providerBoundary: 'Aetheris orchestration owns the contract; model providers remain replaceable adapters.',
    output: { type: 'structured-observation', fields: ['status', 'contractId', 'operation', 'provenance', 'verification'] },
    operations: operationNames.map((name, index) => ({ name, ordinal: index + 1, risk: operationRisk(name), requiresApproval: ['execute', 'interact', 'authorize', 'plan-action'].includes(name) })),
  }
}

function operationRisk(name) {
  if (['authorize', 'execute', 'interact', 'plan-action'].includes(name)) return 'gated-side-effect'
  if (['generate', 'render', 'edit', 'repair', 'optimize-strategy', 'adapt'].includes(name)) return 'sandboxed-write'
  return 'read-and-reason'
}
