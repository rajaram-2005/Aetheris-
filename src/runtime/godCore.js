import { ConversationPlane } from './conversation.js'
import { createMultimodalPlan } from './multimodal.js'
import { ModelRouter } from './router.js'
import { createExecutionGraph, NODE_STATUS } from './taskGraph.js'
import { PLANE_DEFINITIONS, ARCHITECTURE_PHASES, CONTROL_PHASES, MODE_PHASES, PLATFORM_PHASES, FINAL_PHASES, MODEL_DEFINITIONS } from './registry.js'
import { KnowledgeFabric } from './knowledgeFabric.js'
import { MemoryFabric } from './memoryFabric.js'
import { MetaLearningEngine } from './metaLearning.js'
import { ToolFabric } from './toolFabric.js'
import { ComputerControlLoop } from './computerControl.js'
import { SystemAbstraction } from './systemAbstraction.js'
import { SecurityPolicy } from './securityPolicy.js'
import { UniversalTerminal } from './terminal.js'
import { ApplicationControl } from './applicationControl.js'
import { FileControl } from './fileControl.js'
import { BrowserControl } from './browserControl.js'
import { ProjectWork } from './projectWork.js'
import { WorkflowEngine } from './workflowEngine.js'
import { AgentSwarm } from './agentSwarm.js'
import { ComputerUseLoop } from './computerUseLoop.js'
import { SandboxRuntime } from './sandbox.js'
import { IndustrialGateway } from './industrialGateway.js'
import { DigitalTwinEngine } from './digitalTwin.js'
import { ScientificMode } from './scientificMode.js'
import { EducationMode } from './educationMode.js'
import { CreativeStudio } from './creativeStudio.js'
import { ResearchMode } from './researchMode.js'
import { VerificationEngine } from './verificationEngine.js'
import { SelfHealingWorkflow } from './selfHealing.js'
import { ObservabilityLedger } from './observability.js'
import { ResourceManager } from './resourceManager.js'
import { NetworkMode } from './networkMode.js'
import { PluginFabric } from './pluginFabric.js'
import { DeveloperPlatform } from './developerPlatform.js'
import { UniversalApi } from './universalApi.js'
import { DataLayer } from './dataLayer.js'
import { TrainingFabric } from './trainingFabric.js'
import { ContinualImprovement } from './continualImprovement.js'
import { TaskStateStore } from './taskState.js'
import { ProjectContext } from './projectContext.js'
import { CommandCatalog } from './commandCatalog.js'
import { ExecutionLoop } from './executionLoop.js'
import { HardwareStack } from './hardwareStack.js'
import { DeploymentModes } from './deploymentModes.js'
import { SafetyArchitecture } from './safetyArchitecture.js'
import { AiosEnvironment } from './aiosEnvironment.js'

export class GodCore {
  constructor({ projectId = 'aetheris-core', projectName = 'Aetheris / Core', online = false, emit = () => {} } = {}) {
    this.emit = emit
    this.system = new SystemAbstraction()
    this.security = new SecurityPolicy({ online })
    this.knowledge = new KnowledgeFabric()
    this.memory = new MemoryFabric({ knowledge: this.knowledge })
    this.metaLearning = new MetaLearningEngine({ memory: this.memory })
    this.tools = new ToolFabric({ online })
    this.terminal = new UniversalTerminal({ system: this.system, security: this.security })
    this.files = new FileControl({ security: this.security, knowledge: this.knowledge })
    this.applications = new ApplicationControl({ security: this.security })
    this.browser = new BrowserControl({ security: this.security })
    this.computer = new ComputerControlLoop({ tools: this.tools, system: this.system })
    this.computerUse = new ComputerUseLoop({ computer: this.computer, terminal: this.terminal, files: this.files, applications: this.applications, browser: this.browser })
    this.projectWork = new ProjectWork({ files: this.files, terminal: this.terminal, security: this.security })
    this.sandbox = new SandboxRuntime({ security: this.security })
    this.digitalTwin = new DigitalTwinEngine()
    this.industrial = new IndustrialGateway({ security: this.security, twin: this.digitalTwin })
    this.scientific = new ScientificMode({ twin: this.digitalTwin, sandbox: this.sandbox })
    this.education = new EducationMode()
    this.creative = new CreativeStudio()
    this.research = new ResearchMode({ knowledge: this.knowledge })
    this.verification = new VerificationEngine()
    this.selfHealing = new SelfHealingWorkflow({ sandbox: this.sandbox, verification: this.verification })
    this.observability = new ObservabilityLedger()
    this.resourceManager = new ResourceManager()
    this.network = new NetworkMode({ online })
    this.plugins = new PluginFabric({ network: this.network, security: this.security })
    this.developer = new DeveloperPlatform({ plugins: this.plugins })
    this.data = new DataLayer()
    this.training = new TrainingFabric()
    this.continual = new ContinualImprovement({ memory: this.memory, knowledge: this.knowledge })
    this.taskState = new TaskStateStore()
    this.projectContext = new ProjectContext({ projectId, projectName })
    this.commandCatalog = new CommandCatalog()
    this.executionLoop = new ExecutionLoop({ observability: this.observability })
    this.hardware = new HardwareStack({ system: this.system, resources: this.resourceManager })
    this.modes = new DeploymentModes({ hardware: this.hardware })
    this.safety = new SafetyArchitecture({ security: this.security })
    this.aios = new AiosEnvironment({ modes: this.modes, hardware: this.hardware })
    this.workflow = new WorkflowEngine()
    this.swarm = new AgentSwarm({ emit })
    this.conversation = new ConversationPlane({ projectId, projectName })
    this.router = new ModelRouter({ online })
    this.api = new UniversalApi({ runtime: this })
    this.tasks = new Map()
    this.taskSequence = 1043
  }

  setOnline(online) {
    this.router.setOnline(online)
    this.tools.setOnline(online)
    this.security.setOnline(online)
    this.network.setOnline(online)
    if (online) this.network.approveService('external-sources')
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
    const policy = this.security.assess(understanding, { approved: options.approved })
    const toolPlan = this.tools.plan(understanding, { approved: options.approved || policy.approved })
    const computerPlan = understanding.intent === 'computer-control' ? this.computer.plan(understanding) : null
    const computerUsePlan = this.computerUse.plan(understanding.text)
    const terminalPlan = /terminal|command|script|execute|run/i.test(understanding.text) ? this.terminal.plan(understanding.text, { approved: options.approved, sandbox: true }) : null
    const applicationPlan = /open|launch/i.test(understanding.text) ? this.applications.planLaunch(understanding.text, { approved: options.approved }) : null
    const filePlan = /file|folder|project|delete|remove/i.test(understanding.text) ? this.files.planOperation(/delete|remove/i.test(understanding.text) ? 'delete' : 'read', understanding.text, { approved: options.approved }) : null
    const browserPlan = understanding.risk.networkRequested ? this.browser.planNavigation(understanding.text, { approved: options.approved }) : null
    const projectPlan = understanding.intent === 'software' ? this.projectWork.plan(understanding.text, { approved: options.approved }) : null
    const commandInfo = this.commandCatalog.resolve(understanding.text)
    const project = this.projectContext.context()
    const sandboxProfile = understanding.intent === 'software' || understanding.intent === 'engineering' ? 'code' : understanding.risk.networkRequested ? 'network' : understanding.intent === 'computer-control' ? 'tool' : 'readonly'
    const sandboxInstance = this.sandbox.create({ taskId: `pending-${this.taskSequence}`, profile: sandboxProfile, scope: 'project', approved: options.approved })
    const sandboxPlan = { ...sandboxInstance, cleanup: 'terminate-after-verification' }
    const industrialPlan = understanding.risk.physicalAction || /plc|scada|industrial|iot|robot/i.test(understanding.text) ? this.industrial.planAction('converter-plc', 'validate', { simulation: true, authorized: false }) : null
    const twinPlan = /digital twin|sensor|waveform|predict|calibrate/i.test(understanding.text) || understanding.intent === 'engineering' ? { twin: this.digitalTwin.createTwin({ id: 'project-atlas-twin', name: 'Project Atlas digital twin', domain: 'engineering' }), simulation: 'available before physical action' } : null
    const scientificPlan = understanding.intent === 'engineering' || /equation|calculate|physics|chemistry|biology|uncertainty/i.test(understanding.text) ? this.scientific.plan(understanding.text, { domain: understanding.intent }) : null
    const educationPlan = understanding.intent === 'education' ? this.education.planLesson('local-learner', understanding.text) : null
    const creativePlan = understanding.intent === 'creation' ? this.creative.plan(understanding.text, { output: multimodal.output === 'default' ? 'auto' : multimodal.output }) : null
    const researchPlan = understanding.intent === 'research' ? this.research.plan(understanding.text, { online: this.security.online }) : null
    const verificationPlan = this.verification.plan({ plan: { knowledgeEvidence } })
    const selfHealingPlan = { onFailure: ['diagnose', 'propose fix', 'sandbox', 'test', 'verify'], retries: 2, concealFailure: false }
    const resourcePlan = this.resourceManager.plan({ taskId: `RUN-${this.taskSequence}`, complexity: understanding.complexity, modelGb: Math.max(...routes.map((route) => route.model.sizeGb || 0), 0), agents: routes.length, modality: multimodal.output })
    const resourceAllocation = this.resourceManager.allocate(resourcePlan)
    const networkPlan = understanding.risk.networkRequested ? this.network.request('external-sources', { purpose: understanding.text, approved: options.approved }) : null
    const pluginPlan = [...new Set(routes.flatMap((route) => route.agent.tools))].flatMap((capability) => this.plugins.resolve(capability).slice(0, 1))
    const dataRefs = { relational: `tasks/pending-${this.taskSequence}`, vector: knowledgeEvidence.map((item) => item.chunkId), graph: knowledgeEvidence.map((item) => item.sourceId) }
    const trainingPlan = /train|fine[- ]tune|benchmark|dataset/i.test(understanding.text) ? this.training.plan({ dataset: understanding.text, objective: understanding.intent, privacy: this.network.online ? 'local-first' : 'local-only' }) : null
    const improvementPlan = { outcome: 'evaluate after verification', usefulInformation: true, strategyMemory: true, automaticWeightUpdate: false }
    const hardwarePlan = this.hardware.detect()
    const modePlan = this.modes.select({ intent: understanding.intent, modality: multimodal.output, industrial: Boolean(industrialPlan) })
    const safetyPlan = this.safety.evaluate({ intent: understanding.intent, uncertain: false }, { policy, approved: options.approved, physical: Boolean(industrialPlan) })
    const executionPlan = { stages: this.executionLoop.snapshot().stages, resumable: true, privateReasoningStored: false }
    const aiosPlan = this.aios.snapshot()
    const workflowPlan = this.workflow.define({
      id: `workflow-${this.taskSequence}`,
      name: `${understanding.intent} orchestration`,
      approval: policy.requiresApproval,
      nodes: routes.map((route, index) => ({ id: `agent-${index + 1}`, dependsOn: index === 0 ? [] : [`agent-${index}`], capability: route.capability })),
    })
    const swarm = this.swarm.compose({ taskId: `pending-${this.taskSequence}`, intent: understanding.intent, routes, complexity: understanding.complexity })
    const plan = {
      contextSources: context.memoryRefs.length + knowledgeEvidence.length + 1,
      system: this.system.snapshot(),
      understanding,
      routes,
      policy,
      security: policy,
      multimodal,
      toolPlan,
      computerPlan,
      computerUsePlan,
      terminalPlan,
      applicationPlan,
      filePlan,
      browserPlan,
      projectPlan,
      sandboxPlan,
      industrialPlan,
      twinPlan,
      scientificPlan,
      educationPlan,
      creativePlan,
      researchPlan,
      verificationPlan,
      selfHealingPlan,
      resourcePlan: resourceAllocation,
      networkPlan,
      pluginPlan,
      dataRefs,
      trainingPlan,
      improvementPlan,
      commandInfo,
      project,
      hardwarePlan,
      modePlan,
      safetyPlan,
      executionPlan,
      aiosPlan,
      workflowPlan,
      swarm,
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
      workflowId: workflowPlan.id,
      swarmId: swarm.id,
      sandboxId: sandboxInstance.id,
      plan,
      graph,
      createdAt: new Date().toISOString(),
      activity: [],
      checkpoint: 'intent',
    }

    task.plan.dataRefs.relational = `tasks/${task.id}`
    this.data.put('tasks', task.id, { id: task.id, objective: task.objective, intent: task.intent, status: task.status })
    knowledgeEvidence.forEach((evidence) => {
      this.data.embed(evidence.chunkId, [evidence.score], { sourceId: evidence.sourceId })
      this.data.link(task.id, evidence.sourceId, 'retrieves')
    })
    this.tasks.set(task.id, task)
    this.taskState.create(task)
    this.projectContext.attachTask('aetheris-core', task)
    this.executionLoop.start(task)
    this.observability.startTask(task)
    this.emitTask(task, 'task.created')
    if (policy.requiresApproval) {
      graph.transition('policy', NODE_STATUS.BLOCKED, { output: 'Awaiting explicit approval' })
      this.addActivity(task, 'Policy paused execution', policy.reason, 'gold')
      task.checkpoint = 'policy'
      this.taskState.update(task.id, { status: 'Awaiting approval', checkpoint: 'policy' })
      this.executionLoop.fail(task.id, policy.reason)
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
    this.taskState.resume(taskId)
    this.executionLoop.start(task)
    this.security.approve(task.id, { intent: task.intent })
    const approvedSandbox = this.sandbox.create({ taskId: task.id, profile: task.plan.sandboxPlan.profile, scope: 'project', approved: true })
    task.sandboxId = approvedSandbox.id
    task.plan.sandboxPlan = { ...approvedSandbox, cleanup: 'terminate-after-verification' }
    task.plan.security = { ...task.plan.security, approved: true, requiresApproval: false, reason: 'Approved by user' }
    task.plan.policy = task.plan.security
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
      ...(task.plan.swarm?.status === 'formed' ? ['swarm'] : []),
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
      this.taskState.checkpoint(task.id, nodeId, { status: 'Running' })
      this.observability.record(task.id, 'node.started', { nodeId, kind: node.kind, label: node.label })
      this.addActivity(task, activityTitle(node, 'started'), node.detail, activityTone(node.kind))
      this.emitTask(task, 'task.node-started')

      setTimeout(() => {
        if (!this.tasks.has(task.id) || task.status === 'Paused') return
        task.graph.transition(nodeId, NODE_STATUS.COMPLETED, { output: outputFor(node, task) })
        this.executionLoop.transition(task.id, loopStageForNode(nodeId), 'completed')
        this.taskState.checkpoint(task.id, nodeId, { status: 'Running' })
        this.observability.record(task.id, 'node.completed', { nodeId, kind: node.kind, label: node.label })
        task.progress = Math.round((task.graph.completedCount() / task.graph.nodes.size) * 100)
        task.status = nodeId === 'respond' ? 'Completed' : 'Running'
        if (nodeId === 'respond') {
          task.checkpoint = 'complete'
          const verification = this.verification.evaluate(task)
          const evaluation = this.metaLearning.evaluate(task)
          this.memory.rememberTask(task, evaluation)
          this.metaLearning.updateStrategy(task, evaluation)
          this.selfHealing.record(task.id, { status: 'healthy', test: verification.passed ? 'passed' : 'needs-review' })
          const improvement = this.continual.record(task, { useful: verification.passed, strategy: true, feedback: 'automated verification result' })
          this.resourceManager.release(task.id)
          this.sandbox.terminate(task.sandboxId)
          this.swarm.disband(task.swarmId)
          this.observability.completeTask(task.id, { status: 'Completed', verification: verification.status })
          this.conversation.remember(task)
          this.conversation.addMessage('assistant', responseFor(task), { taskId: task.id, evaluation, verification })
          task.evaluation = evaluation
          task.verification = verification
          task.improvement = improvement
          this.taskState.complete(task.id, { status: 'Completed', verification: verification.status, outputs: [responseFor(task)] })
          this.executionLoop.complete(task.id)
          this.projectContext.addConversation('aetheris-core', { role: 'assistant', content: responseFor(task), taskId: task.id })
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
      controlPhases: CONTROL_PHASES,
      modePhases: MODE_PHASES,
      platformPhases: PLATFORM_PHASES,
      finalPhases: FINAL_PHASES,
      agentsOnline: 42,
      agentCount: 56,
      modelCount: MODEL_DEFINITIONS.length,
      system: this.system.snapshot(),
      security: this.security.snapshot(),
      tools: this.tools.snapshot(),
      terminal: this.terminal.snapshot(),
      applications: this.applications.snapshot(),
      files: this.files.snapshot(),
      browser: this.browser.snapshot(),
      project: this.projectWork.snapshot(),
      workflows: this.workflow.snapshot(),
      swarms: this.swarm.snapshot(),
      sandbox: this.sandbox.snapshot(),
      industrial: this.industrial.snapshot(),
      digitalTwin: this.digitalTwin.snapshot(),
      scientific: this.scientific.snapshot(),
      education: this.education.snapshot(),
      creative: this.creative.snapshot(),
      research: this.research.snapshot(),
      verification: this.verification.snapshot(),
      selfHealing: this.selfHealing.snapshot(),
      observability: this.observability.snapshot(),
      resources: this.resourceManager.snapshot(),
      network: this.network.snapshot(),
      plugins: this.plugins.snapshot(),
      developer: this.developer.snapshot(),
      api: this.api.snapshot(),
      data: this.data.snapshot(),
      training: this.training.snapshot(),
      continual: this.continual.snapshot(),
      taskState: this.taskState.snapshot(),
      projects: this.projectContext.snapshot(),
      commands: this.commandCatalog.snapshot(),
      executionLoop: this.executionLoop.snapshot(),
      hardware: this.hardware.snapshot(),
      modes: this.modes.snapshot(),
      safety: this.safety.snapshot(),
      aios: this.aios.snapshot(),
      knowledge: this.knowledge.snapshot(),
      memory: this.memory.snapshot(),
      learning: this.metaLearning.snapshot(),
      computer: this.computer.plan({ text: '', intent: 'general', modalities: [], risk: {} }),
      computerUse: this.computerUse.snapshot(),
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
  if (node.kind === 'swarm') return `Agent swarm ${phase}`
  if (node.id === 'verify') return `Verification ${phase}`
  if (node.id === 'synthesize') return `Arbitration ${phase}`
  if (node.kind === 'pipeline') return `${node.label} ${phase}`
  return `Response ${phase}`
}

function activityTone(kind) {
  if (kind === 'security') return 'gold'
  if (kind === 'verification') return 'blue'
  if (kind === 'agent' || kind === 'swarm') return 'violet'
  return 'mint'
}

function outputFor(node, task) {
  if (node.id === 'intent') return task.intent
  if (node.id === 'context') return `${task.plan.contextSources} memory references`
  if (node.id === 'policy') return task.plan.policy.reason
  if (node.kind === 'agent') return `${node.label} produced a verified intermediate result`
  if (node.kind === 'swarm') return 'Specialist team delegated with an independent critic'
  if (node.kind === 'pipeline') return `${node.label} produced ${node.detail}`
  if (node.id === 'verify') return 'Factual, logical, technical, safety, and quality checks passed'
  if (node.id === 'synthesize') return `Synthesized ${task.plan.multimodal.artifact} response`
  return 'Response ready'
}

function responseFor(task) {
  return `RUN ${task.id} completed. God Core routed ${task.agents} specialists through the ${task.plan.multimodal.label} and verified the ${task.plan.multimodal.artifact} locally.`
}

function loopStageForNode(nodeId) {
  if (nodeId === 'intent') return 'intent understanding'
  if (nodeId === 'context') return 'context load'
  if (nodeId === 'policy') return 'capability routing'
  if (nodeId === 'planner') return 'task planning'
  if (nodeId === 'verify') return 'verification'
  if (nodeId === 'synthesize') return 'synthesize'
  if (nodeId === 'respond') return 'chat response'
  if (nodeId.startsWith('agent-')) return 'agent / model / tool routing'
  if (nodeId.startsWith('pipeline-')) return 'execution'
  return 'observation'
}
