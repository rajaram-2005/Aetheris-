export const PIPELINE_DEFINITIONS = {
  image: {
    id: 'image-pipeline',
    label: 'Image pipeline',
    artifact: 'image',
    stages: [
      ['Image planner', 'composition + constraints'],
      ['Prompt / composition', 'prompt contract'],
      ['Image model', 'render candidate'],
      ['Vision critic', 'independent critique'],
      ['Quality check', 'approve or revise'],
    ],
  },
  video: {
    id: 'video-pipeline',
    label: 'Video pipeline',
    artifact: 'video',
    stages: [
      ['Research + script', 'script draft'],
      ['Storyboard', 'shot list'],
      ['Shot planning', 'continuity plan'],
      ['Scene generation', 'scene candidates'],
      ['Voice + music', 'audio stems'],
      ['Edit + subtitles', 'timeline'],
      ['Continuity check', 'final review'],
    ],
  },
  audio: {
    id: 'audio-pipeline',
    label: 'Audio pipeline',
    artifact: 'audio',
    stages: [
      ['Audio planner', 'voice + mix brief'],
      ['Voice / music / SFX', 'source stems'],
      ['Generation', 'audio take'],
      ['Mix', 'balanced mix'],
      ['Master', 'mastered output'],
      ['Verification', 'loudness + quality'],
    ],
  },
  '3d': {
    id: '3d-pipeline',
    label: '3D pipeline',
    artifact: '3d asset',
    stages: [
      ['3D planning', 'reference brief'],
      ['Geometry', 'mesh'],
      ['Materials + textures', 'surface package'],
      ['Lighting', 'scene setup'],
      ['Rigging', 'control rig'],
      ['Render', 'render pass'],
      ['Export', 'interchange asset'],
    ],
  },
  document: {
    id: 'document-factory',
    label: 'Document factory',
    artifact: 'document',
    stages: [
      ['Outline', 'content structure'],
      ['Content', 'draft'],
      ['Figures + tables', 'supporting assets'],
      ['Formatting', 'layout'],
      ['Validation', 'schema + links'],
      ['Export', 'requested format'],
    ],
  },
  engineering: {
    id: 'scientific-mode',
    label: 'Scientific mode',
    artifact: 'technical report',
    stages: [
      ['Assumptions', 'scope + uncertainty'],
      ['Equations', 'model'],
      ['Calculation', 'computed result'],
      ['Simulation', 'sandbox run'],
      ['Uncertainty', 'sensitivity'],
      ['Report', 'evidence package'],
    ],
  },
  default: {
    id: 'universal-response',
    label: 'Universal response',
    artifact: 'response',
    stages: [
      ['Understand', 'request contract'],
      ['Plan', 'execution plan'],
      ['Execute', 'intermediate result'],
      ['Verify', 'quality gate'],
      ['Synthesize', 'final response'],
    ],
  },
}

export function createMultimodalPlan(understanding) {
  const output = pickOutput(understanding)
  const definition = PIPELINE_DEFINITIONS[output] || PIPELINE_DEFINITIONS.default
  return {
    pipelineId: definition.id,
    label: definition.label,
    output,
    artifact: definition.artifact,
    stages: definition.stages.map(([label, detail], index) => ({
      id: `${definition.id}-${index + 1}`,
      label,
      detail,
      order: index + 1,
      status: index === 0 ? 'ready' : 'queued',
      qualityGate: /check|validation|verify|continuity|uncertainty/i.test(label),
    })),
    generation: ['image', 'video', 'audio', '3d'].includes(output),
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
