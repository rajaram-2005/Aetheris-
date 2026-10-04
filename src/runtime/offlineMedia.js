export const LOCAL_MEDIA_ASSETS = {
  image: [
    { id: 'ev-converter-lab', title: 'EV converter lab', url: '/media/ev-converter-lab.jpg', kind: 'image', provenance: 'local generated preview' },
    { id: 'digital-twin-factory', title: 'Digital twin factory', url: '/media/digital-twin-factory.jpg', kind: 'image', provenance: 'local generated preview' },
  ],
  video: [
    { id: 'digital-twin-video', title: 'Digital twin walkthrough', poster: '/media/digital-twin-factory.jpg', kind: 'video', provenance: 'local video pipeline poster' },
  ],
  audio: [
    { id: 'offline-voice', title: 'Offline voice bed', url: '/media/aetheris-offline-voice.wav', kind: 'audio', provenance: 'local waveform preview' },
  ],
  '3d': [
    { id: 'converter-3d', title: 'Converter 3D study', poster: '/media/ev-converter-lab.jpg', kind: '3d', provenance: 'local 3D pipeline preview' },
  ],
  document: [
    { id: 'verification-report', title: 'Verification report', poster: '/media/aetheris-studio.jpg', kind: 'document', provenance: 'local document factory preview' },
  ],
}

export class OfflineMediaEngine {
  constructor({ network } = {}) {
    this.network = network
    this.jobs = []
    this.assets = []
  }

  plan({ brief, output = 'auto' } = {}) {
    const kind = output === 'auto' ? inferOutput(brief) : output
    const localModels = { image: 'sdxl-lightning', video: 'local-video-pipeline', audio: 'local-audio-pipeline', '3d': 'local-3d-pipeline', document: 'document-factory' }
    return {
      id: `media-plan-${this.jobs.length + 1}`,
      brief,
      output: kind,
      model: localModels[kind] || 'mistral-small-3.1',
      mode: 'LOCAL ONLY',
      networkUsed: false,
      stages: stageList(kind),
      preview: LOCAL_MEDIA_ASSETS[kind]?.[0] || null,
    }
  }

  render(plan) {
    const preview = LOCAL_MEDIA_ASSETS[plan.output]?.[0] || null
    const job = { id: `media-job-${this.jobs.length + 1}`, planId: plan.id, brief: plan.brief, output: plan.output, model: plan.model, status: preview ? 'preview-ready' : 'adapter-ready', localOnly: true, preview, createdAt: new Date().toISOString() }
    this.jobs.unshift(job)
    if (preview) this.assets.unshift({ ...preview, jobId: job.id })
    return job
  }

  snapshot() {
    return { jobs: this.jobs.length, assets: this.assets.length, localOnly: true, networkUsed: false, available: Object.fromEntries(Object.entries(LOCAL_MEDIA_ASSETS).map(([kind, assets]) => [kind, assets.length])) }
  }
}

function stageList(output) {
  if (output === 'video') return ['script', 'storyboard', 'shots', 'scenes', 'voice', 'music', 'edit', 'subtitles', 'continuity']
  if (output === 'audio') return ['voice / music / SFX', 'generation', 'mix', 'master', 'verification']
  if (output === '3d') return ['geometry', 'materials', 'lighting', 'rig', 'render', 'export']
  if (output === 'document') return ['outline', 'content', 'figures', 'formatting', 'validation', 'export']
  return ['concept', 'composition', 'generation', 'vision critique', 'quality check', 'export']
}

function inferOutput(brief) {
  const value = String(brief || '').toLowerCase()
  if (/video|documentary|animation|film/.test(value)) return 'video'
  if (/audio|voice|music|sound/.test(value)) return 'audio'
  if (/3d|mesh|model an object/.test(value)) return '3d'
  if (/report|document|presentation|slides/.test(value)) return 'document'
  return 'image'
}
