const GROUPS = [
  ['conversation-intent', 'Part I — Conversation & intent', 1, 10, 'mint'],
  ['god-core-planning', 'Part II — God Core planning', 11, 20, 'violet'],
  ['native-coding', 'Part III — Native coding intelligence', 21, 40, 'blue'],
  ['native-computer', 'Part IV — Native computer agent', 41, 50, 'gold'],
  ['research', 'Part V — Research agent', 51, 60, 'violet'],
  ['knowledge', 'Part VI — Knowledge engine', 61, 70, 'mint'],
  ['native-image', 'Part VII — Native image intelligence', 71, 80, 'coral'],
  ['native-video', 'Part VIII — Native video intelligence', 81, 90, 'coral'],
  ['native-audio', 'Part IX — Audio / speech / music', 91, 100, 'blue'],
  ['science-engineering', 'Part X — Science & engineering engine', 101, 110, 'gold'],
  ['multimodal-creation', 'Part XI — Multimodal / 3D / document creation', 111, 120, 'violet'],
  ['tool-system', 'Part XII — Tool & system execution', 121, 130, 'mint'],
  ['memory-meta', 'Part XIII — Memory & meta-learning', 131, 140, 'blue'],
  ['verification-delivery', 'Part XIV — Verification, safety & delivery', 141, 150, 'gold'],
]

const PHASE_NAMES = [
  'Input Reception', 'Language Detection', 'Intent Recognition', 'Context Reconstruction', 'Goal Extraction', 'Constraint Extraction', 'Ambiguity Detection', 'Priority Analysis', 'Risk Classification', 'Task Contract Creation',
  'Task Classification', 'Complexity Estimation', 'Capability Discovery', 'Agent Discovery', 'Model Discovery', 'Tool Discovery', 'Resource Estimation', 'Execution Strategy Selection', 'Workflow Graph Construction', 'Master Plan Generation',
  'Repository Discovery', 'Repository Mapping', 'Dependency Graph', 'Architecture Reconstruction', 'Technology Detection', 'API Discovery', 'Database Schema Analysis', 'Configuration Analysis', 'Requirement-to-Code Mapping', 'Change Impact Analysis', 'Implementation Planning', 'Code Generation', 'Code Integration', 'Static Analysis', 'Type Analysis', 'Dependency Analysis', 'Test Generation', 'Test Execution', 'Failure Diagnosis', 'Autonomous Repair',
  'OS Detection', 'Hardware Detection', 'Application Discovery', 'Process Discovery', 'Filesystem Discovery', 'Desktop / GUI Perception', 'Action Planning', 'Controlled Interaction', 'State Verification', 'Recovery',
  'Question Formulation', 'Source Discovery', 'Source Ranking', 'Document Retrieval', 'Evidence Extraction', 'Claim Extraction', 'Cross-Source Comparison', 'Contradiction Detection', 'Evidence Synthesis', 'Citation / Provenance Construction',
  'Document Ingestion', 'OCR', 'Text Extraction', 'Chunking', 'Embedding', 'Vector Indexing', 'Knowledge-Graph Construction', 'Entity Resolution', 'Semantic Retrieval', 'Context Assembly',
  'Visual Intent', 'Composition Planning', 'Subject Planning', 'Style Planning', 'Prompt / Condition Construction', 'Image Generation', 'Vision Evaluation', 'Artifact Detection', 'Revision', 'Final Image Validation',
  'Video Objective', 'Script Generation', 'Story Structure', 'Storyboard', 'Shot Planning', 'Scene Generation', 'Temporal Consistency', 'Voice / Sound', 'Editing', 'Final Video QA',
  'Audio Intent', 'Speech Recognition', 'Speaker / Voice Analysis', 'Voice Generation', 'Music Planning', 'Music Generation', 'Sound-Effect Generation', 'Audio Editing', 'Mixing', 'Mastering',
  'Technical Problem Definition', 'Assumption Extraction', 'Mathematical Model', 'Equation Selection', 'Parameter Extraction', 'Numerical Computation', 'Simulation', 'Result Verification', 'Error / Uncertainty Analysis', 'Engineering Report',
  'Multimodal Input Fusion', 'Image-to-Text', 'Video Understanding', 'Audio Understanding', 'Cross-Modal Reasoning', 'Diagram Generation', '3D Planning', '3D Asset Generation', 'Document / Layout Generation', 'Presentation / Spreadsheet Generation',
  'Tool Selection', 'Permission Evaluation', 'Sandbox Creation', 'Environment Preparation', 'Tool Invocation', 'Output Capture', 'State Observation', 'Error Detection', 'Recovery', 'Execution Verification',
  'Working-Memory Update', 'Episodic-Memory Update', 'Semantic-Memory Update', 'Procedural-Memory Update', 'Strategy-Memory Update', 'Agent Performance Evaluation', 'Model Performance Evaluation', 'Tool Performance Evaluation', 'Strategy Optimization', 'Future-Task Adaptation',
  'Factual Verification', 'Logical Verification', 'Technical Verification', 'Security Verification', 'Policy Verification', 'Output Quality Evaluation', 'User-Requirement Matching', 'Final Artifact Validation', 'Result Packaging', 'Final Response',
]

const DOMAIN_BY_GROUP = {
  'conversation-intent': 'conversation',
  'god-core-planning': 'cognitive',
  'native-coding': 'coding',
  'native-computer': 'computer',
  research: 'research',
  knowledge: 'knowledge',
  'native-image': 'image',
  'native-video': 'video',
  'native-audio': 'audio',
  'science-engineering': 'science',
  'multimodal-creation': 'multimodal',
  'tool-system': 'tools',
  'memory-meta': 'memory',
  'verification-delivery': 'verification',
}

export const PHASE_GROUPS = GROUPS.map(([id, name, start, end, tone]) => ({ id, name, start, end, count: end - start + 1, tone, domain: DOMAIN_BY_GROUP[id] }))

export const UNIVERSAL_PHASES = PHASE_NAMES.map((name, index) => {
  const number = index + 1
  const group = PHASE_GROUPS.find((item) => number >= item.start && number <= item.end)
  return {
    number,
    id: `${String(number).padStart(3, '0')}-${slugify(name)}`,
    name,
    groupId: group.id,
    group: group.name,
    domain: group.domain,
    tone: group.tone,
    parallel: [13, 14, 15, 16, 17].includes(number) || (number >= 51 && number <= 57) || (number >= 121 && number <= 126),
    status: 'defined',
  }
})

export class PhaseEngine {
  constructor({ emit = () => {} } = {}) {
    this.emit = emit
    this.runs = new Map()
  }

  plan({ intent = 'general', text = '', output = 'text', complexity = 'medium' } = {}) {
    const active = activePhaseNumbers({ intent, text, output })
    const phases = UNIVERSAL_PHASES.map((phase) => ({ ...phase, status: active.has(phase.number) ? 'queued' : 'not-applicable' }))
    const groups = PHASE_GROUPS.map((group) => {
      const groupPhases = phases.filter((phase) => phase.groupId === group.id)
      return { ...group, active: groupPhases.filter((phase) => phase.status === 'queued').length, status: groupPhases.some((phase) => phase.status === 'queued') ? 'active' : 'available' }
    })
    return {
      totalPhases: UNIVERSAL_PHASES.length,
      activePhases: phases.filter((phase) => phase.status === 'queued').length,
      intent,
      output,
      complexity,
      phases,
      groups,
      parallelTracks: groups.filter((group) => group.active > 1).map((group) => group.id),
      lifecycle: 'input → plan → execute → observe → verify → learn → deliver',
      privateReasoningStored: false,
    }
  }

  start(taskId, plan) {
    const active = plan.phases.filter((phase) => phase.status === 'queued').map((phase) => phase.number)
    const phases = plan.phases.map((phase) => ({ ...phase, status: active.includes(phase.number) ? (phase.number === active[0] ? 'running' : 'queued') : 'not-applicable' }))
    const run = { taskId, totalPhases: 150, activePhases: active.length, completed: [], current: active[0] || null, currentPhase: phases.find((phase) => phase.number === active[0]) || null, phases, status: 'running', startedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), progress: 0 }
    this.runs.set(taskId, run)
    this.emit({ type: 'phase-engine.started', run: this.publicRun(run) })
    return run
  }

  advance(taskId, { checkpoint, complete = true } = {}) {
    const run = this.runs.get(taskId)
    if (!run || run.status !== 'running') return run || null
    const currentNumber = run.current
    const currentPhase = run.phases.find((phase) => phase.number === currentNumber)
    if (complete && currentPhase && currentPhase.status !== 'completed') {
      currentPhase.status = 'completed'
      currentPhase.completedAt = new Date().toISOString()
      if (!run.completed.includes(currentNumber)) run.completed.push(currentNumber)
    }
    const nextPhase = run.phases.find((phase) => phase.status === 'queued')
    if (nextPhase) {
      nextPhase.status = 'running'
      run.current = nextPhase.number
      run.currentPhase = nextPhase
    } else {
      run.current = null
      run.currentPhase = null
    }
    run.updatedAt = new Date().toISOString()
    run.checkpoint = checkpoint
    run.progress = Math.round((run.completed.length / Math.max(run.activePhases, 1)) * 100)
    this.emit({ type: 'phase-engine.advanced', run: this.publicRun(run) })
    return run
  }

  step(taskId) {
    const run = this.runs.get(taskId)
    if (!run || ['completed', 'cancelled'].includes(run.status)) return run || null
    run.status = 'running'
    return this.advance(taskId, { checkpoint: 'manual-phase-step' })
  }

  complete(taskId) {
    const run = this.runs.get(taskId)
    if (!run) return null
    run.phases.forEach((phase) => { if (phase.status === 'running' || phase.status === 'queued') { phase.status = 'completed'; phase.completedAt = new Date().toISOString() } })
    run.completed = run.phases.filter((phase) => phase.status === 'completed').map((phase) => phase.number)
    run.current = null
    run.currentPhase = null
    run.status = 'completed'
    run.progress = 100
    run.completedAt = new Date().toISOString()
    this.emit({ type: 'phase-engine.completed', run: this.publicRun(run) })
    return run
  }

  pause(taskId) {
    const run = this.runs.get(taskId)
    if (run) { run.status = 'paused'; run.updatedAt = new Date().toISOString(); this.emit({ type: 'phase-engine.paused', run: this.publicRun(run) }) }
    return run || null
  }

  resume(taskId) {
    const run = this.runs.get(taskId)
    if (run) { run.status = 'running'; run.updatedAt = new Date().toISOString(); this.emit({ type: 'phase-engine.resumed', run: this.publicRun(run) }) }
    return run || null
  }

  cancel(taskId) {
    const run = this.runs.get(taskId)
    if (run) { run.status = 'cancelled'; run.updatedAt = new Date().toISOString(); this.emit({ type: 'phase-engine.cancelled', run: this.publicRun(run) }) }
    return run || null
  }

  observe(taskId) {
    return this.publicRun(this.runs.get(taskId))
  }

  publicRun(run) {
    if (!run) return null
    return { ...run, phases: run.phases.map((phase) => ({ ...phase })), completed: [...run.completed], currentPhase: run.currentPhase ? { ...run.currentPhase } : null }
  }

  snapshot() {
    const runs = [...this.runs.values()]
    return { totalPhases: UNIVERSAL_PHASES.length, groups: PHASE_GROUPS, definitions: UNIVERSAL_PHASES, runs: this.runs.size, activeRuns: runs.filter((run) => run.status === 'running').length, completedRuns: runs.filter((run) => run.status === 'completed').length, recentRuns: runs.slice(-5).reverse().map((run) => this.publicRun(run)) }
  }
}

function activePhaseNumbers({ intent, text, output }) {
  const active = new Set([...range(1, 20), ...range(121, 150)])
  const value = String(text).toLowerCase()
  if (intent === 'software' || /code|coding|repository|bug|implement|build|test|debug/i.test(value)) range(21, 40).forEach((number) => active.add(number))
  if (intent === 'computer-control' || /computer|desktop|application|browser|click|terminal|file/i.test(value)) range(41, 50).forEach((number) => active.add(number))
  if (intent === 'research' || /research|source|evidence|citation|literature/i.test(value)) range(51, 60).forEach((number) => active.add(number))
  if (intent === 'research' || intent === 'document' || /knowledge|rag|document|pdf|memory/i.test(value)) range(61, 70).forEach((number) => active.add(number))
  if (output === 'image' || /image|visual|diagram/i.test(value)) range(71, 80).forEach((number) => active.add(number))
  if (output === 'video' || /video|storyboard|scene/i.test(value)) range(81, 90).forEach((number) => active.add(number))
  if (output === 'audio' || /audio|voice|speech|music/i.test(value)) range(91, 100).forEach((number) => active.add(number))
  if (intent === 'engineering' || /engineering|equation|simulation|physics|electrical|control|uncertainty/i.test(value)) range(101, 110).forEach((number) => active.add(number))
  if (output === '3d' || output === 'document' || /multimodal|3d|presentation|spreadsheet|layout/i.test(value)) range(111, 120).forEach((number) => active.add(number))
  return active
}

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
