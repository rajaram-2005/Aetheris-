import { GodCore } from './godCore.js'
import { CodingAgentClient } from './codingAgent.js'

export function createAetherisRuntime(options = {}) {
  const listeners = new Set()
  const godCore = new GodCore({ ...options, emit: (event) => listeners.forEach((listener) => listener(event)) })
  const codingAgent = new CodingAgentClient({ basePath: options.codingAgentBasePath || '/api/agent' })

  return {
    submit(request, context = {}) {
      return godCore.submit(request, context)
    },
    approve(taskId) {
      return godCore.approve(taskId)
    },
    pauseTask(taskId, reason) {
      return godCore.pause(taskId, reason)
    },
    resumeTask(taskId) {
      return godCore.resume(taskId)
    },
    cancelTask(taskId, reason) {
      return godCore.cancel(taskId, reason)
    },
    getTask(taskId) {
      return godCore.getTask(taskId)
    },
    setOnline(online) {
      godCore.setOnline(online)
    },
    request(path, options = {}) {
      return godCore.api.request(path, options)
    },
    apiSpec() {
      return godCore.api.openApi()
    },
    health() {
      return godCore.health()
    },
    ingestKnowledge(source) {
      return godCore.knowledge.ingest(source)
    },
    searchKnowledge(query, options = {}) {
      return godCore.knowledge.search(query, options)
    },
    registerPlugin(plugin) {
      return godCore.plugins.register(plugin)
    },
    discoverPlugins(options = {}) {
      return godCore.plugins.discover(options)
    },
    installPlugin(pluginId, options = {}) {
      return godCore.plugins.install(pluginId, options)
    },
    enablePlugin(pluginId) {
      return godCore.plugins.enable(pluginId)
    },
    disablePlugin(pluginId) {
      return godCore.plugins.disable(pluginId)
    },
    uninstallPlugin(pluginId) {
      return godCore.plugins.uninstall(pluginId)
    },
    invokePlugin(pluginId, capability, input = {}, options = {}) {
      return godCore.plugins.invoke(pluginId, capability, input, options)
    },
    defineCapability(manifest) {
      return godCore.developer.define(manifest)
    },
    publishCapability(id) {
      return godCore.developer.publish(id)
    },
    importModelKnowledge(payload) {
      const result = godCore.modelKnowledge.ingestOutput(payload)
      if (result.status === 'accepted') {
        const update = godCore.offlineMemory.enqueue({ type: 'semantic', source: 'model-import', payload: { modelId: payload.modelId, prompt: payload.prompt, content: payload.content, provenance: 'verified model output' } })
        result.offlineMemory = { update, flush: godCore.offlineMemory.flush({ localOnly: true }) }
      }
      return result
    },
    consolidateModelKnowledge(options = {}) {
      const result = godCore.modelKnowledge.consolidate(options)
      if (result.verified) result.offlineMemory = godCore.offlineMemory.flush({ localOnly: true })
      return result
    },
    flushOfflineMemory(options = { localOnly: true }) {
      return godCore.offlineMemory.flush(options)
    },
    memoryStatus() {
      return godCore.offlineMemory.status()
    },
    planKnowledgeModel(options = {}) {
      return godCore.openSourceKnowledge.plan(options)
    },
    prepareKnowledgeModel(options = {}) {
      return godCore.openSourceKnowledge.prepare(options)
    },
    synthesizeKnowledge(options = {}) {
      return godCore.openSourceKnowledge.synthesize(options)
    },
    knowledgeModelSnapshot() {
      return godCore.openSourceKnowledge.snapshot()
    },
    planNativeIntelligence(options = {}) {
      return godCore.nativeIntelligence.plan(options)
    },
    discoverNativeIntelligence(options = {}) {
      return godCore.nativeIntelligence.discover(options)
    },
    planPhases(options = {}) {
      return godCore.phaseEngine.plan(options)
    },
    observePhaseRun(taskId) {
      return godCore.phaseEngine.observe(taskId)
    },
    advancePhase(taskId) {
      return godCore.phaseEngine.step(taskId)
    },
    planOfflineMedia(payload) {
      return godCore.offlineMedia.plan(payload)
    },
    renderOfflineMedia(plan) {
      return godCore.offlineMedia.render(plan)
    },
    discoverMcp(options = {}) {
      return godCore.mcp.discover(options)
    },
    callMcp(name, args = {}, context = {}) {
      return godCore.mcp.call(name, args, context)
    },
    codingAgentHealth() {
      return codingAgent.health()
    },
    runCodingAgent(prompt, options = {}) {
      return codingAgent.run(prompt, options)
    },
    getTrace(taskId) {
      return godCore.observability.get(taskId)
    },
    recoverTask(taskId) {
      return godCore.taskState.recover(taskId)
    },
    snapshot() {
      return godCore.snapshot()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export * from './registry.js'
export * from './taskGraph.js'
export * from './multimodal.js'
export * from './knowledgeFabric.js'
export * from './memoryFabric.js'
export * from './metaLearning.js'
export * from './toolFabric.js'
export * from './computerControl.js'
export * from './systemAbstraction.js'
export * from './securityPolicy.js'
export * from './terminal.js'
export * from './applicationControl.js'
export * from './fileControl.js'
export * from './browserControl.js'
export * from './projectWork.js'
export * from './workflowEngine.js'
export * from './agentSwarm.js'
export * from './computerUseLoop.js'
export * from './sandbox.js'
export * from './industrialGateway.js'
export * from './digitalTwin.js'
export * from './scientificMode.js'
export * from './educationMode.js'
export * from './creativeStudio.js'
export * from './researchMode.js'
export * from './verificationEngine.js'
export * from './selfHealing.js'
export * from './observability.js'
export * from './resourceManager.js'
export * from './networkMode.js'
export * from './pluginFabric.js'
export * from './developerPlatform.js'
export * from './universalApi.js'
export * from './dataLayer.js'
export * from './trainingFabric.js'
export * from './continualImprovement.js'
export * from './taskState.js'
export * from './projectContext.js'
export * from './commandCatalog.js'
export * from './executionLoop.js'
export * from './hardwareStack.js'
export * from './deploymentModes.js'
export * from './safetyArchitecture.js'
export * from './aiosEnvironment.js'
export * from './modelKnowledgeFabric.js'
export * from './offlineMemory.js'
export * from './offlineMedia.js'
export * from './mcpFabric.js'
export * from './openSourceKnowledge.js'
export * from './codingAgent.js'
export * from './phaseEngine.js'
export * from './nativeIntelligence.js'
