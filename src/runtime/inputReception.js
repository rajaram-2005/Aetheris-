export const INPUT_KINDS = ['text', 'voice', 'image', 'video', 'file', 'screen', 'multimodal']

export class InputReception {
  constructor({ emit = () => {}, maxTextLength = 200_000 } = {}) {
    this.emit = emit
    this.maxTextLength = maxTextLength
    this.received = []
    this.sequence = 1
  }

  receive(input, metadata = {}) {
    const envelope = normalizeInput(input, metadata, this.sequence++)
    if (envelope.text.length > this.maxTextLength) {
      envelope.text = envelope.text.slice(0, this.maxTextLength)
      envelope.truncated = true
    }
    this.received.unshift(envelope)
    this.received = this.received.slice(0, 100)
    this.emit({ type: 'input.received', input: publicInput(envelope) })
    return envelope
  }

  snapshot() {
    return {
      received: this.received.length,
      kinds: [...new Set(this.received.map((input) => input.kind))],
      last: this.received[0] ? publicInput(this.received[0]) : null,
      localOnly: true,
      networkUsed: false,
    }
  }
}

function normalizeInput(input, metadata, sequence) {
  const isObject = input && typeof input === 'object'
  const kind = normalizeKind(isObject ? input.kind || input.type || input.modality : 'text', input)
  const rawText = isObject
    ? input.text || input.transcript || input.content || input.description || input.prompt || input.name || ''
    : input
  const attachments = normalizeAttachments(isObject ? input.attachments || input.files || (input.file ? [input.file] : []) : [])
  const text = String(rawText || '').trim()
  const modalities = [...new Set([kind === 'multimodal' ? null : kind, ...attachments.map((attachment) => attachment.kind)].filter(Boolean))]
  return {
    id: `input-${String(sequence).padStart(5, '0')}`,
    kind,
    text,
    modalities,
    attachments,
    source: metadata.source || (isObject && input.source) || 'user',
    sessionId: metadata.sessionId || (isObject && input.sessionId) || 'local-session',
    receivedAt: new Date().toISOString(),
    localOnly: true,
    networkUsed: false,
    metadata: sanitizeMetadata({ ...(isObject ? input.metadata : {}), ...metadata }),
    truncated: false,
  }
}

function normalizeKind(value, input) {
  const kind = String(value || '').toLowerCase()
  if (INPUT_KINDS.includes(kind)) return kind
  if (input?.mimeType?.startsWith('image/')) return 'image'
  if (input?.mimeType?.startsWith('video/')) return 'video'
  if (input?.mimeType?.startsWith('audio/')) return 'voice'
  if (input?.mimeType || input?.name) return 'file'
  return 'text'
}

function normalizeAttachments(attachments) {
  return (Array.isArray(attachments) ? attachments : [attachments]).filter(Boolean).slice(0, 20).map((attachment, index) => {
    const source = typeof attachment === 'string' ? { name: attachment } : attachment
    const mimeType = source.mimeType || source.type || 'application/octet-stream'
    return {
      id: source.id || `attachment-${index + 1}`,
      name: source.name || `attachment-${index + 1}`,
      kind: mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : mimeType.startsWith('audio/') ? 'voice' : 'file',
      mimeType,
      size: Number.isFinite(source.size) ? source.size : null,
      path: source.path || null,
      fingerprint: source.fingerprint || fingerprint(`${source.name || ''}:${source.size || ''}:${mimeType}`),
    }
  })
}

function sanitizeMetadata(metadata) {
  return Object.fromEntries(Object.entries(metadata || {}).filter(([key]) => !/key|token|secret|password|authorization/i.test(key)).slice(0, 30))
}

function fingerprint(value) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619)
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

function publicInput(input) {
  return { ...input, attachments: input.attachments.map(({ path, ...attachment }) => attachment) }
}
