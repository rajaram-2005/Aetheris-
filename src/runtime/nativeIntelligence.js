export const NATIVE_INTELLIGENCE = [
  native('aether-code', 'Aether-Code', 'Native software engineering system', 'coding', [21, 40], ['repository discovery', 'architecture reconstruction', 'code generation', 'test and repair']),
  native('aether-research', 'Aether-Research', 'Native research and evidence system', 'research', [51, 60], ['source ranking', 'evidence extraction', 'contradiction detection', 'citation construction']),
  native('aether-vision', 'Aether-Vision', 'Native visual reasoning system', 'vision', [111, 115], ['image understanding', 'video understanding', 'cross-modal reasoning']),
  native('aether-image', 'Aether-Image', 'Native image creation pipeline', 'image', [71, 80], ['composition', 'conditioning', 'generation', 'vision QA']),
  native('aether-video', 'Aether-Video', 'Native video creation pipeline', 'video', [81, 90], ['script', 'storyboard', 'scene planning', 'continuity', 'video QA']),
  native('aether-audio', 'Aether-Audio', 'Native speech, music, and audio system', 'audio', [91, 100], ['speech recognition', 'voice generation', 'mixing', 'mastering']),
  native('aether-science', 'Aether-Science', 'Native scientific reasoning system', 'science', [101, 110], ['mathematical models', 'numerical computation', 'simulation', 'uncertainty']),
  native('aether-engineering', 'Aether-Engineering', 'Native engineering and simulation system', 'engineering', [101, 110], ['technical problem definition', 'parameter extraction', 'result verification', 'engineering reports']),
  native('aether-computer', 'Aether-Computer', 'Native operating-system and application control', 'computer', [41, 50], ['OS detection', 'GUI perception', 'controlled interaction', 'recovery']),
  native('aether-terminal', 'Aether-Terminal', 'Native cross-platform command execution', 'terminal', [41, 50], ['environment detection', 'command planning', 'sandboxed execution', 'state verification']),
  native('aether-knowledge', 'Aether-Knowledge', 'Native RAG, graph, and memory system', 'knowledge', [61, 70], ['ingestion', 'OCR', 'embedding', 'graph construction', 'semantic retrieval']),
  native('aether-3d', 'Aether-3D', 'Native geometry, animation, and rendering system', '3d', [111, 120], ['3D planning', 'asset generation', 'materials', 'render delivery']),
  native('aether-device', 'Aether-Device', 'Native IoT and robotics system', 'device', [121, 130], ['telemetry', 'permission gates', 'simulation before action', 'execution verification']),
  native('aether-industrial', 'Aether-Industrial', 'Native PLC, SCADA, and OT safety system', 'industrial', [101, 130], ['digital twin', 'industrial policy', 'authorized gateway', 'recovery']),
  native('aether-meta', 'Aether-Meta', 'Native strategy and meta-learning system', 'meta', [131, 140], ['agent evaluation', 'model evaluation', 'tool evaluation', 'future-task adaptation']),
]

export class NativeIntelligenceFabric {
  constructor({ emit = () => {} } = {}) {
    this.emit = emit
    this.plans = []
  }

  discover({ query = '', domain } = {}) {
    const value = String(query).toLowerCase()
    return NATIVE_INTELLIGENCE.filter((module) => (!domain || module.domain === domain) && (!value || `${module.id} ${module.name} ${module.description} ${module.responsibilities.join(' ')}`.toLowerCase().includes(value)))
  }

  plan({ intent = 'general', text = '', output = 'text' } = {}) {
    const modules = this.select({ intent, text, output })
    const plan = {
      id: `native-plan-${this.plans.length + 1}`,
      intent,
      output,
      modules,
      firstParty: 'orchestration, workflows, memory, verification, tool interfaces, and safety belong to Aetheris',
      externalModels: 'pluggable beneath native contracts',
      privateReasoningStored: false,
      createdAt: new Date().toISOString(),
    }
    this.plans.unshift(plan)
    this.emit({ type: 'native-intelligence.planned', plan })
    return plan
  }

  select({ intent = 'general', text = '', output = 'text' } = {}) {
    const value = String(text).toLowerCase()
    const domains = new Set(['meta', 'knowledge'])
    if (intent === 'software' || /code|coding|repository|bug|implement|debug|test/i.test(value)) domains.add('coding')
    if (intent === 'research' || /research|source|evidence|citation/i.test(value)) domains.add('research')
    if (intent === 'computer-control' || /computer|desktop|browser|application|terminal|filesystem/i.test(value)) { domains.add('computer'); domains.add('terminal') }
    if (intent === 'creation') {
      if (output === 'image' || /image|visual|diagram/i.test(value)) domains.add('image')
      if (output === 'video' || /video|storyboard|scene/i.test(value)) domains.add('video')
      if (output === 'audio' || /audio|voice|music/i.test(value)) domains.add('audio')
      if (output === '3d' || /3d|geometry|render/i.test(value)) domains.add('3d')
      domains.add('vision')
    }
    if (intent === 'engineering' || /engineering|equation|simulation|physics|electrical|control/i.test(value)) { domains.add('science'); domains.add('engineering') }
    if (/device|iot|robot|sensor/i.test(value)) domains.add('device')
    if (/plc|scada|industrial|factory/i.test(value)) domains.add('industrial')
    return NATIVE_INTELLIGENCE.filter((module) => domains.has(module.domain)).map((module) => ({ ...module, phaseRange: `${module.phases[0]}–${module.phases[1]}`, status: 'native-contract' }))
  }

  snapshot() {
    return { moduleCount: NATIVE_INTELLIGENCE.length, plans: this.plans.length, modules: NATIVE_INTELLIGENCE, principle: 'native Aetheris contracts with pluggable open models' }
  }
}

function native(id, name, description, domain, phases, responsibilities) {
  return { id, name, description, domain, phases, responsibilities, status: 'native-contract', modelPolicy: 'external/open models remain pluggable underneath' }
}
