// The registry is deliberately data-first. Providers can replace model entries or add
// tools without changing the control-plane contracts around them.

export const PLANE_DEFINITIONS = [
  { id: 'experience', number: '01', name: 'Experience plane', role: 'What the user sees', status: 'online' },
  { id: 'conversation', number: '02', name: 'Conversation plane', role: 'Intent and task context', status: 'online' },
  { id: 'cognitive', number: '03', name: 'Cognitive plane', role: 'Reasoning, planning, arbitration', status: 'online' },
  { id: 'agents', number: '04', name: 'Agent plane', role: 'Specialist capabilities', status: 'online' },
  { id: 'models', number: '05', name: 'Model plane', role: 'Routing and inference', status: 'online' },
  { id: 'memory', number: '06', name: 'Memory / knowledge plane', role: 'Context, RAG, and learning', status: 'online' },
  { id: 'tools', number: '07', name: 'Tool plane', role: 'Files, apps, APIs, devices', status: 'online' },
  { id: 'creation', number: '08', name: 'Creation plane', role: 'Multimodal generation', status: 'online' },
  { id: 'computer', number: '09', name: 'Computer-control plane', role: 'OS and browser actions', status: 'online' },
  { id: 'security', number: '10', name: 'Security plane', role: 'Policy, consent, sandbox', status: 'online' },
  { id: 'verification', number: '11', name: 'Verification plane', role: 'Quality and safety checks', status: 'online' },
  { id: 'hardware', number: '12', name: 'Hardware / infrastructure plane', role: 'Runtime resources and devices', status: 'online' },
]

export const ARCHITECTURE_PHASES = [
  { id: 'image-pipeline', number: '11', name: 'Image pipeline', role: 'Plan, generate, critique, revise' },
  { id: 'video-pipeline', number: '12', name: 'Video pipeline', role: 'Script, storyboard, render, edit' },
  { id: 'audio-pipeline', number: '13', name: 'Audio pipeline', role: 'Voice, music, mix, master' },
  { id: '3d-pipeline', number: '14', name: '3D pipeline', role: 'Geometry, materials, rig, render' },
  { id: 'document-factory', number: '15', name: 'Document factory', role: 'Outline, content, figures, export' },
  { id: 'memory-fabric', number: '16', name: 'Memory fabric', role: 'Working, episodic, semantic, procedural' },
  { id: 'knowledge-fabric', number: '17', name: 'Knowledge fabric', role: 'Ingest, parse, vector, graph, RAG' },
  { id: 'meta-learning', number: '18', name: 'Meta-learning', role: 'Evaluate outcomes, update strategies' },
  { id: 'tool-fabric', number: '19', name: 'Universal tool fabric', role: 'Permissioned files, terminal, APIs, devices' },
  { id: 'computer-control', number: '20', name: 'Chat → computer control', role: 'Observe, act, compare, verify' },
]

export const AGENT_GROUPS = [
  { id: 'intelligence', name: 'Intelligence', agents: ['Reasoning', 'Planning', 'Problem Solving', 'Strategy', 'Critique', 'Verification', 'Meta-Learning'] },
  { id: 'software', name: 'Software & digital engineering', agents: ['Software Architecture', 'Programming', 'Debugging', 'Testing', 'DevOps', 'Database', 'Cybersecurity'] },
  { id: 'engineering', name: 'Engineering', agents: ['Electrical', 'Electronics', 'Embedded Systems', 'Control Systems', 'Mechanical', 'Robotics', 'Industrial Automation'] },
  { id: 'science', name: 'Science', agents: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Materials', 'Energy', 'Scientific Research'] },
  { id: 'knowledge', name: 'Knowledge', agents: ['Research', 'Retrieval / RAG', 'Knowledge Graph', 'Document Analysis', 'Literature Analysis', 'Citation', 'Fact Verification'] },
  { id: 'productivity', name: 'Human productivity', agents: ['Writing', 'Teaching', 'Tutoring', 'Translation', 'Productivity', 'Presentation', 'Communication'] },
  { id: 'media', name: 'Media', agents: ['Image', 'Video', 'Audio', 'Music', '3D', 'Animation', 'Media Editing'] },
  { id: 'systems', name: 'Computer & physical systems', agents: ['Computer Operation', 'Browser Operation', 'Terminal Operation', 'File-System Operation', 'Repository / Version Control', 'IoT / Device Operation', 'PLC / SCADA Operation'] },
]

export const AGENT_DEFINITIONS = AGENT_GROUPS.flatMap((group) => group.agents.map((name, index) => ({
  id: slugify(name),
  name,
  groupId: group.id,
  group: group.name,
  order: index,
  status: index % 5 === 0 ? 'active' : index % 3 === 0 ? 'standby' : 'available',
  tools: defaultToolsFor(name),
  verification: name === 'Verification' || name === 'Fact Verification' ? 'independent' : 'contract',
})))

export const MODEL_DEFINITIONS = [
  { id: 'aetheris-reasoner-32b', name: 'Aetheris Reasoner 32B', type: 'llm', quantization: 'Q4_K_M', sizeGb: 19.6, modalities: ['text', 'structured'], capabilities: ['reasoning', 'planning', 'synthesis', 'code'], local: true, status: 'loaded', latencyMs: 840 },
  { id: 'mistral-small-3.1', name: 'Mistral Small 3.1', type: 'slm', quantization: 'Q5_K_S', sizeGb: 5.1, modalities: ['text'], capabilities: ['routing', 'chat', 'classification', 'translation'], local: true, status: 'loaded', latencyMs: 120 },
  { id: 'llava-vision-7b', name: 'Llava Vision 7B', type: 'vlm', quantization: 'Q4_0', sizeGb: 4.8, modalities: ['text', 'image', 'screen'], capabilities: ['vision', 'screen-understanding', 'document-analysis'], local: true, status: 'standby', latencyMs: 410 },
  { id: 'whisper-large-v3', name: 'Whisper Large v3', type: 'asr', quantization: 'FP16', sizeGb: 3.1, modalities: ['audio'], capabilities: ['transcription', 'speech'], local: true, status: 'standby', latencyMs: 260 },
  { id: 'sdxl-lightning', name: 'SDXL Lightning', type: 'image', quantization: 'FP16', sizeGb: 6.6, modalities: ['text', 'image'], capabilities: ['image-generation', 'diagram-generation'], local: true, status: 'available', latencyMs: 8400 },
  { id: 'local-video-pipeline', name: 'Local Video Pipeline', type: 'video', quantization: 'mixed', sizeGb: 11.4, modalities: ['text', 'image', 'video', 'audio'], capabilities: ['video-generation', 'storyboard', 'editing'], local: true, status: 'available', latencyMs: 18000 },
  { id: 'local-3d-pipeline', name: 'Local 3D Pipeline', type: '3d', quantization: 'mixed', sizeGb: 8.8, modalities: ['text', 'image', '3d'], capabilities: ['geometry', 'materials', 'rigging', 'render'], local: true, status: 'available', latencyMs: 14000 },
  { id: 'local-audio-pipeline', name: 'Local Audio Pipeline', type: 'audio', quantization: 'mixed', sizeGb: 4.2, modalities: ['text', 'audio'], capabilities: ['tts', 'music', 'sound-effects'], local: true, status: 'available', latencyMs: 3200 },

  { id: 'document-factory', name: 'Document Factory', type: 'specialized', quantization: 'mixed', sizeGb: 2.4, modalities: ['text', 'structured'], capabilities: ['pdf', 'docx', 'pptx', 'xlsx', 'formatting'], local: true, status: 'available', latencyMs: 1300 },
]

export const TOOL_DEFINITIONS = [
  { id: 'files', name: 'Files', risk: 'read-write', scope: 'project' },
  { id: 'terminal', name: 'Terminal', risk: 'sandboxed-execution', scope: 'sandbox' },
  { id: 'browser', name: 'Browser', risk: 'network', scope: 'approved-domains' },
  { id: 'git', name: 'Repository / Version Control', risk: 'read-write', scope: 'project' },
  { id: 'python', name: 'Python', risk: 'sandboxed-execution', scope: 'sandbox' },
  { id: 'devices', name: 'Devices', risk: 'physical-control', scope: 'authorized-gateway' },
  { id: 'simulation', name: 'Scientific simulation', risk: 'sandboxed-execution', scope: 'sandbox' },
]

export function findAgent(nameOrId) {
  const query = String(nameOrId).toLowerCase()
  return AGENT_DEFINITIONS.find((agent) => agent.id === query || agent.name.toLowerCase() === query)
}

export function findModel(id) {
  return MODEL_DEFINITIONS.find((model) => model.id === id) || MODEL_DEFINITIONS[1]
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function defaultToolsFor(name) {
  if (name.includes('Browser')) return ['browser']
  if (name.includes('Terminal') || name.includes('Programming') || name.includes('DevOps')) return ['terminal', 'python']
  if (name.includes('File') || name.includes('Document') || name.includes('Repository')) return ['files', 'git']
  if (name.includes('PLC') || name.includes('IoT') || name.includes('Robotics') || name.includes('Automation')) return ['devices', 'simulation']
  if (name.includes('Research') || name.includes('Retrieval') || name.includes('Citation')) return ['files', 'browser']
  if (name.includes('Simulation') || name.includes('Physics') || name.includes('Mathematics') || name.includes('Electrical')) return ['python', 'simulation']
  return ['files']
}
