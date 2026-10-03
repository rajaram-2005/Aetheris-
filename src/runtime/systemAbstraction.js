export const PLATFORM_ADAPTERS = {
  windows: { id: 'windows', label: 'Windows', shell: 'PowerShell', pathSeparator: '\\', terminal: 'PowerShell', packageManager: 'winget', fileApi: 'Win32 / .NET' },
  linux: { id: 'linux', label: 'Linux', shell: 'bash', pathSeparator: '/', terminal: 'POSIX shell', packageManager: 'apt / dnf / pacman', fileApi: 'POSIX' },
  macos: { id: 'macos', label: 'macOS', shell: 'zsh', pathSeparator: '/', terminal: 'zsh', packageManager: 'Homebrew', fileApi: 'Foundation / POSIX' },
}

export class SystemAbstraction {
  constructor({ platform } = {}) {
    this.requestedPlatform = platform
  }

  detect() {
    const platform = this.requestedPlatform || detectPlatform()
    const adapter = PLATFORM_ADAPTERS[platform] || PLATFORM_ADAPTERS.linux
    return {
      ...adapter,
      os: adapter.label,
      architecture: 'x86_64',
      runtime: 'local',
      cpu: 'available',
      gpu: 'available',
      ramGb: 64,
      permissions: ['project', 'sandbox'],
      capabilities: ['files', 'applications', 'processes', 'terminal', 'browser', 'display', 'audio'],
    }
  }

  adapterFor(platform = this.detect().id) {
    return PLATFORM_ADAPTERS[platform] || PLATFORM_ADAPTERS.linux
  }

  translateCommand(command, fromShell = 'posix', toPlatform = this.detect().id) {
    const adapter = this.adapterFor(toPlatform)
    const value = String(command || '').trim()
    if (!value) return { command: '', shell: adapter.shell, adapter: adapter.id, changed: false }
    if (adapter.id === 'windows' && /^(ls|cat|pwd|which)\b/.test(value)) {
      const translated = value.replace(/^ls\b/, 'Get-ChildItem').replace(/^cat\b/, 'Get-Content').replace(/^pwd\b/, 'Get-Location').replace(/^which\b/, 'Get-Command')
      return { command: translated, shell: adapter.shell, adapter: adapter.id, changed: translated !== value, fromShell }
    }
    if (adapter.id !== 'windows' && /^Get-(ChildItem|Content|Location|Command)\b/.test(value)) {
      const translated = value.replace(/^Get-ChildItem/, 'ls').replace(/^Get-Content/, 'cat').replace(/^Get-Location/, 'pwd').replace(/^Get-Command/, 'which')
      return { command: translated, shell: adapter.shell, adapter: adapter.id, changed: translated !== value, fromShell }
    }
    return { command: value, shell: adapter.shell, adapter: adapter.id, changed: false, fromShell }
  }

  normalizePath(path, platform = this.detect().id) {
    const separator = this.adapterFor(platform).pathSeparator
    return String(path || '').replace(/[\\/]+/g, separator)
  }

  snapshot() {
    return this.detect()
  }
}

function detectPlatform() {
  if (typeof navigator !== 'undefined') {
    const platform = `${navigator.platform || ''} ${navigator.userAgent || ''}`
    if (/Win/i.test(platform)) return 'windows'
    if (/Mac/i.test(platform)) return 'macos'
  }
  return 'linux'
}
