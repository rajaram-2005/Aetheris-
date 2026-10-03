const WORKSPACE_FILES = [
  { path: 'Aetheris/README.md', type: 'markdown', size: '3 KB', modified: 'today', text: 'Universal AIOS control plane architecture and implementation notes.' },
  { path: 'Aetheris/src/runtime/godCore.js', type: 'javascript', size: '18 KB', modified: 'today', text: 'Intent, context, planning, routing, delegation, execution, verification, and synthesis.' },
  { path: 'Project Atlas/simulations/converter.ipynb', type: 'notebook', size: '428 KB', modified: 'yesterday', text: 'Converter waveform simulation, assumptions, equations, and validation plots.' },
  { path: 'Project Atlas/reports/verification.pdf', type: 'pdf', size: '1.8 MB', modified: 'yesterday', text: 'Independent factual, logical, technical, safety, and quality checks.' },
  { path: 'Project Atlas/data/sensors-q3.csv', type: 'csv', size: '12 MB', modified: '3 days ago', text: 'Read-only lab telemetry for digital twin calibration.' },
]

export class FileControl {
  constructor({ files = WORKSPACE_FILES, security, knowledge } = {}) {
    this.security = security
    this.knowledge = knowledge
    this.files = new Map(files.map((file) => [file.path, { ...file }]))
    this.audit = []
  }

  search(query, { limit = 10 } = {}) {
    const value = String(query || '').toLowerCase()
    return [...this.files.values()].filter((file) => `${file.path} ${file.type} ${file.text}`.toLowerCase().includes(value)).slice(0, limit)
  }

  analyze(path) {
    const file = this.files.get(path) || this.search(path, { limit: 1 })[0]
    if (!file) return { status: 'not-found', path }
    return {
      status: 'ready',
      file,
      signals: { readable: true, structured: ['csv', 'json'].includes(file.type), sourceIndexed: Boolean(this.knowledge?.search(file.path).length) },
      suggestedActions: ['summarize', 'extract-entities', 'add-to-knowledge'],
    }
  }

  planOperation(action, path, { approved = false } = {}) {
    const destructive = ['delete', 'remove', 'overwrite', 'move'].includes(action)
    const write = ['create', 'edit', 'write', 'move', 'overwrite'].includes(action)
    const level = destructive ? 2 : write ? 2 : 1
    const allowed = this.security.isAllowed(level, { approved, scope: `file:${path}` }) && (!destructive || approved)
    return { action, path, destructive, write, level, allowed, status: allowed ? 'ready' : 'approval-required', rollback: write ? `checkpoint:${path}` : null }
  }

  execute(action, path, options = {}) {
    const plan = this.planOperation(action, path, options)
    const event = { id: `file-${this.audit.length + 1}`, plan, status: plan.allowed ? 'simulated' : plan.status, createdAt: new Date().toISOString() }
    this.audit.unshift(event)
    return event
  }

  snapshot() {
    return { indexed: this.files.size, auditEvents: this.audit.length, files: [...this.files.values()] }
  }
}
