const DEFAULT_SOURCES = [
  { id: 'aetheris-architecture', title: 'Aetheris Architecture — master brief', type: 'pdf', text: 'Aetheris is a local-first conversational operating environment. God Core routes intent, context, policy, agents, models, tools, memory, creation, computer control, and verification.' },
  { id: 'converter-notes', title: 'EV converter simulation notes', type: 'markdown', text: 'The converter model assumes a 400 volt bus, a 20 kilohertz switching frequency, and a bounded thermal envelope. Validate waveform ripple and uncertainty before reporting.' },
  { id: 'project-atlas', title: 'Project Atlas repository', type: 'git', text: 'Project Atlas contains the orchestration runtime, local model adapters, workflow definitions, and verification fixtures. Changes must be tested in a sandbox.' },
  { id: 'lab-sensors', title: 'Lab sensor readings / Q3', type: 'csv', text: 'Telemetry is read-only by default. Measurements are timestamped, attributed to a device, and retained for digital twin calibration.' },
]

export class KnowledgeFabric {
  constructor({ sources = DEFAULT_SOURCES } = {}) {
    this.sources = new Map()
    this.vectorIndex = new Map()
    this.graph = { entities: new Map(), relations: [] }
    this.ingestionLog = []
    sources.forEach((source) => this.ingest(source, { seed: true }))
  }

  ingest(source, { seed = false } = {}) {
    const normalized = {
      id: source.id || `source-${this.sources.size + 1}`,
      title: source.title || 'Untitled source',
      type: source.type || inferType(source.name || source.title),
      text: String(source.text || source.content || ''),
      status: 'indexed',
      indexedAt: new Date().toISOString(),
      chunkCount: 0,
      seed,
    }
    normalized.chunks = chunk(normalized.text).map((text, index) => ({
      id: `${normalized.id}-chunk-${index + 1}`,
      sourceId: normalized.id,
      text,
      terms: tokenize(text),
    }))
    normalized.chunkCount = normalized.chunks.length
    this.sources.set(normalized.id, normalized)
    normalized.chunks.forEach((item) => this.vectorIndex.set(item.id, item))
    this.updateGraph(normalized)
    this.ingestionLog.unshift({ sourceId: normalized.id, stage: 'indexed', time: normalized.indexedAt })
    this.ingestionLog = this.ingestionLog.slice(0, 30)
    return this.publicSource(normalized)
  }

  search(query, { limit = 5 } = {}) {
    const queryTerms = tokenize(query)
    if (!queryTerms.length) return []
    return [...this.vectorIndex.values()]
      .map((item) => ({ ...item, score: score(queryTerms, item.terms) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => ({
        chunkId: item.id,
        sourceId: item.sourceId,
        source: this.sources.get(item.sourceId)?.title,
        evidence: item.text,
        score: Number(item.score.toFixed(3)),
      }))
  }

  related(sourceId) {
    return this.graph.relations.filter((relation) => relation.from === sourceId || relation.to === sourceId)
  }

  snapshot() {
    return {
      sourceCount: this.sources.size,
      chunkCount: this.vectorIndex.size,
      entityCount: this.graph.entities.size,
      relationCount: this.graph.relations.length,
      lastIngestion: this.ingestionLog[0] || null,
      sources: [...this.sources.values()].map((source) => this.publicSource(source)),
    }
  }

  publicSource(source) {
    return {
      id: source.id,
      title: source.title,
      type: source.type,
      status: source.status,
      indexedAt: source.indexedAt,
      chunkCount: source.chunkCount,
    }
  }

  updateGraph(source) {
    const sourceTerms = tokenize(source.title)
    sourceTerms.forEach((term) => {
      if (!this.graph.entities.has(term)) this.graph.entities.set(term, { id: term, label: term, sources: [] })
      const entity = this.graph.entities.get(term)
      if (!entity.sources.includes(source.id)) entity.sources.push(source.id)
    })
    sourceTerms.slice(0, -1).forEach((term, index) => {
      const next = sourceTerms[index + 1]
      this.graph.relations.push({ from: source.id, to: `${term}:${next}`, type: 'mentions' })
    })
  }
}

function chunk(text, size = 48) {
  const words = String(text).trim().split(/\s+/).filter(Boolean)
  if (!words.length) return ['']
  const chunks = []
  for (let index = 0; index < words.length; index += size) chunks.push(words.slice(index, index + size).join(' '))
  return chunks
}

function tokenize(value) {
  return String(value || '').toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2)
}

function score(queryTerms, itemTerms) {
  const unique = new Set(itemTerms)
  return queryTerms.reduce((total, term) => total + (unique.has(term) ? 1 : 0), 0) / Math.max(queryTerms.length, 1)
}

function inferType(name = '') {
  const lower = name.toLowerCase()
  if (lower.includes('pdf')) return 'pdf'
  if (lower.includes('git') || lower.includes('repo')) return 'git'
  if (lower.includes('csv')) return 'csv'
  return 'text'
}
