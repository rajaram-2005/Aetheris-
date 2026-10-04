export const INDUSTRIAL_PROTOCOLS = ['OPC-UA', 'Modbus', 'MQTT']

const DEFAULT_DEVICES = [
  { id: 'lab-gateway', name: 'Lab gateway', protocol: 'MQTT', kind: 'sensor', status: 'connected', telemetry: { temperature: 31.2, pressure: 1.01 } },
  { id: 'converter-plc', name: 'Converter PLC', protocol: 'OPC-UA', kind: 'controller', status: 'connected', telemetry: { busVoltage: 400, switchingFrequency: 20000 } },
  { id: 'test-bench', name: 'Test bench actuator', protocol: 'Modbus', kind: 'actuator', status: 'locked', telemetry: { state: 'idle' } },
]

export class IndustrialGateway {
  constructor({ security, twin } = {}) {
    this.security = security
    this.twin = twin
    this.devices = new Map(DEFAULT_DEVICES.map((device) => [device.id, { ...device }]))
    this.actions = []
  }

  discover() {
    return [...this.devices.values()].map((device) => ({ ...device, telemetry: { ...device.telemetry } }))
  }

  readTelemetry(deviceId) {
    const device = this.devices.get(deviceId)
    if (!device) return { status: 'not-found', deviceId }
    const sample = { deviceId, protocol: device.protocol, values: { ...device.telemetry }, readOnly: true, capturedAt: new Date().toISOString() }
    this.twin?.ingest(sample)
    return sample
  }

  planAction(deviceId, action, { simulation = true, authorized = false } = {}) {
    const device = this.devices.get(deviceId)
    const industrial = device?.kind === 'controller' || device?.kind === 'actuator'
    return {
      device: device || null,
      action,
      protocol: device?.protocol,
      simulation,
      validationRequired: true,
      safetyInterlock: industrial,
      authorized,
      allowed: Boolean(device && simulation) || Boolean(device && authorized && this.security?.online),
      status: !device ? 'not-found' : simulation ? 'simulation-ready' : authorized ? 'authorization-required' : 'locked',
    }
  }

  executeAction(deviceId, action, options = {}) {
    const plan = this.planAction(deviceId, action, options)
    const event = { id: `industrial-${this.actions.length + 1}`, plan, status: plan.allowed ? 'simulated' : 'blocked', createdAt: new Date().toISOString() }
    this.actions.unshift(event)
    return event
  }

  snapshot() {
    return { protocols: INDUSTRIAL_PROTOCOLS, devices: this.discover(), actions: this.actions.length, physicalWrites: 0, safeMode: true }
  }
}
