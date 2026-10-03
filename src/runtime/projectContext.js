export class ProjectContext {
  constructor({ projectId = 'aetheris-core', projectName = 'Aetheris / Core' } = {}) {
    this.projects = new Map()
    this.ensure(projectId, projectName)
  }

  ensure(id = 'aetheris-core', name = 'Aetheris / Core') {
    if (!this.projects.has(id)) {
      this.projects.set(id, { id, name, conversations: [], files: [], models: [], knowledge: [], tasks: [], workflows: [], agents: [], assets: [], settings: { localFirst: true }, history: [] })
    }
    return this.projects.get(id)
  }

  attachTask(projectId, task) {
    const project = this.ensure(projectId)
    if (!project.tasks.includes(task.id)) project.tasks.unshift(task.id)
    project.history.unshift({ type: 'task', id: task.id, objective: task.objective, time: new Date().toISOString() })
    project.history = project.history.slice(0, 100)
    return project
  }

  addConversation(projectId, message) {
    const project = this.ensure(projectId)
    project.conversations.unshift(message)
    return project
  }

  addAsset(projectId, asset) {
    const project = this.ensure(projectId)
    project.assets.unshift(asset.id || asset)
    return project
  }

  context(projectId = 'aetheris-core') {
    return this.ensure(projectId)
  }

  snapshot() {
    const projects = [...this.projects.values()]
    return { projects: projects.length, active: projects[0]?.id || null, taskRefs: projects.reduce((sum, project) => sum + project.tasks.length, 0), assetRefs: projects.reduce((sum, project) => sum + project.assets.length, 0), knowledgeRefs: projects.reduce((sum, project) => sum + project.knowledge.length, 0) }
  }
}
