export class ComputerUseLoop {
  constructor({ computer, terminal, files, applications, browser } = {}) {
    this.computer = computer
    this.terminal = terminal
    this.files = files
    this.applications = applications
    this.browser = browser
    this.runs = []
  }

  plan(request) {
    const action = inferAction(request)
    return {
      action,
      observation: action === 'find-file' ? 'file index' : action === 'open-app' ? 'application registry' : action === 'run-command' ? 'terminal adapter' : action === 'navigate' ? 'browser adapter' : 'conversation context',
      loop: ['observe', 'understand', 'plan', 'act', 'observe', 'compare expected / actual', 'correct or complete'],
      verification: 'required',
      safeMode: true,
    }
  }

  run(request, { approved = false } = {}) {
    const plan = this.plan(request)
    const trace = {
      id: `computer-run-${this.runs.length + 1}`,
      request,
      plan,
      steps: [],
      status: 'running',
      createdAt: new Date().toISOString(),
    }
    trace.steps.push({ phase: 'observe', result: `Observed ${plan.observation}` })
    const actionResult = this.act(plan.action, request, approved)
    trace.steps.push({ phase: 'act', result: actionResult })
    trace.steps.push({ phase: 'observe', result: 'Observation returned by adapter contract' })
    trace.steps.push({ phase: 'verify', result: { passed: actionResult.status === 'simulated', comparator: 'expected-vs-actual' } })
    trace.status = actionResult.status === 'simulated' ? 'completed' : actionResult.status
    this.runs.unshift(trace)
    return trace
  }

  act(action, request, approved) {
    if (action === 'find-file') return { status: 'simulated', result: this.files.search(request, { limit: 5 }) }
    if (action === 'open-app') return this.applications.launch(request.replace(/open|launch/gi, '').trim(), { approved })
    if (action === 'run-command') return this.terminal.execute(request.replace(/run|execute/gi, '').trim(), { approved })
    if (action === 'navigate') return this.browser.navigate(request.replace(/browse|navigate/gi, '').trim(), { approved })
    return { status: 'no-op', result: 'No computer action inferred' }
  }

  snapshot() {
    return { runs: this.runs.length, last: this.runs[0] || null }
  }
}

function inferAction(text) {
  const value = String(text || '').toLowerCase()
  if (/(find|locate|search).*(file|folder|project)/.test(value)) return 'find-file'
  if (/(open|launch).*(app|application|terminal|browser|editor|simulation|project)/.test(value)) return 'open-app'
  if (/(run|execute).*(command|script|terminal|it)/.test(value)) return 'run-command'
  if (/(browse|navigate|visit|go to)/.test(value)) return 'navigate'
  return 'none'
}
