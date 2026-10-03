import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Bell,
  BookOpen,
  Bot,
  Box,
  Boxes,
  BrainCircuit,
  Cable,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Clock3,
  Code2,
  Command,
  Cpu,
  Database,
  Eye,
  ExternalLink,
  FileText,
  Filter,
  FlaskConical,
  Gauge,
  GitBranch,
  Globe2,
  HardDrive,
  Image,
  KeyRound,
  Layers3,
  Lightbulb,
  ListTodo,
  LockKeyhole,
  Menu,
  Mic,
  Monitor,
  MoreHorizontal,
  Network,
  Paperclip,
  Pause,
  PencilLine,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Send,
  Server,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  TriangleAlert,
  Upload,
  UserRound,
  Video,
  Workflow,
  Wrench,
  X,
  Zap,
} from 'lucide-react'
import './styles.css'
import { createAetherisRuntime } from './runtime/index.js'

const NAV_ITEMS = [
  { id: 'command', label: 'Command center', icon: Command },
  { id: 'workflows', label: 'Workflows', icon: Workflow, count: '04' },
  { id: 'agents', label: 'Agent fabric', icon: Bot, count: '56' },
  { id: 'models', label: 'Model registry', icon: Cpu },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
  { id: 'studio', label: 'Creative studio', icon: Sparkles },
  { id: 'devices', label: 'Devices & system', icon: Monitor },
]

const QUICK_ACTIONS = [
  { label: 'Research a topic', icon: BookOpen, prompt: 'Research a topic and compare the available evidence.' },
  { label: 'Open a project', icon: FolderIcon, prompt: 'Find my project folder and open it.' },
  { label: 'Analyze files', icon: FileText, prompt: 'Analyze the files in my active project and summarize the key findings.' },
  { label: 'Create media', icon: Sparkles, prompt: 'Turn this idea into a visual concept and production plan.' },
]

const INITIAL_TASKS = [
  {
    id: 'RUN-1042',
    title: 'Analyze converter and simulate expected waveform',
    type: 'Engineering workflow',
    status: 'Running',
    progress: 68,
    agents: 5,
    eta: '2m 14s',
    time: '2 min ago',
    color: 'mint',
  },
  {
    id: 'RUN-1041',
    title: 'Aetheris product brief → presentation',
    type: 'Document factory',
    status: 'Awaiting approval',
    progress: 92,
    agents: 3,
    eta: 'Approval needed',
    time: '18 min ago',
    color: 'violet',
  },
  {
    id: 'RUN-1039',
    title: 'Morning project change summary',
    type: 'Scheduled workflow',
    status: 'Completed',
    progress: 100,
    agents: 2,
    eta: 'Complete',
    time: 'Today, 08:00',
    color: 'gold',
  },
  {
    id: 'RUN-1037',
    title: 'Calibrate digital twin from sensor readings',
    type: 'Simulation workflow',
    status: 'Verification',
    progress: 84,
    agents: 7,
    eta: '4m 32s',
    time: 'Yesterday',
    color: 'blue',
  },
]

const INITIAL_ACTIVITY = [
  { icon: BrainCircuit, title: 'God Core decomposed request', detail: '4 capabilities routed · RUN-1042', time: 'Now', tone: 'mint' },
  { icon: FlaskConical, title: 'Simulation sandbox ready', detail: 'Electrical agent · 2.4 GB RAM reserved', time: '38s', tone: 'violet' },
  { icon: ShieldCheck, title: 'Policy check passed', detail: 'Read/write project scope · local only', time: '1m', tone: 'gold' },
  { icon: Eye, title: 'Verification pass started', detail: 'Comparing expected vs actual waveform', time: '2m', tone: 'blue' },
]

const AGENT_GROUPS = [
  {
    name: 'Intelligence',
    tone: 'violet',
    agents: ['Reasoning', 'Planning', 'Problem Solving', 'Strategy', 'Critique', 'Verification', 'Meta-Learning'],
  },
  {
    name: 'Software & digital engineering',
    tone: 'mint',
    agents: ['Software Architecture', 'Programming', 'Debugging', 'Testing', 'DevOps', 'Database', 'Cybersecurity'],
  },
  {
    name: 'Engineering',
    tone: 'gold',
    agents: ['Electrical', 'Electronics', 'Embedded Systems', 'Control Systems', 'Mechanical', 'Robotics', 'Industrial Automation'],
  },
  {
    name: 'Science',
    tone: 'blue',
    agents: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Materials', 'Energy', 'Scientific Research'],
  },
  {
    name: 'Knowledge',
    tone: 'violet',
    agents: ['Research', 'Retrieval / RAG', 'Knowledge Graph', 'Document Analysis', 'Literature Analysis', 'Citation', 'Fact Verification'],
  },
  {
    name: 'Human productivity',
    tone: 'mint',
    agents: ['Writing', 'Teaching', 'Tutoring', 'Translation', 'Productivity', 'Presentation', 'Communication'],
  },
  {
    name: 'Media',
    tone: 'coral',
    agents: ['Image', 'Video', 'Audio', 'Music', '3D', 'Animation', 'Media Editing'],
  },
  {
    name: 'Computer & physical systems',
    tone: 'gold',
    agents: ['Computer Operation', 'Browser Operation', 'Terminal Operation', 'File-System Operation', 'Repository / Version Control', 'IoT / Device Operation', 'PLC / SCADA Operation'],
  },
]

const MODEL_ROWS = [
  { name: 'Aetheris Reasoner 32B', type: 'LLM', quant: 'Q4_K_M', size: '19.6 GB', use: 'Planning · synthesis', status: 'Loaded', accent: 'mint', latency: '840 ms' },
  { name: 'Mistral Small 3.1', type: 'SLM', quant: 'Q5_K_S', size: '5.1 GB', use: 'Fast routing · local chat', status: 'Loaded', accent: 'violet', latency: '120 ms' },
  { name: 'Llava Vision 7B', type: 'VLM', quant: 'Q4_0', size: '4.8 GB', use: 'Screen · image context', status: 'Standby', accent: 'gold', latency: '410 ms' },
  { name: 'Whisper Large v3', type: 'ASR', quant: 'FP16', size: '3.1 GB', use: 'Voice transcription', status: 'Standby', accent: 'blue', latency: '260 ms' },
  { name: 'SDXL Lightning', type: 'Image', quant: 'FP16', size: '6.6 GB', use: 'Image · diagrams', status: 'Available', accent: 'coral', latency: '8.4 s' },
  { name: 'Local 3D Pipeline', type: '3D', quant: 'Mixed', size: '8.8 GB', use: 'Geometry · materials · render', status: 'Available', accent: 'violet', latency: '14.0 s' },
]

const KNOWLEDGE_ITEMS = [
  { title: 'Aetheris Architecture — master brief', meta: 'PDF · 42 pages · indexed 98%', icon: FileText, tone: 'mint' },
  { title: 'EV converter simulation notes', meta: 'Markdown · 18 chunks · updated 2h ago', icon: Code2, tone: 'violet' },
  { title: 'Project Atlas repository', meta: 'Git · 1,248 files · synced today', icon: GitBranch, tone: 'gold' },
  { title: 'Lab sensor readings / Q3', meta: 'CSV · 84k rows · local only', icon: Database, tone: 'blue' },
]

const WORKFLOW_CARDS = [
  { id: 'WF-001', title: 'Engineering analysis', description: 'Research → calculate → simulate → verify', status: 'Active', runs: '12 runs', icon: FlaskConical, tone: 'mint', nodes: ['Research', 'Math', 'Simulation', 'Verify'] },
  { id: 'WF-002', title: 'Document factory', description: 'Outline → write → figures → export', status: 'Awaiting approval', runs: '08 runs', icon: FileText, tone: 'violet', nodes: ['Outline', 'Draft', 'Figures', 'Export'] },
  { id: 'WF-003', title: 'Project change digest', description: 'Observe → summarize → notify', status: 'Scheduled · 08:00', runs: '31 runs', icon: RefreshCw, tone: 'gold', nodes: ['Git', 'Analyze', 'Synthesize', 'Send'] },
  { id: 'WF-004', title: 'Media production', description: 'Concept → storyboard → render → master', status: 'Draft', runs: '03 runs', icon: Sparkles, tone: 'coral', nodes: ['Script', 'Visuals', 'Voice', 'Edit'] },
]

const DEVICE_ITEMS = [
  { name: 'Local workstation', detail: 'Linux · x86_64 · primary runtime', icon: Server, status: 'Online', metric: '42% CPU', tone: 'mint' },
  { name: 'NVIDIA RTX 4080', detail: '16 GB VRAM · CUDA available', icon: Zap, status: 'Available', metric: '38% VRAM', tone: 'violet' },
  { name: 'Project Atlas sandbox', detail: 'Container · scoped filesystem', icon: Box, status: 'Isolated', metric: '2.4 GB', tone: 'gold' },
  { name: 'Lab gateway', detail: 'MQTT · read-only telemetry', icon: Radio, status: 'Connected', metric: '18 sensors', tone: 'blue' },
]

function FolderIcon({ size = 18, strokeWidth = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
      <path d="M3 9h18" />
    </svg>
  )
}

function AetherisMark({ small = false }) {
  return (
    <div className={`brand-mark ${small ? 'small' : ''}`} aria-hidden="true">
      <span className="mark-orbit orbit-one" />
      <span className="mark-orbit orbit-two" />
      <span className="mark-core" />
    </div>
  )
}

function StatusDot({ tone = 'mint', pulse = false }) {
  return <span className={`status-dot ${tone} ${pulse ? 'pulse' : ''}`} />
}

function ToneIcon({ icon: Icon, tone = 'mint', size = 17 }) {
  return <span className={`tone-icon ${tone}`}><Icon size={size} strokeWidth={1.8} /></span>
}

function Pill({ children, tone = 'neutral', icon: Icon, dot = false }) {
  return (
    <span className={`pill ${tone}`}>
      {dot && <StatusDot tone={tone === 'neutral' ? 'muted' : tone} />}
      {Icon && <Icon size={13} strokeWidth={1.8} />}
      {children}
    </span>
  )
}

function Sidebar({ activeView, setActiveView, collapsed, setCollapsed }) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-top">
        <button className="brand" onClick={() => setActiveView('command')} aria-label="Go to command center">
          <AetherisMark />
          <span className="brand-type">AETHERIS<span className="brand-caret">/</span></span>
        </button>
        <button className="collapse-button" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <ChevronRight size={16} /> : <Menu size={17} />}
        </button>
      </div>

      <div className="workspace-select">
        <div className="workspace-avatar">A</div>
        <div className="workspace-copy">
          <span className="overline">ACTIVE PROJECT</span>
          <strong>Aetheris / Core</strong>
        </div>
        <ChevronDown className="workspace-chevron" size={15} />
      </div>

      <div className="nav-label">CONTROL PLANE</div>
      <nav className="primary-nav">
        {NAV_ITEMS.map(({ id, label, icon: Icon, count }) => (
          <button key={id} className={`nav-item ${activeView === id ? 'active' : ''}`} onClick={() => setActiveView(id)}>
            <Icon size={18} strokeWidth={activeView === id ? 2 : 1.7} />
            <span>{label}</span>
            {count && <small>{count}</small>}
            {activeView === id && <span className="nav-active-line" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-spacer" />

      <div className="fabric-status">
        <div className="fabric-status-head">
          <span className="overline">EXECUTION FABRIC</span>
          <StatusDot tone="mint" pulse />
        </div>
        <strong>All systems nominal</strong>
        <div className="fabric-meter"><span /></div>
        <div className="fabric-status-meta"><span>42 / 56 agents online</span><span>98.4%</span></div>
      </div>

      <div className="sidebar-footer">
        <button className="nav-item compact"><Settings2 size={17} /><span>Settings</span></button>
        <div className="user-chip">
          <div className="user-avatar"><UserRound size={15} /></div>
          <div className="user-copy"><strong>Alex Morgan</strong><span>Local administrator</span></div>
          <MoreHorizontal size={16} className="muted-icon" />
        </div>
      </div>
    </aside>
  )
}

function Topbar({ online, setOnline, onNewTask }) {
  return (
    <header className="topbar">
      <div className="breadcrumbs"><span>AETHERIS</span><ChevronRight size={13} /><strong>Command center</strong></div>
      <div className="topbar-actions">
        <button className={`network-toggle ${online ? 'online' : ''}`} onClick={() => setOnline(!online)} title="Toggle network access">
          <span className="network-icon">{online ? <Globe2 size={14} /> : <LockKeyhole size={13} />}</span>
          <span>{online ? 'APPROVED ONLINE' : 'LOCAL ONLY'}</span>
          <span className="toggle-track"><span /></span>
        </button>
        <span className="top-divider" />
        <button className="icon-button notification-button" aria-label="Notifications"><Bell size={17} /><span className="notification-dot" /></button>
        <button className="new-task-button" onClick={onNewTask}><Plus size={16} /> <span>New task</span></button>
      </div>
    </header>
  )
}

function PageHeader({ eyebrow, title, description, action, onAction }) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <button className="secondary-button" onClick={onAction}>{action.icon && <action.icon size={15} />}{action.label}<ArrowUpRight size={14} /></button>}
    </div>
  )
}

function CommandComposer({ value, setValue, onSubmit, onQuickAction, large = false }) {
  const inputRef = useRef(null)
  const submit = () => {
    if (value.trim()) onSubmit()
  }

  return (
    <div className={`command-composer ${large ? 'large' : ''}`}>
      <div className="composer-topline">
        <div className="composer-status"><span className="composer-dot" /><span>GOD CORE</span><span className="slash">/</span><span className="composer-mode">ORCHESTRATOR READY</span></div>
        <div className="composer-tools"><button title="Attach files"><Paperclip size={16} /></button><button title="Voice input"><Mic size={16} /></button></div>
      </div>
      <div className="composer-input-row">
        <Sparkles className="composer-spark" size={21} />
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit() } }}
          placeholder="Ask Aetheris to research, create, analyze, or act…"
          aria-label="Ask Aetheris"
        />
        <button className={`send-button ${value.trim() ? 'ready' : ''}`} onClick={submit} aria-label="Run task"><ArrowRight size={18} /></button>
      </div>
      <div className="composer-footer">
        <span><ShieldCheck size={13} /> Local-first policy active</span>
        <span className="composer-hint"><kbd>↵</kbd> to run</span>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, detail, tone, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-top"><ToneIcon icon={Icon} tone={tone} size={16} /><span className="stat-label">{label}</span><ArrowUpRight size={14} className="stat-arrow" /></div>
      <div className="stat-value-row"><strong>{value}</strong>{trend && <span className={`stat-trend ${trend.positive ? 'positive' : ''}`}>{trend.label}</span>}</div>
      <span className="stat-detail">{detail}</span>
    </div>
  )
}

function QuickAction({ action, onClick }) {
  const Icon = action.icon
  return <button className="quick-action" onClick={() => onClick(action.prompt)}><Icon size={15} /><span>{action.label}</span><Plus size={13} className="quick-plus" /></button>
}

function FoundationStrip({ runtimeSnapshot }) {
  const foundations = runtimeSnapshot?.planes?.slice(0, 10) || []
  return (
    <div className="foundation-strip">
      <div className="foundation-copy"><span className="foundation-live"><StatusDot tone="mint" pulse /> RUNTIME ONLINE</span><strong>First 10 foundations connected</strong></div>
      <div className="foundation-pills">{foundations.map((plane) => <span key={plane.id} title={plane.role}><b>{plane.number}</b>{plane.name.replace(' plane', '')}</span>)}</div>
      <span className="foundation-mode"><LockKeyhole size={12} /> local contracts</span>
    </div>
  )
}

function ArchitecturePhaseStrip({ runtimeSnapshot }) {
  const phases = runtimeSnapshot?.phases || []
  return (
    <div className="phase-strip">
      <div className="phase-copy"><span>11–20 / EXECUTION PLANE</span><strong>Creation, memory, tools, and computer control</strong></div>
      <div className="phase-pills">{phases.map((phase) => <span key={phase.id} title={phase.role}><b>{phase.number}</b>{phase.name}</span>)}</div>
    </div>
  )
}

function ControlPhaseStrip({ runtimeSnapshot }) {
  const phases = runtimeSnapshot?.controlPhases || []
  return (
    <div className="control-phase-strip">
      <div className="control-phase-copy"><span>21–30 / ACTION PLANE</span><strong>System adapters, workflows, and safety</strong></div>
      <div className="control-phase-pills">{phases.map((phase) => <span key={phase.id} title={phase.role}><b>{phase.number}</b>{phase.name}</span>)}</div>
    </div>
  )
}

function ModePhaseStrip({ runtimeSnapshot }) {
  const phases = runtimeSnapshot?.modePhases || []
  return (
    <div className="mode-phase-strip">
      <div className="mode-phase-copy"><span>31–40 / SYSTEM MODES</span><strong>Sandbox, science, education, and trust</strong></div>
      <div className="mode-phase-pills">{phases.map((phase) => <span key={phase.id} title={phase.role}><b>{phase.number}</b>{phase.name}</span>)}</div>
    </div>
  )
}

function GraphNode({ icon: Icon, label, meta, status = 'done', tone = 'neutral' }) {
  return (
    <div className={`graph-node ${status} ${tone}`}>
      <div className="graph-node-icon"><Icon size={16} strokeWidth={1.8} /></div>
      <div className="graph-node-copy"><strong>{label}</strong><span>{meta}</span></div>
      {status === 'done' && <CircleCheck size={14} className="node-check" />}
      {status === 'active' && <span className="node-loader" />}
      {status === 'queued' && <CircleDashed size={14} className="node-queued" />}
    </div>
  )
}

function ExecutionGraph() {
  return (
    <div className="execution-graph">
      <div className="graph-row graph-row-three">
        <GraphNode icon={BrainCircuit} label="Intent" meta="understood" status="done" tone="mint" />
        <span className="graph-connector horizontal"><ArrowRight size={13} /></span>
        <GraphNode icon={Layers3} label="Context" meta="6 sources loaded" status="done" tone="violet" />
        <span className="graph-connector horizontal"><ArrowRight size={13} /></span>
        <GraphNode icon={ShieldCheck} label="Policy" meta="scope approved" status="done" tone="gold" />
      </div>
      <div className="graph-connector vertical"><ArrowRight size={13} /></div>
      <div className="graph-row graph-row-one">
        <GraphNode icon={GitBranch} label="Task planner" meta="RUN-1042 · 7 nodes" status="active" tone="mint" />
      </div>
      <div className="graph-connector vertical"><ArrowRight size={13} /></div>
      <div className="graph-row graph-row-three execution-branches">
        <GraphNode icon={BookOpen} label="Research" meta="3 sources" status="done" tone="violet" />
        <GraphNode icon={FlaskConical} label="Simulation" meta="running · 68%" status="active" tone="mint" />
        <GraphNode icon={Terminal} label="Sandbox" meta="isolated" status="done" tone="gold" />
      </div>
      <div className="graph-branch-line"><span /><span /><span /></div>
      <div className="graph-row graph-row-two final-nodes">
        <GraphNode icon={Eye} label="Verify" meta="checking output" status="active" tone="blue" />
        <span className="graph-connector horizontal"><ArrowRight size={13} /></span>
        <GraphNode icon={Sparkles} label="Synthesize" meta="next" status="queued" tone="violet" />
      </div>
    </div>
  )
}

function PanelHeader({ eyebrow, title, action, actionIcon: ActionIcon = ArrowUpRight }) {
  return (
    <div className="panel-header">
      <div><span className="panel-eyebrow">{eyebrow}</span><h2>{title}</h2></div>
      {action && <button className="panel-action">{action}<ActionIcon size={14} /></button>}
    </div>
  )
}

function ActivityFeed({ items = INITIAL_ACTIVITY }) {
  return (
    <div className="activity-feed">
      {items.map((item, index) => {
        const Icon = item.icon
        return (
          <div className="activity-item" key={`${item.title}-${index}`}>
            <ToneIcon icon={Icon} tone={item.tone} size={16} />
            <div className="activity-copy"><strong>{item.title}</strong><span>{item.detail}</span></div>
            <time>{item.time}</time>
          </div>
        )
      })}
    </div>
  )
}

function TaskStatus({ status }) {
  const icon = status === 'Completed' ? CircleCheck : status === 'Running' ? Activity : status === 'Verification' ? Eye : Clock3
  const tone = status === 'Completed' ? 'mint' : status === 'Running' ? 'blue' : status === 'Verification' ? 'violet' : 'gold'
  const Icon = icon
  return <span className={`task-status ${tone}`}><Icon size={12} />{status}</span>
}

function TaskRow({ task, onSelect }) {
  return (
    <button className="task-row" onClick={() => onSelect(task)}>
      <div className={`task-icon ${task.color}`}><ListTodo size={17} /></div>
      <div className="task-main"><strong>{task.title}</strong><span>{task.id} <i>·</i> {task.type}</span></div>
      <div className="task-progress"><div className="progress-track"><span style={{ width: `${task.progress}%` }} /></div><small>{task.progress}%</small></div>
      <div className="task-agents"><Bot size={13} /> {task.agents}</div>
      <TaskStatus status={task.status} />
      <ChevronRight size={15} className="task-chevron" />
    </button>
  )
}

function runtimeTaskToRow(task) {
  const color = task.status === 'Completed' ? 'mint' : task.status === 'Awaiting approval' ? 'gold' : task.intent === 'creation' ? 'coral' : 'mint'
  return {
    id: task.id,
    title: task.objective,
    type: `${task.intent} orchestration`,
    status: task.status,
    progress: task.progress,
    agents: task.agents,
    eta: task.status === 'Completed' ? 'Complete' : 'live',
    time: 'Now',
    color,
    runtimeTask: task,
  }
}

function Dashboard({ command, setCommand, runCommand, setActiveView, tasks, onSelectTask, runtimeSnapshot }) {
  const [activityItems, setActivityItems] = useState(INITIAL_ACTIVITY)
  const handleSubmit = () => {
    const text = command.trim()
    if (!text) return
    setActivityItems((current) => [{ icon: Sparkles, title: 'New task accepted by God Core', detail: text, time: 'Now', tone: 'mint' }, ...current].slice(0, 4))
    runCommand(text)
  }
  const handleQuickAction = (prompt) => setCommand(prompt)

  return (
    <div className="page-content dashboard-page">
      <PageHeader
        eyebrow="UNIVERSAL CONTROL PLANE / LOCAL SESSION"
        title={<>What should we <em>orchestrate?</em></>}
        description="One conversational surface for every capability, model, tool, and workflow in your environment."
        action={{ label: 'View execution trace', icon: Activity }}
        onAction={() => onSelectTask(tasks[0])}
      />

      <CommandComposer value={command} setValue={setCommand} onSubmit={handleSubmit} onQuickAction={handleQuickAction} large />
      <FoundationStrip runtimeSnapshot={runtimeSnapshot} />
      <ArchitecturePhaseStrip runtimeSnapshot={runtimeSnapshot} />
      <ControlPhaseStrip runtimeSnapshot={runtimeSnapshot} />
      <ModePhaseStrip runtimeSnapshot={runtimeSnapshot} />
      <div className="quick-actions"><span className="quick-label">TRY A COMMAND</span>{QUICK_ACTIONS.map((action) => <QuickAction key={action.label} action={action} onClick={handleQuickAction} />)}</div>

      <div className="stats-grid">
        <StatCard icon={Activity} label="Active run" value="01" detail="RUN-1042 · 2m 14s remaining" tone="mint" trend={{ label: '+1 today', positive: true }} />
        <StatCard icon={Bot} label="Agent fabric" value="42 / 56" detail="Capabilities online and available" tone="violet" trend={{ label: '75%', positive: true }} />
        <StatCard icon={Cpu} label="Model fabric" value="09" detail="3 loaded · 6 ready on demand" tone="gold" trend={{ label: 'LOCAL', positive: true }} />
        <StatCard icon={ShieldCheck} label="Trust score" value="98.4%" detail="Last policy audit · 4 min ago" tone="blue" trend={{ label: 'Healthy', positive: true }} />
      </div>

      <div className="dashboard-grid">
        <section className="panel execution-panel">
          <PanelHeader eyebrow="LIVE EXECUTION / RUN-1042" title="Engineering analysis" action="Open full trace" />
          <div className="run-summary"><div className="run-summary-copy"><span className="live-badge"><StatusDot tone="mint" pulse /> LIVE</span><strong>Analyze converter and simulate expected waveform</strong><span>God Core is coordinating 5 specialist capabilities across a local sandbox.</span></div><div className="run-summary-metric"><strong>68%</strong><span>overall progress</span></div></div>
          <ExecutionGraph />
          <div className="graph-footer"><span><span className="legend-dot mint" /> Complete</span><span><span className="legend-dot blue" /> In progress</span><span><span className="legend-dot muted" /> Queued</span><span className="trace-id">TRACE ID <b>ax-7f3c91</b></span></div>
        </section>
        <section className="panel activity-panel">
          <PanelHeader eyebrow="OBSERVABILITY" title="Live activity" action="See all" />
          <ActivityFeed items={activityItems} />
          <div className="resource-card"><div className="resource-heading"><span>RESOURCE MANAGER</span><Gauge size={14} /></div><div className="resource-bars"><ResourceBar label="CPU" value="42%" width="42%" tone="mint" /><ResourceBar label="GPU" value="38%" width="38%" tone="violet" /><ResourceBar label="RAM" value="61%" width="61%" tone="gold" /></div><div className="resource-footer"><span><Zap size={12} /> 186 W · balanced</span><span>LOCAL RUNTIME</span></div></div>
        </section>
      </div>

      <section className="panel tasks-panel">
        <PanelHeader eyebrow="TASK STATE / RESUMABLE" title="Recent orchestration" action="Open task history" />
        <div className="task-table-head"><span>OBJECTIVE</span><span>PROGRESS</span><span>AGENTS</span><span>STATE</span><span /></div>
        <div className="task-list">{tasks.map((task) => <TaskRow task={task} key={task.id} onSelect={onSelectTask} />)}</div>
      </section>

      <div className="bottom-grid">
        <section className="panel compact-panel fabric-panel">
          <PanelHeader eyebrow="MODEL FABRIC" title="Routing intelligence" action="Registry" />
          <div className="fabric-flow"><div className="fabric-node active"><Cpu size={17} /><span>Task classifier</span></div><ArrowRight size={15} /><div className="fabric-node"><SlidersHorizontal size={17} /><span>Model router</span></div><ArrowRight size={15} /><div className="fabric-node"><Zap size={17} /><span>Inference</span></div></div>
          <div className="fabric-tags"><Pill tone="mint" dot>Privacy first</Pill><Pill tone="neutral">Latency aware</Pill><Pill tone="neutral">RAM fit</Pill></div>
        </section>
        <section className="panel compact-panel memory-panel">
          <PanelHeader eyebrow="MEMORY FABRIC" title="Project context" action="Manage memory" />
          <div className="memory-stats"><MemoryMetric label="Working" value="12" detail="items" icon={Activity} tone="mint" /><MemoryMetric label="Episodic" value="284" detail="events" icon={Clock3} tone="violet" /><MemoryMetric label="Semantic" value="8.4k" detail="chunks" icon={BookOpen} tone="gold" /><MemoryMetric label="Procedural" value="36" detail="strategies" icon={Wrench} tone="blue" /></div>
        </section>
      </div>
    </div>
  )
}

function ResourceBar({ label, value, width, tone }) {
  return <div className="resource-row"><span>{label}</span><div className="resource-track"><span className={tone} style={{ width }} /></div><strong>{value}</strong></div>
}

function MemoryMetric({ label, value, detail, icon: Icon, tone }) {
  return <div className="memory-metric"><ToneIcon icon={Icon} tone={tone} size={14} /><div><strong>{value}</strong><span>{label} <i>·</i> {detail}</span></div></div>
}

function WorkflowsView({ setActiveView, openTask }) {
  return (
    <div className="page-content">
      <PageHeader eyebrow="WORKFLOW ENGINE / DAG + TASKS + JOBS" title="Orchestrate repeatable work" description="Compose capabilities into observable, resumable workflows with approvals, retries, and verification." action={{ label: 'Create workflow', icon: Plus }} onAction={() => openTask({ id: 'DRAFT-NEW', title: 'New workflow', status: 'Draft', progress: 0, agents: 0, type: 'Workflow builder', color: 'mint' })} />
      <div className="workflow-toolbar"><div className="search-box"><Search size={16} /><input placeholder="Search workflows" /></div><div className="toolbar-actions"><button className="filter-button"><Filter size={15} /> All states <ChevronDown size={13} /></button><button className="filter-button"><SlidersHorizontal size={15} /> Sort by recent</button></div></div>
      <div className="workflow-grid">{WORKFLOW_CARDS.map((workflow) => <WorkflowCard key={workflow.id} workflow={workflow} onClick={() => openTask({ ...workflow, title: workflow.title, type: 'Workflow graph', status: workflow.status === 'Active' ? 'Running' : workflow.status, progress: workflow.status === 'Draft' ? 0 : 72, agents: workflow.nodes.length, color: workflow.tone })} />)}</div>
      <section className="panel workflow-detail-panel"><PanelHeader eyebrow="SELECTED WORKFLOW / WF-001" title="Engineering analysis" action="Edit graph" /><div className="workflow-detail"><div className="workflow-pipeline">{['Research', 'Calculate', 'Simulate', 'Verify', 'Report'].map((step, i) => <React.Fragment key={step}><div className={`pipeline-step ${i < 3 ? 'complete' : i === 3 ? 'active' : ''}`}><span>{i < 3 ? <Check size={14} /> : i === 3 ? <Activity size={14} /> : i + 1}</span><strong>{step}</strong><small>{i < 3 ? 'complete' : i === 3 ? 'running' : 'queued'}</small></div>{i < 4 && <ArrowRight size={14} className="pipeline-arrow" />}</React.Fragment>)}</div><div className="workflow-detail-foot"><span><ShieldCheck size={14} /> Human approval before external action</span><span><RefreshCw size={14} /> Retry policy · 2 attempts</span><span><Clock3 size={14} /> Timeout · 15 minutes</span></div></div></section>
    </div>
  )
}

function WorkflowCard({ workflow, onClick }) {
  const Icon = workflow.icon
  return <button className="workflow-card" onClick={onClick}><div className="workflow-card-top"><ToneIcon icon={Icon} tone={workflow.tone} size={18} /><span className={`workflow-state ${workflow.status.toLowerCase().replaceAll(' ', '-')}`}>{workflow.status}</span><MoreHorizontal size={16} className="muted-icon" /></div><h3>{workflow.title}</h3><p>{workflow.description}</p><div className="workflow-mini-graph">{workflow.nodes.map((node, i) => <React.Fragment key={node}><span className={i < 2 ? 'lit' : ''}>{node}</span>{i < workflow.nodes.length - 1 && <ArrowRight size={11} />}</React.Fragment>)}</div><div className="workflow-card-foot"><span>{workflow.id}</span><span>{workflow.runs}</span><ChevronRight size={14} /></div></button>
}

function AgentsView() {
  const [query, setQuery] = useState('')
  const allAgents = useMemo(() => AGENT_GROUPS.flatMap((group) => group.agents.map((name, index) => ({ name, group: group.name, tone: group.tone, state: index % 5 === 0 ? 'Active' : index % 3 === 0 ? 'Standby' : 'Available' }))), [])
  const filtered = allAgents.filter((agent) => `${agent.name} ${agent.group}`.toLowerCase().includes(query.toLowerCase()))
  return (
    <div className="page-content">
      <PageHeader eyebrow="AGENT PLANE / 56 SPECIALIST CAPABILITIES" title="The agent fabric" description="Capabilities are activated on demand. One model can power many specialists; each agent brings its own tools, memory, and verification contract." action={{ label: 'Agent SDK', icon: Code2 }} />
      <div className="agent-overview"><div className="agent-overview-main"><div className="agent-ring"><span>42</span><small>online</small></div><div><span className="panel-eyebrow">FABRIC STATUS</span><h2>All capabilities are available</h2><p>God Core will activate only the specialists required for the current task.</p><div className="agent-bar"><span style={{ width: '75%' }} /></div><div className="agent-meta"><span>42 online</span><span>11 standby</span><span>3 unavailable</span></div></div></div><div className="agent-overview-side"><div><span>ACTIVE TEAMS</span><strong>06</strong></div><div><span>AVG. HANDOFF</span><strong>184ms</strong></div><div><span>VERIFICATION</span><strong>100%</strong></div></div></div>
      <div className="agent-toolbar"><div className="search-box wide"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search 56 capabilities" /></div><div className="toolbar-note"><span className="status-dot mint pulse" /> live registry <span className="slash">/</span> auto-routing enabled</div></div>
      <div className="agent-grid">{filtered.map((agent, index) => <div className="agent-card" key={agent.name}><div className="agent-card-top"><ToneIcon icon={agentIcon(agent.name)} tone={agent.tone} size={17} /><span className={`agent-state ${agent.state.toLowerCase()}`}><StatusDot tone={agent.state === 'Active' ? 'mint' : agent.state === 'Standby' ? 'gold' : 'muted'} />{agent.state}</span></div><strong>{agent.name}</strong><span>{agent.group}</span><div className="agent-card-foot"><span>Tools scoped</span><span>v1.4</span></div></div>)}</div>
    </div>
  )
}

function agentIcon(name) {
  if (name.includes('Research') || name.includes('Analysis') || name.includes('Literature') || name.includes('Citation')) return BookOpen
  if (name.includes('Engineering') || name.includes('Electrical') || name.includes('Physics') || name.includes('Energy')) return Zap
  if (name.includes('Programming') || name.includes('Software') || name.includes('Debug') || name.includes('Code') || name.includes('Repository')) return Code2
  if (name.includes('File') || name.includes('Document') || name.includes('Writing')) return FileText
  if (name.includes('Robot') || name.includes('Device') || name.includes('PLC') || name.includes('Automation')) return Cable
  if (name.includes('Image')) return Image
  if (name.includes('Video')) return Video
  if (name.includes('Audio') || name.includes('Music')) return AudioLines
  return BrainCircuit
}

function ModelsView() {
  return (
    <div className="page-content">
      <PageHeader eyebrow="MODEL PLANE / REGISTRY + ROUTING" title="Choose the right intelligence" description="A model-agnostic fabric that balances capability, privacy, latency, resource fit, and availability for every task." action={{ label: 'Add model', icon: Plus }} />
      <div className="model-health-grid"><div className="model-health-card"><div className="model-health-icon mint"><Cpu size={18} /></div><div><span>LOCAL RUNTIME</span><strong>Ready</strong><small>llama.cpp · CUDA 12.4</small></div><StatusDot tone="mint" pulse /></div><div className="model-health-card"><div className="model-health-icon violet"><HardDrive size={18} /></div><div><span>MEMORY BUDGET</span><strong>31.2 / 64 GB</strong><small>48.7% allocated</small></div><StatusDot tone="violet" /></div><div className="model-health-card"><div className="model-health-icon gold"><Gauge size={18} /></div><div><span>ROUTER LATENCY</span><strong>184 ms</strong><small>p95 over last 24h</small></div><StatusDot tone="gold" /></div><div className="model-health-card"><div className="model-health-icon blue"><Globe2 size={18} /></div><div><span>REMOTE MODELS</span><strong>Disabled</strong><small>Local-only policy active</small></div><LockKeyhole size={15} className="muted-icon" /></div></div>
      <section className="panel model-table-panel"><PanelHeader eyebrow="INSTALLED MODELS / 09 TOTAL" title="Model registry" action="Routing rules" /><div className="model-table"><div className="model-table-head"><span>MODEL</span><span>TYPE / QUANTIZATION</span><span>SIZE</span><span>PRIMARY USE</span><span>STATUS</span><span>LATENCY</span></div>{MODEL_ROWS.map((model) => <ModelRow key={model.name} model={model} />)}</div><button className="load-more"><Plus size={14} /> Show 3 more installed models</button></section>
      <div className="model-bottom-grid"><section className="panel routing-panel"><PanelHeader eyebrow="ROUTING POLICY" title="Why this model?" /><div className="routing-factors"><Factor label="Capability match" value="94%" width="94%" tone="mint" /><Factor label="Resource fit" value="88%" width="88%" tone="violet" /><Factor label="Privacy" value="100%" width="100%" tone="gold" /></div><p className="muted-paragraph">The router selected <strong>Aetheris Reasoner 32B</strong> for the active engineering workflow because it fits the local VRAM budget and policy.</p></section><section className="panel model-note-panel"><div className="quote-mark">“</div><p>Models are replaceable. The control plane, memory, tools, and verification contracts are the durable system.</p><span>— Aetheris architecture principle</span></section></div>
    </div>
  )
}

function ModelRow({ model }) {
  return <div className="model-row"><div className="model-name"><ToneIcon icon={model.type === 'Image' ? Image : model.type === '3D' ? Box : model.type === 'ASR' ? AudioLines : model.type === 'VLM' ? Eye : Cpu} tone={model.accent} size={17} /><strong>{model.name}</strong></div><div className="model-type"><span>{model.type}</span><small>{model.quant}</small></div><span className="model-size">{model.size}</span><span className="model-use">{model.use}</span><span className={`model-status ${model.status.toLowerCase()}`}><StatusDot tone={model.status === 'Loaded' ? 'mint' : model.status === 'Standby' ? 'gold' : 'muted'} />{model.status}</span><span className="model-latency">{model.latency}</span><MoreHorizontal size={16} className="muted-icon" /></div>
}

function Factor({ label, value, width, tone }) {
  return <div className="factor"><div><span>{label}</span><strong>{value}</strong></div><div className="factor-track"><span className={tone} style={{ width }} /></div></div>
}

function KnowledgeView() {
  return (
    <div className="page-content">
      <PageHeader eyebrow="MEMORY + KNOWLEDGE PLANE / LOCAL RAG" title="Give Aetheris context" description="Working, episodic, semantic, and procedural memory unified with a searchable local knowledge fabric." action={{ label: 'Ingest source', icon: Upload }} />
      <div className="knowledge-hero"><div className="knowledge-hero-copy"><div className="knowledge-pulse"><span /><span /><span /></div><span className="panel-eyebrow">KNOWLEDGE FABRIC</span><h2>Everything your project knows, connected.</h2><p>Sources are parsed, chunked, embedded, and linked into retrieval and graph indexes before they reach God Core.</p><div className="knowledge-hero-actions"><button className="primary-small"><Upload size={14} /> Add knowledge</button><button className="text-button">Explore graph <ArrowRight size={14} /></button></div></div><div className="knowledge-visual"><div className="knowledge-orbit orbit-a" /><div className="knowledge-orbit orbit-b" /><div className="knowledge-center"><Database size={22} /><span>RAG</span></div><div className="knowledge-node node-a"><FileText size={14} /></div><div className="knowledge-node node-b"><Image size={14} /></div><div className="knowledge-node node-c"><Code2 size={14} /></div><div className="knowledge-node node-d"><BookOpen size={14} /></div></div></div>
      <div className="memory-fabric-grid"><MemoryFabricCard title="Working memory" value="12" detail="active task items" icon={Activity} tone="mint" items={['RUN-1042 context', 'Current permission scope', 'Open project files']} /><MemoryFabricCard title="Episodic memory" value="284" detail="past events" icon={Clock3} tone="violet" items={['Last engineering session', 'Yesterday’s project search', 'Morning digest run']} /><MemoryFabricCard title="Semantic memory" value="8.4k" detail="indexed chunks" icon={BookOpen} tone="gold" items={['Architecture principles', 'Converter notes', 'Research sources']} /><MemoryFabricCard title="Procedural memory" value="36" detail="learned strategies" icon={Wrench} tone="blue" items={['How to verify simulations', 'Local document workflow', 'Safe file operations']} /></div>
      <section className="panel sources-panel"><PanelHeader eyebrow="INGESTED SOURCES / 1,942 ITEMS" title="Project knowledge" action="Open index" /><div className="sources-list">{KNOWLEDGE_ITEMS.map((item) => <div className="source-row" key={item.title}><ToneIcon icon={item.icon} tone={item.tone} size={17} /><div><strong>{item.title}</strong><span>{item.meta}</span></div><div className="source-indexed"><CircleCheck size={14} /> indexed</div><MoreHorizontal size={16} className="muted-icon" /></div>)}</div></section>
    </div>
  )
}

function MemoryFabricCard({ title, value, detail, icon: Icon, tone, items }) {
  return <div className="memory-fabric-card"><div className="memory-fabric-top"><ToneIcon icon={Icon} tone={tone} size={17} /><span>{title}</span><MoreHorizontal size={15} className="muted-icon" /></div><div className="memory-big-value"><strong>{value}</strong><span>{detail}</span></div><div className="memory-item-list">{items.map((item) => <span key={item}><span className={`memory-item-dot ${tone}`} />{item}</span>)}</div></div>
}

function StudioView() {
  const [studioTab, setStudioTab] = useState('All assets')
  return (
    <div className="page-content">
      <PageHeader eyebrow="CREATION PLANE / MULTIMODAL STUDIO" title="Make something remarkable" description="One creative workspace for writing, visuals, audio, video, diagrams, documents, and 3D assets." action={{ label: 'New creation', icon: Plus }} />
      <div className="studio-command"><div className="studio-command-icon"><Sparkles size={20} /></div><div><span className="panel-eyebrow">CREATIVE DIRECTOR</span><strong>Describe what you want to make</strong><small>Aetheris will plan the pipeline, select models, and keep the output coherent.</small></div><button className="primary-small">Start creating <ArrowRight size={14} /></button></div>
      <div className="studio-tabs">{['All assets', 'Images', 'Video', 'Audio', 'Documents'].map((tab) => <button key={tab} className={studioTab === tab ? 'active' : ''} onClick={() => setStudioTab(tab)}>{tab}</button>)}<span className="studio-tab-count">12 assets</span></div>
      <div className="asset-grid"><AssetCard tone="mint" type="DIAGRAM" title="Universal AIOS architecture" meta="Generated 12 min ago" icon={Layers3} /><AssetCard tone="violet" type="PRESENTATION" title="Aetheris product brief" meta="12 slides · draft" icon={FileText} /><AssetCard tone="gold" type="SIMULATION PLOT" title="Converter waveform / v2" meta="Generated 2 hours ago" icon={Activity} /><AssetCard tone="blue" type="AUDIO" title="Five-minute project speech" meta="Voice · 04:58" icon={AudioLines} /><AssetCard tone="coral" type="IMAGE" title="Industrial digital twin" meta="Generated yesterday" icon={Image} /><AssetCard tone="mint" type="DOCUMENT" title="Verification report" meta="PDF · 18 pages" icon={FileText} /></div>
    </div>
  )
}

function AssetCard({ tone, type, title, meta, icon: Icon }) {
  return <button className={`asset-card ${tone}`}><div className="asset-art"><div className="asset-art-lines" /><div className="asset-art-icon"><Icon size={25} /></div><span className="asset-art-label">{type}</span></div><div className="asset-card-copy"><strong>{title}</strong><span>{meta}</span></div><ArrowUpRight size={15} className="asset-arrow" /></button>
}

function DevicesView() {
  const [armed, setArmed] = useState(false)
  return (
    <div className="page-content">
      <PageHeader eyebrow="COMPUTER-CONTROL + HARDWARE PLANE" title="Your environment, understood" description="A cross-platform system abstraction for files, apps, terminal, browser, devices, and physical systems—with policy before action." action={{ label: 'System scan', icon: RefreshCw }} />
      <div className="system-banner"><div className="system-banner-mark"><Monitor size={20} /></div><div><span className="panel-eyebrow">PRIMARY RUNTIME</span><h2>Local workstation is healthy</h2><p>Linux · x86_64 · 64 GB RAM · NVIDIA RTX 4080 · 1.8 TB available</p></div><div className="system-banner-status"><StatusDot tone="mint" pulse /><strong>ONLINE</strong><span>last scan 2m ago</span></div></div>
      <div className="device-grid">{DEVICE_ITEMS.map((device) => <DeviceCard key={device.name} device={device} />)}</div>
      <div className="device-bottom-grid"><section className="panel permission-panel"><PanelHeader eyebrow="SECURITY / POLICY / CONSENT" title="Action guardrails" action="Review policy" /><div className="permission-levels">{['Reasoning', 'Read-only', 'Create / edit', 'Sandbox', 'Network', 'Automation', 'Devices'].map((level, i) => <div key={level} className={`permission-level ${i < 4 ? 'enabled' : ''}`}><span>{i}</span><strong>{level}</strong>{i < 4 ? <Check size={13} /> : <LockKeyhole size={13} />}</div>)}</div><div className="permission-note"><ShieldCheck size={15} /><span>Destructive operations require explicit confirmation. Industrial actions remain locked until authorized.</span></div></section><section className="panel control-panel"><PanelHeader eyebrow="PHYSICAL SYSTEMS" title="Safe control mode" /><div className="control-mode"><div className="control-mode-icon"><LockKeyhole size={20} /></div><div><strong>{armed ? 'Authorized gateway armed' : 'Read-only by default'}</strong><span>{armed ? 'Device actions are available for approved scopes.' : 'Telemetry can be observed. Actions need a deliberate unlock.'}</span></div><button className={`arm-button ${armed ? 'armed' : ''}`} onClick={() => setArmed(!armed)}>{armed ? 'Disarm' : 'Authorize'}</button></div><div className="device-protocols"><span><Cable size={13} /> OPC-UA</span><span><Radio size={13} /> MQTT</span><span><Network size={13} /> Modbus</span></div></section></div>
    </div>
  )
}

function DeviceCard({ device }) {
  const Icon = device.icon
  return <div className="device-card"><div className={`device-icon ${device.tone}`}><Icon size={19} /></div><div className="device-copy"><strong>{device.name}</strong><span>{device.detail}</span></div><div className="device-status"><span><StatusDot tone={device.tone} />{device.status}</span><strong>{device.metric}</strong></div><MoreHorizontal size={16} className="muted-icon" /></div>
}

function TaskDrawer({ task, onClose, onPause, onApprove }) {
  if (!task) return null
  const isDraft = task.status === 'Draft'
  const awaitingApproval = task.status === 'Awaiting approval'
  return <div className="drawer-backdrop" onClick={onClose}><aside className="task-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-head"><div><span className="panel-eyebrow">TASK TRACE / {task.id}</span><h2>{task.title}</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><div className="drawer-state"><TaskStatus status={isDraft || awaitingApproval ? 'Awaiting approval' : task.status} /><span><Clock3 size={13} /> updated just now</span></div><div className="drawer-progress"><div><span>Overall progress</span><strong>{task.progress || 0}%</strong></div><div className="progress-track large"><span style={{ width: `${task.progress || 0}%` }} /></div></div><div className="drawer-section"><span className="panel-eyebrow">EXECUTION TRACE</span><div className="drawer-timeline"><TimelineItem title="Intent understood" detail="User request mapped to capabilities" done /><TimelineItem title="Policy evaluated" detail={awaitingApproval ? 'Waiting for explicit user approval' : 'Local project scope approved'} done={!awaitingApproval} active={awaitingApproval} /><TimelineItem title="Specialists delegated" detail={`${task.agents || 0} agents activated`} done={!isDraft && !awaitingApproval} active={isDraft} /><TimelineItem title="Execution + observation" detail="Waiting for downstream output" active={!isDraft && !awaitingApproval} /><TimelineItem title="Verification" detail="Independent quality checks" /></div></div><div className="drawer-section"><span className="panel-eyebrow">RESOURCES</span><div className="drawer-resource-list"><span><Bot size={14} /> Agents <b>{task.agents || 0}</b></span><span><Cpu size={14} /> Models <b>03</b></span><span><Wrench size={14} /> Tools <b>06</b></span><span><ShieldCheck size={14} /> Policy <b>{awaitingApproval ? 'hold' : 'pass'}</b></span></div></div><div className="drawer-footer">{awaitingApproval && <button className="primary-small" onClick={() => onApprove(task.id)}><ShieldCheck size={14} /> Approve & continue</button>}{!isDraft && !awaitingApproval && <button className="secondary-button" onClick={onPause}><Pause size={14} /> Pause run</button>}<button className={awaitingApproval ? 'secondary-button' : 'primary-small'} onClick={onClose}>{isDraft ? 'Open workflow builder' : awaitingApproval ? 'Keep paused' : 'Close trace'} <ArrowRight size={14} /></button></div></aside></div>
}

function TimelineItem({ title, detail, done, active }) {
  return <div className={`timeline-item ${done ? 'done' : ''} ${active ? 'active' : ''}`}><div className="timeline-marker">{done ? <Check size={12} /> : active ? <span /> : null}</div><div><strong>{title}</strong><span>{detail}</span></div></div>
}

function App() {
  const runtime = useMemo(() => createAetherisRuntime({ projectId: 'aetheris-core', projectName: 'Aetheris / Core' }), [])
  const [activeView, setActiveView] = useState('command')
  const [collapsed, setCollapsed] = useState(false)
  const [online, setOnline] = useState(false)
  const [command, setCommand] = useState('')
  const [tasks, setTasks] = useState(INITIAL_TASKS)
  const [selectedTask, setSelectedTask] = useState(null)
  const [runtimeSnapshot, setRuntimeSnapshot] = useState(() => runtime.snapshot())
  const [toast, setToast] = useState(null)

  useEffect(() => {
    return runtime.subscribe((event) => {
      setRuntimeSnapshot(runtime.snapshot())
      if (event.task) {
        const row = runtimeTaskToRow(event.task)
        setTasks((current) => {
          const exists = current.some((task) => task.id === row.id)
          return exists ? current.map((task) => task.id === row.id ? row : task) : [row, ...current]
        })
        setSelectedTask((current) => current?.id === row.id ? row : current)
      }
    })
  }, [runtime])

  useEffect(() => {
    runtime.setOnline(online)
  }, [online, runtime])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(timer)
  }, [toast])

  const runCommand = (text) => {
    const runtimeTask = runtime.submit(text, { context: { source: 'command-center', network: online } })
    const row = runtimeTaskToRow(runtimeTask)
    setTasks((current) => current.some((task) => task.id === row.id) ? current : [row, ...current])
    setCommand('')
    setToast({ title: runtimeTask.status === 'Awaiting approval' ? 'Approval required' : 'Task accepted', detail: `${runtimeTask.id} is being coordinated by God Core.` })
  }

  const openNewTask = () => {
    setActiveView('command')
    setTimeout(() => document.querySelector('.command-composer input')?.focus(), 0)
  }

  const openTask = (task) => setSelectedTask(task)

  const renderView = () => {
    switch (activeView) {
      case 'workflows': return <WorkflowsView setActiveView={setActiveView} openTask={openTask} />
      case 'agents': return <AgentsView />
      case 'models': return <ModelsView />
      case 'knowledge': return <KnowledgeView />
      case 'studio': return <StudioView />
      case 'devices': return <DevicesView />
      default: return <Dashboard command={command} setCommand={setCommand} runCommand={runCommand} setActiveView={setActiveView} tasks={tasks} onSelectTask={openTask} runtimeSnapshot={runtimeSnapshot} />
    }
  }

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} setActiveView={setActiveView} collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className="main-shell">
        <Topbar online={online} setOnline={setOnline} onNewTask={openNewTask} />
        <div className="page-scroll">{renderView()}</div>
      </main>
      <TaskDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onPause={() => setToast({ title: 'Run paused', detail: 'The task checkpoint is safe to resume.' })}
        onApprove={(taskId) => {
          runtime.approve(taskId)
          setToast({ title: 'Approval recorded', detail: `${taskId} is continuing through the execution graph.` })
        }}
      />
      {toast && <div className="toast"><div className="toast-icon"><CircleCheck size={16} /></div><div><strong>{toast.title}</strong><span>{toast.detail}</span></div><button onClick={() => setToast(null)}><X size={14} /></button></div>}
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
