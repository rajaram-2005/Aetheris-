export class DigitalTwinEngine {
  constructor() {
    this.twins = new Map()
    this.readings = []
    this.simulations = []
  }

  createTwin({ id, name, domain = 'generic', variables = [] }) {
    const twin = { id: id || `twin-${this.twins.size + 1}`, name: name || 'Untitled twin', domain, variables, state: {}, calibration: 'pending', createdAt: new Date().toISOString() }
    this.twins.set(twin.id, twin)
    return twin
  }

  ingest(reading) {
    this.readings.unshift({ ...reading, ingestedAt: new Date().toISOString() })
    this.readings = this.readings.slice(0, 200)
    return this.readings[0]
  }

  calibrate(twinId, assumptions = []) {
    const twin = this.twins.get(twinId) || this.createTwin({ id: twinId, name: twinId })
    twin.calibration = 'calibrated'
    twin.assumptions = assumptions
    twin.calibratedAt = new Date().toISOString()
    return twin
  }

  simulate(twinId, scenario = {}) {
    const twin = this.twins.get(twinId) || this.createTwin({ id: twinId, name: twinId })
    const result = {
      id: `simulation-${this.simulations.length + 1}`,
      twinId: twin.id,
      scenario,
      outputs: Object.fromEntries(Object.entries(scenario).map(([key, value]) => [key, typeof value === 'number' ? Number((value * 0.98).toFixed(4)) : value])),
      uncertainty: 'bounded; validate against measurements',
      status: 'simulated',
      createdAt: new Date().toISOString(),
    }
    this.simulations.unshift(result)
    return result
  }

  compare(twinId, expected, measured) {
    const keys = new Set([...Object.keys(expected || {}), ...Object.keys(measured || {})])
    const deltas = Object.fromEntries([...keys].map((key) => [key, typeof expected?.[key] === 'number' && typeof measured?.[key] === 'number' ? measured[key] - expected[key] : null]))
    return { twinId, deltas, passed: Object.values(deltas).filter((value) => value !== null).every((value) => Math.abs(value) < 0.05), comparedAt: new Date().toISOString() }
  }

  snapshot() {
    return { twins: this.twins.size, readings: this.readings.length, simulations: this.simulations.length, calibrated: [...this.twins.values()].filter((twin) => twin.calibration === 'calibrated').length }
  }
}
