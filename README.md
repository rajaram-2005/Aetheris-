# Aetheris

Aetheris is a local-first universal AIOS control-plane prototype. The interface treats chat as the control surface and exposes the execution plane behind it: God Core orchestration, specialist capabilities, model routing, memory and knowledge, multimodal creation, computer control, policy, and verification.

## Run locally

```bash
npm install
npm run dev
```

Then open the Vite URL shown in the terminal.

### Secure full coding-agent gateway

The coding-agent UI never accepts or embeds provider secrets. Each installation configures its own server-side credential:

```bash
cp .env.example .env
# Set AETHERIS_API_KEY or AETHERIS_API_KEY_FILE and AETHERIS_API_BASE_URL in .env
npm run agent:server
npm run dev
```

The browser calls `/api/agent`; the local gateway adds the provider authorization header server-side. For a multi-user deployment, keep one provider credential in the server secret manager and issue authenticated user sessions—do not distribute one shared key in the installer or frontend bundle. Rotate any credential that has been pasted into chat, source code, screenshots, or logs.


## Included in this prototype

- Command center with a God Core task composer and quick actions
- Live execution graph with intent, context, policy, planning, specialist branches, and verification
- Observable, resumable task history with trace drawer
- Workflow engine dashboard for DAG-style workflows and approvals
- Agent fabric registry for all 56 specialist capabilities
- Model registry with local routing and resource-fit signals
- Knowledge and memory fabric views for RAG, episodic, semantic, and procedural memory
- Multimodal creative studio for generated assets
- Cross-platform device and system abstraction with permission levels and safe-control mode
- Local-only / approved-online runtime toggle
- Responsive layout for desktop and mobile
- First implementation slice of sections 1–10: plane registry, conversation understanding, God Core orchestration, dependency-aware task graph, 56-agent registry, model routing/registry, and multimodal pipeline planning
- In-browser runtime events for task creation, policy gating, agent/model delegation, verification, synthesis, and completion
- Sections 11–20: image/video/audio/3D pipelines, document factory, memory and knowledge fabrics, meta-learning strategy memory, universal tool permissions, and the observe → act → verify computer-control contract
- Sections 21–30: cross-platform Windows/Linux/macOS adapters, universal terminal, application and file control, browser control, code/project work, workflow engine, agent swarms, computer-use loop, and layered security policy
- Sections 31–40: sandbox runtime, industrial/IoT gateway, digital twin, scientific mode, education mode, creative studio, research mode, verification engine, self-healing workflows, and observability ledger
- Sections 41–50: resource manager, first-class offline/online modes, plugin/MCP fabric, developer SDK contracts, universal API, data layer, training fabric, and continual improvement without automatic weight updates
- Sections 51–62: resumable task state, project context, command catalog, execution loop, hardware/deployment modes, layered safety architecture, and the complete Universal AIOS environment

The runtime also includes a model-knowledge consolidation fabric: local model metadata and verified model outputs are attributed, deduplicated, cross-checked, and written into the knowledge and memory fabrics. An offline journal applies task and model-memory updates locally. It intentionally does not merge model weights automatically; the installed model files and explicit distillation/training data remain separate.

The Creative Studio includes local-only image, video, audio, 3D, and document pipeline adapters with real local preview assets. Image previews are stored under `public/media`; audio includes an offline WAV preview. Full local inference still depends on the installed model runtimes and hardware adapters.

The MCP toolbox exposes 57 permissioned tools across 26 in-process servers covering every plane: chat, experience input, language detection, native intelligence, 150-phase lifecycle, memory, knowledge, models, media, files, terminal, browser, applications, workflows, agents, science, education, research, verification, safety, hardware, industrial telemetry, digital twins, plugins, training, data, and observability. Phase runs can be observed, advanced one phase at a time, or run continuously to completion. Every invocation returns a structured audit envelope and respects local-only, sandbox, network, device, and industrial policy. The MCP console supports server filtering, favorite tools, JSON argument editing, one-call approvals, live structured responses, and local audit updates.

Task runs are now operationally controllable: pause at a safe checkpoint, resume from the last checkpoint, cancel and release resources, or control the same lifecycle through `/tasks`, `/tools`, and `/mcp` API requests. Local task state and audit events remain resumable without storing private chain-of-thought.

The Plugin Market now includes a local-first plugin registry with MCP, SDK, API, WASM, and LOCAL protocol metadata; manifest validation; capability and scope declarations; trust labels; install, enable, disable, and uninstall lifecycle controls; local persistence; invocation auditing; and a developer manifest builder. Network, device, and industrial scopes remain explicitly gated, and built-in plugins cannot be removed.

Aetheris also registers an open-source knowledge stack: Mistral 7B Instruct v0.3 under Apache-2.0 for cited RAG synthesis and BGE-M3 under MIT for retrieval embeddings. The local adapter plans retrieval, evidence ranking, citation binding, synthesis, verification, and memory writes. Model weights are not silently downloaded or claimed as installed; connect a local llama.cpp, Ollama, or Transformers provider to enable inference while preserving `weightsChanged: false`.

The architecture now includes the complete 150-phase engine: 14 lifecycle parts from conversation and God Core planning through native coding, computer control, research, knowledge, image, video, audio, science/engineering, multimodal creation, system execution, memory/meta-learning, and final verification/delivery. **Phase 1 — Input Reception** and **Phase 2 — Language Detection** are implemented as live offline runtime contracts. Phase runs now continue automatically from Phase 3 through the selected lifecycle without manual stopping, while `fullPhaseRun: true` activates and executes all 150 phases sequentially. Each phase records a status, checkpoint, operation, completion time, ordered action history, and runtime events. The Observability console exposes active phase, progress, checkpoint state, 14-group coverage, newest-first event stream, and safe pause/resume/cancel/step controls. The runtime also exposes `observePhaseRuns`, `phaseRunHistory`, and `phaseObservability`; `/observability` returns the phase ledger and task telemetry, while `/phases` supports `advance`, `run`, `pause`, `resume`, `cancel`, `history`, and `list` actions. Manual control remains available through `advancePhase`, `aetheris.phases.advance`, and `/phases`; continuous mode is available through `runAllPhases`, `aetheris.phases.run_all`, and `/phases` with `action: run`. Native Aetheris contracts are registered as Aether-Code, Aether-Research, Aether-Vision, Aether-Image, Aether-Video, Aether-Audio, Aether-Science, Aether-Engineering, Aether-Computer, Aether-Terminal, Aether-Knowledge, Aether-3D, Aether-Device, Aether-Industrial, and Aether-Meta. External and open models remain pluggable beneath these first-party orchestration, workflow, memory, safety, tool, and verification contracts.

The quality harness is now available with `npm test`, `npm run test:watch`, and `npm run lines`. The offline contract suite covers phase planning and execution, observability events, pause/resume/cancel semantics, language and input normalization, task lifecycle and approval gates, MCP policy, native-intelligence separation, knowledge provenance, offline memory, resource release, and universal API routes. GitHub Actions runs the same test and build gates without external provider access. The staged 50,000-line quality roadmap lives at `docs/50k-roadmap.md`; it treats tests, persistence, adapters, security, operator surfaces, and documentation as meaningful scope rather than padding.

Phase runs now persist versioned snapshots when a storage adapter is available, recover interrupted runs into a safe paused state, support bounded paginated history, JSON/NDJSON audit export, scheduler-failure reporting, and idempotent API/MCP transitions. All 15 native Aetheris modules expose versioned capability contracts with validation and approval-aware adapter boundaries. Workflow runs now validate DAGs and expose retry, timeout, compensation, checkpoint, approval, pause/resume/cancel, recovery, and API control contracts. The operator console includes event filters, local audit export, recovered-run controls, and runtime readiness reporting through `/ready`.

This is an interface and local runtime prototype; real model providers, storage, OS, and device adapters can be connected behind the existing control-plane contracts.
