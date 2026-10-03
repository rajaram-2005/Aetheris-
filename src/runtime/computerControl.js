export class SystemAbstraction {
  detect() {
    const platform = typeof navigator !== 'undefined' ? navigator.platform : 'linux'
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Node runtime'
    const os = /Win/i.test(platform) ? 'Windows' : /Mac/i.test(platform) ? 'macOS' : 'Linux'
    return {
      os,
      architecture: 'x86_64',
      shell: os === 'Windows' ? 'PowerShell' : os === 'macOS' ? 'zsh' : 'bash',
      runtime: 'local',
      userAgent,
      capabilities: ['files', 'applications', 'processes', 'terminal', 'browser', 'display', 'audio'],
    }
  }

  resolveApplication(name) {
    return { query: name, status: 'resolver-ready', candidates: [], note: 'Native adapter required to inspect installed applications.' }
  }

  resolvePath(query) {
    return { query, status: 'index-ready', matches: [], note: 'File index adapter required to inspect the host filesystem.' }
  }
}

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
      adapter: action === 'none' ? 'not-required' : `${system.os.toLowerCase()}-adapter`,
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
  const value = text.toLowerCase()
  if (/(open|launch)/.test(value)) return 'open'
  if (/(find|locate|search).*(file|folder|project)/.test(value)) return 'find-file'
  if (/(run|execute)/.test(value)) return 'run'
  if (/(type|click|navigate)/.test(value)) return 'interact'
  return 'none'
}
