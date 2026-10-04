import { phaseOperation } from './phaseExecution.js'
import { PhaseRunSnapshotStore } from './phasePersistence.js'

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
  constructor({ emit = () => {}, storage = null, storageKey = 'aetheris.phase-runs', scheduler = null } = {}) {
    this.emit = emit
    this.runs = new Map()
    this.eventSequence = 0
    this.scheduler = scheduler || { setTimeout: (callback, delay) => setTimeout(callback, delay) }
    this.snapshotStore = new PhaseRunSnapshotStore({ storage, key: storageKey })
    this.restore()
  }

  restore() {
    const saved = this.snapshotStore.load()
    this.eventSequence = Math.max(saved.eventSequence || 0, ...saved.runs.flatMap((run) => (run.events || []).map((event) => Number(String(event.id || '').split('-').at(-1)) || 0)))
    saved.runs.forEach((savedRun) => {
      const run = normalizeRestoredRun(savedRun)
      if (run.status === 'running') {
        run.status = 'paused'
        run.autoRunning = false
        run.recoveredFrom = 'running'
        run.updatedAt = new Date().toISOString()
        run.checkpointState = { ...(run.checkpointState || {}), name: run.checkpoint || 'recovered', phase: run.current, status: 'paused', reason: 'Recovered after runtime restart', at: run.updatedAt }
        this.recordEvent(run, 'run.recovered', { phase: run.current, checkpoint: run.checkpoint, recoveredFrom: 'running' })
      }
      this.runs.set(run.taskId, run)
    })
    if (saved.runs.length) this.persist()
  }

  persist() {
    return this.snapshotStore.save({ runs: [...this.runs.values()], eventSequence: this.eventSequence })
  }

  schedule(run, callback, delay) {
    try {
      return this.scheduler.setTimeout(callback, delay)
    } catch (error) {
      this.failRun(run.taskId, error)
      return null
    }
  }

  failRun(taskId, error) {
    const run = this.runs.get(taskId)
    if (!run || ['completed', 'cancelled', 'failed'].includes(run.status)) return run || null
    run.status = 'failed'
    run.autoRunning = false
    run.updatedAt = new Date().toISOString()
    run.error = { code: 'PHASE_SCHEDULER_FAILURE', message: error?.message || 'phase scheduler failed' }
    run.checkpointState = { name: run.checkpoint || 'scheduler-failure', phase: run.current, status: 'failed', at: run.updatedAt }
    this.recordEvent(run, 'run.failed', { phase: run.current, checkpoint: run.checkpoint, error: run.error })
    this.persist()
    this.emit({ type: 'phase-engine.failed', run: this.publicRun(run) })
    return run
  }

  plan({ intent = 'general', text = '', output = 'text', complexity = 'medium', fullRun = false } = {}) {
    const active = fullRun ? new Set(range(1, 150)) : activePhaseNumbers({ intent, text, output })
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
      fullRun,
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
    const now = new Date().toISOString()
    const run = { taskId, totalPhases: 150, activePhases: active.length, completed: [], actions: [], events: [], current: active[0] || null, currentPhase: phases.find((phase) => phase.number === active[0]) || null, phases, status: 'running', startedAt: now, updatedAt: now, progress: 0, checkpoint: 'plan-created', checkpointState: { name: 'plan-created', phase: null, status: 'running', at: now }, autoRunning: false, autoRequested: false, stepDelay: 32 }
    this.runs.set(taskId, run)
    this.recordEvent(run, 'run.started', { phase: run.current })
    if (run.currentPhase) {
      run.currentPhase.startedAt = now
      this.recordEvent(run, 'phase.started', { phase: run.currentPhase.number, phaseId: run.currentPhase.id, name: run.currentPhase.name })
    }
    this.persist()
    this.emit({ type: 'phase-engine.started', run: this.publicRun(run) })
    return run
  }

  advance(taskId, { checkpoint, complete = true } = {}) {
    const run = this.runs.get(taskId)
    if (!run || run.status !== 'running') return run || null
    const currentNumber = run.current
    const currentPhase = run.phases.find((phase) => phase.number === currentNumber)
    const completedAt = new Date().toISOString()
    if (complete && currentPhase && currentPhase.status !== 'completed') {
      currentPhase.status = 'completed'
      currentPhase.completedAt = completedAt
      if (!run.completed.includes(currentNumber)) run.completed.push(currentNumber)
      run.actions.push({ phase: currentPhase.number, id: currentPhase.id, name: currentPhase.name, domain: currentPhase.domain, operation: phaseOperation(currentPhase), status: 'completed', startedAt: currentPhase.startedAt || run.startedAt, completedAt })
      this.recordEvent(run, 'phase.completed', { phase: currentPhase.number, phaseId: currentPhase.id, name: currentPhase.name, operation: phaseOperation(currentPhase) })
    }
    const nextPhase = run.phases.find((phase) => phase.status === 'queued')
    if (nextPhase) {
      nextPhase.status = 'running'
      nextPhase.startedAt = new Date().toISOString()
      run.current = nextPhase.number
      run.currentPhase = nextPhase
      this.recordEvent(run, 'phase.started', { phase: nextPhase.number, phaseId: nextPhase.id, name: nextPhase.name })
    } else {
      run.current = null
      run.currentPhase = null
    }
    run.updatedAt = new Date().toISOString()
    run.checkpoint = checkpoint || (currentPhase ? `phase-${String(currentPhase.number).padStart(3, '0')}` : run.checkpoint)
    run.checkpointState = { name: run.checkpoint, phase: currentNumber || null, status: nextPhase ? 'completed' : 'ready-to-complete', at: run.updatedAt }
    run.progress = Math.round((run.completed.length / Math.max(run.activePhases, 1)) * 100)
    this.recordEvent(run, 'run.advanced', { phase: run.current, checkpoint: run.checkpoint, progress: run.progress })
    this.persist()
    this.emit({ type: 'phase-engine.advanced', run: this.publicRun(run) })
    return run
  }

  step(taskId) {
    const run = this.runs.get(taskId)
    if (!run || ['completed', 'cancelled'].includes(run.status) || run.autoRunning) return run || null
    run.status = 'running'
    run.updatedAt = new Date().toISOString()
    this.recordEvent(run, 'manual.step-requested', { phase: run.current })
    return this.advance(taskId, { checkpoint: 'manual-phase-step' })
  }

  runToCompletion(taskId, { delay = 32 } = {}) {
    const run = this.runs.get(taskId)
    if (!run || ['completed', 'cancelled', 'failed'].includes(run.status)) return run || null
    if (run.autoRunning) return run
    run.status = 'running'
    run.autoRunning = true
    run.autoRequested = true
    run.stepDelay = delay
    run.updatedAt = new Date().toISOString()
    this.recordEvent(run, 'run.auto-started', { delay })
    this.persist()
    const tick = () => {
      try {
        const current = this.runs.get(taskId)
        if (!current || !current.autoRunning || current.status !== 'running') return
        if (!current.currentPhase) {
          current.autoRunning = false
          this.complete(taskId)
          return
        }
        this.advance(taskId, { checkpoint: `phase-${String(current.currentPhase.number).padStart(3, '0')}` })
        const after = this.runs.get(taskId)
        if (after?.currentPhase) this.schedule(after, tick, after.stepDelay)
        else {
          after.autoRunning = false
          this.complete(taskId)
        }
      } catch (error) {
        this.failRun(taskId, error)
      }
    }
    this.schedule(run, tick, 0)
    return run
  }

  complete(taskId) {
    const run = this.runs.get(taskId)
    if (!run || ['completed', 'cancelled', 'failed'].includes(run.status)) return run || null
    run.phases.forEach((phase) => { if (phase.status === 'running' || phase.status === 'queued') { phase.status = 'completed'; phase.completedAt = new Date().toISOString() } })
    run.completed = run.phases.filter((phase) => phase.status === 'completed').map((phase) => phase.number)
    run.current = null
    run.currentPhase = null
    run.autoRunning = false
    run.status = 'completed'
    run.progress = 100
    run.updatedAt = new Date().toISOString()
    run.completedAt = run.updatedAt
    run.checkpoint = 'final-response'
    run.checkpointState = { name: 'final-response', phase: 150, status: 'completed', at: run.completedAt }
    this.recordEvent(run, 'run.completed', { completed: run.completed.length, progress: run.progress })
    this.persist()
    this.emit({ type: 'phase-engine.completed', run: this.publicRun(run) })
    return run
  }

  pause(taskId, reason = 'Paused by user') {
    const run = this.runs.get(taskId)
    if (run && !['completed', 'cancelled'].includes(run.status)) {
      run.status = 'paused'
      run.autoRunning = false
      run.updatedAt = new Date().toISOString()
      run.checkpointState = { name: run.checkpoint || 'pause-requested', phase: run.current, status: 'paused', reason, at: run.updatedAt }
      this.recordEvent(run, 'run.paused', { phase: run.current, checkpoint: run.checkpoint, reason })
      this.persist()
      this.emit({ type: 'phase-engine.paused', run: this.publicRun(run) })
    }
    return run || null
  }

  resume(taskId) {
    const run = this.runs.get(taskId)
    if (run && run.status === 'paused') {
      run.status = 'running'
      run.updatedAt = new Date().toISOString()
      run.checkpointState = { name: run.checkpoint || 'resume-requested', phase: run.current, status: 'running', at: run.updatedAt }
      this.recordEvent(run, 'run.resumed', { phase: run.current, checkpoint: run.checkpoint })
      this.persist()
      this.emit({ type: 'phase-engine.resumed', run: this.publicRun(run) })
      if (run.autoRequested) this.runToCompletion(taskId, { delay: run.stepDelay })
    }
    return run || null
  }

  cancel(taskId, reason = 'Cancelled by user') {
    const run = this.runs.get(taskId)
    if (run && !['completed', 'cancelled'].includes(run.status)) {
      run.status = 'cancelled'
      run.autoRunning = false
      run.updatedAt = new Date().toISOString()
      run.checkpointState = { name: run.checkpoint || 'cancelled', phase: run.current, status: 'cancelled', reason, at: run.updatedAt }
      this.recordEvent(run, 'run.cancelled', { phase: run.current, checkpoint: run.checkpoint, reason })
      this.persist()
      this.emit({ type: 'phase-engine.cancelled', run: this.publicRun(run) })
    }
    return run || null
  }

  observe(taskId) {
    return this.publicRun(this.runs.get(taskId))
  }

  observeAll({ limit = 12, status } = {}) {
    const runs = [...this.runs.values()].filter((run) => !status || run.status === status).slice(-limit).reverse()
    return runs.map((run) => this.publicRun(run))
  }

  history(taskId, { limit = 100, cursor = 0 } = {}) {
    const run = this.runs.get(taskId)
    if (!run) return null
    const pageSize = Math.min(Math.max(Number(limit) || 100, 1), 500)
    const offset = Math.max(Number(cursor) || 0, 0)
    const newestActions = run.actions.slice().reverse()
    const events = run.events.slice(offset, offset + pageSize).map((event) => cloneEvent(event))
    const actions = newestActions.slice(offset, offset + pageSize).map((action) => ({ ...action }))
    const total = Math.max(run.events.length, newestActions.length)
    const nextCursor = offset + pageSize < total ? offset + pageSize : null
    return { taskId, checkpoint: run.checkpoint, checkpointState: run.checkpointState, actions, events, page: { cursor: offset, limit: pageSize, nextCursor, totalEvents: run.events.length, totalActions: run.actions.length } }
  }

  exportAudit(taskId, { format = 'json', limit = 500 } = {}) {
    const run = this.runs.get(taskId)
    if (!run) return null
    const payload = { schemaVersion: 1, exportedAt: new Date().toISOString(), taskId, run: this.publicRun(run), history: this.history(taskId, { limit }) }
    if (format === 'ndjson') {
      const content = payload.history.events.map((event) => JSON.stringify(event)).join('\n')
      return { format, content, eventCount: payload.history.events.length, taskId, schemaVersion: payload.schemaVersion }
    }
    return { format: 'json', content: JSON.stringify(payload), payload }
  }

  recordEvent(run, type, data = {}) {
    const event = {
      id: `phase-event-${++this.eventSequence}`,
      taskId: run.taskId,
      type,
      phase: data.phase ?? run.current ?? null,
      checkpoint: data.checkpoint ?? run.checkpoint ?? null,
      status: run.status,
      data: { ...data },
      time: new Date().toISOString(),
    }
    run.events.unshift(event)
    run.events = run.events.slice(0, 500)
    return event
  }

  publicRun(run) {
    if (!run) return null
    return { ...run, phases: run.phases.map((phase) => ({ ...phase })), completed: [...run.completed], actions: run.actions.map((action) => ({ ...action })), events: (run.events || []).map((event) => ({ ...event, data: { ...event.data } })), checkpointState: run.checkpointState ? { ...run.checkpointState } : null, currentPhase: run.currentPhase ? { ...run.currentPhase } : null }
  }

  snapshot() {
    const runs = [...this.runs.values()]
    const events = runs.flatMap((run) => run.events || []).sort((a, b) => b.time.localeCompare(a.time))
    return { totalPhases: UNIVERSAL_PHASES.length, groups: PHASE_GROUPS, definitions: UNIVERSAL_PHASES, runs: this.runs.size, activeRuns: runs.filter((run) => run.status === 'running').length, pausedRuns: runs.filter((run) => run.status === 'paused').length, completedRuns: runs.filter((run) => run.status === 'completed').length, failedRuns: runs.filter((run) => run.status === 'failed').length, eventCount: events.length, recentEvents: events.slice(0, 20).map((event) => cloneEvent(event)), recentRuns: runs.slice(-12).reverse().map((run) => this.publicRun(run)), persistence: { version: 1, available: Boolean(this.snapshotStore.storage), key: this.snapshotStore.key } }
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

function cloneEvent(event) {
  return { ...event, data: { ...(event.data || {}) } }
}

function normalizeRestoredRun(run) {
  const phases = Array.isArray(run.phases) ? run.phases.map((phase) => ({ ...phase })) : []
  const currentPhase = phases.find((phase) => phase.number === run.current) || null
  return {
    ...run,
    phases,
    completed: Array.isArray(run.completed) ? [...run.completed] : phases.filter((phase) => phase.status === 'completed').map((phase) => phase.number),
    actions: Array.isArray(run.actions) ? run.actions.map((action) => ({ ...action })) : [],
    events: Array.isArray(run.events) ? run.events.map(cloneEvent) : [],
    currentPhase,
    autoRunning: false,
    autoRequested: Boolean(run.autoRequested),
  }
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
