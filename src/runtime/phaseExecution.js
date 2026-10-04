export const PHASE_OPERATION_FAMILIES = {
  conversation: 'normalize and prepare conversation contract',
  cognitive: 'classify, plan, and route capability contract',
  coding: 'inspect, change, analyze, test, diagnose, and repair repository state',
  computer: 'observe system state, plan action, verify state, and recover',
  research: 'retrieve, compare, extract evidence, and bind provenance',
  knowledge: 'ingest, index, resolve entities, retrieve, and assemble context',
  image: 'plan visual intent, generate, evaluate, revise, and validate image artifact',
  video: 'plan story, generate scenes, maintain continuity, edit, and validate video',
  audio: 'recognize, generate, edit, mix, and master audio artifact',
  science: 'model assumptions, compute, simulate, quantify uncertainty, and report',
  multimodal: 'fuse modalities and produce cross-modal artifact',
  tools: 'select, authorize, sandbox, invoke, observe, recover, and verify tool',
  memory: 'write working, episodic, semantic, procedural, and strategy state',
  verification: 'verify facts, logic, security, policy, requirements, artifacts, and delivery',
}

export function phaseOperation(phase) {
  return PHASE_OPERATION_FAMILIES[phase.domain] || 'execute controlled Aetheris lifecycle operation'
}
