export const DEPLOYMENT_MODES = {
  'personal-computer': { label: 'Personal computer', capabilities: ['chat', 'local models', 'memory', 'RAG', 'image', 'audio', 'documents', 'computer control'], scale: 'single user' },
  workstation: { label: 'Workstation', capabilities: ['larger models', 'parallel agents', 'video', '3D', 'scientific computing', 'simulation'], scale: 'high compute' },
  server: { label: 'Server', capabilities: ['model cluster', 'agent cluster', 'shared memory', 'multi-user', 'authentication', 'scheduling', 'monitoring', 'API'], scale: 'multi-user' },
  edge: { label: 'Edge', capabilities: ['quantized models', 'local tools', 'robots', 'industrial gateways'], scale: 'constrained' },
  industrial: { label: 'Industrial', capabilities: ['digital twin', 'simulation', 'safety layer', 'authorized gateway', 'PLC', 'SCADA', 'robotics'], scale: 'safety-critical' },
}

export class DeploymentModes {
  constructor({ hardware } = {}) {
    this.hardware = hardware
  }

  select({ intent, modality, server = false, industrial = false } = {}) {
    const id = industrial ? 'industrial' : server ? 'server' : this.hardware.selectMode({ intent, modality })
    return { id, ...DEPLOYMENT_MODES[id], selectedAt: new Date().toISOString(), offlineCapable: true }
  }

  plan(id, objective) {
    const mode = DEPLOYMENT_MODES[id] || DEPLOYMENT_MODES['personal-computer']
    return { mode: id, objective, capabilities: mode.capabilities, localFirst: true, externalServices: 'approved only' }
  }

  snapshot() {
    return { modes: Object.keys(DEPLOYMENT_MODES), profiles: DEPLOYMENT_MODES }
  }
}
