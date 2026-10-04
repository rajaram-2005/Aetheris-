# Aetheris 50,000-line quality roadmap

## Intent

The 50,000-line target is a quality target, not a request for filler. Every added line should make Aetheris more testable, more observable, safer to operate, or more capable as a native runtime. Generated bundles, vendored dependencies, credentials, and meaningless padding do not count toward the target.

The repository began this milestone at approximately 7,235 lines across the runtime, UI, server, and stylesheet. The first step is to make behavior measurable before adding more surface area.

## Counting rule

Use:

```bash
npm run lines
```

The command counts tracked source, test, and documentation files under `src`, `server`, `test`, and `docs`. It deliberately excludes `node_modules`, `dist`, build output, caches, and generated artifacts.

## Milestones

### Gate 1 — Contract test foundation

**Target: 10,000 meaningful lines.**

- Add a zero-dependency Node test harness.
- Cover phase planning, exact one-step advancement, continuous execution, pause, resume, cancel, checkpoints, and event history.
- Cover offline language detection across scripts, declared-language provenance, non-text input, and input normalization.
- Cover God Core task lifecycle, policy approval, local-only provenance, verification, and offline memory updates.
- Cover MCP discovery, structured responses, permission gates, native-intelligence separation, and universal API routes.
- Keep tests deterministic and free of user credentials or external network requirements.

### Gate 2 — Persistence and recovery contracts

**Target: 16,000 meaningful lines.**

- Add durable run snapshots with schema versions and migrations.
- Add restart recovery tests for queued, running, paused, completed, and cancelled runs.
- Add idempotency keys for API and MCP transitions.
- Add bounded event retention, pagination, correlation IDs, and audit export.
- Add fault-injection tests for timers, storage, malformed input, and unavailable adapters.

### Gate 3 — Native capability contract suite

**Target: 25,000 meaningful lines.**

- Turn each first-party native intelligence module into a versioned capability contract.
- Add adapter interfaces for coding, research, vision, image, video, audio, science, engineering, computer, terminal, knowledge, 3D, device, industrial, and meta-learning domains.
- Add conformance fixtures for local, offline, sandboxed, approved-online, and approval-required modes.
- Verify that replaceable models remain beneath Aetheris orchestration rather than replacing it.

### Gate 4 — Controlled tool and workflow execution

**Target: 35,000 meaningful lines.**

- Expand workflow DAG validation, retries, compensation, safe checkpoints, and cancellation semantics.
- Add file, terminal, browser, application, device, digital-twin, and industrial simulation adapters with explicit policy gates.
- Add resource allocation, concurrency, timeouts, and back-pressure tests.
- Add synthetic fixtures only; never add real secrets, user tokens, or production endpoints.

### Gate 5 — Operator surfaces and delivery

**Target: 43,000 meaningful lines.**

- Expand the observability console with filters, run comparison, event inspection, export, and recovery controls.
- Add API schemas, error envelopes, pagination, and compatibility tests.
- Add accessibility, responsive UI, and browser-level smoke coverage.
- Add local deployment profiles and health/readiness checks.

### Gate 6 — 50,000-line release candidate

**Target: 50,000 meaningful lines.**

- Run the complete unit, integration, contract, security, and build suites.
- Review all line growth for duplication, dead code, and untestable abstractions.
- Measure runtime health, full 150-phase completion, event retention, recovery, and policy behavior.
- Document what is implemented, what remains adapter-defined, and what is intentionally not claimed.

## Quality gates for every increment

1. `npm test` passes offline and deterministically.
2. `npm run build` passes without committing generated build output.
3. `git diff --check` passes.
4. No user-supplied credentials are stored, echoed, bundled, or used in fixtures.
5. Local-only behavior remains truthful: no fake network success and no hidden provider claims.
6. New runtime state has an observable API and a bounded retention policy.
7. New controls preserve pause, resume, cancel, and exact manual advancement semantics where applicable.

## Current increment

Gate 1 is complete: the test command, shared asynchronous assertions, phase-engine contracts, language/input contracts, runtime/API contracts, task lifecycle contracts, MCP/native/security contracts, and this roadmap are covered offline.

The continuous roadmap run has also completed the first implementation slice of Gates 2–4:

- Gate 2: versioned phase snapshots, restart recovery, bounded event history, paginated history, JSON/NDJSON audit export, scheduler fault handling, API/MCP idempotency, and malformed-storage handling.
- Gate 3: versioned native Aetheris capability contracts for all 15 first-party modules, input validation, approval gates, adapter-boundary execution results, and `/native` API access.
- Gate 4: validated workflow DAGs with retries, timeouts, compensation planning, checkpoints, approval, pause/resume/cancel, recovery, and controlled workflow API transitions.
- Gate 5 slice: the operator console now filters phase events, exports local audit data, recovers persisted phase runs through direct phase controls, and exposes readiness plus structured API envelopes.
- Gate 6 slice: CI runs tests, production build, whitespace checks, and the meaningful line-count report.

The remaining gates continue in the same order with the quality suite running after each increment; no line-count padding is used.
