const PROJECT_PIPELINE = [
  { id: 'architecture', label: 'Architecture', verification: 'dependency and boundary review' },
  { id: 'implementation', label: 'Implementation', verification: 'sandboxed change set' },
  { id: 'testing', label: 'Testing', verification: 'unit and integration checks' },
  { id: 'debugging', label: 'Debugging', verification: 'failure diagnosis' },
  { id: 'security', label: 'Security', verification: 'policy and dependency scan' },
  { id: 'verification', label: 'Verification', verification: 'independent result review' },
]

export class ProjectWork {
  constructor({ files, terminal, security } = {}) {
    this.files = files
    this.terminal = terminal
    this.security = security
    this.projects = new Map([['aetheris-core', { id: 'aetheris-core', name: 'Aetheris / Core', root: 'Aetheris', status: 'active' }]])
    this.runs = []
  }

  inspect(projectId = 'aetheris-core') {
    const project = this.projects.get(projectId) || [...this.projects.values()].find((item) => item.name.toLowerCase().includes(projectId.toLowerCase()))
    return { project: project || null, files: project ? this.files.search(project.root) : [], checks: ['manifest', 'dependencies', 'tests', 'security'] }
  }

  plan(request, { approved = false } = {}) {
    const stages = PROJECT_PIPELINE.map((stage, index) => ({ ...stage, order: index + 1, status: index === 0 ? 'ready' : 'queued' }))
    const write = /fix|implement|edit|refactor|change|build/i.test(request)
    return {
      objective: request,
      stages,
      write,
      sandbox: true,
      approval: write && !approved,
      contract: 'analyze → propose → sandbox → test → verify → apply',
    }
  }

  record(run) {
    const saved = { id: `project-run-${this.runs.length + 1}`, ...run, createdAt: new Date().toISOString() }
    this.runs.unshift(saved)
    return saved
  }

  snapshot() {
    return { projects: this.projects.size, runs: this.runs.length, pipeline: PROJECT_PIPELINE }
  }
}
