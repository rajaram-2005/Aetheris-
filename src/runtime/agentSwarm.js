export class AgentSwarm {
  constructor({ emit = () => {} } = {}) {
    this.emit = emit
    this.teams = new Map()
  }

  compose({ taskId, intent, routes = [], complexity = 'medium' }) {
    const activeRoutes = routes.filter(Boolean)
    const team = {
      id: `swarm-${taskId || this.teams.size + 1}`,
      taskId,
      intent,
      complexity,
      members: activeRoutes.map((route, index) => ({
        agentId: route.agent.id,
        name: route.agent.name,
        modelId: route.model.id,
        role: index === 0 ? 'lead' : roleFor(route.agent.name),
        status: 'assigned',
      })),
      critic: activeRoutes.find((route) => /critique|verification|fact/i.test(route.agent.name))?.agent.name || 'Verification',
      coordinator: 'God Core',
      status: activeRoutes.length > 1 ? 'formed' : 'single-agent',
      createdAt: new Date().toISOString(),
    }
    this.teams.set(team.id, team)
    this.emit({ type: 'swarm.formed', swarm: team })
    return team
  }

  disband(swarmId) {
    const team = this.teams.get(swarmId)
    if (!team) return null
    team.status = 'completed'
    team.completedAt = new Date().toISOString()
    return team
  }

  snapshot() {
    return { active: [...this.teams.values()].filter((team) => team.status === 'formed').length, total: this.teams.size, teams: [...this.teams.values()] }
  }
}

function roleFor(name) {
  if (/research|retrieval|citation/i.test(name)) return 'evidence'
  if (/verification|critique|testing|fact/i.test(name)) return 'critic'
  if (/programming|electrical|physics|image|video|audio/i.test(name)) return 'specialist'
  return 'support'
}
