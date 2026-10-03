import { ConversationPlane } from './conversation.js'
import { createMultimodalPlan } from './multimodal.js'
import { ModelRouter } from './router.js'
import { createExecutionGraph, NODE_STATUS } from './taskGraph.js'
import { PLANE_DEFINITIONS, ARCHITECTURE_PHASES, MODEL_DEFINITIONS } from './registry.js'
import { KnowledgeFabric } from './knowledgeFabric.js'
import { MemoryFabric } from './memoryFabric.js'
import { MetaLearningEngine } from './metaLearning.js'
import { ToolFabric } from './toolFabric.js'
import { ComputerControlLoop } from './computerControl.js'

export class GodCore {
  constructor({ projectId = 'aetheris-core', projectName = 'Aetheris / Core', online = false, emit = () => {} } = {}) {
    this.emit = emit
    this.knowledge = new KnowledgeFabric()
    this.memory = new MemoryFabric({ knowledge: this.knowledge })
    this.metaLearning = new MetaLearningEngine({ memory: this.memory })
    this.tools = new ToolFabric({ online })
    this.computer = new ComputerControlLoop({ tools: this.tools })
    this.conversation = new ConversationPlane({ projectId, projectName })
    this.router = new ModelRouter({ online })
    this.tasks = new Map()
    this.taskSequence = 1043
  }

  setOnline(online) {
    this.router.setOnline(online)
    this.tools.setOnline(online)
    this.emit({ type: 'runtime.network', online: this.router.online })
  }

  submit(request, options = {}) {
    const understanding = this.conversation.understand(request)
    const memoryContext = this.memory.contextFor(understanding.text)
    const knowledgeEvidence = this.knowledge.search(understanding.text)
    const context = this.conversation.loadContext({
      ...options.context,
      memory: memoryContext,
      knowledge: knowledgeEvidence,
    })
    const multimodal = createMultimodalPlan(understanding)
    const routes = this.router.route(understanding, multimodal)
    const policy = evaluatePolicy(understanding, { online: this.router.online, ...options })
    const toolPlan = this.tools.plan(understanding, { approved: options.approved })
    const computerPlan = understanding.intent === 'computer-control' ? this.computer.plan(understanding) : null
    const plan = {
      contextSources: context.memoryRefs.length + knowledgeEvidence.length + 1,
      understanding,
      routes,
      policy,
      multimodal,
      toolPlan,
      computerPlan,
      knowledgeEvidence,
      tools: resolveTools(routes, understanding, toolPlan),
    }
    const graph = createExecutionGraph(plan)
    const task = {
      id: `RUN-${this.taskSequence++}`,
      sessionId: `SESSION-${Date.now().toString(36)}`,
      objective: understanding.text,
      intent: understanding.intent,
      status: policy.requiresApproval ? 'Awaiting approval' : 'Running',
      progress: 0,
      agents: routes.length,
      models: [...new Set(routes.map((route) => route.model.id))],
      tools: plan.tools,
      plan,
      graph,
      createdAt: new Date().toISOString(),
      activity: [],
      checkpoint: 'intent',
    }

    this.tasks.set(task.id, task)
    this.emitTask(task, 'task.created')
    if (policy.requiresApproval) {
      graph.transition('policy', NODE_STATUS.BLOCKED, { output: 'Awaiting explicit approval' })
      this.addActivity(task, 'Policy paused execution', policy.reason, 'gold')
      task.checkpoint = 'policy'
      this.emitTask(task, 'task.awaiting-approval')
    } else {
      this.execute(task)
    }
    return serializeTask(task)
  }

  approve(taskId) {
    const task = this.tasks.get(taskId)
    if (!task || task.status !== 'Awaiting approval') return task ? serializeTask(task) : null
    task.status = 'Running'
    task.plan.toolPlan = this.tools.plan(task.plan.understanding, { approved: true })
    task.plan.tools = task.plan.toolPlan.map((tool) => tool.toolId)
    task.tools = task.plan.tools
    task.graph.transition('policy', NODE_STATUS.COMPLETED, { output: 'Approved by user' })
    this.addActivity(task, 'Policy approved by user', 'Execution scope unlocked', 'gold')
    this.emitTask(task, 'task.approved')
    this.execute(task)
    return serializeTask(task)
  }

  execute(task) {
    const sequence = [
      'intent',
      'context',
      'policy',
      'planner',
      ...task.plan.routes.map((_, index) => `agent-${index + 1}`),
      ...task.plan.multimodal.stages.map((_, index) => `pipeline-${index + 1}`),
      'verify',
      'synthesize',
      'respond',
    ]
    const delay = (index) => 220 + (index < 4 ? index * 100 : 180)

    // A graph is dependency-aware rather than time-based: each node is started only
    // after its predecessor has completed. This keeps the demo faithful to the same
    // contract a real worker queue would use when replacing these simulated steps.
    const runNode = (index) => {
      if (index >= sequence.length) return
      if (!this.tasks.has(task.id) || task.status === 'Paused' || task.status === 'Awaiting approval') return

      const nodeId = sequence[index]
      const node = task.graph.get(nodeId)
      if (!node || node.status === NODE_STATUS.BLOCKED) return

      task.graph.transition(nodeId, NODE_STATUS.RUNNING)
      task.checkpoint = nodeId
      this.addActivity(task, activityTitle(node, 'started'), node.detail, activityTone(node.kind))
      this.emitTask(task, 'task.node-started')

      setTimeout(() => {
        if (!this.tasks.has(task.id) || task.status === 'Paused') return
        task.graph.transition(nodeId, NODE_STATUS.COMPLETED, { output: outputFor(node, task) })
        task.progress = Math.round((task.graph.completedCount() / task.graph.nodes.size) * 100)
        task.status = nodeId === 'respond' ? 'Completed' : 'Running'
        if (nodeId === 'respond') {
          task.checkpoint = 'complete'
          const evaluation = this.metaLearning.evaluate(task)
          this.memory.rememberTask(task, evaluation)
          this.metaLearning.updateStrategy(task, evaluation)
          this.conversation.remember(task)
          this.conversation.addMessage('assistant', responseFor(task), { taskId: task.id, evaluation })
          task.evaluation = evaluation
        }
        this.addActivity(task, activityTitle(node, 'completed'), node.kind === 'agent' ? `${node.label} · ${node.detail}` : node.detail, activityTone(node.kind))
        this.emitTask(task, nodeId === 'respond' ? 'task.completed' : 'task.node-completed')
        if (nodeId !== 'respond') setTimeout(() => runNode(index + 1), 120)
      }, delay(index))
    }

    runNode(0)
  }

  getTask(taskId) {
    const task = this.tasks.get(taskId)
    return task ? serializeTask(task) : null
  }

  snapshot() {
    return {
      planes: PLANE_DEFINITIONS,
      phases: ARCHITECTURE_PHASES,
      agentsOnline: 42,
      agentCount: 56,
      modelCount: MODEL_DEFINITIONS.length,
      tools: this.tools.snapshot(),
      knowledge: this.knowledge.snapshot(),
      memory: this.memory.snapshot(),
      learning: this.metaLearning.snapshot(),
      computer: this.computer.plan({ text: '', intent: 'general', modalities: [], risk: {} }),
      tasks: [...this.tasks.values()].map(serializeTask),
      online: this.router.online,
    }
  }

  emitTask(task, type) {
    this.emit({ type, task: serializeTask(task) })
  }

  addActivity(task, title, detail, tone = 'mint') {
    task.activity.unshift({ title, detail, tone, time: 'now' })
    task.activity = task.activity.slice(0, 12)
  }
}

function evaluatePolicy(understanding, { online }) {
  const { risk } = understanding
  if (risk.physicalAction) return { requiresApproval: true, reason: 'Physical or industrial action requires authorization' }
  if (risk.destructive) return { requiresApproval: true, reason: 'Destructive operation requires explicit confirmation' }
  if (risk.networkRequested && !online) return { requiresApproval: true, reason: 'Network access is disabled in LOCAL ONLY mode' }
  return { requiresApproval: false, reason: 'Project scope approved' }
}

function resolveTools(routes, understanding, toolPlan = []) {
  const names = new Set(toolPlan.filter((tool) => tool.allowed).map((tool) => tool.toolId))
  const allowed = new Set(names)
  routes.forEach((route) => route.agent.tools.forEach((tool) => {
    if (!toolPlan.length || allowed.has(tool)) names.add(tool)
  }))
  if (understanding.intent === 'engineering' && (!toolPlan.length || allowed.has('simulation'))) names.add('simulation')
  return [...names]
}

function serializeTask(task) {
  return {
    ...task,
    graph: task.graph.toJSON(),
    plan: {
      ...task.plan,
      routes: task.plan.routes.map((route) => ({
        capability: route.capability,
        agent: { id: route.agent.id, name: route.agent.name, group: route.agent.group },
        model: { id: route.model.id, name: route.model.name, type: route.model.type },
        reason: route.reason,
      })),
    },
    models: [...task.models],
    tools: [...task.tools],
    activity: [...task.activity],
  }
}

function activityTitle(node, phase) {
  if (node.kind === 'agent') return `${node.label} ${phase}`
  if (node.id === 'intent') return `God Core ${phase} request`
  if (node.id === 'context') return `Context engine ${phase}`
  if (node.id === 'policy') return `Policy engine ${phase}`
  if (node.id === 'planner') return `Task planner ${phase}`
  if (node.id === 'verify') return `Verification ${phase}`
  if (node.id === 'synthesize') return `Arbitration ${phase}`
  if (node.kind === 'pipeline') return `${node.label} ${phase}`
  return `Response ${phase}`
}

function activityTone(kind) {
  if (kind === 'security') return 'gold'
  if (kind === 'verification') return 'blue'
  if (kind === 'agent') return 'violet'
  return 'mint'
}

function outputFor(node, task) {
  if (node.id === 'intent') return task.intent
  if (node.id === 'context') return `${task.plan.contextSources} memory references`
  if (node.id === 'policy') return task.plan.policy.reason
  if (node.kind === 'agent') return `${node.label} produced a verified intermediate result`
  if (node.kind === 'pipeline') return `${node.label} produced ${node.detail}`
  if (node.id === 'verify') return 'Factual, logical, technical, safety, and quality checks passed'
  if (node.id === 'synthesize') return `Synthesized ${task.plan.multimodal.artifact} response`
  return 'Response ready'
}

function responseFor(task) {
  return `RUN ${task.id} completed. God Core routed ${task.agents} specialists through the ${task.plan.multimodal.label} and verified the ${task.plan.multimodal.artifact} locally.`
}
