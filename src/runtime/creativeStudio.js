export class CreativeStudio {
  constructor({ multimodal } = {}) {
    this.multimodal = multimodal
    this.assets = []
  }

  plan(brief, { output = 'auto', references = [] } = {}) {
    const type = output === 'auto' ? inferOutput(brief) : output
    return {
      brief,
      output: type,
      references,
      stages: type === 'video' ? ['script', 'storyboard', 'visuals', 'voice', 'music', 'edit', 'export'] : type === 'audio' ? ['voice', 'music', 'SFX', 'mix', 'master'] : ['concept', 'composition', 'generation', 'critique', 'revision', 'export'],
      consistency: ['characters', 'objects', 'style'],
      approval: 'human review before publish',
    }
  }

  create(plan) {
    const asset = { id: `asset-${this.assets.length + 1}`, title: plan.brief, type: plan.output, status: 'draft', stages: plan.stages, createdAt: new Date().toISOString() }
    this.assets.unshift(asset)
    return asset
  }

  approve(assetId) {
    const asset = this.assets.find((item) => item.id === assetId)
    if (!asset) return null
    asset.status = 'approved'
    asset.approvedAt = new Date().toISOString()
    return asset
  }

  snapshot() {
    return { assets: this.assets.length, drafts: this.assets.filter((asset) => asset.status === 'draft').length, approved: this.assets.filter((asset) => asset.status === 'approved').length }
  }
}

function inferOutput(brief) {
  const value = String(brief).toLowerCase()
  if (/video|documentary|animation|film/.test(value)) return 'video'
  if (/audio|voice|music|sound/.test(value)) return 'audio'
  if (/3d|model|mesh/.test(value)) return '3d'
  if (/document|report|presentation|slides/.test(value)) return 'document'
  return 'image'
}
