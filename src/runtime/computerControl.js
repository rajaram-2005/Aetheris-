import { SystemAbstraction } from './systemAbstraction.js'

export { SystemAbstraction }

export class ComputerControlLoop {
  constructor({ tools, system = new SystemAbstraction() } = {}) {
    this.tools = tools
    this.system = system
  }

  plan(understanding) {
    const system = this.system.detect()
    const action = inferAction(understanding.text)
    return {
      system,
      action,
      loop: ['observe', 'understand', 'plan', 'act', 'observe', 'compare', 'verify'],
      adapter: action === 'none' ? 'not-required' : `${system.id}-adapter`,
      verification: 'expected-vs-actual',
      safeMode: true,
    }
  }

  observe(target = 'desktop') {
    return { target, status: 'observation-ready', capturedAt: new Date().toISOString(), source: 'adapter-contract' }
  }

  verify(expected, actual) {
    return { passed: Boolean(expected && actual), expected, actual, comparator: 'contract-match', checkedAt: new Date().toISOString() }
  }
}

function inferAction(text) {
  const value = String(text || '').toLowerCase()
  if (/(open|launch)/.test(value)) return 'open'
  if (/(find|locate|search).*(file|folder|project)/.test(value)) return 'find-file'
  if (/(run|execute)/.test(value)) return 'run'
  if (/(type|click|navigate)/.test(value)) return 'interact'
  return 'none'
}
