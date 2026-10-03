export class ResearchMode {
  constructor({ knowledge } = {}) {
    this.knowledge = knowledge
    this.runs = []
  }

  plan(question, { online = false, sources = [] } = {}) {
    const localEvidence = this.knowledge?.search(question, { limit: 8 }) || []
    return {
      question,
      sourcePolicy: online ? 'local-first + approved online' : 'local-only',
      stages: ['retrieve', 'rank sources', 'extract evidence', 'cross-check', 'detect contradictions', 'synthesize', 'citations'],
      evidence: [...sources, ...localEvidence],
      uncertainty: localEvidence.length ? 'supported by local evidence' : 'evidence gap; do not overstate inference',
    }
  }

  run(plan) {
    const contradictions = findContradictions(plan.evidence)
    const result = {
      id: `research-${this.runs.length + 1}`,
      question: plan.question,
      rankedSources: plan.evidence.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 8),
      contradictions,
      citations: plan.evidence.map((item, index) => ({ id: `citation-${index + 1}`, source: item.source || item.title || 'local evidence', evidence: item.evidence || item.text || '' })),
      uncertainty: plan.uncertainty,
      status: 'synthesis-ready',
      createdAt: new Date().toISOString(),
    }
    this.runs.unshift(result)
    return result
  }

  snapshot() {
    return { runs: this.runs.length, last: this.runs[0] || null, citationReady: true }
  }
}

function findContradictions(evidence) {
  const texts = evidence.map((item) => String(item.evidence || item.text || '').toLowerCase())
  return texts.some((text) => text.includes('not ') && texts.some((other) => other.includes(text.replace('not ', '')))) ? [{ status: 'possible-contradiction', action: 'flag for review' }] : []
}
