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
