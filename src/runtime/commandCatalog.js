export const COMMAND_CATALOG = [
  { id: 'system.open-workspace', group: 'system', example: 'Open my engineering workspace.', intent: 'computer-control' },
  { id: 'research.compare-evidence', group: 'research', example: 'Research this topic and compare the available evidence.', intent: 'research' },
  { id: 'creation.engineering-diagram', group: 'image', example: 'Create an engineering diagram.', intent: 'creation' },
  { id: 'creation.educational-video', group: 'video', example: 'Turn this paper into a ten-minute educational video.', intent: 'creation' },
  { id: 'documents.technical-report', group: 'documents', example: 'Create a technical report from these files.', intent: 'document' },
  { id: 'development.fix-and-test', group: 'development', example: 'Analyze this project, fix the problem, and test it.', intent: 'software' },
  { id: 'engineering.simulate', group: 'engineering', example: 'Analyze this converter and simulate the expected waveform.', intent: 'engineering' },
  { id: 'education.teach', group: 'education', example: 'Teach me this topic from beginner to advanced.', intent: 'education' },
  { id: 'automation.digest', group: 'automation', example: 'Every morning, prepare a summary of my project changes.', intent: 'workflow' },
]

export class CommandCatalog {
  resolve(text) {
    const value = String(text || '').toLowerCase()
    const matches = COMMAND_CATALOG.map((command) => ({ ...command, score: score(value, command.example.toLowerCase()) })).filter((command) => command.score > 0).sort((a, b) => b.score - a.score)
    return { matched: matches[0] || null, suggestions: matches.slice(0, 3), catalogSize: COMMAND_CATALOG.length }
  }

  snapshot() {
    return { commands: COMMAND_CATALOG.length, groups: [...new Set(COMMAND_CATALOG.map((command) => command.group))] }
  }
}

function score(input, example) {
  const terms = input.split(/\s+/).filter((term) => term.length > 3)
  return terms.reduce((sum, term) => sum + (example.includes(term) ? 1 : 0), 0)
}
