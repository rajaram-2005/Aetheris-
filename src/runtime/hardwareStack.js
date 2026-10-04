export const HARDWARE_LAYERS = ['application', 'Aetheris runtime', 'agent runtime', 'model runtime', 'inference engine', 'operating system', 'CPU / GPU / NPU', 'memory / storage']

export class HardwareStack {
  constructor({ system, resources } = {}) {
    this.system = system
    this.resources = resources
  }

  detect() {
    const host = this.system.detect()
    const capacity = this.resources.snapshot().capacity
    return {
      layers: HARDWARE_LAYERS,
      host: { os: host.os || host.label, architecture: host.architecture, shell: host.shell },
      accelerators: { cpu: capacity.cpuCores, gpu: capacity.gpu, npu: 'adapter-ready' },
      memory: { ramGb: capacity.ramGb, vramGb: capacity.vramGb, storageGb: capacity.storageGb },
      inference: 'local adapter ready',
    }
  }

  selectMode({ intent = 'general', modality = 'text', resources = this.resources.snapshot() } = {}) {
    if (intent === 'industrial' || intent === 'device-control') return 'industrial'
    if (resources.capacity?.ramGb <= 16 || resources.capacity?.vramGb <= 4) return 'edge'
    if (modality === 'video' || modality === '3d' || resources.capacity?.gpu) return 'workstation'
    return 'personal-computer'
  }

  snapshot() {
    return this.detect()
  }
}
