const PIPELINES = {
  image: ['Image planner', 'Prompt + composition', 'Image model', 'Vision critic', 'Quality check'],
  video: ['Research + script', 'Storyboard', 'Shot planning', 'Scene generation', 'Voice + music', 'Edit + subtitles', 'Continuity check'],
  audio: ['Audio planner', 'Voice / music / SFX', 'Generation', 'Mix', 'Master', 'Verification'],
  '3d': ['3D planning', 'Geometry', 'Materials + textures', 'Lighting', 'Rigging', 'Render', 'Export'],
  document: ['Outline', 'Content', 'Figures + tables', 'Formatting', 'Validation', 'Export'],
  engineering: ['Assumptions', 'Equations', 'Calculation', 'Simulation', 'Uncertainty', 'Report'],
  default: ['Understand', 'Plan', 'Execute', 'Verify', 'Synthesize'],
}

export function createMultimodalPlan(understanding) {
  const output = pickOutput(understanding)
  const pipeline = PIPELINES[output] || PIPELINES.default
  return {
    output,
    stages: pipeline.map((label, index) => ({ id: `${output}-${index + 1}`, label, order: index + 1, status: index === 0 ? 'ready' : 'queued' })),
    generation: output !== 'default' && ['image', 'video', 'audio', '3d'].includes(output),
  }
}

function pickOutput(understanding) {
  const modalities = understanding.modalities || []
  if (modalities.includes('video')) return 'video'
  if (modalities.includes('3d')) return '3d'
  if (modalities.includes('audio')) return 'audio'
  if (modalities.includes('image')) return 'image'
  if (understanding.intent === 'engineering') return 'engineering'
  if (understanding.intent === 'document' || modalities.includes('document')) return 'document'
  return 'default'
}
