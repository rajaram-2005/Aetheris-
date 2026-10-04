export const NODE_STATUS = Object.freeze({
  QUEUED: 'queued',
  READY: 'ready',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  BLOCKED: 'blocked',
})

export class TaskGraph {
  constructor(nodes = []) {
    this.nodes = new Map()
    nodes.forEach((node) => this.addNode(node))
  }

  addNode(node) {
    if (this.nodes.has(node.id)) throw new Error(`Task graph already contains ${node.id}`)
    this.nodes.set(node.id, {
      status: NODE_STATUS.QUEUED,
      attempts: 0,
      output: null,
      error: null,
      ...node,
      dependsOn: [...(node.dependsOn || [])],
    })
    return this.nodes.get(node.id)
  }

  get(id) {
    return this.nodes.get(id)
  }

  transition(id, status, patch = {}) {
    const node = this.nodes.get(id)
    if (!node) throw new Error(`Unknown task graph node ${id}`)
    node.status = status
    if (status === NODE_STATUS.RUNNING) node.attempts += 1
    Object.assign(node, patch)
    return node
  }

  readyNodes() {
    return [...this.nodes.values()].filter((node) => {
      if (![NODE_STATUS.QUEUED, NODE_STATUS.READY].includes(node.status)) return false
      return node.dependsOn.every((dependencyId) => this.nodes.get(dependencyId)?.status === NODE_STATUS.COMPLETED)
    })
  }

  completedCount() {
    return [...this.nodes.values()].filter((node) => node.status === NODE_STATUS.COMPLETED).length
  }

  hasFailed() {
    return [...this.nodes.values()].some((node) => node.status === NODE_STATUS.FAILED)
  }

  isComplete() {
    return [...this.nodes.values()].every((node) => [NODE_STATUS.COMPLETED, NODE_STATUS.BLOCKED].includes(node.status))
  }

  toJSON() {
    return [...this.nodes.values()].map((node) => ({ ...node, dependsOn: [...node.dependsOn] }))
  }
}

export function createExecutionGraph(plan) {
  const graph = new TaskGraph()
  graph.addNode({ id: 'intent', label: 'Intent', kind: 'control', detail: 'understand request' })
  graph.addNode({ id: 'context', label: 'Context', kind: 'control', detail: `${plan.contextSources} sources loaded`, dependsOn: ['intent'] })
  graph.addNode({ id: 'policy', label: 'Policy', kind: 'security', detail: plan.policy.requiresApproval ? 'approval required' : 'scope approved', dependsOn: ['context'] })
  graph.addNode({ id: 'planner', label: 'Task planner', kind: 'cognitive', detail: `${plan.routes.length} specialist routes`, dependsOn: ['policy'] })

  const delegationDependencies = ['planner']
  if (plan.swarm?.status === 'formed') {
    graph.addNode({ id: 'swarm', label: 'Agent swarm', kind: 'swarm', detail: `${plan.swarm.members.length} members · critic assigned`, dependsOn: ['planner'], swarmId: plan.swarm.id })
    delegationDependencies.push('swarm')
  }

  const routeIds = plan.routes.map((route, index) => {
    const id = `agent-${index + 1}`
    graph.addNode({
      id,
      label: route.agent.name,
      kind: 'agent',
      detail: route.model.name,
      dependsOn: delegationDependencies,
      agentId: route.agent.id,
      modelId: route.model.id,
      capability: route.capability,
    })
    return id
  })

  const pipelineIds = []
  let pipelineDependencies = routeIds.length ? routeIds : ['planner']
  plan.multimodal.stages.forEach((stage, index) => {
    const id = `pipeline-${index + 1}`
    graph.addNode({
      id,
      label: stage.label,
      kind: 'pipeline',
      detail: stage.detail,
      qualityGate: stage.qualityGate,
      dependsOn: pipelineDependencies,
      pipelineStageId: stage.id,
    })
    pipelineIds.push(id)
    pipelineDependencies = [id]
  })

  graph.addNode({ id: 'verify', label: 'Verification', kind: 'verification', detail: 'independent checks', dependsOn: pipelineIds.length ? pipelineDependencies : (routeIds.length ? routeIds : ['planner']) })
  graph.addNode({ id: 'synthesize', label: 'Synthesize', kind: 'cognitive', detail: 'compose result', dependsOn: ['verify'] })
  graph.addNode({ id: 'respond', label: 'Response', kind: 'control', detail: 'return to user', dependsOn: ['synthesize'] })
  return graph
}
