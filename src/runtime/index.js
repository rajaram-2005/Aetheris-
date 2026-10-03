import { GodCore } from './godCore.js'

export function createAetherisRuntime(options = {}) {
  const listeners = new Set()
  const godCore = new GodCore({ ...options, emit: (event) => listeners.forEach((listener) => listener(event)) })

  return {
    submit(request, context = {}) {
      return godCore.submit(request, context)
    },
    approve(taskId) {
      return godCore.approve(taskId)
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
