const NETWORK_TERMS = ['browse', 'web', 'internet', 'online', 'search the web', 'external source', 'api']
const DESTRUCTIVE_TERMS = ['delete', 'remove', 'overwrite', 'drop ', 'shutdown', 'format ', 'kill ', 'sudo', 'root access', 'publish', 'send '] 
const PHYSICAL_TERMS = ['robot', 'plc', 'scada', 'actuator', 'motor', 'industrial', 'device control', 'turn on', 'turn off']

export class ConversationPlane {
  constructor({ projectId = 'aetheris-core', projectName = 'Aetheris / Core' } = {}) {
    this.project = { id: projectId, name: projectName }
    this.messages = []
    this.workingMemory = new Map()
    this.episodicMemory = []
  }

  addMessage(role, content, metadata = {}) {
    const message = { id: `msg-${this.messages.length + 1}`, role, content, createdAt: new Date().toISOString(), metadata }
    this.messages.push(message)
    if (this.messages.length > 80) this.messages.shift()
    return message
  }

  loadContext(extra = {}) {
    return {
      project: this.project,
      recentMessages: this.messages.slice(-8),
      workingMemory: Object.fromEntries(this.workingMemory.entries()),
      memoryRefs: ['project.settings', 'conversation.recent', 'knowledge.local-index'],
      availableCapabilities: 56,
      ...extra,
    }
  }

  understand(input) {
    const text = String(input || '').trim()
    const lower = text.toLowerCase()
    const modalities = detectModalities(lower)
    const intent = classifyIntent(lower, modalities)
    const entities = extractEntities(text)
    const risk = {
      requiresApproval: DESTRUCTIVE_TERMS.some((term) => lower.includes(term)) || PHYSICAL_TERMS.some((term) => lower.includes(term)),
      networkRequested: NETWORK_TERMS.some((term) => lower.includes(term)),
      physicalAction: PHYSICAL_TERMS.some((term) => lower.includes(term)),
      destructive: DESTRUCTIVE_TERMS.some((term) => lower.includes(term)),
    }

    const understanding = {
      text,
      intent,
      modalities,
      entities,
      risk,
      complexity: estimateComplexity(text, intent),
      confidence: intent === 'general' ? 0.63 : 0.91,
    }
    this.addMessage('user', text, { understanding })
    this.workingMemory.set('lastIntent', understanding)
    return understanding
  }

  remember(task) {
    const memoryEvent = { taskId: task.id, objective: task.objective, intent: task.intent, completedAt: new Date().toISOString() }
    this.episodicMemory.unshift(memoryEvent)
    this.episodicMemory = this.episodicMemory.slice(0, 50)
    this.workingMemory.set('lastTask', task.id)
    return memoryEvent
  }
}

function detectModalities(text) {
  const modalities = ['text']
  if (/(image|picture|photo|diagram|illustration|visual)/.test(text)) modalities.push('image')
  if (/(video|documentary|animation|storyboard)/.test(text)) modalities.push('video')
  if (/(audio|voice|speech|music|sound)/.test(text)) modalities.push('audio')
  if (/(screen|screenshot|camera|look at)/.test(text)) modalities.push('screen')
  if (/(pdf|docx|pptx|spreadsheet|document|report|presentation)/.test(text)) modalities.push('document')
  if (/(3d|three-dimensional|model an object)/.test(text)) modalities.push('3d')
  return [...new Set(modalities)]
}

function classifyIntent(text, modalities) {
  if (/(research|compare evidence|sources|paper|literature|fact check)/.test(text)) return 'research'
  if (/(simulate|simulation|waveform|converter|circuit|engineering|digital twin)/.test(text)) return 'engineering'
  if (/(code|program|repository|repo|debug|test|build|implement|fix the problem)/.test(text)) return 'software'
  if (/(open|find|launch|run it|terminal|browser|file|folder|application|project)/.test(text)) return 'computer-control'
  if (/(teach|learn|explain|tutor|lesson|curriculum)/.test(text)) return 'education'
  if (modalities.some((modality) => ['image', 'video', 'audio', '3d'].includes(modality))) return 'creation'
  if (/(report|presentation|slides|spreadsheet|pdf|document|speech)/.test(text)) return 'document'
  return 'general'
}

function estimateComplexity(text, intent) {
  const lengthScore = text.length > 140 ? 2 : text.length > 60 ? 1 : 0
  const intentScore = ['engineering', 'software', 'creation', 'research'].includes(intent) ? 1 : 0
  const conjunctionScore = (text.match(/\b(and|then|after|with|plus)\b/gi) || []).length > 1 ? 1 : 0
  const score = lengthScore + intentScore + conjunctionScore
  return score >= 3 ? 'high' : score >= 1 ? 'medium' : 'low'
}

function extractEntities(text) {
  return {
    quoted: [...text.matchAll(/"([^\"]+)"|'([^']+)'/g)].map((match) => match[1] || match[2]),
    fileTypes: [...text.matchAll(/\b(pdf|docx|pptx|xlsx|csv|md|json|png|jpg|mp4)\b/gi)].map((match) => match[1].toLowerCase()),
  }
}
