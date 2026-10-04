export const AIOS_LAYERS = [
  { id: 'experience', label: 'Chat / voice / vision / files / screen' },
  { id: 'control', label: 'God Core universal control plane' },
  { id: 'capabilities', label: '56 specialist capabilities' },
  { id: 'models', label: 'Model fabric' },
  { id: 'memory', label: 'Memory + knowledge' },
  { id: 'workflow', label: 'Workflow + agent orchestration' },
  { id: 'tools', label: 'Tool fabric' },
  { id: 'creation', label: 'Multimodal creation' },
  { id: 'computer', label: 'Computer control' },
  { id: 'simulation', label: 'Simulation / digital twin' },
  { id: 'industrial', label: 'IoT / robotics / PLC / SCADA' },
  { id: 'security', label: 'Security / policy / consent / sandbox' },
  { id: 'verification', label: 'Verification / observability / audit' },
  { id: 'platform', label: 'Windows / Linux / macOS' },
  { id: 'hardware', label: 'CPU / GPU / NPU / edge / server' },
]

export class AiosEnvironment {
  constructor({ modes, hardware } = {}) {
    this.modes = modes
    this.hardware = hardware
  }

  snapshot() {
    return {
      name: 'Aetheris',
      kind: 'Universal AIOS',
      controlPlane: 'God Core',
      executionPlane: 'modular intelligence fabric',
      localFirst: true,
      layers: AIOS_LAYERS,
      selectedMode: this.modes.select({ intent: 'general', modality: 'text' }),
      hardware: this.hardware.detect(),
      invariant: 'chatbot is the control plane; everything else is execution plane',
    }
  }
}
