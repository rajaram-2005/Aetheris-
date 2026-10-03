const SDK_KINDS = ['agent', 'tool', 'model', 'memory', 'workflow', 'ui', 'device']

export class DeveloperPlatform {
  constructor({ plugins } = {}) {
    this.plugins = plugins
    this.packages = new Map()
    this.events = []
  }

  define(manifest) {
    const packageId = manifest.id || `${manifest.kind || 'capability'}-${this.packages.size + 1}`
    const validation = this.validate({ ...manifest, id: packageId })
    const definition = { ...manifest, id: packageId, status: validation.valid ? 'ready' : 'invalid', validation, createdAt: new Date().toISOString() }
    this.packages.set(packageId, definition)
    return definition
  }

  validate(manifest) {
    const errors = []
    if (!SDK_KINDS.includes(manifest.kind)) errors.push(`kind must be one of ${SDK_KINDS.join(', ')}`)
    if (!manifest.name) errors.push('name is required')
    if (!manifest.version) errors.push('version is required')
    if (!manifest.inputSchema) errors.push('inputSchema is required')
    if (!manifest.outputSchema) errors.push('outputSchema is required')
    if (!manifest.permissions) errors.push('permissions are required')
    return { valid: errors.length === 0, errors }
  }

  publish(packageId) {
    const definition = this.packages.get(packageId)
    if (!definition || definition.status !== 'ready') return { status: 'blocked', packageId }
    definition.status = 'published'
    this.events.unshift({ type: 'published', packageId, time: new Date().toISOString() })
    return definition
  }

  snapshot() {
    return { packages: this.packages.size, published: [...this.packages.values()].filter((item) => item.status === 'published').length, sdkKinds: SDK_KINDS, events: this.events.length }
  }
}
