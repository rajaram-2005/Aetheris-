export class NetworkMode {
  constructor({ online = false } = {}) {
    this.online = Boolean(online)
    this.approvedServices = new Set()
    this.requests = []
  }

  setOnline(online) {
    this.online = Boolean(online)
  }

  approveService(service) {
    this.approvedServices.add(service)
    return { service, approved: true, mode: this.online ? 'online' : 'offline' }
  }

  request(service, { purpose = 'task', approved = false } = {}) {
    const allowed = this.online && (approved || this.approvedServices.has(service))
    const request = { service, purpose, allowed, status: allowed ? 'approved' : 'blocked', mode: this.online ? 'online' : 'local-only', time: new Date().toISOString() }
    this.requests.unshift(request)
    return request
  }

  selectModelPolicy() {
    return this.online ? 'local-first with approved remote fallback' : 'LOCAL ONLY'
  }

  snapshot() {
    return { online: this.online, label: this.online ? 'APPROVED ONLINE' : 'LOCAL ONLY', approvedServices: [...this.approvedServices], requests: this.requests.length, modelPolicy: this.selectModelPolicy() }
  }
}
