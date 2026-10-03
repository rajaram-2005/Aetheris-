import { AGENT_DEFINITIONS, MODEL_DEFINITIONS, findAgent } from './registry.js'

const CAPABILITY_ROUTES = {
  research: ['Research', 'Retrieval / RAG', 'Citation'],
  engineering: ['Electrical', 'Physics', 'Scientific Research', 'Verification'],
  software: ['Software Architecture', 'Programming', 'Testing', 'Debugging'],
  'computer-control': ['Computer Operation', 'File-System Operation', 'Terminal Operation'],
  education: ['Teaching', 'Tutoring', 'Communication'],
  creation: ['Image', 'Video', 'Audio', 'Media Editing'],
  document: ['Document Analysis', 'Writing', 'Presentation', 'Citation'],
  general: ['Reasoning', 'Planning', 'Verification'],
}

export class ModelRouter {
  constructor({ online = false, resources = {} } = {}) {
    this.online = online
    this.resources = { ramGb: 64, vramGb: 16, ...resources }
  }

  setOnline(online) {
    this.online = Boolean(online)
  }

  route(understanding, multimodalPlan) {
    const names = CAPABILITY_ROUTES[understanding.intent] || CAPABILITY_ROUTES.general
    const routes = names.map((name) => {
      const agent = findAgent(name) || AGENT_DEFINITIONS[0]
      const model = this.selectModel({ understanding, modality: multimodalPlan.output, agent })
      return { capability: agent.name, agent, model, reason: this.explainChoice(model, understanding) }
    })
    return routes.filter((route, index) => routes.findIndex((candidate) => candidate.agent.id === route.agent.id) === index)
  }

  selectModel({ understanding, modality }) {
    const candidates = MODEL_DEFINITIONS.filter((model) => model.local || this.online)
    const desired = modality === 'image' ? 'image'
      : modality === 'video' ? 'video'
        : modality === 'audio' ? 'audio'
          : modality === 'document' ? 'specialized'
            : understanding.complexity === 'low' ? 'slm' : 'llm'
    const match = candidates.find((model) => model.type === desired)
    return match || candidates.find((model) => model.type === 'slm') || candidates[0]
  }

  explainChoice(model, understanding) {
    const resourceFit = model.sizeGb < this.resources.vramGb + this.resources.ramGb / 4 ? 'resource fit' : 'memory-aware fallback'
    const privacy = model.local ? 'local policy' : 'approved remote'
    return `${resourceFit} · ${privacy} · ${understanding.complexity} complexity`
  }
}
