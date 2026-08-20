# QOS Harness — Engineering Plan

**Status:** Active  
**Version:** 2.0  
**Current milestone:** `H-ARCH`  
**Current task:** `H-ARCH-001 — Step 2: Extract Graph Schemas`
**Task status:** Approved — Step 1 in progress

---

## 1. Product Objective

Build a multi-agent development orchestration engine capable of developing applications in a predictable, economical, auditable, and verifiable way.

The harness must eventually coordinate specialized agents for:

- Product / Requirements
- UX
- UI / Design
- Architecture / Planning
- Coding
- Testing
- Code Review
- Fixing
- Documentation
- Release

The success criterion is not “the model generated code”.

A task is successful only when the requested behavior is correctly understood, the minimum necessary context is gathered, the implementation plan is actionable, the implementation respects the repository architecture, deterministic validation passes, and the process converges within defined budgets.

---

# 2. Engineering Principles

## 2.1 SOLID without abstraction for abstraction's sake

Apply SOLID where responsibilities genuinely change for different reasons.

We will avoid both extremes:

- monolithic files that accumulate unrelated responsibilities;
- excessive fragmentation into tiny abstractions with no architectural value.

### Single Responsibility

A module should have one coherent reason to change.

### Open/Closed

Providers, reviewers, planners, telemetry sinks, and future agents should be replaceable through contracts instead of edits throughout the graph.

### Liskov Substitution

Provider implementations must honor the same behavioral contract.

### Interface Segregation

Avoid “god interfaces”. A planner should not depend on capabilities it does not use.

### Dependency Inversion

Core orchestration should depend on contracts, not NVIDIA, Claude CLI, filesystem persistence, or another concrete infrastructure provider.

---

## 2.2 Clean Architecture direction

Dependencies should point inward.

```text
Infrastructure
      ↓
Application
      ↓
Domain
```

The domain must not know whether an LLM came from NVIDIA, Claude CLI, Anthropic API, or a local runtime.

---

## 2.3 System intelligence before model intelligence

The harness must deterministically resolve everything that does not require LLM reasoning.

Examples:

- file existence;
- already-read evidence;
- package scripts;
- installed dependencies;
- imports and exports;
- symbol references;
- test relationships;
- Git state;
- invalid/duplicate evidence requests;
- actual command/test result.

LLMs should focus on decisions requiring reasoning.

---

## 2.4 Evidence-driven agents

Agents must not make unsupported architectural claims.

Plans and reviews should point to concrete evidence:

- file;
- symbol;
- import;
- reference;
- excerpt;
- test;
- dependency.

---

## 2.5 Deterministic gates

LLMs may recommend and interpret, but deterministic processes decide:

- test PASS/FAIL;
- typecheck PASS/FAIL;
- lint PASS/FAIL;
- build PASS/FAIL;
- path validity;
- unauthorized modifications;
- duplicated evidence;
- Git safety.

---

## 2.6 Model specialization

Do not search for one model that does everything.

Different models may be selected for:

- architecture/planning;
- semantic review;
- context-efficiency review;
- coding;
- fixing;
- visual review;
- test review.

---

## 2.7 Optimize cost per successful task

Primary economic metric:

> **Cost per Successful Completion**

A more expensive planning call can be cheaper overall if it prevents replanning, failed implementations, and fix loops.

---

# 3. Main Success Metric

## Successful Feature Completion Rate — SFCR

A task counts as successfully completed only when all applicable conditions are met:

- requirements satisfied;
- no unauthorized files changed;
- typecheck passes;
- relevant tests pass;
- build passes when applicable;
- no unresolved blocking issues;
- no human intervention required.

Secondary metrics:

- Time to Successful Completion;
- Cost per Successful Completion;
- LLM Calls per Completion;
- Planner Calls;
- Reviewer Calls;
- Fix Loops;
- Context Tokens;
- Files Read;
- Duplicate Requests;
- Invalid Paths;
- Replans;
- Implementation Attempts.

---

# 4. Target Architecture

```text
USER REQUEST
     │
     ▼
TASK NORMALIZER
     │
     ▼
REPOSITORY INTELLIGENCE
     │
     ▼
CONTEXT ENGINE
     │
     ▼
PLANNER / ARCHITECT
     │
     ▼
PRIMARY REVIEWER
     │
     ├──── issue/conflict ────► CONDITIONAL REVIEWER
     │                              │
     └──────────────────────────────┘
     │
     ▼
EVIDENCE RESOLVER
     │
     ├──── needs evidence ────► CONTEXT ENGINE
     │
     ▼
REFINE
     │
     ▼
DETERMINISTIC PLAN GATE
     │
     ▼
IMPLEMENTER
     │
     ▼
DETERMINISTIC VALIDATION
     │
   ┌─┴────┐
   │      │
 PASS    FAIL
   │      │
   │     FIXER
   │      │
   │      └────► VALIDATION
   ▼
CODE REVIEW
   │
   ▼
FINAL ACCEPTANCE
   │
   ▼
REPORT / RELEASE
```

---

# 5. Architectural Direction

Target organization:

```text
src/
├── app/
│   └── run-harness.ts
│
├── graph/
│   ├── build-dev-graph.ts
│   ├── nodes/
│   └── routers/
│
├── domain/
│   ├── state/
│   ├── planning/
│   └── telemetry/
│
├── application/
│   ├── context/
│   └── prompts/
│
├── infrastructure/
│   ├── llm/
│   ├── repository/
│   └── telemetry/
│
└── index.ts
```

This is a direction, not permission to create every file immediately.

Every extraction must have a concrete responsibility and acceptance test.

---

# 6. Current Repository Baseline

Snapshot reviewed before defining `H-ARCH-001`:

- `src/graph.ts` contains graph schemas, context helpers, prompts, graph nodes, routers, and graph assembly.
- `src/providers/nvidia.ts` contains provider configuration, model-specific behavior, HTTP requests, retry/backoff, JSON extraction, recovery behavior, and structured validation.
- `src/state.ts` contains planning/review/refined-plan schemas and `DevState`.
- `src/index.ts` owns the current executable entry point and directly invokes `devGraph`.
- `src/repository/inspect.ts` and `src/repository/tools.ts` already isolate part of repository inspection/tooling.
- Current package has no general LLM provider abstraction.
- Current graph directly imports `callNvidiaJson`.
- Existing validation script: `npm run typecheck`.
- Existing focused scripts include `test:tools`, `test:structured`, `test:nvidia`, and `test:nvidia-review`.

This baseline must remain behaviorally stable during `H-ARCH-001`.

---

# 7. Roadmap

## H-ARCH — Architectural Foundation

### Objective

Create a maintainable core before adding telemetry, context intelligence, more providers, and additional agent roles.

### Rule

No feature behavior changes during this milestone.

### Tasks

- **H-ARCH-001 — Modularize Core Harness Without Behavior Changes**
- H-ARCH-002 — Introduce LLM Provider Contract
- H-ARCH-003 — Extract Graph Node Dependencies / Runtime Composition
- H-ARCH-004 — Establish Architectural Tests and Boundaries

> `H-ARCH-002` and later tasks may be adjusted after H-ARCH-001 evidence is collected. We do not prematurely implement the entire target architecture.

---

## H0 — Benchmark Foundation

### Objective

Create reproducible telemetry and benchmark infrastructure before changing model strategy.

### Tasks

- H0-001 — Run Telemetry Foundation
- H0-002 — Benchmark Task Suite
- H0-003 — Benchmark Runner
- H0-004 — Comparison Report

---

## H1 — Repository Intelligence

### Objective

Allow the computer to understand repository structure before an LLM is called.

### Tasks

- H1-001 — File Index
- H1-002 — Symbol Index
- H1-003 — Import Graph
- H1-004 — Reference Search
- H1-005 — Test Mapping
- H1-006 — Package / Script Summary
- H1-007 — Git Summary

---

## H2 — Context Engine

### Objective

Deliver minimal, ranked, predictable context to models.

### Tasks

- H2-001 — Relevance Ranker
- H2-002 — Context Budget
- H2-003 — Context Priority
- H2-004 — Excerpt Builder
- H2-005 — Context Deduplication
- H2-006 — Context Provenance

### Initial acceptance target

For benchmark B04:

- reduce planner context by at least 50%;
- no regression in planning quality;
- fewer irrelevant reads;
- no repeated full-file context where excerpts suffice.

---

## H3 — Evidence Protocol

### Objective

Move from generic `filesToRead` to structured evidence requests.

Example:

```json
{
  "evidenceRequests": [
    {
      "type": "symbol",
      "query": "useWorkflowDraft"
    },
    {
      "type": "references",
      "query": "addEdge"
    },
    {
      "type": "excerpt",
      "path": "src/hooks/workflows/use-workflow-draft.ts",
      "symbol": "draftReducer"
    }
  ]
}
```

### Tasks

- H3-001 — Evidence Request Schema
- H3-002 — Evidence Resolver
- H3-003 — Evidence Cache
- H3-004 — Duplicate / Invalid Request Gate
- H3-005 — Evidence Provenance

---

## H4 — Planning Engine

### Objective

Produce actionable plans that converge without loops.

### Tasks

- H4-001 — Planner Contract
- H4-002 — Progress Detection
- H4-003 — Convergence Gate
- H4-004 — Final Plan Schema
- H4-005 — Planning Budget Separation

A final `changes_required` plan must contain exact files, actions, evidence, validation, and no blocking unknowns.

---

## H5 — Review Council

### Objective

Use complementary reviewers without redundant calls.

### Proposed roles

**Primary semantic reviewer**
- unsupported assumptions;
- missing evidence;
- premature convergence;
- contradictions;
- unsafe assumptions.

Initial candidate: GPT-OSS.

**Conditional efficiency reviewer**
- excessive context;
- repeated evidence;
- unnecessary reads;
- cheaper evidence paths.

Initial candidate: Nemotron.

### Tasks

- H5-001 — Reviewer Contract
- H5-002 — Conditional Second Review
- H5-003 — Deterministic Review Arbiter
- H5-004 — Reviewer Benchmark

---

## H6 — Implementation Engine

### Objective

Implement only an approved plan.

### Tasks

- H6-001 — Implementation Contract
- H6-002 — File Scope Guard
- H6-003 — Git Diff Capture
- H6-004 — Coder Provider Integration
- H6-005 — Unexpected Change Gate

---

## H7 — Validation and Fix Loop

### Objective

Use deterministic failures to drive bounded automated correction.

### Tasks

- H7-001 — Validation Command Resolver
- H7-002 — Typecheck Gate
- H7-003 — Test Gate
- H7-004 — Build Gate
- H7-005 — Failure Parser
- H7-006 — Fixer Contract
- H7-007 — Fix Attempt Budget

---

## H8 — Product / UX / UI Agents

### Objective

Extend orchestration beyond coding.

Structured artifacts will include:

- Product requirements;
- acceptance criteria;
- UX flows/states;
- accessibility requirements;
- UI/design rules;
- responsive behavior;
- component guidance.

---

## H9 — Dynamic Orchestrator

### Objective

Select only the agents required by each task.

Example:

```text
simple bug:
INSPECT → PLAN → CODE → TEST

UI redesign:
PRODUCT → UX → DESIGN → ARCHITECT → CODE → VISUAL REVIEW → TEST
```

---

## H10 — Cost / Quality Router

### Objective

Route models based on benchmarked completion economics.

Potential strategy:

```text
simple
→ lower-cost planner

medium
→ standard planner

complex / low confidence
→ stronger planner

failed replan
→ escalation model
```

Routing must be benchmark-driven.

---

## H11 — Production Hardening

### Tasks

- checkpoints;
- resume;
- provider fallback;
- concurrency limits;
- rate-limit handling;
- timeouts;
- Git isolation/worktrees;
- secrets safety;
- structured logs;
- observability;
- run history;
- failure recovery;
- tool/plugin permissions.

---

# 8. Benchmark Suite

Initial fixed benchmark set:

- **B01 — Trivial:** add `GET /health` to a simple project.
- **B02 — Already Satisfied:** detect requested behavior already exists.
- **B03 — Localized Change:** small change in a known component.
- **B04 — Cross-file Feature:** Q-Flow Workflow Canvas n8n-like behavior.
- **B05 — Architectural/Ambiguous:** architecture discovery required before implementation.

Benchmark infrastructure is implemented in H0, after architectural foundation.

---

# 9. Model Strategy

Models are replaceable components.

Initial candidates:

- Planner / Refine:
  - current Nemotron baseline;
  - Claude Sonnet benchmark later.

- Primary Reviewer:
  - GPT-OSS.

- Conditional Reviewer:
  - Nemotron.

- Implementer:
  - coding-focused model selected by benchmark.

- Deterministic validation:
  - no LLM.

We will improve the harness before using a stronger model to compensate for weak context engineering.

---

# 10. Development Rules

From this point onward:

1. Work on one task at a time.
2. Define acceptance criteria before implementation.
3. Do not begin the next task until acceptance is proven.
4. Preserve benchmark comparability.
5. Do not mix refactoring and behavior changes in the same task.
6. Do not change prompts and architecture simultaneously unless explicitly scoped.
7. Record meaningful architectural decisions.
8. Prefer deterministic solutions over prompt instructions.
9. Preserve pre-existing user changes.
10. Every task must explicitly list non-goals.
11. Every refactor must have a rollback-friendly scope.
12. `npm run typecheck` is a mandatory gate for every TypeScript task.
13. Existing focused tests/scripts must be run when affected.
14. No model is trusted to declare its own implementation valid.

---

# 11. Execution Order

Current order:

```text
H-ARCH-001
   ↓
H-ARCH-002
   ↓
H-ARCH-003
   ↓
H-ARCH-004
   ↓
H0-001
   ↓
H0-002
   ↓
H0-003
   ↓
H0-004
   ↓
H1
   ↓
H2
   ↓
H3
   ↓
H4
   ↓
H5
   ↓
H6
   ↓
H7
   ↓
H8+
```

We may collapse later H-ARCH tasks if H-ARCH-001 demonstrates they are unnecessary. Architecture follows evidence.

---

# 12. Current Task Specification

# H-ARCH-001 — Modularize Core Harness Without Behavior Changes

## 12.1 Problem

The current prototype works, but responsibilities have accumulated in central files.

`src/graph.ts` currently contains multiple independent concerns:

- local Zod schemas used to validate provider output;
- context formatting;
- request normalization;
- planner prompt;
- reviewer prompt;
- refine prompt;
- graph nodes;
- routers;
- graph assembly.

`src/providers/nvidia.ts` also contains multiple infrastructure concerns:

- environment/configuration;
- model-family behavior;
- HTTP transport;
- retry/backoff;
- retry-after handling;
- GPT-OSS empty-content recovery;
- JSON extraction;
- structured validation.

This is acceptable for a prototype but creates increasing change risk as we add telemetry, Claude, repository intelligence, evidence requests, implementation agents, and specialized roles.

---

## 12.2 Objective

Reduce structural coupling and clarify responsibilities **without changing observable harness behavior**.

This task is a refactor, not a feature.

---

## 12.3 Scope

H-ARCH-001 will focus on the graph side first.

### Extract from `src/graph.ts`

1. graph-local structured-output schemas;
2. context formatting/normalization helpers;
3. prompt builders;
4. graph routers;
5. graph construction into an explicit builder module if this can be done without changing runtime semantics.

### Keep stable for this task

- node algorithms;
- planner/reviewer/refine behavior;
- prompt wording;
- model names/defaults;
- provider behavior;
- retry behavior;
- state semantics;
- routing semantics;
- repository tooling behavior.

### NVIDIA provider

Do **not** deeply refactor `nvidia.ts` in H-ARCH-001.

Provider abstraction is intentionally reserved for `H-ARCH-002`, so this task does not mix graph modularization with provider architecture.

---

## 12.4 Proposed File Structure for H-ARCH-001

Minimal proposed structure:

```text
src/
├── graph/
│   ├── schemas.ts
│   ├── context.ts
│   ├── prompts.ts
│   ├── routers.ts
│   └── build-dev-graph.ts
│
├── graph.ts
├── state.ts
├── providers/
│   └── nvidia.ts
├── repository/
│   ├── inspect.ts
│   └── tools.ts
└── index.ts
```

Important:

`src/graph.ts` may remain temporarily as a compatibility/export boundary.

Example intent:

```ts
export { devGraph } from "./graph/build-dev-graph.js";
```

This reduces migration risk and keeps existing imports stable.

We do **not** create `domain/`, `application/`, and `infrastructure/` folders wholesale in this task.

---

## 12.5 Responsibility Boundaries

### `src/graph/schemas.ts`

Owns schemas that validate structured LLM responses used by graph nodes.

It must not:

- call providers;
- read files;
- contain prompts;
- route graph execution.

### `src/graph/context.ts`

Owns pure context transformation helpers currently embedded in `graph.ts`, including candidates such as:

- file listing formatting;
- package context;
- known-file context;
- review feedback formatting;
- request normalization.

It should favor pure functions.

It must not:

- invoke LLMs;
- mutate repository files;
- construct the graph.

### `src/graph/prompts.ts`

Owns prompt construction.

Prompt text must be moved, not rewritten.

Functions should accept explicit data and return strings.

Example direction:

```ts
buildPlannerPrompt(...)
buildReviewerPrompt(...)
buildRefinePrompt(...)
```

No model calls inside prompt builders.

### `src/graph/routers.ts`

Owns pure graph transition decisions.

Candidate routers:

- `afterPlanRouter`
- `reviewRouter`
- `afterReadRouter`
- `planGateRouter`

No provider calls and no side effects.

### `src/graph/build-dev-graph.ts`

Owns graph composition:

- node registration;
- edges;
- conditional edges;
- compile/export.

Node implementations may remain together initially if extracting them would make this task too broad.

The priority is removing unrelated concerns before splitting every node.

---

## 12.6 Important Design Decision

We will **not** split every node into a separate file in H-ARCH-001 unless the extraction is demonstrably low-risk.

Reason:

Creating many files at once would increase diff size without proving architectural benefit.

Preferred sequence:

```text
graph.ts monolith
   ↓
extract pure/static concerns
   ↓
stabilize
   ↓
later extract node services/dependencies where justified
```

This keeps the refactor incremental.

---

## 12.7 State Strategy

`src/state.ts` currently owns planning/review/refined-plan schemas and `DevState`.

For H-ARCH-001:

- do not redesign `DevState`;
- do not change field names;
- do not change defaults;
- do not change counters;
- do not change inferred public types unless required solely to expose existing schemas cleanly.

If graph-local schemas duplicate state-domain schemas, document the duplication for H-ARCH-002/003 instead of forcing a broad state redesign now.

---

## 12.8 Dependency Rule

After H-ARCH-001, intended dependency direction:

```text
index.ts
   ↓
graph.ts compatibility boundary
   ↓
graph/build-dev-graph.ts
   ↓
graph nodes / routers / prompts / context / schemas
   ↓
state + repository + provider
```

No new circular dependencies are allowed.

---

## 12.9 Behavioral Invariants

These are frozen during H-ARCH-001:

### Models

Current environment/default model resolution must remain unchanged.

### Planning

Same planner prompt content and structured schema semantics.

### Review

Same reviewer prompt content and decision semantics.

### Read loop

Same file-reading behavior.

### Refine

Same refine prompt and output semantics.

### Routers

Given the same `DevState`, routers must return the same transition as before.

### Failure behavior

Same limits and failure conditions.

### Entry point

`npm run dev` must continue to invoke the harness using `src/index.ts`.

---

## 12.10 Tests to Add

Because this is architectural work, pure extracted functions should gain focused tests where valuable.

Priority:

### Router characterization tests

Given representative `DevState` inputs, verify each router returns the same branch.

These tests protect behavior during later convergence work.

### Context helper tests

Verify deterministic formatting/normalization behavior.

Do not over-test prompt prose.

### Import smoke/typecheck

Compilation must prove module boundaries are valid.

---

## 12.11 Acceptance Criteria

H-ARCH-001 is accepted only when all applicable items pass:

- [ ] `npm run typecheck` passes.
- [ ] Existing `npm run test:tools` passes.
- [ ] Existing structured/provider-focused tests affected by imports still run as before.
- [ ] `npm run dev` still starts through the same entry point.
- [ ] No prompt wording intentionally changes.
- [ ] No model defaults intentionally change.
- [ ] No router decision semantics change.
- [ ] No planning/review/refine counters change semantics.
- [ ] No repository read behavior changes.
- [ ] No retry/provider behavior changes.
- [ ] `src/graph.ts` is substantially reduced or becomes a compatibility boundary.
- [ ] Extracted context helpers are pure where practical.
- [ ] Extracted routers are pure.
- [ ] No circular dependency is introduced.
- [ ] No new runtime dependency is added solely for this refactor.
- [ ] Pre-existing project behavior remains observationally equivalent.

---

## 12.12 Non-goals

H-ARCH-001 must **not**:

- add Claude;
- change NVIDIA models;
- change reviewer strategy;
- change prompts;
- implement telemetry;
- implement benchmarks;
- implement Repository Intelligence;
- implement Context Engine;
- implement Evidence Protocol;
- fix planning convergence;
- add implementation agents;
- add dynamic routing;
- change Q-Flow;
- introduce a database;
- redesign `DevState`;
- deeply refactor `nvidia.ts`.

---

## 12.13 Risks

### Risk: accidental prompt changes

Mitigation:
move prompt text verbatim before improving it.

### Risk: router behavior changes during extraction

Mitigation:
characterization tests before/with extraction.

### Risk: circular imports

Mitigation:
keep helpers dependent on state/types, never on graph builder.

### Risk: over-engineering

Mitigation:
minimal file set; no speculative full Clean Architecture migration.

### Risk: mixing provider abstraction with graph refactor

Mitigation:
provider abstraction explicitly deferred to H-ARCH-002.

---

## 12.13.1 Step 1 Validation Record

**Status:** ✅ Accepted

Validated on the real development environment:

- `npm run typecheck` — PASS
- `npm run test:graph-characterization` — PASS
- `npm run test:tools` — PASS

Behavior intentionally characterized includes:

- `afterPlanRouter`
- `reviewRouter`
- `afterReadRouter`
- `planGateRouter`
- request normalization
- context helper behavior

The warning/log lines emitted during characterization are expected observations of current behavior, not test failures.

**Next:** Step 2 — Extract graph structured-output schemas without semantic changes.

## 12.14 Implementation Sequence

### Step 1 — Characterize current behavior ✅

**Status: Accepted.**

Before moving code:

- identify all graph-local schemas;
- identify pure helpers;
- identify prompt blocks;
- identify routers;
- record node list and graph edges;
- run baseline typecheck/tests.

### Step 2 — Extract graph schemas 🚧

**Status: In progress.**

Move structured-output schemas without semantic changes.

Run typecheck.

### Step 3 — Extract context helpers

Move pure context/request helpers.

Add focused tests where useful.

Run typecheck/tests.

### Step 4 — Extract prompt builders

Move prompt text verbatim.

Run typecheck.

### Step 5 — Extract routers

Move pure routing functions.

Add characterization tests.

Run typecheck/tests.

### Step 6 — Extract graph builder

Move graph composition into `graph/build-dev-graph.ts`.

Keep `src/graph.ts` as compatibility export if beneficial.

Run full available validation.

### Step 7 — Review diff

Verify:

- no behavioral edits mixed into refactor;
- no prompt semantic changes;
- no provider changes;
- no model changes;
- no accidental cleanup outside scope.

### Step 8 — Accept or reject H-ARCH-001

Only mark complete when every acceptance criterion is evidenced.

---

## 12.15 Expected Outcome

After H-ARCH-001, adding telemetry should not require turning `graph.ts` into a larger monolith.

The next architecture task can then introduce a provider contract deliberately:

```text
Planner/Reviewer nodes
        ↓
   LlmProvider
     ┌──┴─────────────┐
     ↓                ↓
NVIDIA Provider   Claude Provider
```

That belongs to `H-ARCH-002`, not this task.

---

# 13. Next Task Preview

## H-ARCH-002 — Introduce LLM Provider Contract

Tentative objective:

Decouple graph/application logic from `callNvidiaJson` so providers become replaceable.

Tentative contract direction:

```ts
export interface StructuredLlmProvider {
  generateStructured<T>(request: StructuredLlmRequest<T>): Promise<StructuredLlmResult<T>>;
}
```

Expected future implementations:

- NVIDIA API;
- Claude CLI;
- Anthropic API;
- local provider.

This spec is intentionally not finalized until H-ARCH-001 is complete.

---

# 14. H0 Preview

Once architectural foundation is accepted:

## H0-001 — Run Telemetry Foundation

Telemetry only.

Required initial data:

```text
runId
startedAt
finishedAt
durationMs
task
repositoryPath
finalStatus
failureReason

models
node timings
LLM call counters
planning/review/refine attempts
requested evidence
read evidence
duplicates
invalid requests
final plans
```

Persistence initially:

```text
.runs/
  <run-id>.json
```

No database/dashboard yet.

---

# 15. Definition of Done for the Overall Engineering Strategy

The harness strategy is considered mature when:

- benchmarks are reproducible;
- context is deterministic and budgeted;
- agents request evidence instead of blindly requesting files;
- repeated evidence cannot create loops;
- planning converges within defined budgets;
- implementation scope is enforced;
- deterministic validation controls PASS/FAIL;
- fix loops are bounded;
- model choices are benchmark-driven;
- Product/UX/UI/Coder specialists can be added without redesigning the core;
- cost and time are measured per successful feature, not per model call.

---

# 16. Decision Log

## ADR-001 — Architectural refactor before telemetry

**Decision:** Introduce `H-ARCH` before H0.

**Reason:** Telemetry, additional providers, context intelligence, and specialist agents would otherwise increase coupling in already-central files.

## ADR-002 — Incremental modularization

**Decision:** Do not perform a full folder/architecture migration in one task.

**Reason:** Large refactors make behavioral regressions harder to isolate.

## ADR-003 — Provider abstraction deferred

**Decision:** NVIDIA provider abstraction belongs to H-ARCH-002.

**Reason:** Separates graph modularization from infrastructure/provider changes.

## ADR-004 — Stronger models do not replace context engineering

**Decision:** Improve harness predictability before benchmarking Claude as planner.

**Reason:** A stronger model should not mask avoidable context/orchestration defects.

---

# 17. Current Working Agreement

We are currently discussing and approving:

> **H-ARCH-001 — Modularize Core Harness Without Behavior Changes**

Spec approved on 2026-08-20.

Implementation proceeds **Step 1 → Step 8**, with validation after each meaningful extraction.

### H-ARCH-001 progress

- [x] Spec approved.
- [x] Step 1 characterization-test implementation prepared against the uploaded repository snapshot.
- [ ] Run `npm run typecheck` in the source development environment.
- [ ] Run `npm run test:graph-characterization`.
- [ ] Confirm baseline tests before Step 2.
- [ ] Step 2 — Extract graph schemas.
