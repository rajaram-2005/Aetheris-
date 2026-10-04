import { MODEL_DEFINITIONS } from './registry.js'

export const OPEN_SOURCE_KNOWLEDGE_MODEL = MODEL_DEFINITIONS.find((model) => model.id === 'mistral-7b-instruct-v0.3')
export const OPEN_SOURCE_EMBEDDING_MODEL = MODEL_DEFINITIONS.find((model) => model.id === 'bge-m3-embeddings')

export class OpenSourceKnowledgeModel {
  constructor({ knowledge, memory, network, emit = () => {} } = {}) {
    this.knowledge = knowledge
    this.memory = memory
    this.network = network
    this.emit = emit
    this.provider = 'llama.cpp'
    this.quantization = OPEN_SOURCE_KNOWLEDGE_MODEL?.quantization || 'Q4_K_M'
    this.modelPath = null
    this.weightsAvailable = false
    this.configured = false
    this.plans = []
    this.syntheses = []
  }

  configure({ provider = 'llama.cpp', modelPath = null, quantization = this.quantization, weightsAvailable = false } = {}) {
    this.provider = provider
    this.modelPath = modelPath
    this.quantization = quantization
    this.weightsAvailable = Boolean(weightsAvailable || modelPath)
    this.configured = true
    const result = this.snapshot()
    this.emit({ type: 'knowledge-model.configured', model: result })
    return { status: this.weightsAvailable ? 'ready' : 'adapter-ready', model: result, networkUsed: false, note: this.weightsAvailable ? 'Local weights are configured; inference is provider-backed.' : 'No weights were downloaded or bundled. Connect a local Mistral runtime to run inference.' }
  }

  prepare({ provider = this.provider, quantization = this.quantization } = {}) {
    return this.configure({ provider, quantization, weightsAvailable: false })
  }

  plan({ query = '', limit = 6, mode = 'rag' } = {}) {
    const evidence = this.knowledge?.search(query, { limit }) || []
    const plan = {
      id: `knowledge-plan-${this.plans.length + 1}`,
      query,
      mode,
      model: this.modelMetadata(),
      embeddingModel: this.embeddingMetadata(),
      evidence,
      stages: ['local retrieval', 'evidence ranking', 'citation binding', 'open-source synthesis', 'verification', 'memory write'],
      localOnly: !this.network?.online,
      networkUsed: false,
      weightsAvailable: this.weightsAvailable,
      status: this.weightsAvailable ? 'ready' : 'adapter-ready',
      createdAt: new Date().toISOString(),
    }
    this.plans.unshift(plan)
    this.emit({ type: 'knowledge-model.plan-created', plan })
    return plan
  }

  synthesize({ query = '', evidence = null, citations = [], verified = false } = {}) {
    const selected = evidence || this.knowledge?.search(query, { limit: 6 }) || []
    const result = {
      id: `knowledge-synthesis-${this.syntheses.length + 1}`,
      query,
      model: this.modelMetadata(),
      evidence: selected,
      citations: citations.length ? citations : selected.map((item) => ({ sourceId: item.sourceId, chunkId: item.chunkId, title: item.source })),
      verified,
      status: this.weightsAvailable ? 'inference-ready' : 'adapter-ready',
      output: this.weightsAvailable ? null : 'Connect local Mistral 7B weights through the configured provider to generate a synthesis.',
      privateReasoningStored: false,
      networkUsed: false,
      createdAt: new Date().toISOString(),
    }
    this.syntheses.unshift(result)
    if (verified && selected.length) this.memory?.rememberSemantic(`Knowledge synthesis request: ${query}`, { source: 'open-source-knowledge-model', modelId: OPEN_SOURCE_KNOWLEDGE_MODEL?.id, provenance: 'retrieved local evidence', citations: result.citations })
    this.emit({ type: 'knowledge-model.synthesis-created', synthesis: result })
    return result
  }

  modelMetadata() {
    return { ...OPEN_SOURCE_KNOWLEDGE_MODEL, configured: this.configured, weightsAvailable: this.weightsAvailable, provider: this.provider, modelPath: this.modelPath }
  }

  embeddingMetadata() {
    return { ...OPEN_SOURCE_EMBEDDING_MODEL, configured: this.configured, weightsAvailable: false }
  }

  snapshot() {
    return {
      model: this.modelMetadata(),
      embeddingModel: this.embeddingMetadata(),
      provider: this.provider,
      configured: this.configured,
      weightsAvailable: this.weightsAvailable,
      plans: this.plans.length,
      syntheses: this.syntheses.length,
      localOnly: !this.network?.online,
      networkUsed: false,
      status: this.weightsAvailable ? 'ready' : 'adapter-ready',
      weightsChanged: false,
    }
  }
}
