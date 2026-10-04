import { MODEL_DEFINITIONS } from './registry.js'

export class ModelKnowledgeFabric {
  constructor({ knowledge, memory, verification } = {}) {
    this.knowledge = knowledge
    this.memory = memory
    this.verification = verification
    this.catalog = new Map()
    this.artifacts = []
    this.consolidations = []
    this.seedRegistry()
  }

  seedRegistry() {
    MODEL_DEFINITIONS.forEach((model) => {
      this.catalog.set(model.id, { id: model.id, name: model.name, type: model.type, local: model.local, modalities: model.modalities, capabilities: model.capabilities, quantization: model.quantization, openSource: Boolean(model.openSource), license: model.license || null, provider: model.provider || null, role: model.role || null, provenance: 'model-registry' })
      this.memory?.rememberSemantic(`Model ${model.name} supports ${model.capabilities.join(', ')}`, { source: 'model-registry', modelId: model.id, provenance: 'registry metadata' })
    })
  }

  plan({ query = '', modelIds = [...this.catalog.keys()], offline = true } = {}) {
    const models = modelIds.map((id) => this.catalog.get(id)).filter(Boolean)
    return {
      query,
      modelIds: models.map((model) => model.id),
      modelCount: models.length,
      mode: offline ? 'offline consolidation' : 'approved federated consolidation',
      stages: ['collect approved outputs', 'normalize claims', 'deduplicate', 'cross-check', 'attribute provenance', 'write memory', 'verify'],
      weightsChanged: false,
      sourcePolicy: 'model outputs become evidence; no automatic weight merge',
    }
  }

  ingestOutput({ modelId, prompt, content, citations = [], confidence = null, verified = false } = {}) {
    const model = this.catalog.get(modelId)
    if (!model || !content) return { status: 'rejected', reason: 'model and content are required' }
    const artifact = { id: `model-artifact-${this.artifacts.length + 1}`, modelId, model: model.name, prompt, content: String(content), citations, confidence, verified, createdAt: new Date().toISOString() }
    this.artifacts.unshift(artifact)
    return { status: verified ? 'accepted' : 'pending-verification', artifact }
  }

  consolidate({ task, outputs = [], verified = false } = {}) {
    const normalized = outputs.length ? outputs : task?.plan?.routes?.map((route) => ({ modelId: route.model.id, content: `${route.agent.name} completed a verified intermediate result for ${task.objective}`, confidence: verified ? 1 : null })) || []
    const accepted = []
    const seen = new Set()
    normalized.forEach((output) => {
      const result = this.ingestOutput({ ...output, prompt: task?.objective, verified })
      if (result.status === 'rejected') return
      const key = result.artifact.content.toLowerCase().replace(/\s+/g, ' ').trim()
      if (seen.has(key)) return
      seen.add(key)
      accepted.push(result.artifact)
      if (verified) {
        this.knowledge?.ingest({ id: `model-knowledge-${result.artifact.id}`, title: `${result.artifact.model} evidence`, type: 'model-output', text: result.artifact.content })
        this.memory?.rememberSemantic(result.artifact.content, { source: 'model-consolidation', modelId: result.artifact.modelId, taskId: task?.id, provenance: 'verified model output' })
      }
    })
    const record = { id: `consolidation-${this.consolidations.length + 1}`, taskId: task?.id || null, models: [...new Set(accepted.map((artifact) => artifact.modelId))], accepted: accepted.length, verified, weightsChanged: false, mode: 'offline memory update', createdAt: new Date().toISOString() }
    this.consolidations.unshift(record)
    return record
  }

  snapshot() {
    return { catalogModels: this.catalog.size, artifacts: this.artifacts.length, consolidations: this.consolidations.length, verifiedArtifacts: this.artifacts.filter((artifact) => artifact.verified).length, weightsChanged: false, mode: 'evidence + memory, not weight merge' }
  }
}
