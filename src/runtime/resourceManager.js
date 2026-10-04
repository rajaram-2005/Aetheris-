export class ResourceManager {
  constructor({ profile = {} } = {}) {
    this.capacity = { cpuCores: 16, gpu: 'RTX 4080', vramGb: 16, ramGb: 64, storageGb: 1800, powerWatts: 300, networkMbps: 1000, ...profile }
    this.usage = { cpuCores: 0, vramGb: 0, ramGb: 0, storageGb: 0, powerWatts: 0, networkMbps: 0 }
    this.allocations = new Map()
  }

  plan({ taskId, complexity = 'medium', modelGb = 0, agents = 1, modality = 'text' } = {}) {
    const gpuWeight = modality === 'video' ? 8 : modality === 'image' || modality === '3d' ? 4 : 1
    const requested = {
      cpuCores: Math.min(this.capacity.cpuCores, Math.max(1, agents * (complexity === 'high' ? 2 : 1))),
      vramGb: Math.min(this.capacity.vramGb, Math.max(modelGb, gpuWeight)),
      ramGb: Math.min(this.capacity.ramGb, complexity === 'high' ? 12 : complexity === 'medium' ? 6 : 3),
      storageGb: modality === 'video' ? 12 : modality === '3d' ? 8 : 1,
      powerWatts: modality === 'video' ? 180 : modality === 'image' || modality === '3d' ? 120 : 60,
      networkMbps: 0,
    }
    const fit = Object.entries(requested).every(([key, value]) => value <= (this.capacity[key] ?? Number.POSITIVE_INFINITY) - (this.usage[key] || 0))
    return { taskId, requested, fit, mode: fit ? (requested.vramGb > 2 ? 'gpu-accelerated' : 'cpu-local') : 'queued-for-resources', concurrency: Math.max(1, Math.floor(this.capacity.cpuCores / requested.cpuCores)) }
  }

  allocate(plan) {
    if (!plan.fit) return { ...plan, status: 'queued' }
    Object.entries(plan.requested).forEach(([key, value]) => { this.usage[key] = (this.usage[key] || 0) + value })
    const allocation = { ...plan, status: 'allocated', allocatedAt: new Date().toISOString() }
    this.allocations.set(plan.taskId, allocation)
    return allocation
  }

  release(taskId) {
    const allocation = this.allocations.get(taskId)
    if (!allocation) return null
    Object.entries(allocation.requested).forEach(([key, value]) => { this.usage[key] = Math.max(0, (this.usage[key] || 0) - value) })
    allocation.status = 'released'
    allocation.releasedAt = new Date().toISOString()
    this.allocations.delete(taskId)
    return allocation
  }

  snapshot() {
    return { capacity: this.capacity, usage: this.usage, allocations: this.allocations.size, utilization: { cpu: percent(this.usage.cpuCores, this.capacity.cpuCores), ram: percent(this.usage.ramGb, this.capacity.ramGb), vram: percent(this.usage.vramGb, this.capacity.vramGb) } }
  }
}

function percent(value, max) {
  return `${Math.round((value / Math.max(max, 1)) * 100)}%`
}
