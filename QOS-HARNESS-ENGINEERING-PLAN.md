# QOS Harness — Engineering Plan

**Status:** Active
**Version:** 2.0
**Current milestone:** `H0`
**Current task:** `H0-002A — Task Intake Foundation`
**Task status:** ✅ H0-002A Step 5 accepted

---

### Current Release

**Version:** `v0.1.0-alpha.6`
**Status:** Benchmark Suite Alpha
**Milestone:** `H0-002 — Benchmark Task Suite` ✅

### Architecture Milestone

`H-ARCH-001` and `H-ARCH-002` are complete.

The original graph monolith has been decomposed into explicit architectural boundaries:

```text
src/
├── graph.ts
└── graph/
    ├── schemas.ts
    ├── context.ts
    ├── prompts.ts
    ├── routers.ts
    ├── nodes.ts
    └── build-dev-graph.ts
```

The public `src/graph.ts` module now acts primarily as a compatibility/public API boundary.

### Established boundaries

- Structured output schemas
- Context construction and request normalization
- Prompt construction
- Graph routing
- Graph node execution
- LangGraph assembly
- Provider integration
- Repository inspection and tools

### Validation baseline

```bash
npm run typecheck && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Release significance

`v0.1.0-alpha.6` represents the completed fixed benchmark-suite foundation of the QOS Harness. It is not yet a production-ready autonomous development system.

The release proves that benchmark tasks are versioned, fixed, machine-independent, deterministically validated, and evaluated through explicit acceptance semantics before the automatic benchmark runner is introduced.

### Next milestone

`H0-003 — Benchmark Runner`

# 1. Product Objective

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
- H-ARCH-003 — Execution Policy / Runtime Composition Hardening
- **H-ARCH-004 — Establish Architectural Tests and Boundaries**

> `H-ARCH-002` and later tasks may be adjusted after H-ARCH-001 evidence is collected. We do not prematurely implement the entire target architecture.

---

## H0 — Benchmark Foundation

### Objective

Create reproducible telemetry and benchmark infrastructure before changing model strategy.

### Tasks

- H0-001 — Run Telemetry Foundation
- H0-002 — Benchmark Task Suite
- **H0-002A — Task Intake Foundation**
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
H0-002A
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

### Step 2 — Extract graph schemas ✅

**Status: Accepted.**

Move structured-output schemas without semantic changes.

Run typecheck.

## 12.13.2 Step 2 Validation Record

**Status:** ✅ Accepted

Reference commit:

`741991618ca6ac98db5df58ce5152cd33547898a`

Commit message:

`refactor(graph): extract structured output schemas`

Observed change:

- `src/graph.ts` now imports the structured output schemas;
- `src/graph/schemas.ts` owns `ExplorationSchema`, `ReviewSchema`, `RefinedSchema`, and `Exploration`;
- no intentional prompt, routing, model, provider, or state-semantic changes.

**Next:** Step 3 — extract context helpers and request normalization.

### Step 3 — Extract context helpers ✅

**Status: Accepted.**

Move pure context/request helpers.

Add focused tests where useful.

Run typecheck/tests.

## 12.13.3 Step 3 Validation Record

**Status:** ✅ Accepted

Observed change:

- `src/graph/context.ts` now owns:
  - `listFiles`
  - `packageContext`
  - `knownFileContext`
  - `reviewFeedback`
  - `normalizeRequests`
- `src/graph.ts` imports these helpers and temporarily re-exports them for compatibility with characterization tests;
- no intentional prompt, model, router, provider, retry, state, or repository-read behavior changed.

Validation expected/used for acceptance:

- `npm run typecheck`
- `npm run test:graph-characterization`
- `npm run test:tools`

**Next:** Step 4 — extract prompt builders without changing prompt semantics.

### Step 4 — Extract prompt builders ✅

**Status: Accepted.**

Move prompt text verbatim.

Run typecheck.

## 12.13.4 Step 4 Validation Record

**Status:** ✅ Accepted

Reference commit:

`ee9a7b84c85d25dbb72aa39a44867405a60e3c02`

Observed change:

- `src/graph/prompts.ts` owns planner, reviewer, and refine prompt construction;
- `src/test-prompt-characterization.ts` characterizes critical prompt contracts;
- `package.json` exposes the prompt characterization test as an official script;
- `src/graph.ts` retains orchestration and provider calls;
- no intentional model, router, provider, retry, state, or repository behavior changed.

Acceptance gates:

- `npm run typecheck`
- `npm run test:prompt-characterization`
- `npm run test:graph-characterization`
- `npm run test:tools`

**Next:** Step 5 — extract graph routing decisions without semantic changes.

### Step 5 — Extract routers

Move pure routing functions.

Add characterization tests.

Run typecheck/tests.

## 12.13.5 Step 5 Validation Record

**Status:** ✅ Accepted

Observed change:

- `src/graph/routers.ts` owns the four graph routing decisions;
- `src/graph.ts` imports and temporarily re-exports those routers;
- existing characterization tests passed;
- no intentional routing-semantic change was introduced.

**Next:** Step 6 — extract `StateGraph` assembly without changing graph topology.

### Step 6 — Extract graph builder

Move graph composition into `graph/build-dev-graph.ts`.

Keep `src/graph.ts` as compatibility export if beneficial.

Run full available validation.

## 12.13.6 Step 6 Validation Record

**Status:** ✅ Accepted

Observed result:

- `src/graph/build-dev-graph.ts` owns `StateGraph` assembly;
- node names and graph topology remained unchanged;
- `src/graph.ts` still exports `devGraph`;
- validation gates passed in the development environment.

Architectural observation:

Step 6 intentionally introduced a temporary circular dependency:

```text
src/graph.ts
  → src/graph/build-dev-graph.ts
  → src/graph.ts
```

The cycle is currently operational because the builder only captures imported node bindings and `buildDevGraph()` is invoked after node initialization, but retaining this dependency would violate the intended architectural direction and increase future initialization risk.

**Decision:** add Step 7 to remove the cycle by extracting graph nodes.

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

## 12.16 Step 4 Detailed Specification — Extract Prompt Builders

### Objective

Move prompt construction out of `src/graph.ts` into a dedicated module without changing prompt semantics, model behavior, routing, or provider behavior.

### New module

```text
src/graph/prompts.ts
```

Expected public functions:

```ts
buildPlannerPrompt(state: DevStateType): string
buildReviewerPrompt(state: DevStateType): string
buildRefinePrompt(state: DevStateType): string
```

### Responsibilities

`src/graph/prompts.ts` owns only prompt construction.

It may depend on:

- `DevStateType`;
- pure context helpers from `src/graph/context.ts`.

It must not:

- call NVIDIA or any other provider;
- read repository files;
- mutate state;
- route graph execution;
- choose models;
- perform retries;
- validate provider responses.

### `src/graph.ts` after extraction

The graph nodes remain responsible for orchestration.

Expected shape:

```text
planNode
  → buildPlannerPrompt(state)
  → callNvidiaJson(...)
  → normalizeRequests(...)

reviewPlanNode
  → buildReviewerPrompt(state)
  → callNvidiaJson(...)

refineNode
  → buildRefinePrompt(state)
  → callNvidiaJson(...)
```

### Behavioral invariants

During Step 4, do not intentionally change:

- prompt wording;
- prompt rules;
- expected JSON shape described in prompts;
- `PLANNER_MODEL`;
- `REVIEW_MODEL`;
- `maxTokens`;
- `maxRetries`;
- Zod schemas;
- routing behavior;
- planning/review/refine counters;
- repository reading;
- NVIDIA provider behavior.

### Characterization tests

Add focused tests for the new prompt builders.

The tests should prove that generated prompts still contain the critical existing contract markers, including:

Planner:

- `PLANNER EXPLORATÓRIO`;
- current task;
- repository/file context;
- `needsMoreContext`;
- `filesToRead`.

Reviewer:

- `REVIEWER independente`;
- `approve_read`;
- `revise_read`;
- `enough_context`;
- current exploration plan.

Refine:

- `ARQUITETO FINAL`;
- `changes_required`;
- `already_satisfied`;
- `blocked`;
- validation contract.

The reviewer builder must preserve the existing guard that requires an `explorationPlan`.

### Acceptance criteria

Step 4 is accepted only when:

- [ ] `src/graph/prompts.ts` exists.
- [ ] Planner, reviewer, and refine prompt construction is no longer embedded in `src/graph.ts`.
- [ ] `src/graph.ts` still owns orchestration/provider calls.
- [ ] No intentional prompt-semantic changes are introduced.
- [ ] `npm run typecheck` passes.
- [ ] prompt characterization tests pass.
- [ ] `npm run test:graph-characterization` passes.
- [ ] `npm run test:tools` passes.
- [ ] no model, router, provider, retry, or state semantics change.
- [ ] no new runtime dependency is added.

### Planned test command

Initially:

```bash
npx tsx src/test-prompt-characterization.ts
```

After validation, add an official package script:

```json
"test:prompt-characterization": "tsx src/test-prompt-characterization.ts"
```

and rerun the gate through the package script before committing.

### Suggested commit

```bash
git commit -m "refactor(graph): extract prompt builders"
```

### Non-goals

Do not yet:

- optimize prompt token usage;
- shorten prompts;
- change reviewer semantics;
- introduce Claude;
- introduce prompt templates from external files;
- introduce a generic prompt registry;
- change provider abstraction;
- change context ranking/budgeting.

Those belong to later architecture/context tasks.

## 12.17 Step 5 Detailed Specification — Extract Routers

### Objective

Move graph routing decisions out of `src/graph.ts` into a dedicated module without changing any routing semantics.

### New module

```text
src/graph/routers.ts
```

It owns:

```ts
afterPlanRouter;
reviewRouter;
afterReadRouter;
planGateRouter;
```

### Responsibilities

`src/graph/routers.ts` may:

- inspect `DevStateType`;
- return graph route labels;
- preserve current diagnostic logging.

It must not:

- mutate state;
- call providers;
- read files;
- build prompts;
- alter counters;
- introduce new routing decisions;
- fix known routing behavior during this extraction.

### Compatibility

`src/graph.ts` temporarily re-exports the routers so existing characterization tests remain valid without being rewritten during the refactor.

### Behavioral invariants

The following current behavior must remain unchanged during Step 5:

- `afterPlanRouter` may bypass redundant review after a `revise_read` plan contains valid files;
- `reviewRouter` routes `enough_context` to `refine`;
- the current `planningAttempts >= maxPlanningAttempts` ordering remains unchanged;
- `approve_read` with no files and no remaining context requirement routes to `refine`;
- `afterReadRouter` routes failed state to `failed`, otherwise to `plan`;
- `planGateRouter` requires no `failureReason` and a present `refinedPlan` before routing to `report`.

Known questionable behavior is characterized, not corrected, in this step.

### Acceptance criteria

- [ ] `src/graph/routers.ts` exists.
- [ ] All four router functions are removed from their implementation location in `src/graph.ts`.
- [ ] `src/graph.ts` imports the four routers.
- [ ] Existing router exports remain compatible for characterization tests.
- [ ] No router logic changes.
- [ ] No new runtime dependency.
- [ ] `npm run typecheck` passes.
- [ ] `npm run test:prompt-characterization` passes.
- [ ] `npm run test:graph-characterization` passes.
- [ ] `npm run test:tools` passes.

### Gate

```bash
npm run typecheck && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Suggested commit

```bash
git commit -m "refactor(graph): extract routers"
```

### Non-goals

Do not yet:

- correct retry/attempt semantics;
- redesign route labels;
- introduce generic router abstractions;
- change graph topology;
- move graph construction;
- change prompts, schemas, providers, or context logic.

Graph construction is reserved for Step 6.

## 12.18 Step 6 Detailed Specification — Extract Graph Builder

### Objective

Move `StateGraph` construction out of `src/graph.ts` while preserving the exact current graph topology and runtime behavior.

### New module

```text
src/graph/build-dev-graph.ts
```

It owns:

- `new StateGraph(DevState)`;
- node registration;
- static edges;
- conditional edges;
- `.compile()`.

### Compatibility strategy

During this step, node implementations remain in `src/graph.ts` and are exported so the builder can register them. This is intentionally transitional: Step 6 extracts graph assembly only and does not combine node extraction with graph extraction.

`src/graph.ts` continues exporting:

```ts
export const devGraph = buildDevGraph();
```

### Behavioral invariants

Do not change:

- node names;
- node implementations;
- edge topology;
- conditional route maps;
- START/END placement;
- router behavior;
- prompts;
- schemas;
- provider calls;
- model configuration;
- retry/token configuration;
- state semantics.

### Acceptance criteria

- [ ] `src/graph/build-dev-graph.ts` exists.
- [ ] `StateGraph`, `START`, `END`, and `DevState` graph-assembly usage moves out of `src/graph.ts`.
- [ ] graph topology is byte-for-byte equivalent in intent.
- [ ] `devGraph` remains exported from `src/graph.ts`.
- [ ] no new runtime dependency.
- [ ] `npm run typecheck` passes.
- [ ] `npm run test:prompt-characterization` passes.
- [ ] `npm run test:graph-characterization` passes.
- [ ] `npm run test:tools` passes.

### Gate

```bash
npm run typecheck && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Suggested commit

```bash
git commit -m "refactor(graph): extract graph builder"
```

### Non-goals

Do not extract graph nodes in this step. Do not redesign dependency injection or create a generic graph factory yet. Those decisions should be evaluated after H-ARCH-001 is structurally complete.

## 12.13.7 Step 7 Validation Record

**Status:** ✅ Accepted

Observed result:

- `src/graph/nodes.ts` owns the eight graph node implementations;
- `src/graph/build-dev-graph.ts` imports nodes directly from `./nodes.js`;
- the temporary circular dependency introduced by Step 6 was removed;
- `src/graph.ts` is now a small compatibility/public API boundary;
- the full validation gate passed.

**H-ARCH-001 conclusion:** structurally complete.
**Release baseline:** `v0.1.0-alpha.1`
**Next:** `H-ARCH-002 — LLM Provider Contract`

## 12.19 Step 7 Detailed Specification — Extract Graph Nodes and Remove Circular Dependency

### Objective

Move graph node implementations from `src/graph.ts` to `src/graph/nodes.ts` and remove the temporary circular dependency created by Step 6.

### Problem being solved

After Step 6:

```text
src/graph.ts
  → src/graph/build-dev-graph.ts
  → src/graph.ts
```

The builder imports nodes from the compatibility module that itself imports the builder.

Although current ESM evaluation allows this shape to work in the present implementation, the dependency direction is undesirable and fragile.

### Target dependency direction

```text
src/graph.ts
  → build-dev-graph.ts
       → nodes.ts
       → routers.ts
       → state.ts

nodes.ts
  → schemas.ts
  → prompts.ts
  → context.ts
  → repository/*
  → providers/*
```

No module under `src/graph/` should import `src/graph.ts`.

### New module

```text
src/graph/nodes.ts
```

It owns the current implementations of:

- `analyzeNode`
- `planNode`
- `reviewPlanNode`
- `readContextNode`
- `refineNode`
- `planGateNode`
- `reportNode`
- `failedNode`

It also owns the node-local model constants currently used by planner/reviewer/refine execution.

### Compatibility boundary

After Step 7, `src/graph.ts` becomes a small public/compatibility boundary that:

- re-exports context helpers;
- re-exports prompt builders;
- re-exports routers;
- re-exports nodes;
- re-exports `buildDevGraph`;
- exports the compiled `devGraph`.

### Behavioral invariants

Do not change:

- node implementation logic;
- node names;
- graph topology;
- prompts;
- schemas;
- model defaults;
- token/retry settings;
- provider behavior;
- repository-read behavior;
- state semantics;
- router behavior;
- log messages.

### Acceptance criteria

- [ ] `src/graph/nodes.ts` exists.
- [ ] all eight node implementations move out of `src/graph.ts`.
- [ ] `src/graph/build-dev-graph.ts` imports nodes from `./nodes.js`.
- [ ] `src/graph/build-dev-graph.ts` no longer imports `../graph.js`.
- [ ] no module under `src/graph/` imports the compatibility boundary `src/graph.ts`.
- [ ] `src/graph.ts` is reduced to a small compatibility/public API layer.
- [ ] `devGraph` remains exported from `src/graph.ts`.
- [ ] existing context/router/prompt exports remain compatible.
- [ ] no new runtime dependency is introduced.
- [ ] `npm run typecheck` passes.
- [ ] `npm run test:prompt-characterization` passes.
- [ ] `npm run test:graph-characterization` passes.
- [ ] `npm run test:tools` passes.

### Gate

```bash
npm run typecheck && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Suggested commit

```bash
git commit -m "refactor(graph): extract nodes and remove circular dependency"
```

### Non-goals

Do not yet:

- introduce dependency injection for nodes;
- create one file per node;
- introduce generic node factories;
- change model/provider selection;
- add telemetry;
- change planning convergence;
- optimize context;
- alter prompts.

### H-ARCH-001 completion decision after Step 7

If Step 7 passes, stop and reassess before adding more structural refactors.

Expected resulting structure:

```text
src/
├── graph.ts
└── graph/
    ├── schemas.ts
    ├── context.ts
    ├── prompts.ts
    ├── routers.ts
    ├── nodes.ts
    └── build-dev-graph.ts
```

At that point, H-ARCH-001 should be considered structurally complete unless validation reveals a concrete reason for another extraction.

# 13. Next Task Preview

## H-ARCH-002 — Introduce LLM Provider Contract

Tentative objective:

Decouple graph/application logic from `callNvidiaJson` so providers become replaceable.

Tentative contract direction:

```ts
export interface StructuredLlmProvider {
  generateStructured<T>(
    request: StructuredLlmRequest<T>,
  ): Promise<StructuredLlmResult<T>>;
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

# H-ARCH-002 — LLM Provider Contract

## Status

**Milestone:** ✅ Complete
**Current step:** Accepted
**Release candidate:** `v0.1.0-alpha.2`

## Milestone outcome

At completion, graph/application logic will depend on a provider-neutral structured LLM contract rather than `callNvidiaJson` directly. NVIDIA will be an adapter behind that contract, provider-specific errors and model-family behavior will remain inside adapters, and a second provider will prove substitutability without graph-node changes.

## Planned steps

1. **Characterize Current Provider Boundary** — deterministic tests, no production refactor.
2. **Define Provider Contract** — smallest provider-neutral structured-generation contract supported by evidence.
3. **Separate Shared Structured-Output Behavior** — normalize only genuinely provider-neutral concerns.
4. **Convert NVIDIA to Contract Adapter** — preserve characterization while implementing the contract.
5. **Provider Resolution / Composition** — configure role → provider without provider-specific graph branches.
6. **Inject Providers into Graph Nodes** — remove direct NVIDIA dependency from nodes.
7. **Add Second Provider Adapter** — initially Claude CLI or local/Ollama.
8. **Cross-Provider Acceptance** — same acceptance scenarios across implementations.
9. **Architecture Review / Release Decision** — verify dependency direction and decide next alpha.

## Step 1 — Current Provider Characterization

# H-ARCH-002 — Step 1: Characterize Current NVIDIA Provider Boundary

## Objective

Freeze the externally observable behavior of the current NVIDIA integration before introducing a provider abstraction.

## Evidence from current code

`src/providers/nvidia.ts` currently owns HTTP transport, authentication, model-family request customization, retry/backoff, JSON extraction, GPT-OSS empty-content recovery, validation wrapping, timing, and usage propagation.

`src/graph/nodes.ts` directly imports `callNvidiaJson`, so graph execution is still coupled to the NVIDIA adapter.

The existing NVIDIA planner/reviewer files are live benchmarks rather than deterministic characterization tests.

## Scope

Add one deterministic provider characterization test using a mocked global `fetch`. No production code changes.

## Characterized behaviors

- NVIDIA endpoint and bearer authentication
- base chat-completions request shape
- caller-provided model and token budget
- Nemotron `thinking: false`
- GPT-OSS `reasoning_effort: low`
- structured JSON extraction
- invalid JSON error normalization
- validator error wrapping
- non-retryable HTTP failure
- retry-limit behavior for HTTP 429
- GPT-OSS empty-content recovery and increased recovery token budget

## Non-goals

- no `LlmProvider` interface yet
- no provider factory/registry
- no node injection
- no NVIDIA production refactor
- no Claude/Ollama adapter
- no retry-policy redesign

## Acceptance

```bash
npm run typecheck
npm run test:provider-characterization
```

The test must make zero real NVIDIA requests and require no real API key.

## Exit condition

Once this characterization passes, Step 2 may define the provider contract against observed behavior instead of assumptions.

### Current validation state

The runtime characterization test already passes. The first `typecheck` exposed two test-only strict-TypeScript issues under `exactOptionalPropertyTypes`; a correction was prepared. Step 1 is not accepted until the corrected test passes the full gate:

```bash
npm run typecheck && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

## H-ARCH-002 success criterion

Provider substitution must not require graph-node edits. The same orchestration contract must be able to execute with different configured providers/models. If planner/reviewer nodes need NVIDIA-, Claude-, or Ollama-specific branches, this milestone has not achieved its architectural objective.

## Non-goals

H-ARCH-002 does not yet implement benchmark-driven model selection, telemetry dashboards, Repository Intelligence, Context Engine, implementation/fix agents, or specialist Product/UX/UI agents.

## H-ARCH-002 Step 1 Validation Record

**Status:** ✅ Accepted

The NVIDIA provider boundary is protected by deterministic characterization tests. The full Step 1 gate passed, including TypeScript, provider characterization, prompt characterization, graph characterization, and repository/tool tests.

**Decision:** use this characterized behavior as the evidence baseline for the provider-neutral contract.

## H-ARCH-002 Step 2 — Define Provider Contract

**Status:** 🚧 In progress

### Objective

Define the smallest provider-neutral contract required by the current planning workflow without changing NVIDIA production behavior or graph-node behavior.

### Architectural decision

```ts
export interface StructuredLlmProvider {
  generateStructured<T>(
    request: StructuredLlmRequest<T>,
  ): Promise<StructuredLlmResult<T>>;
}
```

The request carries `model`, `prompt`, `validate`, `maxTokens`, and `maxRetries`. The result carries validated `data`, `elapsedSeconds`, and optional provider-neutral token usage.

### Boundary rules

The contract must not expose NVIDIA URLs/authentication, HTTP details, `reasoning_effort`, `chat_template_kwargs`, `reasoning_content`, GPT-OSS recovery behavior, NVIDIA-specific errors, or a Zod dependency.

### Files in this step

Create:

```text
src/providers/contracts.ts
src/test-provider-contract.ts
```

Update:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/providers/nvidia.ts
src/graph/nodes.ts
```

### Acceptance gate

```bash
npm run typecheck && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Exit condition

Step 2 is complete when the contract compiles, a fake provider proves substitutability at the type level, production behavior remains unchanged, and all existing gates remain green.

**Next:** Step 3 — separate genuinely shared structured-output behavior from adapter-specific behavior.

## H-ARCH-002 Step 2 Validation Record

**Status:** ✅ Accepted

The provider-neutral structured generation contract is now established.

Accepted boundary:

```text
StructuredLlmProvider
  → StructuredLlmRequest<T>
  → StructuredLlmResult<T>
  → LlmUsage
```

The contract contains no NVIDIA, Claude, Ollama, HTTP, LangGraph, or Zod-specific concepts. A fake implementation proves the contract can be satisfied without infrastructure dependencies.

The full Step 2 gate passed.

## H-ARCH-002 Step 3 — Separate Shared Structured-Output Behavior

**Status:** ✅ Accepted

### Objective

Separate only the structured-output behavior that is demonstrably provider-neutral, while leaving transport, retry policy, model-family behavior, recovery behavior, timing, validation error context, and provider response mapping inside the NVIDIA adapter for now.

### Evidence-based responsibility decision

| Responsibility             | Step 3 decision        | Reason                                                  |
| -------------------------- | ---------------------- | ------------------------------------------------------- |
| JSON object extraction     | **Shared**             | Pure transformation of model text; no NVIDIA dependency |
| HTTP transport/auth        | NVIDIA adapter         | Provider-specific infrastructure                        |
| Retry/backoff/Retry-After  | NVIDIA adapter         | Bound to HTTP/provider behavior                         |
| Nemotron request body      | NVIDIA adapter         | Model/provider-specific                                 |
| GPT-OSS reasoning/recovery | NVIDIA adapter         | Model-specific workaround                               |
| Response content lookup    | NVIDIA adapter         | NVIDIA/OpenAI-compatible response shape                 |
| Timing                     | NVIDIA adapter for now | Measures concrete provider execution                    |
| Token usage mapping        | NVIDIA adapter for now | NVIDIA currently returns snake_case                     |
| Validation invocation      | NVIDIA adapter for now | Current error context includes provider/model behavior  |
| Normalized provider errors | Deferred               | Requires an explicit error contract, not yet defined    |

### Architectural decision

Create:

```text
src/providers/structured-output.ts
```

with the pure helper:

```ts
extractJsonObject(content: string): string
```

`src/providers/nvidia.ts` will import this helper instead of owning its implementation.

This is intentionally a small extraction. Step 3 does **not** create a generic structured-output executor, because current evidence does not yet justify moving validation, timing, or provider error context out of concrete adapters.

### Files in this step

Create:

```text
src/providers/structured-output.ts
```

Modify:

```text
src/providers/nvidia.ts
src/test-provider-characterization.ts
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/providers/contracts.ts
src/graph/nodes.ts
```

### Behavioral invariants

- NVIDIA request shape remains unchanged.
- NVIDIA auth/base URL remain unchanged.
- Retry/backoff remain unchanged.
- Nemotron customization remains unchanged.
- GPT-OSS recovery remains unchanged.
- Validation behavior/error text remain unchanged.
- Public `callNvidiaJson` signature remains unchanged.
- Graph nodes remain coupled to NVIDIA until the later adapter/injection steps.

### Acceptance gate

```bash
npm run typecheck && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Acceptance criteria

- [ ] JSON extraction no longer lives in `nvidia.ts`.
- [ ] the shared extraction helper imports no provider/HTTP/model dependencies.
- [ ] pure JSON behavior remains unchanged.
- [ ] fenced JSON behavior remains unchanged.
- [ ] text-prefixed JSON behavior remains supported.
- [ ] balanced embedded JSON with braces inside strings remains supported.
- [ ] invalid JSON still produces the current NVIDIA wrapping behavior.
- [ ] all previous gates remain green.
- [ ] no graph-node or contract behavior changes.

### Commit

```bash
git commit -m "refactor(provider): extract structured JSON parsing"
```

### Exit condition

Step 3 is complete when JSON extraction is a provider-neutral utility and the NVIDIA characterization suite proves no observable provider behavior regressed.

**Next:** Step 4 — convert NVIDIA into a `StructuredLlmProvider` adapter while preserving the characterized boundary.

## H-ARCH-002 Step 3 Validation Record

**Status:** ✅ Accepted

The provider-neutral JSON extraction helper now lives in:

```text
src/providers/structured-output.ts
```

`src/providers/nvidia.ts` consumes that helper while preserving NVIDIA transport, retry/backoff, model-family customization, GPT-OSS recovery, validation wrapping, timing, and legacy public API behavior.

The full Step 3 gate passed.

**Decision:** proceed to Step 4 and make NVIDIA formally satisfy `StructuredLlmProvider` without changing graph-node dependencies yet.

## H-ARCH-002 Step 4 — Convert NVIDIA to Contract Adapter

**Status:** ✅ Accepted

### Objective

Make NVIDIA formally implement the provider-neutral `StructuredLlmProvider` contract while preserving the characterized `callNvidiaJson` API and all current NVIDIA behavior.

### Architectural strategy

Introduce:

```ts
export class NvidiaProvider implements StructuredLlmProvider
```

with:

```ts
generateStructured<T>(
  request: StructuredLlmRequest<T>,
): Promise<StructuredLlmResult<T>>
```

The adapter delegates to the already-characterized `callNvidiaJson` boundary.

This is deliberate. Step 4 proves contract compatibility first; it does not simultaneously rewrite the transport implementation.

### Compatibility boundary

`callNvidiaJson` remains exported and unchanged so current graph nodes continue operating exactly as before.

Conceptually:

```text
current graph nodes
      ↓
callNvidiaJson()          ← compatibility API
      ↓
NVIDIA implementation

future consumers
      ↓
StructuredLlmProvider
      ↑
NvidiaProvider
      ↓
callNvidiaJson()
```

Later steps will invert the node dependency.

### Usage normalization

NVIDIA currently exposes token usage as:

```text
prompt_tokens
completion_tokens
total_tokens
```

The provider-neutral contract exposes:

```text
promptTokens
completionTokens
totalTokens
```

`NvidiaProvider` owns this mapping because it is adapter-specific response normalization.

### Files in this step

Modify:

```text
src/providers/nvidia.ts
src/test-provider-characterization.ts
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/providers/contracts.ts
src/providers/structured-output.ts
src/graph/nodes.ts
```

### Behavioral invariants

- `callNvidiaJson` signature remains unchanged.
- NVIDIA request shape remains unchanged.
- auth/base URL remain unchanged.
- retry/backoff remain unchanged.
- Nemotron customization remains unchanged.
- GPT-OSS recovery remains unchanged.
- validation/error behavior remains unchanged.
- graph nodes remain unchanged.
- no provider registry/factory is introduced.

### Acceptance criteria

- [ ] `NvidiaProvider` implements `StructuredLlmProvider`.
- [ ] a provider-neutral `generateStructured()` call reaches the same characterized NVIDIA transport.
- [ ] result data remains validated.
- [ ] elapsed time is preserved.
- [ ] token usage maps to camelCase provider-neutral fields.
- [ ] legacy `callNvidiaJson` behavior remains green.
- [ ] no graph-node changes.
- [ ] no new runtime dependency.
- [ ] all previous gates remain green.

### Acceptance gate

```bash
npm run typecheck && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Commit

```bash
git commit -m "feat(provider): adapt NVIDIA to structured LLM contract"
```

### Exit condition

Step 4 is complete when NVIDIA can be consumed through `StructuredLlmProvider` while the legacy boundary remains behaviorally unchanged.

**Next:** Step 5 — introduce explicit provider resolution/composition for agent roles without yet spreading provider-specific branches through the graph.

## H-ARCH-002 Step 4 Validation Record

**Status:** ✅ Accepted

`NvidiaProvider` now implements `StructuredLlmProvider` and delegates to the
characterized `callNvidiaJson` compatibility boundary.

The adapter normalizes NVIDIA token usage into the provider-neutral camelCase
shape while preserving request behavior, validation, timing, retry/backoff,
Nemotron customization, GPT-OSS recovery, and the legacy graph-facing API.

The full Step 4 gate passed.

**Decision:** proceed to explicit role composition before changing graph-node
dependencies.

## H-ARCH-002 Step 5 — Provider Resolution / Composition

**Status:** ✅ Accepted

### Objective

Create one explicit composition boundary that maps current LLM roles to a
provider, model, and execution budget without introducing provider-specific
branches inside graph nodes.

### Architectural decision

Introduce a provider-neutral role-binding contract:

```text
LlmRole
  ├── planner
  ├── reviewer
  └── refiner

LlmRoleBinding
  ├── provider: StructuredLlmProvider
  ├── model
  ├── maxTokens
  └── maxRetries
```

`src/providers/role-composition.ts` owns only the neutral binding/resolution
types and functions.

`src/providers/default-composition.ts` is the concrete runtime composition root.
For the current baseline it binds all three roles to `nvidiaProvider` while
preserving the exact model and execution settings currently duplicated in
`src/graph/nodes.ts`.

### Why execution budgets belong in the binding

The current reviewer node contains model-family policy:

```ts
REVIEW_MODEL.startsWith("openai/gpt-oss") ? 1800 : 1400;
```

Leaving that policy in the graph would make Step 6 only superficially
provider-neutral.

Step 5 therefore moves the future source of truth for model and execution
configuration into composition. The old node-local constants remain untouched
for one transitional step so runtime behavior cannot change before the new
composition is characterized.

### Transitional duplication

During Step 5:

```text
nodes.ts                    default-composition.ts
current runtime values     future composition values
```

Both intentionally contain equivalent model/token/retry settings.

Step 6 removes the node-local copies and consumes the characterized bindings.

### Files in this step

Create:

```text
src/providers/role-composition.ts
src/providers/default-composition.ts
src/test-provider-composition.ts
```

Modify:

```text
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/providers/contracts.ts
src/providers/nvidia.ts
src/providers/structured-output.ts
src/graph/nodes.ts
```

### Acceptance criteria

- [ ] planner/reviewer/refiner are explicit provider-neutral roles.
- [ ] each role resolves to provider + model + execution budget.
- [ ] different roles can be bound to different provider implementations.
- [ ] the concrete default composition uses `nvidiaProvider`.
- [ ] planner model resolution preserves `NVIDIA_PLANNER_MODEL` and its current default.
- [ ] reviewer model resolution preserves `NVIDIA_REVIEW_MODEL` and its current default.
- [ ] refiner continues sharing the planner model.
- [ ] planner keeps `maxTokens=1800`, `maxRetries=6`.
- [ ] reviewer keeps GPT-OSS `1800`, otherwise `1400`, with `maxRetries=6`.
- [ ] refiner keeps `maxTokens=2600`, `maxRetries=6`.
- [ ] graph nodes remain untouched.
- [ ] no new runtime dependency is added.
- [ ] all previous gates remain green.

### Acceptance gate

The new composition test is intentionally run directly in this step so the
patch does not speculate about the current `package.json` snapshot:

```bash
npm run typecheck && \
npx tsx src/test-provider-composition.ts && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Commit

```bash
git commit -m "feat(provider): compose LLM role bindings"
```

### Exit condition

Step 5 is complete when role-to-provider/model/budget composition is
deterministic, testable, and isolated from graph code.

**Next:** Step 6 — inject the composed role bindings into graph nodes and remove
the direct `callNvidiaJson` dependency.

## H-ARCH-002 Step 5 Validation Record

**Status:** ✅ Accepted

Role-to-provider/model/budget composition is now explicit and deterministic. The full Step 5 gate passed.

**Decision:** inject the characterized bindings into graph construction and remove direct NVIDIA dependencies from graph nodes.

## H-ARCH-002 Step 6 — Inject Providers into Graph Nodes

**Status:** ✅ Accepted

### Objective

Remove direct NVIDIA dependency and node-local provider/model policy from `src/graph/nodes.ts`. Planner, reviewer, and refiner must consume only `LlmRoleBindings` and `StructuredLlmProvider`.

### Architecture

```text
graph.ts composition root
  → defaultLlmRoleBindings
  → buildDevGraph(bindings)
  → createGraphNodes(bindings)
  → resolveLlmRole(...)
  → StructuredLlmProvider.generateStructured(...)
```

### Acceptance gate

```bash
npm run typecheck && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Commit

```bash
git commit -m "refactor(graph): inject LLM provider bindings"
```

### Exit condition

Changing a role's provider no longer requires editing `src/graph/nodes.ts`.

**Next:** Step 7 — add a second `StructuredLlmProvider` implementation.

## H-ARCH-002 Step 6 Validation Record

**Status:** ✅ Accepted

Graph LLM nodes now consume role bindings and `StructuredLlmProvider.generateStructured()` instead of importing NVIDIA directly. Provider/model/budget selection is injected through graph composition, and the Step 6 full gate passed.

**Decision:** prove the abstraction with a second concrete provider without changing graph nodes or the default runtime composition.

## H-ARCH-002 Step 7 — Add Claude CLI Provider Adapter

**Status:** ✅ Accepted

### Objective

Add Claude Code CLI as the second concrete implementation of `StructuredLlmProvider` while keeping Claude in the role of an LLM provider rather than a second repository/coding orchestrator.

### Isolation policy

Every adapter call uses `--safe-mode`, `--tools ""`, `--disallowedTools "mcp__*"`, `--no-session-persistence`, and `--disable-slash-commands`.

`--bare` is intentionally not used because the installed CLI documents that bare mode bypasses OAuth/keychain authentication.

### Structured-output decision

The CLI supports native `--json-schema`, but the current provider-neutral contract exposes only `validate: (value: unknown) => T`; it does not expose a JSON Schema. Step 7 therefore uses `--output-format json`, reads `structured_output` when present or extracts JSON from the CLI `result` field, and applies the existing validator.

Native `--json-schema` integration is deferred until the contract contains explicit schema evidence instead of only a validator closure.

### Portability finding — execution budgets

Claude Code CLI does not expose equivalents for the current neutral `maxTokens` and `maxRetries` fields. The adapter does not incorrectly map these to `--max-turns`, because turns and tokens/retries are different semantics. This mismatch is recorded for Step 8/9 architecture review.

### Files in this step

Create:

```text
src/providers/claude-cli.ts
src/test-claude-provider.ts
src/test-claude-smoke.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify graph nodes, graph builder, provider contracts, NVIDIA adapter, role composition, or default composition.

### Acceptance gate

```bash
npm run typecheck && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

Then run once for live adapter acceptance:

```bash
npm run test:claude-smoke
```

### Commit

```bash
git commit -m "feat(provider): add Claude CLI adapter"
```

### Exit condition

Step 7 is complete when Claude CLI satisfies the provider contract in deterministic tests and one real smoke invocation, while NVIDIA remains the default composition and graph code is unchanged.

**Next:** Step 8 — Cross-Provider Acceptance.

## H-ARCH-002 Step 7 Validation Record

**Status:** ✅ Accepted

`ClaudeCliProvider` now satisfies `StructuredLlmProvider` through deterministic
process-runner tests and one explicit live Claude CLI smoke invocation.

The adapter keeps Claude in provider mode: tools are disabled, session
persistence is disabled, and the graph/default NVIDIA composition remain
unchanged.

The full Step 7 deterministic gate and live smoke passed.

**Decision:** run the same provider-neutral acceptance scenario through both
concrete adapters and prove a mixed Claude/NVIDIA graph composition without
editing graph nodes.

## H-ARCH-002 Step 8 — Cross-Provider Acceptance

**Status:** ✅ Accepted

### Objective

Prove that NVIDIA and Claude CLI satisfy the same current structured-generation
contract and can coexist in one role composition without provider-specific
graph branches.

This step is acceptance/characterization work. It does not redesign the
provider contract.

### Shared acceptance scenario

Both providers receive the same provider-neutral request shape:

```text
model
prompt
validate
maxTokens
maxRetries
```

and must return the same validated application value:

```json
{
  "ok": true,
  "source": "portable"
}
```

The deterministic test uses the real adapter classes with mocked transport:

```text
NvidiaProvider
  → mocked fetch

ClaudeCliProvider
  → injected mocked CLI runner
```

No external API or Claude quota is consumed by the deterministic gate.

### Mixed composition proof

The same deterministic test constructs:

```text
planner  → ClaudeCliProvider
reviewer → NvidiaProvider
refiner  → ClaudeCliProvider
```

and passes those bindings to `buildDevGraph()`.

No graph-node edit or provider-specific branch is allowed.

### Live acceptance

After the deterministic gate, one explicit live scenario is run through each
real provider:

```text
NVIDIA API
Claude Code CLI
```

The live script uses the same prompt and application validator for both.

Environment overrides are available:

```text
NVIDIA_CROSS_PROVIDER_MODEL
CLAUDE_CROSS_PROVIDER_MODEL
```

Defaults:

```text
NVIDIA: nvidia/nemotron-3.5-lightning-30b-a3b
Claude: sonnet
```

### Portability finding retained from Step 7

`maxTokens` and `maxRetries` remain accepted by the neutral request contract,
but Claude CLI has no equivalent semantics and intentionally ignores them.

Step 8 does not hide this mismatch by mapping them to unrelated Claude CLI
flags. Passing the same request through both adapters proves the core structured
generation contract, but does not prove that execution-budget semantics are
portable.

This becomes an explicit Step 9 architecture-review decision:

```text
keep neutral execution budgets
vs.
move execution policy into provider/role-specific configuration
vs.
split portable request data from adapter capabilities
```

### Files in this step

Create:

```text
src/test-cross-provider-acceptance.ts
src/test-cross-provider-live.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/providers/contracts.ts
src/providers/nvidia.ts
src/providers/claude-cli.ts
src/providers/default-composition.ts
src/providers/role-composition.ts
src/graph/nodes.ts
src/graph/build-dev-graph.ts
```

### Deterministic acceptance gate

```bash
npm run typecheck && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Live acceptance gate

Run separately because it consumes real provider usage:

```bash
npm run test:cross-provider-live
```

### Acceptance criteria

- [ ] the same structured request scenario succeeds through `NvidiaProvider`.
- [ ] the same structured request scenario succeeds through `ClaudeCliProvider`.
- [ ] both results pass the same application validator.
- [ ] deterministic acceptance uses no real NVIDIA or Claude request.
- [ ] mixed Claude/NVIDIA role bindings compile into a graph.
- [ ] graph nodes remain unchanged.
- [ ] provider contract remains unchanged.
- [ ] default runtime composition remains NVIDIA.
- [ ] one real NVIDIA acceptance call succeeds.
- [ ] one real Claude CLI acceptance call succeeds.
- [ ] execution-budget portability mismatch is explicitly carried into Step 9.

### Commit

```bash
git commit -m "test(provider): verify cross-provider acceptance"
```

### Exit condition

Step 8 is complete when both concrete providers satisfy the same core
structured-output scenario, mixed role composition builds without graph edits,
all deterministic gates pass, and the live two-provider acceptance succeeds.

**Next:** Step 9 — Architecture Review / Release Decision. Decide the
execution-budget contract issue, verify dependency direction, and determine
whether H-ARCH-002 is ready for the next alpha release.

## H-ARCH-002 Step 8 Validation Record

**Status:** ✅ Accepted

Both concrete providers satisfied the same live structured-generation scenario:

```text
NVIDIA    — PASS
Claude CLI — PASS
```

The deterministic cross-provider acceptance also proved that a mixed graph can
be composed as:

```text
planner  → ClaudeCliProvider
reviewer → NvidiaProvider
refiner  → ClaudeCliProvider
```

without changing graph nodes.

**Decision:** proceed to the final architecture review with provider
substitutability proven by both mocked and live acceptance.

## H-ARCH-002 Step 9 — Architecture Review / Release Decision

**Status:** ✅ Accepted

### Objective

Review the architecture produced by H-ARCH-002, make explicit decisions about
the remaining contract limitation, add a deterministic dependency-direction
guard, and decide whether the milestone is ready for the next alpha release.

### Architecture findings

#### 1. Provider substitution — accepted

The milestone success criterion is satisfied.

Graph nodes resolve provider-neutral role bindings and invoke:

```text
StructuredLlmProvider.generateStructured()
```

They contain no NVIDIA or Claude-specific branch.

Both NVIDIA and Claude CLI satisfy the same core structured-generation
scenario, and mixed provider role composition builds successfully.

#### 2. Dependency direction — accepted

Desired direction:

```text
graph nodes / builder
        ↓
role-composition
        ↓
StructuredLlmProvider contract
        ↑
concrete adapters

outer composition root
        ↓
default-composition
        ↓
concrete provider selection
```

`src/graph.ts` is allowed to know the default composition because it is the
current outer compatibility/runtime composition boundary.

`src/graph/nodes.ts` and `src/graph/build-dev-graph.ts` must not import concrete
provider adapters.

Step 9 adds a deterministic architecture test to guard this rule.

#### 3. maxTokens / maxRetries portability — accepted as alpha limitation

Cross-provider evidence shows that these fields are not universal execution
controls:

```text
NVIDIA:
  maxTokens  → supported
  maxRetries → supported

Claude Code CLI:
  maxTokens  → no equivalent control
  maxRetries → no equivalent control
```

Mapping them to unrelated Claude flags such as `--max-turns` would be
semantically incorrect.

**Decision for H-ARCH-002:** do not redesign the runtime contract in the final
acceptance step.

For the current alpha contract, `maxTokens` and `maxRetries` are explicitly
documented as optional execution hints rather than cross-provider guarantees.

A capability-aware execution-policy redesign belongs to H-ARCH-003, where it
can be evaluated independently instead of mixing a new policy model into the
provider-contract acceptance commit.

#### 4. H-ARCH-003 replan

Step 6 of H-ARCH-002 already implemented the graph dependency injection that
the original H-ARCH-003 preview expected.

Therefore H-ARCH-003 is adjusted from:

```text
Extract Graph Node Dependencies / Runtime Composition
```

to:

```text
Execution Policy / Runtime Composition Hardening
```

Initial evidence-driven questions for H-ARCH-003:

- should execution budgets be provider capabilities rather than request fields?
- should role bindings carry portable policy, provider-specific policy, or both?
- should adapters expose capability metadata?
- how should timeout/retry/fallback policy be separated from model generation?
- where should provider lifecycle/process startup policy live?

This is a roadmap refinement based on completed architecture, not a change to
the overall product objective.

### Step 9 files

Create:

```text
src/test-provider-architecture.ts
```

Modify:

```text
src/providers/contracts.ts
src/providers/role-composition.ts
src/providers/default-composition.ts
src/providers/nvidia.ts
src/providers/claude-cli.ts
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify runtime graph behavior, prompts, schemas, routing, provider
transport logic, or default provider selection.

### Architecture test

`test:provider-architecture` verifies that:

- graph nodes do not import NVIDIA or Claude adapters;
- graph builder does not import concrete adapters;
- graph nodes invoke the neutral provider contract;
- graph builder requires injected role bindings;
- neutral contracts/composition do not import concrete adapters;
- concrete default provider selection remains isolated in composition;
- the outer `src/graph.ts` boundary may depend on default composition.

### Final H-ARCH-002 gate

```bash
npm run typecheck && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

The Step 8 live cross-provider gate does not need to be repeated in every
deterministic run because it already passed against both concrete providers.
It remains an explicit release/smoke command:

```bash
npm run test:cross-provider-live
```

### Acceptance criteria

- [x] dependency-direction architecture test passes.
- [x] graph nodes contain no concrete provider dependency.
- [x] graph builder contains no concrete provider dependency.
- [x] NVIDIA and Claude adapters remain behind the same contract.
- [x] cross-provider deterministic acceptance remains green.
- [x] previous provider/graph/prompt/tool gates remain green.
- [x] maxTokens/maxRetries semantics are documented as optional hints.
- [x] no unsupported Claude mapping is introduced.
- [x] H-ARCH-003 is replanned around execution-policy hardening.
- [x] no runtime behavior change is mixed into the final review.
- [x] H-ARCH-002 is approved for the next alpha release if the full gate passes.

### Release decision

The full Step 9 gate passed:

```text
H-ARCH-002 — ACCEPTED
Next release candidate — v0.1.0-alpha.2
Next architecture task — H-ARCH-003
```

Do not bump `package.json` in this review commit because the package lock was
not part of the Step 9 source snapshot. Version/tag publication should be a
separate release commit after H-ARCH-002 acceptance.

### Commit

```bash
git commit -m "test(architecture): review provider boundaries"
```

### Exit condition

Step 9 is complete when the architecture guard and all deterministic regression
gates pass. At that point H-ARCH-002 can be marked complete and the
`v0.1.0-alpha.2` release can be prepared.

## H-ARCH-002 Step 9 Validation Record

**Status:** ✅ Accepted

The final architecture gate passed.

Verified outcomes:

- graph nodes remain provider-neutral;
- graph builder requires injected role bindings;
- concrete provider selection remains outside graph nodes;
- NVIDIA and Claude CLI satisfy the same structured LLM contract;
- deterministic cross-provider acceptance passes;
- live NVIDIA/Claude cross-provider acceptance passes;
- provider architecture boundary test passes;
- `maxTokens` and `maxRetries` are explicitly treated as optional execution hints.

**H-ARCH-002 conclusion:** complete.

**Release decision:** `v0.1.0-alpha.2 — Provider Abstraction Alpha`

**Next:** `H-ARCH-003 — Execution Policy / Runtime Composition Hardening`

# H-ARCH-003 — Execution Policy / Runtime Composition Hardening

## Status

**Milestone:** ✅ Complete
**Current step:** Accepted
**Release baseline:** `v0.1.0-alpha.2`
**Release candidate:** `v0.1.0-alpha.3 — Runtime Policy Alpha`

## Milestone objective

H-ARCH-002 proved that graph execution can substitute concrete LLM providers without graph-node edits.

H-ARCH-003 hardens that abstraction so providers do not need to pretend they share execution controls that are not semantically equivalent.

The milestone focuses on:

```text
provider capabilities
portable execution policy
provider-specific execution controls
timeout ownership
retry ownership
provider lifecycle
runtime composition
```

The graph must remain provider-neutral.

## Planned steps

1. **Characterize Execution Policy Differences**
2. **Define Provider Capabilities Contract**
3. **Separate Portable Policy from Provider Hints**
4. **Introduce Runtime Role Configuration**
5. **Centralize Timeout / Retry Ownership**
6. **Provider Lifecycle / Process Policy**
7. **Cross-Provider Acceptance / Architecture Review**

The sequence may be reduced if Step 1 evidence proves that a planned abstraction is unnecessary.

---

## H-ARCH-003 Step 1 — Characterize Execution Policy Differences

**Status:** ✅ Accepted

### Objective

Freeze the current execution-policy differences between NVIDIA and Claude CLI before redesigning contracts or runtime composition.

This is a characterization step.

No production behavior changes are allowed.

### Current evidence matrix

| Concern                             | NVIDIA                                  | Claude CLI                                                   |
| ----------------------------------- | --------------------------------------- | ------------------------------------------------------------ |
| Shared structured provider contract | yes                                     | yes                                                          |
| `maxTokens` equivalent              | maps to `max_tokens`                    | no equivalent                                                |
| `maxRetries` equivalent             | provider-owned HTTP/network retries     | no equivalent                                                |
| Timeout policy                      | none explicit                           | none explicit                                                |
| Invocation lifecycle                | HTTP `fetch` per request                | CLI runner/process invocation per request                    |
| Structured-output transport         | response text + shared JSON extraction  | JSON CLI envelope; `structured_output` or JSON from `result` |
| Usage normalization                 | NVIDIA snake_case → neutral usage       | CLI input/output tokens → neutral usage                      |
| Provider-specific model behavior    | Nemotron/GPT-OSS request/recovery logic | CLI flags/isolation policy                                   |
| Retryable transport failures        | 429/500/502/503/504 + network errors    | no adapter retry policy                                      |
| Default provider                    | NVIDIA                                  | non-default                                                  |

### Key finding to protect

The current shared request shape contains:

```text
maxTokens
maxRetries
```

but the adapters do not implement equivalent semantics.

NVIDIA consumes both controls.

Claude CLI intentionally ignores both because mapping them to unrelated CLI flags would be incorrect.

Step 1 characterizes this fact; it does not fix it.

### Deterministic characterization test

Create:

```text
src/test-provider-execution-policy-characterization.ts
```

The test uses:

```text
NvidiaProvider
  → mocked fetch

ClaudeCliProvider
  → injected mocked runner
```

It verifies:

- NVIDIA maps `maxTokens` to `max_tokens`;
- Claude does not map `maxTokens` to an invented CLI control;
- Claude does not map `maxRetries` to `--max-turns`;
- NVIDIA currently owns retry behavior inside the adapter;
- neither provider has an explicit timeout policy;
- Claude default execution is process/runner based;
- both normalize token usage into the shared result contract;
- both preserve their provider-specific structured-output transport.

No real NVIDIA or Claude request is allowed.

### Scope

Create:

```text
src/test-provider-execution-policy-characterization.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/providers/contracts.ts
src/providers/role-composition.ts
src/providers/default-composition.ts
src/providers/nvidia.ts
src/providers/claude-cli.ts
src/providers/structured-output.ts
```

### Non-goals

Do not yet:

- add a capabilities interface;
- remove `maxTokens` or `maxRetries`;
- introduce timeout controls;
- move retry ownership;
- optimize Claude CLI startup;
- introduce provider fallback;
- change default provider/model selection;
- change graph nodes;
- change prompts;
- add benchmark telemetry.

### Deterministic gate

```bash
npm run typecheck && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Acceptance criteria

- [ ] current NVIDIA execution controls are characterized.
- [ ] current Claude CLI execution controls are characterized.
- [ ] `maxTokens` semantic mismatch is proven deterministically.
- [ ] `maxRetries` semantic mismatch is proven deterministically.
- [ ] current retry ownership is recorded.
- [ ] absence of explicit provider timeout policy is recorded.
- [ ] current Claude process/runner lifecycle boundary is recorded.
- [ ] structured-output transport differences are recorded.
- [ ] token usage normalization remains green for both providers.
- [ ] no production source behavior changes.
- [ ] no real provider usage is consumed by the test.
- [ ] all alpha.2 regression gates remain green.

### Commit

```bash
git commit -m "test(provider): characterize execution policy differences"
```

### Exit condition

Step 1 is complete when the current provider execution-policy asymmetries are protected by deterministic tests and the full regression gate passes.

Only then may Step 2 decide whether a provider-capabilities contract is actually justified by evidence.

## H-ARCH-003 Step 1 Validation Record

**Status:** ✅ Accepted

The deterministic execution-policy characterization gate passed.

Evidence frozen by Step 1:

- NVIDIA maps `maxTokens` to the concrete `max_tokens` request control;
- NVIDIA owns HTTP/network retry behavior inside the adapter;
- Claude CLI has no equivalent for `maxTokens`;
- Claude CLI has no equivalent for `maxRetries`;
- Claude does not misuse `--max-turns` as retry policy;
- neither adapter currently exposes explicit timeout control;
- Claude execution is runner/process based;
- both adapters normalize usage through the same provider-neutral result shape.

**Decision:** Step 2 may define capability metadata, but only for semantic
controls that the orchestrator can meaningfully reason about.

---

## H-ARCH-003 Step 2 — Define Provider Capabilities Contract

**Status:** ✅ Accepted

### Objective

Define the smallest capability contract justified by Step 1 evidence without
changing provider execution behavior or runtime role policy.

### Architectural decision

Add two provider-neutral contracts:

```ts
type StructuredLlmProviderCapabilities = Readonly<{
  supportsOutputTokenLimit: boolean;
  supportsTransportRetries: boolean;
}>;

interface CapabilityAwareStructuredLlmProvider extends StructuredLlmProvider {
  readonly capabilities: StructuredLlmProviderCapabilities;
}
```

The existing `StructuredLlmProvider` remains unchanged.

This is deliberate.

Step 2 defines and proves capability metadata without simultaneously forcing
all role bindings/test doubles to become capability-aware or redesigning
execution policy. Promotion of capability awareness into runtime composition
belongs to later H-ARCH-003 steps.

### Why these two capabilities

Step 1 produced concrete cross-provider evidence for exactly two semantic
execution controls:

| Capability                      | NVIDIA    | Claude CLI  |
| ------------------------------- | --------- | ----------- |
| output token limit              | supported | unsupported |
| adapter-owned transport retries | supported | unsupported |

These controls are observable, semantically meaningful, and potentially useful
to orchestration.

### What is intentionally excluded

Do not add capability flags for:

```text
processBased
httpBased
nativeStructuredOutput
explicitTimeout
providerName
modelFamily
```

Reasons:

- process/HTTP lifecycle is currently an adapter implementation detail;
- both providers already satisfy the structured-output application contract;
- Step 1 proved neither adapter has explicit timeout support yet;
- provider/model identity belongs to composition, not capabilities.

Capability metadata should answer:

> what semantic execution control can this provider honor?

It should not become a generic description of provider internals.

### Provider declarations

NVIDIA:

```text
supportsOutputTokenLimit = true
supportsTransportRetries = true
```

Claude CLI:

```text
supportsOutputTokenLimit = false
supportsTransportRetries = false
```

No runtime behavior changes.

### Files

Create:

```text
src/test-provider-capabilities.ts
```

Modify:

```text
src/providers/contracts.ts
src/providers/nvidia.ts
src/providers/claude-cli.ts
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/providers/role-composition.ts
src/providers/default-composition.ts
src/graph/*
```

### Non-goals

Do not yet:

- remove `maxTokens` or `maxRetries` from `StructuredLlmRequest`;
- make role bindings capability-aware;
- introduce portable execution policy;
- introduce timeout controls;
- move retry ownership;
- add provider fallback;
- expose provider lifecycle details;
- change NVIDIA or Claude request behavior;
- change graph nodes.

### Deterministic gate

```bash
npm run typecheck && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Acceptance criteria

- [ ] capability type is provider-neutral.
- [ ] capability-aware provider extends, rather than replaces, the existing base contract.
- [ ] NVIDIA advertises only capabilities it currently honors.
- [ ] Claude CLI explicitly advertises unsupported token-limit/retry controls.
- [ ] capability metadata does not expose lifecycle/transport implementation details.
- [ ] role bindings remain unchanged.
- [ ] graph remains unchanged.
- [ ] provider execution behavior remains unchanged.
- [ ] deterministic capability test passes.
- [ ] Step 1 characterization remains green.
- [ ] all alpha.2 regression gates remain green.

### Commit

```bash
git commit -m "feat(provider): define execution capabilities"
```

### Exit condition

Step 2 is complete when provider capability metadata is explicit and verified
without changing runtime policy.

**Next:** Step 3 — Separate Portable Policy from Provider Hints.

## H-ARCH-003 Step 2 Validation Record

**Status:** ✅ Accepted

The provider-capabilities contract and full deterministic regression gate passed.

Accepted capability metadata:

```text
NVIDIA:
  supportsOutputTokenLimit = true
  supportsTransportRetries = true

Claude CLI:
  supportsOutputTokenLimit = false
  supportsTransportRetries = false
```

The base `StructuredLlmProvider` contract remained valid and role bindings were
not changed during Step 2.

**Decision:** Step 3 may now separate provider-specific execution hints from
future portable Harness policy.

---

## H-ARCH-003 Step 3 — Separate Portable Policy from Provider Hints

**Status:** ✅ Accepted

### Objective

Remove ambiguous `maxTokens` / `maxRetries` fields from the shared structured
request and replace them with explicitly named provider hints.

This step does **not** introduce portable Harness execution policy yet.

### Architectural decision

The provider-neutral application request remains:

```text
model
prompt
validate
```

Optional provider-specific controls are grouped under:

```ts
type StructuredLlmProviderHints = Readonly<{
  maxOutputTokens?: number;
  transportRetries?: number;
}>;
```

and attached as:

```ts
providerHints?: StructuredLlmProviderHints;
```

### Semantic separation

```text
Application request:
  model
  prompt
  validate

Provider hints:
  maxOutputTokens
  transportRetries

Portable Harness policy:
  intentionally not defined yet
```

This matters because:

- `maxOutputTokens` is a provider generation control, not a Harness guarantee;
- `transportRetries` describes retries owned by a provider/transport adapter;
- neither should be confused with future task-level retry, fallback, timeout,
  or orchestration policy.

### NVIDIA mapping

The NVIDIA adapter maps:

```text
providerHints.maxOutputTokens
  → legacy NvidiaCallOptions.maxTokens
  → NVIDIA max_tokens

providerHints.transportRetries
  → legacy NvidiaCallOptions.maxRetries
  → current HTTP/network retry loop
```

This preserves existing NVIDIA runtime behavior while making the external
semantics explicit.

### Claude mapping

Claude CLI advertises both capabilities as unsupported.

The adapter accepts the shared request shape but does not invent CLI mappings
for unsupported hints.

### Role composition

`LlmRoleBinding` changes from:

```text
provider
model
maxTokens
maxRetries
```

to:

```text
provider
model
providerHints?
```

The current default NVIDIA role values are preserved exactly:

```text
planner:
  maxOutputTokens = 1800
  transportRetries = 6

reviewer:
  maxOutputTokens = 1800 for GPT-OSS, otherwise 1400
  transportRetries = 6

refiner:
  maxOutputTokens = 2600
  transportRetries = 6
```

### Graph behavior

Graph nodes remain provider-neutral.

They forward `binding.providerHints` without inspecting capabilities or
branching on concrete providers.

Capability-aware policy decisions belong to the next runtime-composition steps.

### Files

Create:

```text
src/test-provider-hints.ts
```

Modify:

```text
src/providers/contracts.ts
src/providers/role-composition.ts
src/providers/default-composition.ts
src/providers/nvidia.ts
src/providers/claude-cli.ts
src/graph/nodes.ts
src/test-provider-contract.ts
src/test-provider-composition.ts
src/test-provider-injection.ts
src/test-provider-execution-policy-characterization.ts
src/test-cross-provider-acceptance.ts
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

### Non-goals

Do not yet:

- introduce `timeoutMs`;
- introduce Harness/task retry policy;
- move NVIDIA transport retry implementation;
- make graph nodes inspect capabilities;
- reject unsupported hints at runtime;
- add fallback;
- optimize Claude process startup;
- redesign provider lifecycle;
- change model defaults;
- change prompt/routing behavior.

### Step 3 typecheck correction

The first Step 3 gate exposed two characterization tests that still used the
removed `StructuredLlmRequest.maxTokens` / `maxRetries` fields:

```text
src/test-claude-provider.ts
src/test-provider-characterization.ts
```

These tests are part of the same Step 3 semantic migration and now use:

```text
providerHints.maxOutputTokens
providerHints.transportRetries
```

No production behavior changes are introduced by this correction.

### Deterministic gate

```bash
npm run typecheck && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Acceptance criteria

- [ ] `maxTokens` is removed from `StructuredLlmRequest`.
- [ ] `maxRetries` is removed from `StructuredLlmRequest`.
- [ ] provider hints use explicit semantic names.
- [ ] role bindings carry optional provider hints rather than ambiguous budgets.
- [ ] NVIDIA default output-token values remain unchanged.
- [ ] NVIDIA default transport-retry values remain unchanged.
- [ ] Claude CLI still does not map unsupported hints to unrelated flags.
- [ ] graph nodes remain provider-neutral.
- [ ] no portable Harness timeout/retry policy is invented early.
- [ ] provider capability tests remain green.
- [ ] execution-policy characterization remains green.
- [ ] cross-provider deterministic acceptance remains green.
- [ ] all alpha.2 regression gates remain green.

### Commit

```bash
git commit -m "refactor(provider): separate provider execution hints"
```

### Exit condition

Step 3 is complete when provider-specific execution controls are explicitly
separated from the core structured-generation request semantics while existing
runtime behavior remains stable.

**Next:** Step 4 — Introduce Runtime Role Configuration.

## H-ARCH-003 Step 3 Validation Record

**Status:** ✅ Accepted

The provider-hint migration and full deterministic regression gate passed.

Accepted outcome:

```text
StructuredLlmRequest
  → model
  → prompt
  → validate
  → providerHints?

providerHints
  → maxOutputTokens
  → transportRetries
```

The old ambiguous `maxTokens` / `maxRetries` request fields are no longer part
of the provider-neutral request shape.

**Decision:** Step 4 may now promote capability awareness into the runtime
role-composition boundary.

---

## H-ARCH-003 Step 4 — Introduce Runtime Role Configuration

**Status:** ✅ Accepted

### Objective

Make the runtime role configuration an explicit capability-aware boundary
between outer composition and graph execution.

The graph should receive effective runtime configuration rather than raw role
bindings whose provider hints may be unsupported.

### Architectural decision

Introduce:

```text
src/providers/runtime-composition.ts
```

with:

```ts
LlmRoleRuntimeConfig
LlmRuntimeConfig
ResolvedLlmRoleRuntime
defineLlmRuntimeConfig(...)
resolveLlmRoleRuntime(...)
```

### Runtime responsibility

Runtime composition owns:

```text
role
  → provider
  → model
  → requested provider hints
  → provider capabilities
  → effective provider hints
```

Graph nodes consume only the resolved result.

### Capability-aware hint resolution

Example:

```text
requested:
  maxOutputTokens = 1800
  transportRetries = 6

provider capabilities:
  supportsOutputTokenLimit = false
  supportsTransportRetries = false

resolved:
  providerHints = omitted
```

This prevents the graph from forwarding controls that the configured provider
cannot honor.

### Why this belongs here

The provider adapter should not decide orchestration configuration.

The graph should not branch on provider capabilities.

Therefore capability-to-hint resolution belongs between:

```text
default/user runtime composition
          ↓
runtime role resolver
          ↓
graph nodes
```

### Compatibility

`src/providers/role-composition.ts` remains temporarily as a compatibility
boundary.

Its existing types/functions delegate to the new runtime-composition module.

This avoids unnecessary external breakage while the internal graph migrates to
the new terminology.

### Default runtime

`src/providers/default-composition.ts` exports:

```text
defaultLlmRuntimeConfig
```

and temporarily keeps:

```text
defaultLlmRoleBindings
```

as a compatibility alias.

The current default NVIDIA models and provider hints remain unchanged.

### Graph changes

`src/graph/nodes.ts` and `src/graph/build-dev-graph.ts` depend directly on
`LlmRuntimeConfig` / `resolveLlmRoleRuntime`.

No concrete provider import is introduced.

### Files

Create:

```text
src/providers/runtime-composition.ts
src/test-runtime-composition.ts
```

Modify:

```text
src/providers/role-composition.ts
src/providers/default-composition.ts
src/graph/nodes.ts
src/graph/build-dev-graph.ts
src/graph.ts
src/test-provider-hints.ts
src/test-provider-composition.ts
src/test-provider-injection.ts
src/test-cross-provider-acceptance.ts
src/test-provider-architecture.ts
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/providers/contracts.ts
src/providers/nvidia.ts
src/providers/claude-cli.ts
```

### Non-goals

Do not yet:

- add Harness timeout policy;
- add Harness call retries;
- move NVIDIA transport retries;
- add fallback;
- redesign provider lifecycle;
- optimize Claude CLI startup;
- change provider request/response behavior;
- change model defaults;
- change graph topology;
- change prompts or routing semantics.

### Step 4 typecheck correction

The first Step 4 gate exposed a test-only typing mismatch in:

```text
src/test-provider-composition.ts
src/test-provider-injection.ts
```

Both fake-provider helpers were still declared to return the base
`StructuredLlmProvider` type even though Step 4 added the required capability
metadata and runtime configuration now requires
`CapabilityAwareStructuredLlmProvider`.

The correction changes only the fake-provider return types/imports. No
production runtime behavior is changed.

### Deterministic gate

```bash
npm run typecheck && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Acceptance criteria

- [ ] runtime-composition module exists.
- [ ] runtime role provider is capability-aware.
- [ ] unsupported provider hints are removed before graph execution.
- [ ] graph nodes do not inspect provider capabilities.
- [ ] graph nodes do not import concrete providers.
- [ ] builder accepts `LlmRuntimeConfig`.
- [ ] default NVIDIA runtime values remain unchanged.
- [ ] old role-composition API remains temporarily compatible.
- [ ] no provider adapter behavior changes.
- [ ] no graph topology/prompt/routing behavior changes.
- [ ] runtime-composition deterministic test passes.
- [ ] all previous alpha.2 gates remain green.

### Commit

```bash
git commit -m "refactor(runtime): introduce capability-aware role config"
```

### Exit condition

Step 4 is complete when runtime role configuration is explicit,
capability-aware, and isolated from both graph nodes and concrete provider
adapters.

**Next:** Step 5 — Centralize Timeout / Retry Ownership.

## H-ARCH-003 Step 4 Validation Record

**Status:** ✅ Accepted

The capability-aware runtime-composition gate passed in the development
environment.

Accepted outcome:

```text
default/user runtime config
          ↓
resolveLlmRoleRuntime(...)
          ↓
capability-aware effective provider hints
          ↓
graph nodes
```

Unsupported provider hints are removed before graph execution, and graph nodes
remain provider-neutral.

### Documentation correction

The Step 4 source commit was completed after the full gate passed, but the
uploaded engineering-plan snapshot still showed Step 4 as `In progress`.

This record corrects that stale plan metadata before Step 5 work. It does not
change Step 4 source behavior.

**Decision:** Step 5 may centralize the provider-call execution boundary.

---

## H-ARCH-003 Step 5 — Centralize Timeout / Retry Ownership

**Status:** ✅ Accepted

### Objective

Create one portable execution boundary for complete structured-LLM calls and
make ownership of retry/timeout semantics explicit without inventing unsafe
behavior.

### Evidence-driven ownership decision

There are three distinct retry concepts:

```text
transport retry
  → adapter-specific
  → NVIDIA HTTP/network retry today

whole provider-call retry
  → Harness execution concern
  → not implemented yet

task/graph retry
  → orchestration concern
  → existing planning/review state logic, outside this step
```

Timeout is also a Harness provider-call concern, but correct timeout behavior
requires cancellation/lifecycle semantics from concrete providers.

### Architectural decision

Create:

```text
src/providers/execution.ts
```

with:

```ts
executeStructuredLlm(runtime, request);
```

Graph LLM nodes delegate all complete provider invocations through this
boundary.

Current execution semantics remain intentionally:

```text
one provider invocation
no Harness-level timeout
no Harness-level whole-call retry
```

### Why Step 5 does not implement timeout yet

A `Promise.race()` timeout would only stop waiting.

It would **not** reliably cancel:

```text
NVIDIA fetch
Claude CLI child process
```

For Claude CLI this could leave an orphaned/continuing provider process and
still consume quota after the Harness considers the call timed out.

Therefore timeout implementation is blocked on Step 6 lifecycle/cancellation
semantics.

### Why Step 5 does not implement whole-call retry yet

The current provider contract has no normalized error classification such as:

```text
retryable
non-retryable
cancelled
timed-out
```

Retrying every provider exception would incorrectly retry validation errors,
invalid structured output, authentication failures, or other deterministic
failures.

Therefore Step 5 establishes ownership and a single execution point, but does
not add retries until evidence supports a safe retry decision.

### Provider transport retries

NVIDIA's existing:

```text
429 / 500 / 502 / 503 / 504
network errors
Retry-After
backoff/jitter
```

remain inside the NVIDIA adapter.

`providerHints.transportRetries` remains the adapter-owned transport retry
control characterized in Steps 1–4.

Claude CLI continues to advertise no transport-retry capability.

### Graph dependency direction

Before:

```text
graph node
  → resolved runtime
  → runtime.provider.generateStructured(...)
```

After:

```text
graph node
  → resolved runtime
  → executeStructuredLlm(...)
  → runtime.provider.generateStructured(...)
```

Graph topology, prompts, schemas, routing, models, and provider transport
behavior remain unchanged.

### Files

Create:

```text
src/providers/execution.ts
src/test-llm-execution.ts
```

Modify:

```text
src/graph/nodes.ts
src/test-provider-injection.ts
src/test-provider-architecture.ts
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/providers/contracts.ts
src/providers/runtime-composition.ts
src/providers/default-composition.ts
src/providers/nvidia.ts
src/providers/claude-cli.ts
src/graph/build-dev-graph.ts
src/graph.ts
```

### Non-goals

Do not yet:

- add `timeoutMs`;
- use `Promise.race()` as fake cancellation;
- add Harness whole-call retries;
- move NVIDIA transport retry behavior;
- add normalized provider error taxonomy;
- add fallback between providers;
- optimize Claude CLI startup;
- redesign process lifecycle;
- change graph/task retry semantics;
- change models/prompts/routing.

### Deterministic test

`test:llm-execution` proves:

- resolved model is forwarded;
- effective provider hints are forwarded;
- application prompt/validator are preserved;
- exactly one provider invocation occurs;
- provider result is returned unchanged;
- provider errors propagate unchanged;
- Harness does not silently add whole-call retries.

### Deterministic gate

```bash
npm run typecheck && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Acceptance criteria

- [x] portable LLM execution boundary exists.
- [x] graph nodes no longer invoke provider adapters directly.
- [x] execution boundary imports no concrete provider.
- [x] transport retry remains provider-owned.
- [x] no Harness-level retry is accidentally introduced.
- [x] no fake timeout/cancellation behavior is introduced.
- [x] provider exceptions still propagate unchanged.
- [x] provider result/timing/usage behavior remains unchanged.
- [x] graph topology remains unchanged.
- [x] provider adapters remain unchanged.
- [x] architecture guard protects the new dependency direction.
- [x] full alpha.2 regression gate remains green.

### Commit

```bash
git commit -m "refactor(runtime): centralize LLM execution boundary"
```

### Exit condition

Step 5 is complete when every graph LLM call crosses one portable execution
boundary and retry/timeout ownership is explicit without unsafe behavior.

**Next:** Step 6 — Provider Lifecycle / Process Policy.

Step 6 must establish the cancellation/lifecycle evidence needed before a real
portable timeout policy can be implemented.

## H-ARCH-003 Step 5 Validation Record

**Status:** ✅ Accepted

The full deterministic Step 5 gate passed in the development environment.

Accepted outcomes:

```text
graph LLM nodes
  → resolveLlmRoleRuntime(...)
  → executeStructuredLlm(...)
  → provider.generateStructured(...)
```

Ownership is now explicit:

```text
transport retry
  → concrete provider adapter

whole provider-call retry
  → portable execution boundary
  → intentionally not implemented yet

provider-call timeout
  → portable execution boundary
  → intentionally not implemented until cancellation/lifecycle is safe

task/graph retry
  → orchestration/state
```

The Step 5 gate also proved that the new execution boundary performs exactly
one provider invocation, preserves the provider result/error semantics, and
does not introduce hidden retry or fake timeout behavior.

**Decision:** proceed to Step 6 — Provider Lifecycle / Process Policy.

## H-ARCH-003 Step 6 — Provider Lifecycle / Process Policy

**Status:** ✅ Accepted

### Objective

Establish real cooperative cancellation for both concrete providers so future
portable timeout policy can stop underlying provider work instead of merely
stopping the Harness await.

### Evidence

Current provider lifecycle differs:

```text
NVIDIA
  → fetch request

Claude CLI
  → execFile child process
```

Step 5 deliberately rejected `Promise.race()` timeout because it would not
guarantee cancellation of either underlying operation.

### Architectural decision

Add an optional portable cancellation signal to the structured request:

```ts
signal?: AbortSignal
```

This is not a provider hint.

Cancellation is a complete-call lifecycle concern and therefore belongs to the
portable request/execution path.

Provider hints remain limited to provider-owned controls such as output-token
limits and transport retries.

### Execution boundary

`executeStructuredLlm(...)` forwards the optional signal unchanged to the
resolved provider.

The execution boundary still does not create its own timeout in Step 6.

### NVIDIA lifecycle policy

The NVIDIA adapter propagates the signal through:

```text
generateStructured
  → callNvidiaJson
  → requestNvidia
  → fetch
```

The same signal also covers:

- transport retry loops;
- retry backoff sleep;
- GPT-OSS empty-content recovery.

Once cancellation is observed, NVIDIA must not perform another transport retry.

Existing 429/5xx/network retry behavior remains unchanged when no cancellation
occurs.

### Claude CLI lifecycle policy

The Claude runner accepts optional execution options:

```ts
{
  signal?: AbortSignal
}
```

The default `execFile` runner wires the signal to the child process and uses:

```text
killSignal = SIGTERM
```

Abort therefore terminates the actual Claude CLI process rather than only
rejecting an outer Harness promise.

Existing injected test runners remain compatible because the options argument
is optional.

### Timeout policy

Step 6 does **not** add `timeoutMs` or `AbortSignal.timeout()`.

After Step 6, the architecture has the cancellation primitive required for a
future timeout implementation.

The Step 7 architecture review will decide whether timeout policy belongs in
H-ARCH-003 finalization or should remain deferred to production hardening.

### Files

Create:

```text
src/test-provider-lifecycle.ts
```

Modify:

```text
src/providers/contracts.ts
src/providers/execution.ts
src/providers/nvidia.ts
src/providers/claude-cli.ts
src/test-claude-provider.ts
src/test-provider-execution-policy-characterization.ts
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/providers/runtime-composition.ts
src/providers/default-composition.ts
src/graph/*
```

### Non-goals

Do not yet:

- add a timeout duration to runtime config;
- add Harness whole-call retry;
- add provider fallback;
- add normalized error taxonomy;
- change NVIDIA retry/backoff values;
- change model defaults;
- change prompts;
- change graph topology/routing;
- optimize Claude CLI startup.

### Deterministic lifecycle test

`test:provider-lifecycle` proves:

- NVIDIA fetch receives the exact request signal;
- aborting NVIDIA cancels the in-flight request;
- NVIDIA does not retry after cancellation;
- Claude provider forwards the exact signal to its runner;
- aborting Claude cancels the in-flight runner operation;
- the default Claude `execFile` runner terminates a local child process via
  cooperative abort;
- no real NVIDIA or Claude provider usage is consumed.

### Deterministic gate

```bash
npm run typecheck && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Acceptance criteria

- [x] `StructuredLlmRequest` supports optional cooperative cancellation.
- [x] cancellation is distinct from provider hints.
- [x] execution boundary forwards the cancellation signal.
- [x] NVIDIA wires cancellation to real `fetch`.
- [x] NVIDIA cancellation stops transport retry progression.
- [x] NVIDIA retry backoff is abortable.
- [x] GPT-OSS recovery receives the same cancellation signal.
- [x] Claude runner accepts optional lifecycle execution options.
- [x] Claude default process runner wires cancellation to `execFile`.
- [x] Claude child process uses explicit `SIGTERM` cancellation policy.
- [x] existing injected Claude runners remain source-compatible.
- [x] no timeout duration/policy is introduced prematurely.
- [x] no whole-call retry/fallback is introduced.
- [x] provider lifecycle deterministic test passes.
- [x] all previous regression gates remain green.

### Commit

```bash
git commit -m "feat(runtime): add provider cancellation lifecycle"
```

### Exit condition

Step 6 is complete when both concrete providers can cooperatively cancel their
actual underlying work and the full deterministic regression gate passes.

**Next:** Step 7 — Cross-Provider Acceptance / Architecture Review.

## H-ARCH-003 Step 6 Validation Record

**Status:** ✅ Accepted

The full deterministic Step 6 gate passed in the development environment.

Validated outcomes:

```text
StructuredLlmRequest.signal
  → executeStructuredLlm(...)
  → concrete provider adapter
```

NVIDIA:

```text
signal
  → generateStructured
  → callNvidiaJson
  → requestNvidia
  → fetch

signal also covers:
  → retry backoff
  → retry-loop cancellation
  → GPT-OSS recovery request
```

Claude CLI:

```text
signal
  → ClaudeCliProvider
  → ClaudeCliRunner options
  → execFile
  → SIGTERM child-process cancellation
```

The deterministic lifecycle test proved:

- NVIDIA receives the exact `AbortSignal`;
- cancelling NVIDIA aborts the in-flight fetch;
- NVIDIA does not continue transport retries after cancellation;
- Claude receives the exact signal through the runner boundary;
- cancelling Claude aborts the in-flight runner;
- the default Claude runner terminates a real local child process;
- no real NVIDIA or Claude usage is consumed by the lifecycle test.

The complete regression gate also remained green, including execution,
runtime-composition, capabilities, hints, provider architecture, mixed
cross-provider composition, provider contracts, graph characterization, prompt
characterization, and repository tooling.

No `timeoutMs`, Harness whole-call retry, provider fallback, graph topology,
prompt, or model-default behavior was introduced.

**Decision:** proceed to Step 7 — Cross-Provider Acceptance / Architecture
Review.

## H-ARCH-003 Step 7 — Cross-Provider Acceptance / Architecture Review

**Status:** ✅ Accepted

### Objective

Close H-ARCH-003 by proving that the hardened runtime semantics remain
provider-substitutable and that execution-policy ownership is now explicit,
safe, and provider-neutral.

This is an acceptance/review step.

No production runtime behavior should be added merely to make the milestone
look more complete.

### Final architecture under review

```text
outer composition
  → LlmRuntimeConfig
  → resolveLlmRoleRuntime(...)
  → capability-filtered provider hints
  → graph node
  → executeStructuredLlm(...)
  → StructuredLlmRequest
       ├── prompt / validate
       ├── signal?
       └── providerHints?
  → concrete provider adapter
```

Provider-specific internals remain:

```text
NVIDIA
  → HTTP/network transport retries
  → model-family request behavior
  → fetch cancellation

Claude CLI
  → CLI invocation/isolation flags
  → child-process lifecycle
  → SIGTERM cancellation
```

### Step 7 acceptance scenario

Create one deterministic cross-provider runtime acceptance test:

```text
src/test-harch003-acceptance.ts
```

It uses real adapter classes with mocked provider transport:

```text
NvidiaProvider
  → mocked fetch

ClaudeCliProvider
  → injected runner
```

No NVIDIA API call or Claude quota is consumed.

### Acceptance assertions

The final test must prove all of the following together:

#### Runtime composition

- a mixed Claude/NVIDIA runtime still composes;
- unsupported Claude provider hints are stripped;
- supported NVIDIA provider hints are preserved;
- the graph/runtime layer does not branch on concrete providers.

#### Portable execution

- both providers execute through `executeStructuredLlm(...)`;
- both return the same portable validated application shape;
- the execution boundary performs no hidden whole-call retry.

#### Lifecycle

- cancellation crosses `executeStructuredLlm(...)`;
- NVIDIA receives the exact signal at the transport boundary;
- NVIDIA cancellation does not become a transport retry;
- Claude receives the exact signal at the runner boundary;
- Claude cancellation does not trigger a Harness whole-call retry.

#### Architecture

- `StructuredLlmRequest` contains portable `signal`;
- provider hints remain explicitly separate;
- old ambiguous `maxTokens` / `maxRetries` request controls do not return;
- runtime composition imports no concrete provider;
- graph nodes import no concrete provider;
- graph nodes do not inspect capabilities;
- execution boundary imports no concrete provider;
- NVIDIA retains adapter-owned retry behavior;
- Claude retains process-owned `SIGTERM` lifecycle.

### Timeout decision

**Decision:** do not add `timeoutMs` in H-ARCH-003 Step 7.

Step 6 established the correct cancellation primitive, but timeout duration,
defaults, role budgets, observability, and operational policy are production
hardening concerns.

The roadmap already reserves explicit timeout/fallback/rate-limit hardening for
H11.

Adding a timeout now would introduce a new operational policy without benchmark
or production evidence and would violate the evidence-driven scope of this
milestone.

### Whole-call retry decision

**Decision:** do not add Harness whole-provider-call retry in H-ARCH-003.

The execution boundary owns that future concern, but the current contract still
has no normalized retryable-error taxonomy.

Blindly retrying every provider exception would be unsafe.

Transport retry remains provider-owned; task retry remains orchestration-owned.

### Fallback decision

Provider fallback remains out of scope and stays in production hardening.

### H-ARCH-003 milestone outcome if accepted

The milestone will have established:

```text
capability-aware providers
  ↓
explicit provider hints
  ↓
capability-aware runtime composition
  ↓
portable execution boundary
  ↓
clear retry ownership
  ↓
portable cooperative cancellation
  ↓
provider-specific real lifecycle cancellation
```

without leaking NVIDIA/Claude branching into graph code.

### Files

Create:

```text
src/test-harch003-acceptance.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify production source in Step 7 unless the acceptance gate exposes a
concrete architecture defect.

### Non-goals

Do not:

- add `timeoutMs`;
- add `AbortSignal.timeout()`;
- add Harness whole-call retries;
- add provider fallback;
- add normalized error taxonomy;
- change NVIDIA retry/backoff;
- change Claude CLI flags;
- optimize Claude startup;
- change runtime role defaults;
- change graph topology;
- change prompts/routing;
- change model defaults;
- add telemetry/benchmark behavior.

### Step 7 acceptance-test correction

The first Step 7 gate failed in `test:harch003-acceptance` because the
architecture assertion searched the entire Claude adapter source for the text:

```text
--max-turns
```

The adapter intentionally contains that text in a comment documenting that the
flag must **not** be used.

The assertion therefore produced a false positive even though the actual CLI
argument list did not contain `--max-turns`.

The correction narrows the source check to reject only a quoted CLI argument:

```text
"--max-turns"
'--max-turns'
```

This is a test-only correction.

No production source, runtime behavior, provider configuration, lifecycle,
retry policy, or graph behavior changes.

### Deterministic gate

```bash
npm run typecheck && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Acceptance criteria

- [x] final H-ARCH-003 cross-provider acceptance test exists.
- [x] mixed runtime composition remains valid.
- [x] capability filtering behaves correctly across NVIDIA/Claude.
- [x] both providers execute through the portable execution boundary.
- [x] both providers preserve the shared structured result contract.
- [x] cancellation crosses the portable execution boundary for both providers.
- [x] NVIDIA cancellation does not trigger transport retry progression.
- [x] Claude cancellation does not trigger Harness whole-call retries.
- [x] graph remains provider-neutral.
- [x] graph does not inspect provider capabilities.
- [x] runtime composition remains provider-neutral.
- [x] execution boundary remains provider-neutral.
- [x] provider hints remain distinct from portable cancellation.
- [x] no timeout policy is added.
- [x] no Harness whole-call retry is added.
- [x] no fallback is added.
- [x] all deterministic alpha.2/H-ARCH-003 gates remain green.

### Commit

```bash
git commit -m "test(runtime): close execution policy hardening"
```

### Exit condition

Step 7 is accepted when the full deterministic gate passes.

At that point H-ARCH-003 can be marked complete and work may proceed to:

```text
H-ARCH-004 — Establish Architectural Tests and Boundaries
```

## H-ARCH-003 Step 7 Validation Record

**Status:** ✅ Accepted

The full deterministic Step 7 gate passed in the development environment after
one test-only false-positive correction.

The first acceptance run incorrectly rejected the Claude adapter because the
source-code guard matched `--max-turns` inside a comment that explicitly
documents that the flag is **not** used. The guard was narrowed to reject only
a quoted CLI argument. No production behavior changed.

Final accepted architecture:

```text
outer composition
  → LlmRuntimeConfig
  → resolveLlmRoleRuntime(...)
  → capability-filtered provider hints
  → graph node
  → executeStructuredLlm(...)
  → StructuredLlmRequest
       ├── prompt / validate
       ├── signal?
       └── providerHints?
  → concrete provider adapter
```

Verified outcomes:

- mixed NVIDIA/Claude runtime composition remains valid;
- unsupported Claude hints are removed before execution;
- supported NVIDIA hints are preserved;
- graph nodes remain provider-neutral and capability-agnostic;
- complete LLM calls cross the portable execution boundary;
- cancellation crosses that boundary for both concrete providers;
- NVIDIA cancellation stops underlying fetch/retry progression;
- Claude cancellation terminates the underlying CLI process lifecycle;
- transport retry remains provider-owned;
- Harness whole-call retry remains intentionally unimplemented;
- no runtime timeout policy or fallback was added;
- all H-ARCH-003 and alpha.2 deterministic regression gates remain green.

### Milestone conclusion

```text
H-ARCH-003 — ACCEPTED
Release candidate — v0.1.0-alpha.3
Release name — Runtime Policy Alpha
Next architecture task — H-ARCH-004
```

**Decision:** H-ARCH-003 is complete.

# H0-002A — Task Intake Foundation

## Status

**Milestone:** H0
**Status:** 📋 Planned
**Position:** after H0-002 / alpha.6 release, before H0-003 Benchmark Runner

## Why this task exists

The target architecture already starts with:

```text
USER REQUEST
     ↓
TASK NORMALIZER
     ↓
REPOSITORY INTELLIGENCE
```

but the roadmap did not yet define a concrete task that establishes how work
enters the Harness.

Without an intake boundary, future integrations risk coupling the Harness core
directly to CLI arguments, GitHub issues, Q-Flow payloads, webhooks, benchmark
fixtures, or self-improvement experiments.

The Harness should consume one normalized task contract regardless of origin.

## Objective

Create the smallest stable task-intake and application-execution boundary needed
before the Benchmark Runner and later external integrations expand the system.

Target flow:

```text
external/manual task
        ↓
Task Intake
        ↓
Task Normalizer
        ↓
NormalizedHarnessTask
        ↓
runHarness(task)
        ↓
Harness Core
```

The first implementation remains local and deterministic.

## Architectural principle

The Harness is a development engine, not an integration platform.

External systems produce tasks.

They must not become dependencies of the core orchestration engine.

Preferred direction:

```text
CLI ─────────┐
HTTP API ────┤
GitHub ──────┤
Q-Flow ──────┤
Manual UI ───┤
Self-improve ┤
Benchmark ───┤
             ↓
         Task Intake
             ↓
       Task Normalizer
             ↓
   NormalizedHarnessTask
             ↓
       runHarness(task)
             ↓
        Harness Core
```

Adapters may be added later without changing the normalized task or application
execution contracts.

## Normalized task contract direction

The exact TypeScript shape must be finalized from repository evidence during
Step 1, but the contract should cover these concepts:

```text
task identity
source
repository identity / requested revision
human request
constraints
acceptance criteria
metadata
```

The normalized contract must not contain GitHub-, Q-Flow-, HTTP-, CLI-,
benchmark-runner-, or LLM-provider-specific concepts.

## Source model

Initial source vocabulary should be intentionally small and extensible.

Expected initial sources:

```text
manual
cli
benchmark
self-improvement
```

Future adapters may add:

```text
api
github
qflow
webhook
```

without changing Harness planning semantics.

## Repository identity

Task intake must align with the machine-independent identity direction already
established by H0-002.

Do not make absolute local repository paths part of the normalized domain task
identity.

Preferred identity direction:

```text
repository:
  id
  revision?
```

Resolution into a concrete workspace remains outside the normalized task
contract.

Example:

```text
identity:
  qos-harness @ v0.1.0-alpha.6

execution workspace:
  /tmp/harness-runs/<run-id>/worktree
```

These are different concepts and must remain separate.

## Task normalization

Normalization is deterministic wherever possible.

Examples:

```text
trim/validate task text
validate required repository identity
normalize optional arrays
reject blank acceptance criteria
reject blank constraints
preserve source metadata without leaking it into core planning
```

Normalization must not:

```text
ask an LLM to rewrite the task
infer architecture
guess repository paths
invent acceptance criteria
select models
execute the task
```

Semantic decomposition remains a later planning concern.

## Application execution boundary

H0-002A must introduce a small application API in:

```text
src/app/run-harness.ts
```

Step 1-3 evidence shows that the application boundary cannot be only:

```ts
runHarness(task)
```

because `NormalizedHarnessTask` intentionally contains machine-independent
repository identity while actual execution requires a concrete local workspace.

The target direction is therefore:

```ts
type ResolvedWorkspace = Readonly<{
  repositoryPath: string;
}>;

type HarnessExecutionOptions = Readonly<{
  maxPlanningAttempts?: number;
}>;

type RunHarnessRequest = Readonly<{
  task: NormalizedHarnessTask;
  workspace: ResolvedWorkspace;
  execution?: HarnessExecutionOptions;
}>;

runHarness(request, dependencies?)
```

The exact exported names may be refined from implementation evidence, but these
boundaries are now architectural requirements.

Its responsibility is to execute one already-normalized Harness task against one
already-resolved workspace.

Expected ownership:

```text
receive NormalizedHarnessTask
receive resolved local workspace
receive optional execution policy
compose/inject runtime dependencies required for one run
start lifecycle / telemetry
invoke graph/core execution
project terminal result
persist run telemetry
return HarnessRunResult
```

It must not:

```text
parse CLI arguments
normalize raw task input
resolve GitHub/Q-Flow payloads
select a benchmark case
clone/checkout repositories
resolve repository.id to a local working tree
invent task requirements
```

### Resolved workspace is not task identity

These concepts remain separate:

```text
NormalizedHarnessTask.repository
  → repository identity
  → id + revision?

ResolvedWorkspace
  → concrete execution location
  → repositoryPath
```

`repositoryPath` must not be copied into the normalized task merely to satisfy
runtime execution.

### Dependency injection direction

Step 4 should support deterministic tests without real provider calls or `.runs`
writes.

Preferred shape:

```text
runHarness(request, dependencies?)
```

where production defaults still use the real:

```text
buildDevGraph
createLlmCallTelemetryCollector
createRunLifecycleRecorder
createJsonRunTelemetryStore
```

and tests may inject deterministic doubles.

Dependency injection is for application-boundary testability only. It must not
move provider/model selection into `NormalizedHarnessTask`.

### Why `runHarness(task)` belongs before H0-003

Without an application execution boundary, H0-003 would likely either:

```text
call the graph directly
```

or:

```text
invent a benchmark-only execution path
```

Both would create a second entry path that future CLI/API/GitHub/Q-Flow work
would later need to replace.

H0-003 should invoke the same application boundary as real tasks:

```text
BenchmarkTask
    ↓ adapter
NormalizedHarnessTask

repository.id + revision
    ↓ H0-003 workspace resolver
ResolvedWorkspace

NormalizedHarnessTask + ResolvedWorkspace
    ↓
runHarness(...)
```

## First delivery surface

The first concrete intake adapter should remain CLI/manual.

Reason:

- no external service dependency;
- deterministic tests;
- easy local development;
- easy benchmark invocation;
- no premature API server.

The future HTTP API should be an adapter over the same intake and application
services, not a second Harness execution path.

## H0-002A planned steps

1. **Characterize Current Task Entry**
   - inspect `src/index.ts`, graph invocation, current telemetry lifecycle,
     benchmark task shape, repository/task arguments, and current executable
     composition;
   - identify exactly what must move behind `runHarness(task)`;
   - no production behavior change.

2. **Define Normalized Harness Task Contract**
   - machine-independent repository identity;
   - explicit source;
   - request;
   - constraints;
   - acceptance criteria;
   - metadata boundary.

3. **Define Deterministic Task Normalizer**
   - validate/normalize raw intake data;
   - no LLM;
   - deterministic errors;
   - no workspace resolution.

4. **Extract Application Execution Boundary**
   - introduce `runHarness({ task, workspace, execution? }, dependencies?)`;
   - keep normalized task identity separate from resolved local workspace;
   - preserve telemetry lifecycle and graph behavior;
   - return an explicit application result;
   - support deterministic dependency injection for tests;
   - do not migrate `src/index.ts` yet.

5. **Introduce CLI / Manual Intake Adapter**
   - define how executable/manual input obtains repository identity;
   - translate raw intake → normalize → resolved workspace → runHarness;
   - remove the duplicated one-run orchestration from `src/index.ts`;
   - preserve current executable behavior;
   - keep external integration concerns outside the core.

6. **H0-002A Acceptance / Architecture Review**
   - prove core execution no longer needs to understand task origin;
   - prove CLI/manual and future benchmark execution can share one application
     path;
   - define the stable handoff expected by H0-003.

## Acceptance criteria

H0-002A is complete only when:

- [ ] one integration-neutral normalized task contract exists.
- [ ] repository identity is machine-independent.
- [ ] concrete workspace path is not part of normalized repository identity.
- [ ] task source is explicit.
- [ ] constraints and acceptance criteria are explicit structured fields.
- [ ] deterministic normalization rejects malformed/blank task data.
- [ ] normalization does not call an LLM.
- [ ] `runHarness(...)` exists as the application execution boundary.
- [ ] application execution receives an already-normalized task and an explicit resolved workspace.
- [ ] application execution owns one-run graph/telemetry orchestration.
- [ ] application execution does not parse CLI/GitHub/Q-Flow/API input.
- [ ] CLI/manual intake maps into normalized task + resolved workspace → `runHarness(...)`.
- [ ] Harness core does not branch on GitHub, Q-Flow, HTTP, CLI, or benchmark
      source concepts.
- [ ] no API server is added prematurely.
- [ ] no GitHub/Q-Flow SDK dependency is added.
- [ ] benchmark task definitions remain unchanged unless a concrete shared
      identity extraction is justified by Step 1 evidence.
- [ ] H0-002 benchmark suite remains green.
- [ ] H0-001 telemetry remains green.
- [ ] H-ARCH boundaries remain green.
- [ ] no new runtime integration dependency is required.

## Non-goals

Do not yet:

- build a web UI for task submission;
- start an HTTP server;
- integrate GitHub;
- integrate Q-Flow;
- integrate Jira/Slack;
- implement webhook listeners;
- automatically create tasks from telemetry;
- implement recursive self-improvement;
- implement dynamic agent routing;
- implement Repository Intelligence;
- change benchmark scoring;
- implement the Benchmark Runner itself;
- resolve repository IDs into worktrees inside task normalization;
- create a generic job queue.

## Relationship to H0-003

H0-003 remains:

```text
Benchmark Runner
```

and keeps its responsibility:

```text
benchmark repository/revision resolution
isolated reproducible working tree
Harness execution
validation-command execution
observation capture
benchmark acceptance
```

H0-003 must not create a benchmark-only graph entry point.

Required direction:

```text
BenchmarkTask
    ↓
benchmark adapter
    ↓
NormalizedHarnessTask

repository.id + revision
    ↓
workspace resolution / isolated execution context
    ↓
ResolvedWorkspace

NormalizedHarnessTask + ResolvedWorkspace
    ↓
runHarness(...)
```

The exact relationship between normalized repository identity and resolved
workspace context must be finalized from H0-002A/H0-003 evidence without
putting machine-local paths into the task identity.

## Relationship to future Q-Flow / GitHub integration

Later:

```text
GitHub Issue
    ↓ GitHub adapter

Q-Flow workflow
    ↓ Q-Flow/API adapter

HTTP request
    ↓ API adapter

all
    ↓
Task Normalizer
    ↓
NormalizedHarnessTask
    ↓
runHarness(task)
```

No future adapter should inject provider/model/graph-specific behavior into the
normalized task contract.

## Self-improvement safety direction

Future self-improvement tasks should enter through the same intake contract with
an explicit source and immutable evaluation constraints.

Example concept:

```text
source: self-improvement
repository: qos-harness
constraints:
  - benchmark definitions are immutable
  - benchmark acceptance rules are immutable
  - baseline evaluator is immutable
```

The stable Harness should evaluate candidate Harness changes in isolated
worktrees before promotion.

This safety model is documented now but not implemented in H0-002A.

## Release strategy

Do not create a separate alpha merely for planning this insertion.

After:

```text
v0.1.0-alpha.6 — Benchmark Suite Alpha
```

the sequence becomes:

```text
H0-002A Task Intake Foundation
   ↓
acceptance
   ↓
release decision based on actual scope
   ↓
H0-003 Benchmark Runner
```

# Release Procedure — v0.1.0-alpha.6

`H0-002 — Benchmark Task Suite` is accepted.

Release name:

```text
v0.1.0-alpha.6 — Benchmark Suite Alpha
```

Run the final deterministic release gate:

```bash
npm run typecheck && \
npm run test:h0-002-acceptance && \
npm run test:benchmark-suite-validation && \
npm run test:benchmark-acceptance && \
npm run test:benchmark-cases && \
npm run test:benchmark-contract && \
npm run test:run-telemetry-integration && \
npm run test:llm-call-telemetry && \
npm run test:run-telemetry-store && \
npm run test:run-lifecycle-recorder && \
npm run test:run-telemetry-contract && \
npm run test:run-lifecycle-characterization && \
npm run test:harch004-acceptance && \
npm run test:architecture-public-boundaries && \
npm run test:architecture-dependencies && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

Review release metadata:

```bash
git diff -- package.json package-lock.json CHANGELOG.md QOS-HARNESS-ENGINEERING-PLAN.md
git diff --check
```

Stage:

```bash
git add \
  package.json \
  package-lock.json \
  CHANGELOG.md \
  QOS-HARNESS-ENGINEERING-PLAN.md
```

Review staged release:

```bash
git diff --cached --stat
git diff --cached
git diff --cached --check
```

Create the release commit:

```bash
git commit -m "chore(release): prepare v0.1.0-alpha.6"
```

Create the annotated tag:

```bash
git tag -a v0.1.0-alpha.6 \
  -m "QOS Harness v0.1.0-alpha.6 - benchmark suite"
```

Verify:

```bash
git show v0.1.0-alpha.6 --stat
```

Publish:

```bash
git push origin main
git push origin v0.1.0-alpha.6
```

Final verification:

```bash
git status
git tag --list "v0.1.0*"
git ls-remote --tags origin "v0.1.0-alpha.6"
```

After publication, development proceeds to:

```text
H0-003 — Benchmark Runner
```

# Release Procedure — v0.1.0-alpha.5

`H0-001 — Run Telemetry Foundation` is accepted.

Release name:

```text
v0.1.0-alpha.5 — Telemetry Foundation Alpha
```

Run the final deterministic release gate:

```bash
npm run typecheck && \
npm run test:run-telemetry-integration && \
npm run test:llm-call-telemetry && \
npm run test:run-telemetry-store && \
npm run test:run-lifecycle-recorder && \
npm run test:run-telemetry-contract && \
npm run test:run-lifecycle-characterization && \
npm run test:harch004-acceptance && \
npm run test:architecture-public-boundaries && \
npm run test:architecture-dependencies && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

Review release metadata:

```bash
git diff -- package.json package-lock.json CHANGELOG.md QOS-HARNESS-ENGINEERING-PLAN.md
git diff --check
```

Stage:

```bash
git add \
  package.json \
  package-lock.json \
  CHANGELOG.md \
  QOS-HARNESS-ENGINEERING-PLAN.md
```

Create the release commit:

```bash
git commit -m "chore(release): prepare v0.1.0-alpha.5"
```

Create the annotated tag:

```bash
git tag -a v0.1.0-alpha.5 \
  -m "QOS Harness v0.1.0-alpha.5 - telemetry foundation"
```

Publish:

```bash
git push origin main
git push origin v0.1.0-alpha.5
```

Final verification:

```bash
git status
git tag --list "v0.1.0*"
git ls-remote --tags origin "v0.1.0-alpha.5"
```

After publication, development proceeds to:

```text
H0-002 — Benchmark Task Suite
```

# Release Procedure — v0.1.0-alpha.4

`H-ARCH-004` and the complete `H-ARCH` milestone are accepted.

Release name:

```text
v0.1.0-alpha.4 — Architectural Foundation Alpha
```

Run the final deterministic release gate:

```bash
npm run typecheck && \
npm run test:harch004-acceptance && \
npm run test:architecture-public-boundaries && \
npm run test:architecture-dependencies && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

The live NVIDIA/Claude smoke remains optional for this release because H-ARCH-004
introduced no provider runtime behavior:

```bash
npm run test:cross-provider-live
```

Review release metadata:

```bash
git diff -- package.json package-lock.json CHANGELOG.md QOS-HARNESS-ENGINEERING-PLAN.md
git diff --check
```

Stage:

```bash
git add \
  package.json \
  package-lock.json \
  CHANGELOG.md \
  QOS-HARNESS-ENGINEERING-PLAN.md
```

Review staged release:

```bash
git diff --cached --stat
git diff --cached
git diff --cached --check
```

Create the release commit:

```bash
git commit -m "chore(release): prepare v0.1.0-alpha.4"
```

Create the annotated tag:

```bash
git tag -a v0.1.0-alpha.4 \
  -m "QOS Harness v0.1.0-alpha.4 - architectural foundation"
```

Verify:

```bash
git show v0.1.0-alpha.4 --stat
```

Publish:

```bash
git push origin main
git push origin v0.1.0-alpha.4
```

Final verification:

```bash
git status
git tag --list "v0.1.0*"
git ls-remote --tags origin "v0.1.0-alpha.4"
```

After publication, development proceeds to:

```text
H0-001 — Run Telemetry Foundation
```

# H-ARCH-004 — Establish Architectural Tests and Boundaries

## Status

**Milestone:** ✅ Complete
**Current step:** Accepted
**Release baseline:** `v0.1.0-alpha.3`

## Milestone objective

Turn the architectural boundaries established by H-ARCH-001/002/003 into
deterministic, repository-level invariants before benchmark, repository
intelligence, context-engine and implementation work expand the codebase.

H-ARCH-004 is intentionally test-heavy and production-code-light.

The milestone does not redesign the architecture. It protects the architecture
that already exists and only generalizes guards when current dependency evidence
supports doing so.

## Planned steps

1. **Characterize Current Dependency Boundaries**
2. **Add Module Dependency / Cycle Guards**
3. **Protect Composition and Public Boundaries**
4. **Final Architecture Acceptance**

---

## H-ARCH-004 Step 1 — Characterize Current Dependency Boundaries

**Status:** ✅ Accepted

### Objective

Freeze the current import/dependency shape of the architectural core before
introducing generalized dependency and cycle rules.

This is characterization only.

No production behavior or production source changes are allowed.

### Evidence from the current repository

The current runtime path is:

```text
index.ts
  → graph.ts
  → default-composition
  → graph builder / node factory

graph/build-dev-graph.ts
  → state
  → runtime-composition
  → nodes
  → routers

graph/nodes.ts
  → state
  → runtime-composition
  → execution
  → repository inspection/tools
  → graph schemas/context/prompts
```

Provider-neutral runtime boundaries are currently:

```text
providers/contracts.ts
providers/runtime-composition.ts
providers/execution.ts
providers/role-composition.ts
providers/structured-output.ts
```

The concrete default composition root is:

```text
providers/default-composition.ts
  → providers/nvidia.ts
```

Repository infrastructure is currently isolated in:

```text
repository/inspect.ts
repository/tools.ts
```

### Existing architecture guard

`src/test-provider-architecture.ts` already protects a focused subset of the
architecture:

- graph nodes/builder do not import concrete provider adapters;
- runtime/contracts/execution remain provider-neutral;
- default concrete provider selection stays in composition.

H-ARCH-004 does not replace that test in Step 1.

Step 1 adds a broader characterization baseline that later steps can generalize
without guessing the current dependency graph.

### Characterization test

Create:

```text
src/test-architecture-boundaries-characterization.ts
```

The test reads a fixed set of core TypeScript modules and records their current
static `import` / re-export specifiers.

It intentionally does **not** implement a generic architecture policy engine or
cycle detector yet.

The characterized module set includes:

```text
index.ts
state.ts
graph.ts
graph/*
providers/contracts.ts
providers/default-composition.ts
providers/execution.ts
providers/role-composition.ts
providers/runtime-composition.ts
providers/structured-output.ts
repository/inspect.ts
repository/tools.ts
```

### Why characterize before generalizing

A generalized architectural guard can become harmful if it encodes an idealized
dependency diagram rather than the repository that actually exists.

Step 1 therefore freezes evidence first.

Step 2 may then build a small dependency graph/cycle detector against known,
accepted boundaries.

### Files

Create:

```text
src/test-architecture-boundaries-characterization.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify production source.

### Behavioral invariants

Do not change:

- graph topology;
- graph node behavior;
- prompts;
- state schemas;
- provider contracts;
- provider capabilities/hints;
- runtime composition;
- provider adapters;
- repository inspection/tools;
- model defaults;
- retry/cancellation semantics;
- public exports.

### Non-goals

Do not yet:

- add a generic dependency graph implementation;
- add cycle detection;
- reorganize folders;
- move files between architecture layers;
- add dependency-cruiser, madge or another runtime/dev dependency;
- change `src/graph.ts`;
- remove compatibility aliases;
- redesign `state.ts`;
- add telemetry;
- add Repository Intelligence;
- add Context Engine;
- add Evidence Protocol;
- add implementation/fix agents.

### Deterministic gate

```bash
npm run typecheck && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Acceptance criteria

- [x] dependency-boundary characterization test exists.
- [x] current entry-point dependency is characterized.
- [x] current graph compatibility/composition boundary is characterized.
- [x] graph builder dependencies are characterized.
- [x] graph-node application dependencies are characterized.
- [x] graph helper/schema dependencies are characterized.
- [x] neutral provider runtime dependencies are characterized.
- [x] concrete default-composition dependency is characterized.
- [x] repository infrastructure dependencies are characterized.
- [x] builder → compatibility-boundary regression remains absent.
- [x] graph nodes remain free of concrete provider imports.
- [x] runtime composition remains free of concrete provider imports.
- [x] execution boundary remains free of concrete provider imports.
- [x] no production source changes.
- [x] no new dependency is added.
- [x] full alpha.3 deterministic regression gate remains green.

### Commit

```bash
git commit -m "test(architecture): characterize dependency boundaries"
```

### Exit condition

Step 1 is complete when the current architectural dependency shape is
deterministically characterized and the full regression gate passes.

**Next:** Step 2 — Add Module Dependency / Cycle Guards.


## H-ARCH-004 Step 1 Validation Record

**Status:** ✅ Accepted

The full deterministic Step 1 gate passed in the development environment.

Accepted outcome:

- the current entry-point dependency is characterized;
- the graph compatibility/composition boundary is characterized;
- graph builder dependencies are characterized;
- graph-node application dependencies are characterized;
- graph helper/schema dependencies are characterized;
- neutral provider runtime dependencies are characterized;
- concrete default-composition dependency is characterized;
- repository infrastructure dependencies are characterized;
- builder → compatibility-boundary regression remains absent;
- graph nodes remain free of concrete provider imports;
- runtime composition remains provider-neutral;
- execution boundary remains provider-neutral;
- no production source changed;
- no new dependency was added;
- all alpha.3 deterministic regression gates remained green.

**Decision:** proceed to Step 2 — Add Module Dependency / Cycle Guards.

## H-ARCH-004 Step 2 — Add Module Dependency / Cycle Guards

**Status:** ✅ Accepted

### Objective

Promote the Step 1 import characterization into generalized architectural
guards that protect production-module dependency direction and detect circular
dependencies automatically.

This remains architecture-test work.

No production source changes are planned.

### Evidence from Step 1

Step 1 proved the current dependency shape and confirmed these high-value
invariants:

```text
graph/* ─X→ graph.ts
graph/* ─X→ concrete provider adapters
runtime-composition ─X→ concrete provider adapters
execution ─X→ concrete provider adapters
```

It also confirmed that the temporary graph cycle from H-ARCH-001 no longer
exists.

Step 2 generalizes those point observations so future files cannot silently
reintroduce the same classes of defects.

### Architectural test strategy

Create:

```text
src/test-architecture-dependencies.ts
```

The test scans production TypeScript modules under `src/`.

Files named `test-*.ts` are intentionally excluded from the production
dependency graph.

For production modules it:

1. extracts static relative imports and re-exports;
2. extracts literal dynamic imports;
3. resolves local `.js` specifiers back to repository `.ts` source modules;
4. fails on unresolved local production dependencies;
5. builds an in-memory directed dependency graph;
6. detects circular dependencies deterministically;
7. applies a small set of evidence-backed boundary rules.

No external architecture package is added.

### Step 2 boundary rules

#### Rule 1 — no production cycles

The production source dependency graph must be acyclic.

This protects against regressions like the earlier transitional shape:

```text
graph.ts
  → graph/build-dev-graph.ts
  → graph.ts
```

#### Rule 2 — graph internals do not depend on `graph.ts`

`src/graph.ts` is an outer compatibility/default-composition boundary.

Modules under:

```text
src/graph/*
```

must not import back into it.

#### Rule 3 — graph internals remain provider-neutral

Modules under `src/graph/*` must not directly import:

```text
providers/nvidia.ts
providers/claude-cli.ts
providers/default-composition.ts
```

Graph runtime configuration must continue arriving through injected neutral
contracts.

#### Rule 4 — provider runtime core remains neutral

These modules:

```text
providers/contracts.ts
providers/execution.ts
providers/role-composition.ts
providers/runtime-composition.ts
```

must not depend on concrete provider adapters or the concrete default
composition root.

#### Rule 5 — graph builder remains injectable

`graph/build-dev-graph.ts` must not select `default-composition.ts`.

Concrete runtime selection stays outside the graph builder.

### Why the rule set stays small

H-ARCH-004 is not permission to encode every folder as a rigid Clean
Architecture layer.

Rules are added only where earlier milestones produced concrete dependency
evidence.

Repository Intelligence, Context Engine, telemetry and implementation agents
will add new modules later. Step 2 should protect established boundaries without
blocking those roadmap changes through speculative restrictions.

### Files

Create:

```text
src/test-architecture-dependencies.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify production source.

### Non-goals

Do not:

- add `madge`, `dependency-cruiser`, ESLint architecture plugins or another dependency;
- reorganize folders;
- move production modules;
- define a generic domain/application/infrastructure framework;
- ban all cross-folder imports;
- redesign `graph.ts`;
- remove compatibility exports;
- change provider composition;
- change runtime behavior;
- add Repository Intelligence;
- add telemetry;
- add Context Engine;
- change prompts/models/routing.

### Deterministic gate

```bash
npm run typecheck && \
npm run test:architecture-dependencies && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Acceptance criteria

- [x] generalized production dependency graph is built deterministically.
- [x] relative local imports/re-exports are resolved to source modules.
- [x] literal dynamic local imports are included.
- [x] unresolved local production dependencies fail the guard.
- [x] production circular dependencies fail the guard.
- [x] graph internals cannot depend on `graph.ts`.
- [x] graph internals cannot select concrete provider adapters.
- [x] graph internals cannot select default concrete composition.
- [x] provider-neutral runtime core cannot depend on concrete adapters.
- [x] graph builder cannot select default concrete composition.
- [x] no production source changes.
- [x] no new dependency is added.
- [x] Step 1 characterization remains green.
- [x] full alpha.3 regression gate remains green.

### Commit

```bash
git commit -m "test(architecture): guard module dependencies and cycles"
```

### Exit condition

Step 2 is complete when the production dependency graph is acyclic, the
evidence-backed boundary rules are enforced automatically, and the full
deterministic regression gate passes.

**Next:** Step 3 — Protect Composition and Public Boundaries.


## H-ARCH-004 Step 2 Validation Record

**Status:** ✅ Accepted

The full deterministic Step 2 gate passed in the development environment.

Accepted outcome:

- the production TypeScript dependency graph is built deterministically;
- local relative imports/re-exports are resolved back to source modules;
- literal dynamic local imports are included;
- unresolved local production dependencies fail the guard;
- production circular dependencies fail the guard;
- graph internals cannot depend back on `graph.ts`;
- graph internals cannot select NVIDIA, Claude CLI, or default concrete composition;
- the provider-neutral runtime core cannot depend on concrete adapters;
- the graph builder remains injectable and cannot select the default composition;
- Step 1 dependency characterization remains green;
- no production source changed;
- no new dependency was added;
- the complete alpha.3 deterministic regression gate remained green.

The Step 2 rule set intentionally remains small and evidence-backed rather than
turning the current folder structure into a speculative global layering system.

**Decision:** proceed to Step 3 — Protect Composition and Public Boundaries.

## H-ARCH-004 Step 3 — Protect Composition and Public Boundaries

**Status:** ✅ Accepted

### Objective

Protect the repository's current public API and runtime-composition boundaries
so later work cannot silently move concrete provider selection or graph
construction into the wrong layer.

This remains test-only architectural hardening.

No production source changes are planned.

### Evidence from Steps 1–2

Steps 1 and 2 established and generalized the internal dependency direction.

Step 3 focuses on the outer edges of that architecture:

```text
index.ts
  → graph.ts

graph.ts
  → default-composition
  → graph builder / node factory

default-composition
  → concrete provider selection

graph builder / nodes
  → injected neutral runtime config

provider runtime core
  → provider-neutral contracts only
```

### Public/composition boundary rules

#### Rule 1 — executable entry point goes through `graph.ts`

`src/index.ts` must continue to import the public graph boundary.

It must not:

- select NVIDIA/Claude/default composition directly;
- construct the graph directly;
- instantiate graph nodes directly.

This preserves one outer runtime entry point.

#### Rule 2 — `graph.ts` remains the compatibility/default-composition boundary

`src/graph.ts` may know:

- `default-composition`;
- graph builder;
- graph node factory;
- graph helper modules for compatibility exports.

It must not directly import concrete provider adapters.

#### Rule 3 — current compatibility exports remain stable

Step 3 freezes the current compatibility surface exposed by `graph.ts`,
including:

- context helpers;
- prompt builders;
- routers;
- graph node factory/default nodes;
- injected graph builder alias;
- default `buildDevGraph()`;
- compiled `devGraph`.

This is not a permanent promise that every export must exist forever.

It is a regression guard while H-ARCH completes.

Any future removal should be an explicit compatibility-breaking task.

#### Rule 4 — concrete provider selection stays in default composition

`providers/default-composition.ts` is the deliberate concrete composition root.

It may import the default NVIDIA adapter.

It must not depend on graph internals.

#### Rule 5 — injectable graph core does not select default composition

`graph/build-dev-graph.ts` and `graph/nodes.ts` remain reusable with explicit
`LlmRuntimeConfig`.

They must not import `providers/default-composition.ts`.

#### Rule 6 — provider runtime core does not depend outward on graph/public composition

These modules:

```text
providers/contracts.ts
providers/runtime-composition.ts
providers/execution.ts
providers/role-composition.ts
```

must not depend on `graph.ts`, graph internals, or default concrete composition.

### Why Step 3 uses focused source guards

Step 2 already owns generalized dependency/cycle analysis.

Step 3 intentionally does not build a second dependency framework.

It protects public/composition semantics that are clearer as focused assertions:

- which module is the executable boundary;
- which module may select concrete defaults;
- which compatibility exports are currently supported.

### Files

Create:

```text
src/test-architecture-public-boundaries.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify production source.

### Non-goals

Do not:

- redesign the public API;
- remove compatibility exports;
- remove `role-composition.ts`;
- move default composition into a new app layer;
- rename graph modules;
- introduce a provider registry;
- change the default provider;
- reorganize folders;
- change runtime behavior;
- add Repository Intelligence;
- add Context Engine;
- add telemetry;
- add implementation/fix agents.

### Deterministic gate

```bash
npm run typecheck && \
npm run test:architecture-public-boundaries && \
npm run test:architecture-dependencies && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Acceptance criteria

- [x] executable entry point is protected behind `graph.ts`.
- [x] entry point cannot select concrete providers/default composition directly.
- [x] `graph.ts` remains the current outer compatibility/composition boundary.
- [x] `graph.ts` does not directly import concrete provider adapters.
- [x] current graph compatibility exports are protected.
- [x] default composition remains the concrete provider-selection root.
- [x] default composition does not depend on graph internals.
- [x] graph builder remains independent from default composition.
- [x] graph nodes remain independent from default composition.
- [x] provider runtime core cannot depend outward on graph/public composition.
- [x] role-composition remains a neutral compatibility forwarding layer.
- [x] Step 2 dependency/cycle guards remain green.
- [x] no production source changes.
- [x] no new dependency is added.
- [x] full alpha.3 regression gate remains green.

### Commit

```bash
git commit -m "test(architecture): protect public composition boundaries"
```

### Exit condition

Step 3 is complete when the public/runtime composition boundaries are guarded
deterministically and the full regression gate passes.

**Next:** Step 4 — Final Architecture Acceptance.


## H-ARCH-004 Step 3 Validation Record

**Status:** ✅ Accepted

The full deterministic Step 3 gate passed in the development environment.

Accepted outcome:

- the executable entry point remains behind `graph.ts`;
- the entry point does not select concrete providers/default composition directly;
- `graph.ts` remains the outer compatibility/default-composition boundary;
- `graph.ts` does not import concrete provider adapters directly;
- the current compatibility export surface is protected;
- `default-composition.ts` remains the concrete provider-selection root;
- default composition does not depend on graph internals;
- graph builder and graph nodes remain independent from default composition;
- provider runtime core does not depend outward on graph/public composition;
- `role-composition.ts` remains a neutral compatibility forwarding layer;
- Step 2 dependency/cycle guards remained green;
- no production source changed;
- no new dependency was added;
- the complete alpha.3 deterministic regression gate remained green.

**Decision:** proceed to Step 4 — Final Architecture Acceptance.

## H-ARCH-004 Step 4 — Final Architecture Acceptance

**Status:** ✅ Accepted

### Objective

Close H-ARCH-004 and the complete H-ARCH architectural-foundation milestone by
proving that the repository now has deterministic protection for the
architecture established across H-ARCH-001, H-ARCH-002 and H-ARCH-003.

This is acceptance/review only.

No production source changes are planned.

### Final architecture under acceptance

```text
index.ts
  ↓
graph.ts
  ├── default runtime composition
  └── compatibility/public exports
       ↓
graph/build-dev-graph.ts
  ↓
graph/nodes.ts
  ↓
runtime-composition
  ↓
execution
  ↓
provider contract
  ↑
concrete adapters

repository inspection/tools
  ↑
graph nodes
```

Concrete provider selection remains outside the graph core.

### H-ARCH-004 guard stack

#### Step 1 — Dependency characterization

Protects the exact current core dependency shape.

Purpose:

- freeze evidence before generalization;
- make architectural drift visible.

#### Step 2 — Dependency graph / cycle guards

Protects generalized structural invariants:

- no production cycles;
- graph internals do not import `graph.ts`;
- graph internals remain provider-neutral;
- provider runtime core remains neutral;
- graph builder remains injectable.

#### Step 3 — Public/composition boundary guards

Protects outer architecture semantics:

- `index.ts` enters through `graph.ts`;
- `graph.ts` remains the compatibility/default-composition boundary;
- default composition owns concrete provider selection;
- current compatibility exports remain stable during H-ARCH;
- runtime core does not depend outward on graph/public composition.

#### Existing provider architecture guard

`test:provider-architecture` remains complementary.

It continues protecting the provider-specific dependency rules established in
H-ARCH-002/003.

### Final acceptance test

Create:

```text
src/test-harch004-acceptance.ts
```

The test does not create a fourth architecture framework.

It verifies that:

- Step 1 characterization exists and covers the intended core modules;
- Step 2 provides generalized cycle/dependency protection;
- Step 3 protects the public/composition boundary;
- the existing provider architecture guard remains present;
- the final runtime dependency direction still matches the accepted design;
- H-ARCH-004 did not introduce an external architecture dependency.

### H-ARCH completion decision

If Step 4 passes, H-ARCH is complete:

```text
H-ARCH-001 ✅ Modular graph foundation
H-ARCH-002 ✅ Provider abstraction
H-ARCH-003 ✅ Runtime/execution policy hardening
H-ARCH-004 ✅ Architectural tests and boundaries
```

At that point architectural-foundation work stops unless later evidence reveals
a concrete defect.

The next milestone is:

```text
H0 — Benchmark Foundation
```

This transition is deliberate.

The Harness now needs measurement and product capability more than additional
architecture-only refactoring.

### Files

Create:

```text
src/test-harch004-acceptance.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify production source.

### Non-goals

Do not:

- add more architectural layers;
- reorganize folders;
- introduce domain/application/infrastructure directories now;
- remove compatibility APIs;
- remove provider compatibility aliases;
- add a provider registry;
- change graph behavior;
- change provider behavior;
- add telemetry implementation in this step;
- start H0 before H-ARCH-004 acceptance;
- add Repository Intelligence or Context Engine.

### Deterministic gate

```bash
npm run typecheck && \
npm run test:harch004-acceptance && \
npm run test:architecture-public-boundaries && \
npm run test:architecture-dependencies && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Acceptance criteria

- [x] final H-ARCH-004 acceptance test exists.
- [x] Step 1 characterization guard is present and validated.
- [x] Step 2 dependency/cycle guard is present and validated.
- [x] Step 3 public/composition guard is present and validated.
- [x] provider architecture guard remains complementary and green.
- [x] final runtime dependency direction remains intact.
- [x] production dependency graph remains acyclic.
- [x] graph core remains provider-neutral.
- [x] provider runtime core remains graph/provider-adapter neutral.
- [x] default composition remains the concrete provider-selection root.
- [x] public compatibility boundary remains stable.
- [x] no production source changes.
- [x] no new dependency is added.
- [x] full alpha.3/H-ARCH regression gate remains green.

### Commit

```bash
git commit -m "test(architecture): close architectural foundation"
```

### Exit condition

Step 4 is accepted when the full deterministic gate passes.

Then:

```text
H-ARCH-004 — COMPLETE
H-ARCH — COMPLETE
Next: H0-001 — Run Telemetry Foundation
```


## H-ARCH-004 Step 4 Validation Record

**Status:** ✅ Accepted

The full deterministic final architecture gate passed in the development
environment.

Verified outcomes:

- Step 1 dependency characterization remains present and green;
- Step 2 generalized module dependency/cycle guards remain green;
- Step 3 public/composition boundary guards remain green;
- the existing provider architecture guard remains complementary and green;
- the production dependency graph remains acyclic;
- `graph.ts` remains the outer compatibility/default-composition boundary;
- graph builder and graph nodes remain injectable and provider-neutral;
- runtime composition and execution remain free of concrete provider selection;
- `default-composition.ts` remains the concrete provider-selection root;
- no production source changed during H-ARCH-004;
- no architecture dependency/library was added;
- the complete alpha.3/H-ARCH deterministic regression gate remained green.

### H-ARCH final conclusion

```text
H-ARCH-001 ✅ Modularize Core Harness Without Behavior Changes
H-ARCH-002 ✅ LLM Provider Contract
H-ARCH-003 ✅ Execution Policy / Runtime Composition Hardening
H-ARCH-004 ✅ Architectural Tests and Boundaries

H-ARCH ✅ COMPLETE
```

The architectural foundation is now considered sufficient for the next phase.
Further architecture-only refactoring is deferred unless later benchmark or
product evidence exposes a concrete defect.

**Decision:** proceed to `H0-001 — Run Telemetry Foundation`.

# H0 — Benchmark Foundation

## H0-001 — Run Telemetry Foundation

**Status:** 🚧 In progress
**Current step:** H0-001 complete
**Release baseline:** `v0.1.0-alpha.4`

## Milestone objective

Create the smallest deterministic run-telemetry foundation required to measure
Harness executions before model strategy, context strategy, or benchmark
comparisons are changed.

Initial persistence target:

```text
.runs/
  <run-id>.json
```

No database or dashboard is introduced in H0-001.

The first telemetry schema should be grounded in data the Harness already
produces rather than speculative observability fields.

## Planned steps

1. **Characterize Run Lifecycle and Telemetry Inputs**
2. **Define Run Telemetry Contract**
3. **Create Run Lifecycle Recorder**
4. **Persist Run Record**
5. **Capture LLM Call Metrics**
6. **Telemetry Acceptance / H0-001 Review**

The sequence may be reduced if characterization shows that a planned
abstraction is unnecessary.

---

## H0-001 Step 1 — Characterize Run Lifecycle and Telemetry Inputs

**Status:** ✅ Accepted

### Objective

Freeze the current execution lifecycle and identify telemetry data that already
exists before introducing any production telemetry code.

This is characterization only.

No runtime behavior changes are allowed.

### Current lifecycle evidence

The current executable path is:

```text
src/index.ts
  → devGraph.invoke(...)
  → graph nodes
  → terminal report/failed node
```

The entry point already supplies run identity and execution-control inputs:

```text
task
repositoryPath
planningAttempts
reviewAttempts
attempts
maxAttempts
status
```

`DevState` already contains additional telemetry candidates:

```text
repositoryContext
fileContents
recentlyReadFiles
filesChanged
validationOutput
failureReason
status
```

Graph nodes already expose deterministic observation points for:

```text
planning attempt increments
review attempt increments
files read
failure reason
completed terminal status
failed terminal status
```

### Current telemetry absence

Before H0-001 production work there is intentionally no:

```text
runId
startedAt
finishedAt
durationMs
RunTelemetry
.runs persistence
```

Step 1 characterizes this absence so later steps introduce telemetry
deliberately rather than mixing it into unrelated runtime code.

### Characterization test

Create:

```text
src/test-run-lifecycle-characterization.ts
```

The test statically characterizes:

- executable entry through `devGraph.invoke(...)`;
- task and repository identity at run start;
- current run-control counters/defaults;
- `DevState` fields usable as telemetry inputs;
- current status vocabulary;
- deterministic node-level counter/terminal observation points;
- absence of run telemetry/persistence infrastructure.

No graph invocation and no real provider usage is required.

### Why static characterization first

H0-001 will introduce cross-cutting instrumentation.

Without a frozen baseline it would be easy to accidentally:

- change state semantics while adding metrics;
- couple telemetry to one provider;
- make `.runs` persistence part of graph/domain state;
- derive metrics from values that are not actually available at lifecycle
  boundaries.

Step 1 prevents that by recording existing evidence first.

### Files

Create:

```text
src/test-run-lifecycle-characterization.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify production source.

### Non-goals

Do not yet:

- define `RunTelemetry`;
- generate run IDs;
- create `.runs/`;
- write JSON files;
- add clocks/timers to runtime;
- instrument provider calls;
- add token/cost aggregation;
- add OpenTelemetry;
- add a database;
- add a dashboard;
- change DevState;
- change graph topology;
- change prompts/models/providers.

### Deterministic gate

```bash
npm run typecheck && \
npm run test:run-lifecycle-characterization && \
npm run test:harch004-acceptance && \
npm run test:architecture-public-boundaries && \
npm run test:architecture-dependencies && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Acceptance criteria

- [x] run-lifecycle characterization test exists.
- [x] executable graph invocation boundary is characterized.
- [x] task/repository run identity inputs are characterized.
- [x] current run-control counters/defaults are characterized.
- [x] telemetry-relevant `DevState` inputs are characterized.
- [x] current status vocabulary is characterized.
- [x] planning/review attempt observation points are characterized.
- [x] terminal completed/failed observation points are characterized.
- [x] files-read/failure observation points are characterized.
- [x] absence of run telemetry/persistence infrastructure is recorded.
- [x] no production source changes.
- [x] no new dependency is added.
- [x] full H-ARCH/alpha.4 regression gate remains green.

### Commit

```bash
git commit -m "test(telemetry): characterize run lifecycle"
```

### Exit condition

Step 1 is complete when the current run lifecycle and telemetry inputs are
deterministically characterized and the complete regression gate passes.

**Next:** Step 2 — Define Run Telemetry Contract.


## H0-001 Step 1 Validation Record

**Status:** ✅ Accepted

The full deterministic H0-001 Step 1 gate passed in the development
environment on the `v0.1.0-alpha.4` architectural-foundation baseline.

Accepted characterization:

- the executable run begins in `src/index.ts` through `devGraph.invoke(...)`;
- `task` and `repositoryPath` are available at run start;
- planning/review/task attempt counters and current defaults are characterized;
- telemetry-relevant `DevState` fields are characterized;
- the current run-status vocabulary is frozen as evidence;
- planning and review attempt increments have deterministic observation points;
- completed and failed terminal statuses have deterministic observation points;
- file-read count and failure-reason observation points are characterized;
- no `RunTelemetry`, run ID, timestamps, duration, or `.runs` persistence exists yet;
- no production source changed;
- no new dependency was added;
- the complete H-ARCH/alpha.4 deterministic regression gate remained green.

### Design consequence

Step 2 may now define the run-telemetry contract from observed lifecycle data.

Telemetry should remain outside `DevState` unless a later step produces concrete
evidence that graph state itself must carry a telemetry concern.

**Decision:** proceed to Step 2 — Define Run Telemetry Contract.

## H0-001 Step 2 — Define Run Telemetry Contract

**Status:** ✅ Accepted

### Objective

Define the smallest stable internal telemetry contract justified by the Step 1
run-lifecycle evidence.

Step 2 introduces telemetry types only.

It does not record, persist, time, or mutate a run yet.

### Design decisions

#### 1. Telemetry remains outside `DevState`

The graph state already represents orchestration state.

Run telemetry is a cross-cutting observation of that execution and therefore
starts in a dedicated module:

```text
src/telemetry/contracts.ts
```

No `DevState` field is added in Step 2.

#### 2. Persisted records are versioned from day one

The contract contains:

```ts
schemaVersion: 1
```

The `.runs/<run-id>.json` persistence planned for Step 4 will therefore have an
explicit compatibility discriminator.

Step 2 does not implement JSON parsing/migrations.

#### 3. Run status is terminal-only

Telemetry records use:

```text
completed
failed
```

rather than duplicating every transient `DevState.status`.

Intermediate node/status timing is not yet evidenced as necessary for the
minimal run record.

#### 4. Lifecycle identity/timing is explicit

The contract includes:

```text
runId
startedAt
finishedAt
durationMs
task
repositoryPath
```

Timestamps are ISO-8601 strings.

`durationMs` is stored explicitly so benchmark/report consumers do not need to
recompute it from wall-clock strings.

No clock implementation is added in this step.

#### 5. Existing execution counters become grouped run metrics

Step 1 identified:

```text
planningAttempts
reviewAttempts
attempts
```

The telemetry contract exposes them as:

```ts
attempts: {
  planning
  review
  task
}
```

This avoids leaking graph-state field names into the persisted telemetry shape
while preserving their semantics.

#### 6. File activity stays deliberately small

Current evidence supports:

```text
number of files read
files changed
```

The contract therefore contains:

```ts
files: {
  read: number
  changed: readonly string[]
}
```

Requested evidence, duplicate requests, invalid paths, and context-token detail
remain deferred until H1/H2/H3 provide deterministic evidence for those
metrics.

#### 7. LLM-call telemetry is part of the contract now, instrumentation later

The provider contract already exposes:

```text
model
elapsedSeconds
usage.promptTokens?
usage.completionTokens?
usage.totalTokens?
```

and runtime composition already has explicit roles:

```text
planner
reviewer
refiner
```

The run telemetry contract therefore defines:

```ts
LlmCallTelemetry
```

with those portable fields.

Step 5 will capture/populate these records.

No provider-specific fields are allowed.

#### 8. Start/completion fragments are explicit

Step 3 will build a lifecycle recorder.

To prevent that implementation from inventing an ad-hoc partial shape, Step 2
defines:

```text
RunTelemetryStart
RunTelemetryCompletion
RunTelemetry
```

The final record is the composition of lifecycle start + completion data plus
the schema version.

### Contract

```text
RunTelemetry
├── schemaVersion
├── runId
├── startedAt
├── finishedAt
├── durationMs
├── task
├── repositoryPath
├── finalStatus
├── failureReason?
├── attempts
│   ├── planning
│   ├── review
│   └── task
├── files
│   ├── read
│   └── changed[]
└── llmCalls[]
    ├── role
    ├── model
    ├── elapsedSeconds
    ├── promptTokens?
    ├── completionTokens?
    └── totalTokens?
```

### Files

Create:

```text
src/telemetry/contracts.ts
src/test-run-telemetry-contract.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/state.ts
src/index.ts
src/graph/*
src/providers/*
```

### Non-goals

Do not yet:

- generate a run ID;
- call a clock;
- create a lifecycle recorder;
- mutate telemetry during graph execution;
- add telemetry to `DevState`;
- create `.runs/`;
- write/read JSON;
- add runtime JSON validation/migrations;
- instrument provider calls;
- calculate cost;
- add node timings;
- add evidence-request metrics;
- add OpenTelemetry;
- add a database/dashboard.

### Deterministic test

Create:

```text
src/test-run-telemetry-contract.ts
```

It must prove:

- schema version is explicit;
- a complete successful run record satisfies the contract;
- a failed run can carry `failureReason`;
- attempt counters have distinct planning/review/task semantics;
- file read/change metrics are represented;
- LLM role/model/timing/optional usage is provider-neutral;
- token usage is optional because the existing provider result allows optional
  usage;
- the contract compiles without depending on graph state or concrete providers.

### Deterministic gate

```bash
npm run typecheck && \
npm run test:run-telemetry-contract && \
npm run test:run-lifecycle-characterization && \
npm run test:harch004-acceptance && \
npm run test:architecture-public-boundaries && \
npm run test:architecture-dependencies && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Acceptance criteria

- [x] `src/telemetry/contracts.ts` exists.
- [x] telemetry schema version is explicit.
- [x] run identity fields are explicit.
- [x] start/finish timestamps and duration are explicit.
- [x] terminal final status is limited to completed/failed.
- [x] failure reason is optional and supported.
- [x] planning/review/task attempt metrics are distinct.
- [x] file-read count and changed-file list are represented.
- [x] LLM call telemetry uses role/model/elapsed time and optional portable usage.
- [x] telemetry imports no concrete provider.
- [x] telemetry does not depend on `DevState`.
- [x] no runtime recorder/persistence behavior is introduced.
- [x] no new dependency is added.
- [x] Step 1 characterization remains green.
- [x] complete H-ARCH/alpha.4 regression gate remains green.

### Commit

```bash
git commit -m "feat(telemetry): define run telemetry contract"
```

### Exit condition

Step 2 is complete when the telemetry contract is explicit, provider-neutral,
independent from graph state, and the full deterministic regression gate
passes.

**Next:** Step 3 — Create Run Lifecycle Recorder.


## H0-001 Step 2 Validation Record

**Status:** ✅ Accepted

The full deterministic H0-001 Step 2 gate passed on the
`v0.1.0-alpha.4` architectural-foundation baseline.

Accepted contract:

- `src/telemetry/contracts.ts` owns the telemetry types;
- telemetry remains independent from `DevState`;
- `schemaVersion` is explicit from the first persisted contract;
- run identity contains `runId`, `task`, and `repositoryPath`;
- lifecycle timing contains `startedAt`, `finishedAt`, and `durationMs`;
- terminal run status is limited to `completed | failed`;
- `failureReason` remains optional;
- planning, review, and task attempts are represented independently;
- file activity captures files-read count and changed-file paths;
- LLM-call telemetry captures role, model, elapsed time, and optional portable
  token usage;
- the contract contains no concrete provider dependency;
- no recorder, clock, persistence, graph-state mutation, or provider
  instrumentation was introduced;
- no new dependency was added;
- Step 1 characterization remained green;
- the complete H-ARCH/alpha.4 deterministic regression gate remained green.

### Design consequence

Step 3 may create the run lifecycle recorder against this contract without
adding telemetry fields to graph state.

The recorder should own lifecycle assembly and time/run-ID dependencies through
small injectable boundaries so deterministic tests do not depend on wall clock
or random IDs.

**Decision:** proceed to Step 3 — Create Run Lifecycle Recorder.

## H0-001 Step 3 — Create Run Lifecycle Recorder

**Status:** ✅ Accepted

### Objective

Create the smallest runtime component that assembles the Step 2 telemetry
contract across a run lifecycle.

Step 3 owns:

```text
run ID creation
start timestamp
finish timestamp
duration calculation
final RunTelemetry assembly
```

It does not persist telemetry or instrument the graph/providers yet.

### Architectural decision

Create:

```text
src/telemetry/recorder.ts
```

with:

```ts
createRunLifecycleRecorder(...)
```

The recorder starts a run:

```text
recorder.start({
  task,
  repositoryPath
})
```

and returns an active run handle:

```text
ActiveRunTelemetry
├── start
└── complete(...)
```

`complete(...)` receives the telemetry data already produced by the execution
and returns one final `RunTelemetry` record.

### Dependency strategy

The recorder uses tiny injectable lifecycle dependencies:

```ts
now?: () => Date
createRunId?: () => string
```

Production defaults are:

```text
clock       → new Date()
run ID      → crypto.randomUUID()
```

Deterministic tests inject fixed values.

This avoids:

- mocking global time;
- mocking global randomness;
- coupling tests to wall-clock speed;
- adding a UUID dependency.

### Why the recorder is outside `DevState`

The recorder observes one Harness run.

It does not represent graph planning state and therefore does not belong in
LangGraph state.

Step 3 does not add telemetry fields to `DevState`.

### Duration policy

`durationMs` is computed from the captured lifecycle timestamps.

If the wall clock moves backwards, the recorder clamps the persisted duration
to zero rather than writing a negative benchmark duration.

This is intentionally a minimal wall-clock policy.

A monotonic high-resolution timing source can be considered later if benchmark
evidence proves that millisecond wall-clock timing is insufficient.

### Clock validation

Injected/default clock values must be valid `Date` instances with finite epoch
milliseconds.

Invalid values fail deterministically before an invalid ISO timestamp or `NaN`
duration can enter telemetry.

### Files

Create:

```text
src/telemetry/recorder.ts
src/test-run-lifecycle-recorder.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/index.ts
src/state.ts
src/graph/*
src/providers/*
```

### Non-goals

Do not yet:

- wire the recorder into `src/index.ts`;
- create `.runs/`;
- persist JSON;
- read run history;
- instrument LLM calls;
- mutate `DevState`;
- add node timings;
- calculate token cost;
- add benchmark-runner behavior;
- add OpenTelemetry;
- add database/dashboard behavior.

### Deterministic test

Create:

```text
src/test-run-lifecycle-recorder.ts
```

It must prove:

- run IDs can be injected deterministically;
- start time is captured exactly once at run start;
- finish time is captured on completion;
- duration is calculated from lifecycle timestamps;
- successful completion produces the Step 2 `RunTelemetry` contract;
- failed completion preserves an optional `failureReason`;
- negative wall-clock duration is never persisted;
- invalid clock values fail deterministically;
- no filesystem persistence occurs;
- no graph/provider dependency is required.

### Deterministic gate

```bash
npm run typecheck && \
npm run test:run-lifecycle-recorder && \
npm run test:run-telemetry-contract && \
npm run test:run-lifecycle-characterization && \
npm run test:harch004-acceptance && \
npm run test:architecture-public-boundaries && \
npm run test:architecture-dependencies && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Acceptance criteria

- [x] `src/telemetry/recorder.ts` exists.
- [x] recorder starts a run from task/repository identity.
- [x] run ID generation is injectable.
- [x] clock is injectable.
- [x] production run IDs use `crypto.randomUUID()`.
- [x] production clock uses current `Date`.
- [x] start timestamp is captured at lifecycle start.
- [x] finish timestamp is captured at completion.
- [x] duration is deterministic under an injected clock.
- [x] negative wall-clock duration is clamped to zero.
- [x] invalid clock values fail deterministically.
- [x] completed run assembles the Step 2 telemetry contract.
- [x] failed run preserves `failureReason`.
- [x] recorder remains independent from `DevState`.
- [x] recorder has no graph/provider dependency.
- [x] no persistence or provider instrumentation is introduced.
- [x] no new dependency is added.
- [x] Step 1/2 telemetry tests remain green.
- [x] complete H-ARCH/alpha.4 regression gate remains green.

### Commit

```bash
git commit -m "feat(telemetry): add run lifecycle recorder"
```

### Exit condition

Step 3 is complete when run lifecycle identity/timing can be assembled
deterministically into `RunTelemetry` without graph-state or persistence
coupling, and the full deterministic regression gate passes.

**Next:** Step 4 — Persist Run Record.


## H0-001 Step 3 Validation Record

**Status:** ✅ Accepted

The full deterministic H0-001 Step 3 gate passed on the
`v0.1.0-alpha.4` architectural-foundation baseline.

Accepted outcome:

- `src/telemetry/recorder.ts` owns run lifecycle assembly;
- run IDs are generated through an injectable factory with
  `crypto.randomUUID()` as the production default;
- time is supplied through an injectable clock with `new Date()` as the
  production default;
- start timestamps are captured exactly at lifecycle start;
- finish timestamps are captured at lifecycle completion;
- `durationMs` is derived deterministically from the captured lifecycle times;
- negative wall-clock deltas are clamped to zero;
- invalid clock values fail deterministically before invalid telemetry can be
  produced;
- successful and failed runs assemble the Step 2 `RunTelemetry` contract;
- optional failure reasons are preserved;
- the recorder remains independent from `DevState`, graph modules, and provider
  modules;
- no filesystem persistence, graph instrumentation, or provider
  instrumentation was introduced;
- no new dependency was added;
- Step 1 and Step 2 telemetry gates remained green;
- the complete H-ARCH/alpha.4 deterministic regression gate remained green.

### Design consequence

Step 4 may add persistence behind a dedicated telemetry store/writer boundary.

Persistence should receive a completed `RunTelemetry` value and must not own run
lifecycle timing, ID creation, graph state, or provider instrumentation.

**Decision:** proceed to Step 4 — Persist Run Record.

## H0-001 Step 4 — Persist Run Record

**Status:** ✅ Accepted

### Objective

Persist one completed `RunTelemetry` record as deterministic JSON under:

```text
.runs/<run-id>.json
```

Step 4 introduces a dedicated persistence boundary.

It does not yet wire persistence into the executable Harness lifecycle.

### Architectural decision

Create:

```text
src/telemetry/store.ts
```

with a small contract:

```ts
interface RunTelemetryStore {
  save(telemetry: RunTelemetry): Promise<PersistedRunTelemetry>;
}
```

and one filesystem implementation:

```ts
createJsonRunTelemetryStore(...)
```

The store receives an already-completed `RunTelemetry`.

It does not:

- generate the run ID;
- read the clock;
- calculate duration;
- inspect `DevState`;
- call providers;
- decide whether the run succeeded.

Those concerns remain owned by the lifecycle/runtime boundaries established in
Steps 2–3.

### Persistence location

The JSON store writes to:

```text
<rootDirectory>/.runs/<run-id>.json
```

The production default root is:

```text
process.cwd()
```

Tests inject a temporary root directory.

The store intentionally does **not** derive the output directory from
`telemetry.repositoryPath`.

Reason:

`repositoryPath` is the repository being operated on. Writing Harness telemetry
inside that target repository would create an unauthorized task-side file and
could contaminate Git scope/diffs.

Telemetry belongs to the Harness runtime workspace unless a later product
decision explicitly configures another telemetry root.

### Serialization

Records are written as:

```text
JSON.stringify(record, null, 2) + newline
```

The persisted value is therefore human-readable, deterministic for a given
object insertion order, and directly consumable by H0 benchmark/report tooling.

Step 4 does not introduce a JSON schema parser or migration loader.

### Collision policy

Persistence uses exclusive file creation.

If:

```text
.runs/<run-id>.json
```

already exists, `save(...)` fails instead of silently overwriting the previous
run.

The lifecycle recorder currently uses `crypto.randomUUID()` by default, so a
collision indicates either an injected/test ID reuse or a serious lifecycle
problem that should remain visible.

### Path-safety policy

Because `runId` becomes a filename, the filesystem store accepts only a
conservative filename-safe identifier:

```text
A-Z
a-z
0-9
.
_
-
```

with an alphanumeric first character.

Path separators, traversal syntax, empty values, and other filename syntax are
rejected before persistence.

### Files

Create:

```text
src/telemetry/store.ts
src/test-run-telemetry-store.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/index.ts
src/state.ts
src/graph/*
src/providers/*
src/telemetry/contracts.ts
src/telemetry/recorder.ts
```

### Non-goals

Do not yet:

- wire the store into `src/index.ts`;
- automatically persist every Harness run;
- add `.gitignore` without reviewing its current repository contents;
- read/query run history;
- add schema migrations;
- add retention/cleanup;
- overwrite existing run records;
- persist target-repository telemetry inside `repositoryPath`;
- instrument LLM calls;
- calculate token cost;
- add node timings;
- add a database/dashboard;
- add OpenTelemetry.

### Deterministic test

Create:

```text
src/test-run-telemetry-store.ts
```

using a temporary directory.

It must prove:

- `.runs/` is created recursively when needed;
- one completed telemetry value is serialized to
  `.runs/<run-id>.json`;
- persisted JSON round-trips to the original telemetry value;
- persisted JSON ends with a newline;
- the store reports the persisted path;
- an existing run file is not silently overwritten;
- unsafe/path-traversal run IDs are rejected;
- the test does not write to the repository's real `.runs/`;
- the store requires no graph/provider dependency.

### Deterministic gate

```bash
npm run typecheck && \
npm run test:run-telemetry-store && \
npm run test:run-lifecycle-recorder && \
npm run test:run-telemetry-contract && \
npm run test:run-lifecycle-characterization && \
npm run test:harch004-acceptance && \
npm run test:architecture-public-boundaries && \
npm run test:architecture-dependencies && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Acceptance criteria

- [x] `src/telemetry/store.ts` exists.
- [x] a provider-neutral `RunTelemetryStore` boundary exists.
- [x] JSON filesystem implementation exists.
- [x] completed telemetry is written under `.runs/<run-id>.json`.
- [x] output root is injectable for deterministic tests.
- [x] production root defaults to `process.cwd()`.
- [x] target `repositoryPath` is not used as the persistence root.
- [x] `.runs/` is created when absent.
- [x] JSON output is human-readable and newline-terminated.
- [x] existing run records are not silently overwritten.
- [x] unsafe run IDs are rejected before filesystem persistence.
- [x] store does not own lifecycle timing/ID generation.
- [x] store remains independent from `DevState`, graph, and providers.
- [x] no executable wiring is introduced yet.
- [x] no new dependency is added.
- [x] Steps 1–3 telemetry gates remain green.
- [x] complete H-ARCH/alpha.4 regression gate remains green.

### Commit

```bash
git commit -m "feat(telemetry): persist run records"
```

### Exit condition

Step 4 is complete when a completed `RunTelemetry` value can be safely and
deterministically persisted under `.runs/<run-id>.json` without coupling
persistence to graph state, provider execution, or the target repository.

**Next:** Step 5 — Capture LLM Call Metrics.


## H0-001 Step 4 Validation Record

**Status:** ✅ Accepted

The full deterministic H0-001 Step 4 gate passed on the
`v0.1.0-alpha.4` architectural-foundation baseline.

Accepted outcome:

- `src/telemetry/store.ts` defines the provider-neutral
  `RunTelemetryStore` boundary;
- `createJsonRunTelemetryStore(...)` persists completed run telemetry as
  human-readable JSON;
- persistence uses `<rootDirectory>/.runs/<run-id>.json`;
- the production root defaults to `process.cwd()`;
- deterministic tests inject a temporary root directory and therefore do not
  create `.runs/` in the real development repository;
- the target `telemetry.repositoryPath` is not used as the persistence root;
- `.runs/` is created recursively when required;
- JSON is newline-terminated;
- existing run files are never silently overwritten;
- unsafe/path-traversal run IDs are rejected before filesystem persistence;
- persistence does not own run IDs, lifecycle timing, graph state, or provider
  execution;
- the executable Harness is still intentionally not wired to the store in
  Step 4;
- no new dependency was added;
- Steps 1–3 telemetry gates remained green;
- the complete H-ARCH/alpha.4 deterministic regression gate remained green.

### Observed validation behavior

Running the Step 4 test does not leave a `.runs/` directory in the project
root.

This is expected: the persistence test writes to a temporary directory, verifies
the record, and removes the temporary directory afterward.

Real Harness executions will only create `.runs/<run-id>.json` after the final
H0-001 executable wiring is introduced.

### Design consequence

Step 5 may instrument portable LLM-call metrics without coupling that
instrumentation to the filesystem store.

The final H0-001 wiring should compose:

```text
lifecycle recorder
  + LLM-call metrics
  + completed graph state
  + telemetry store
```

at the executable/application boundary.

**Decision:** proceed to Step 5 — Capture LLM Call Metrics.

## H0-001 Step 5 — Capture LLM Call Metrics

**Status:** ✅ Accepted

### Objective

Capture portable metrics for successful planner, reviewer, and refiner LLM
calls without putting telemetry into `DevState` and without coupling telemetry
to a concrete provider.

Step 5 instruments the graph's existing portable LLM execution path.

It does not persist the collected metrics or wire the executable Harness
lifecycle yet.

### Evidence

The provider-neutral structured result already exposes:

```text
elapsedSeconds
usage.promptTokens?
usage.completionTokens?
usage.totalTokens?
```

Runtime composition already exposes the semantic role and selected model:

```text
planner
reviewer
refiner
model
```

The Step 2 telemetry contract already reserves:

```text
llmCalls[]
```

for exactly these portable values.

### Architectural decision

Create:

```text
src/telemetry/llm-calls.ts
```

with:

```ts
LlmCallTelemetrySink
LlmCallTelemetryCollector
createLlmCallTelemetryCollector(...)
captureStructuredLlmCall(...)
```

The collector is in-memory and run-scoped.

It owns no filesystem persistence and no graph state.

### Graph injection

`createGraphNodes(...)` gains an optional telemetry sink:

```ts
createGraphNodes(
  llmRuntimeConfig,
  llmCallTelemetrySink?,
)
```

Planner, reviewer, and refiner record the result only after
`executeStructuredLlm(...)` returns successfully.

The graph builder receives the same optional sink and forwards it to the node
factory.

The public `buildDevGraph(...)` compatibility wrapper also accepts the optional
sink while preserving its current no-argument behavior.

Therefore:

```text
existing callers
  → no telemetry sink
  → behavior unchanged

final H0-001 wiring
  → run-scoped collector
  → buildDevGraph(collector)
  → collected llmCalls[]
```

### Successful-call scope

Step 5 records **successful provider calls only**.

Reason:

When `executeStructuredLlm(...)` throws, the current portable contract does not
guarantee:

```text
elapsedSeconds
normalized failure type
portable token usage
```

Inventing those values in telemetry would make benchmark data misleading.

Failure-call telemetry requires a future normalized execution-error/result
contract and is not added implicitly here.

### Provider neutrality

The capture helper consumes:

```text
StructuredLlmResult<T>
role
model
```

It must not inspect:

```text
NVIDIA response shapes
Claude CLI output
provider hints
provider capabilities
HTTP/process details
```

Provider usage remains optional because the provider contract already makes
usage optional.

### Collector behavior

`createLlmCallTelemetryCollector()`:

- preserves call order;
- records one entry per successful LLM call;
- exposes `snapshot()` as a copied array;
- never exposes its internal mutable array.

No aggregation or cost calculation occurs yet.

H0 comparison/report work can aggregate raw call records later.

### Files

Create:

```text
src/telemetry/llm-calls.ts
src/test-llm-call-telemetry.ts
```

Modify:

```text
src/graph/nodes.ts
src/graph/build-dev-graph.ts
src/graph.ts
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/state.ts
src/index.ts
src/providers/*
src/telemetry/contracts.ts
src/telemetry/recorder.ts
src/telemetry/store.ts
```

### Non-goals

Do not yet:

- persist LLM metrics;
- wire a collector in `src/index.ts`;
- automatically create `.runs/`;
- record failed provider calls with invented metrics;
- add normalized provider error telemetry;
- calculate cost;
- aggregate tokens;
- add node timings;
- add prompt contents to telemetry;
- add provider-specific telemetry fields;
- mutate `DevState`;
- add a database/dashboard;
- add OpenTelemetry.

### Deterministic test

Create:

```text
src/test-llm-call-telemetry.ts
```

with a capability-aware fake provider.

It must prove:

- planner calls capture planner role/model/time/usage;
- reviewer calls capture reviewer role/model/time with usage absent when the
  provider omits it;
- refiner calls capture refiner role/model/time/partial portable usage;
- graph nodes use the injected collector;
- call order is preserved;
- the capture helper is a no-op when no sink is configured;
- snapshots do not expose the collector's internal mutable array;
- no real provider usage occurs;
- no filesystem persistence occurs.

### Deterministic gate

```bash
npm run typecheck && \
npm run test:llm-call-telemetry && \
npm run test:run-telemetry-store && \
npm run test:run-lifecycle-recorder && \
npm run test:run-telemetry-contract && \
npm run test:run-lifecycle-characterization && \
npm run test:harch004-acceptance && \
npm run test:architecture-public-boundaries && \
npm run test:architecture-dependencies && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Acceptance criteria

- [x] `src/telemetry/llm-calls.ts` exists.
- [x] a provider-neutral LLM telemetry sink exists.
- [x] an in-memory run-scoped collector exists.
- [x] planner successful calls are captured.
- [x] reviewer successful calls are captured.
- [x] refiner successful calls are captured.
- [x] selected model is captured from resolved runtime composition.
- [x] elapsed provider time is captured.
- [x] prompt/completion/total usage remains optional.
- [x] call order is preserved.
- [x] collector snapshots do not expose the internal array.
- [x] graph node factory accepts an optional telemetry sink.
- [x] graph builder forwards an optional telemetry sink.
- [x] public graph builder remains compatible with no-argument callers.
- [x] graph state remains unchanged.
- [x] provider adapters/contracts remain unchanged.
- [x] failed calls are not assigned invented portable metrics.
- [x] no persistence/executable wiring is introduced yet.
- [x] no new dependency is added.
- [x] Steps 1–4 telemetry gates remain green.
- [x] complete H-ARCH/alpha.4 regression gate remains green.

### Commit

```bash
git commit -m "feat(telemetry): capture LLM call metrics"
```

### Exit condition

Step 5 is complete when successful planner/reviewer/refiner calls can be
captured into the Step 2 portable telemetry shape through an optional run-scoped
collector, without graph-state, concrete-provider, or persistence coupling.

**Next:** Step 6 — Telemetry Acceptance / H0-001 Review.


## H0-001 Step 5 Validation Record

**Status:** ✅ Accepted

The full deterministic H0-001 Step 5 gate passed on the
`v0.1.0-alpha.4` architectural-foundation baseline.

Accepted outcome:

- `src/telemetry/llm-calls.ts` defines a provider-neutral LLM telemetry sink
  and in-memory collector;
- successful planner, reviewer, and refiner calls capture semantic role,
  selected model, provider elapsed time, and optional portable token usage;
- call order is preserved;
- collector snapshots do not expose the collector's internal mutable array;
- graph node creation accepts an optional telemetry sink;
- graph assembly forwards the optional sink without changing no-telemetry
  behavior;
- the public graph builder remains compatible with existing no-argument
  callers;
- no telemetry fields were added to `DevState`;
- no concrete provider adapter or provider contract was changed;
- failed provider calls are not assigned invented portable metrics;
- no filesystem persistence or executable lifecycle wiring was introduced in
  Step 5;
- no new dependency was added.

### Regression adjustments accepted during validation

Step 5 legitimately extended the graph-builder/node-factory dependency surface.

The deterministic architecture guards were updated to reflect that explicit
telemetry dependency while preserving the underlying architecture rules:

- `test-harch004-acceptance.ts` now expects the optional telemetry sink;
- `test-architecture-boundaries-characterization.ts` now characterizes the
  telemetry import in the graph boundary/builder/nodes;
- `test-provider-architecture.ts` now expects the optional telemetry sink;
- duplicate type/value imports from `telemetry/llm-calls` in `nodes.ts` were
  consolidated into one import;
- the Step 5 test fixture was corrected to provide all required `DevStateType`
  keys explicitly.

These corrections do not weaken the dependency rules. They update frozen
characterization/acceptance expectations to the new explicit, provider-neutral
telemetry boundary.

### Gate evidence

The complete deterministic regression sequence reached and passed:

```text
typecheck
H0-001 Step 5 LLM telemetry
H0-001 Steps 1-4 telemetry
H-ARCH-004 acceptance/public/dependency/boundary guards
H-ARCH-003 acceptance/execution policy/provider lifecycle
provider architecture/cross-provider/composition/injection/contract
H-ARCH-001 prompt/graph characterization
repository tools
```

### Design consequence

Step 6 should be an integration/acceptance step, not another telemetry
abstraction step.

It should compose the already-accepted boundaries at the executable
application edge:

```text
run lifecycle recorder
  + run-scoped LLM collector
  + graph execution result
  + run telemetry store
```

and prove that a real Harness run writes one `.runs/<run-id>.json` record with
terminal status, attempts, file metrics, and captured LLM calls.

**Decision:** proceed to Step 6 — Telemetry Acceptance / H0-001 Review.

## H0-001 Step 6 — Telemetry Acceptance / H0-001 Review

**Status:** ✅ Accepted

### Objective

Compose the telemetry boundaries accepted in Steps 2–5 at the executable
application edge so a normal Harness execution persists one terminal run record.

The runtime composition becomes:

```text
RunLifecycleRecorder
  + LlmCallTelemetryCollector
  + buildDevGraph(collector)
  + graph.invoke(...)
  + buildRunTelemetryCompletion(...)
  + RunTelemetryStore
  → .runs/<run-id>.json
```

### Architectural decision

Create `src/telemetry/completion.ts` as a small deterministic adapter from
terminal `DevStateType` to the run-completion fields required by the recorder.

It owns only state-to-telemetry projection: terminal status, attempt counters,
files-read count, changed files, captured LLM calls, and `failureReason`.

It does not own clock, run ID, graph invocation, filesystem persistence, or
provider execution.

### Executable wiring

`src/index.ts` becomes the application composition point. It creates a
run-scoped LLM collector, lifecycle recorder/active run, graph built with the
collector, and telemetry store.

After `graph.invoke(...)` returns a terminal state:

```text
state → buildRunTelemetryCompletion(...)
      → activeRun.complete(...)
      → store.save(...)
```

The persisted path is printed to the console.

The exported static `devGraph` compatibility boundary remains available in
`src/graph.ts`; the executable uses `buildDevGraph(...)` because telemetry must
be run-scoped.

### Terminal-state policy

A persisted completion requires graph status `completed` or `failed`. Any
non-terminal returned status is rejected deterministically. Terminal failures
preserve `failureReason` when present.

Provider/process exceptions that abort `graph.invoke(...)` before LangGraph
returns a terminal state are not normalized in H0-001.

### Files and attempts

The final run record projects existing deterministic state:

```text
attempts.planning → state.planningAttempts
attempts.review   → state.reviewAttempts
attempts.task     → state.attempts

files.read        → Object.keys(state.fileContents).length
files.changed     → state.filesChanged
```

No new graph-state telemetry fields are introduced.

### `.runs/` repository hygiene

Now that the executable creates `process.cwd()/.runs`, add `.runs/` to
`.gitignore`.

### Deterministic acceptance test

Create `src/test-run-telemetry-integration.ts`. It composes the accepted
telemetry boundaries with deterministic clock/ID values and a temporary
persistence root. It proves collector data, terminal state projection,
lifecycle timing, persistence, completed/failed status, failure reason, and
non-terminal rejection without calling a live model.

### Step 1 characterization evolution

Step 1 intentionally characterized the pre-telemetry executable. Step 6 updates
that test to assert the accepted executable composition instead of asserting
that `src/index.ts` contains no telemetry wiring. State/status/node observations
remain protected.

### Files

Create:

```text
src/telemetry/completion.ts
src/test-run-telemetry-integration.ts
```

Modify:

```text
src/index.ts
src/test-run-lifecycle-characterization.ts
.gitignore
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify `src/state.ts`, `src/providers/*`, existing telemetry contracts,
recorder/store/LLM collector, or graph topology.

### Deterministic gate

```bash
npm run typecheck && \
npm run test:run-telemetry-integration && \
npm run test:llm-call-telemetry && \
npm run test:run-telemetry-store && \
npm run test:run-lifecycle-recorder && \
npm run test:run-telemetry-contract && \
npm run test:run-lifecycle-characterization && \
npm run test:harch004-acceptance && \
npm run test:architecture-public-boundaries && \
npm run test:architecture-dependencies && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Manual smoke after deterministic gate

With the normal environment configured:

```bash
npm run dev
```

must leave exactly one new `.runs/<run-id>.json` for the terminal run.

Inspect with:

```bash
ls -lah .runs
cat .runs/<run-id>.json
git status --short
```

`.runs/` must not appear in Git status.

### Acceptance criteria

- [x] completion adapter exists and accepts only terminal graph state.
- [x] completed/failed status, optional failure reason, attempts, files, and LLM
  calls map deterministically.
- [x] index creates a run-scoped collector and lifecycle recorder.
- [x] index builds the graph with the collector.
- [x] index persists one terminal telemetry record and prints its path.
- [x] `.runs/` is ignored by Git.
- [x] deterministic integration test uses a temporary store root.
- [x] no graph-state telemetry fields are added.
- [x] no provider contract/adapter changes occur.
- [x] graph topology remains unchanged.
- [x] Steps 1–5 telemetry gates remain green.
- [x] complete H-ARCH/alpha.4 deterministic regression gate remains green.
- [x] manual Harness smoke creates one real `.runs/<run-id>.json`.
- [x] `.runs/` remains absent from `git status --short`.

### Commit

After acceptance:

```bash
git commit -m "feat(telemetry): wire run telemetry lifecycle"
```

### Exit condition

H0-001 is complete when a normal terminal Harness run emits one ignored,
versioned `.runs/<run-id>.json` record containing lifecycle, attempts, files,
terminal result, and successful portable LLM-call metrics.

**Next task:** H0-002 — Benchmark Task Suite.


## H0-001 Step 6 Validation Record

**Status:** ✅ Accepted — H0-001 complete

The deterministic Step 6 gate passed and the manual executable smoke produced
a real ignored run record.

Observed smoke:

```text
runId:
b8fbf6db-280c-4582-9f0b-30a321a02630

finalStatus:
failed

planning attempts:
4

review attempts:
3

task attempts:
0

files read:
5

files changed:
0

LLM calls:
7

durationMs:
50890
```

The persisted record contained:

- `schemaVersion: 1`;
- generated run identity and lifecycle timestamps;
- the original task and target repository path;
- terminal `failed` status;
- attempt counters;
- file-read/change metrics;
- ordered planner/reviewer call telemetry;
- selected models;
- provider elapsed times;
- prompt/completion/total token usage;
- final lifecycle duration.

The run failed because the planning-attempt budget was exhausted. This is a
valid terminal Harness outcome and therefore a valid telemetry smoke for
H0-001.

`failureReason` was absent from the JSON because the returned terminal graph
state had `failureReason: undefined`. H0-001 intentionally preserves that field
when present and does not invent a reason when graph state does not provide one.

### Repository hygiene evidence

The generated file was written under:

```text
.runs/b8fbf6db-280c-4582-9f0b-30a321a02630.json
```

and `.runs/` did not appear in `git status --short`.

Only expected Step 6 source/plan/test changes remained visible to Git.

### H0-001 accepted architecture

```text
src/index.ts
  → run-scoped LLM collector
  → run lifecycle recorder
  → graph built with collector
  → terminal DevState projection
  → completed RunTelemetry
  → JSON telemetry store
  → .runs/<run-id>.json
```

Telemetry remains outside `DevState`, provider-neutral, versioned, and
persisted outside the target repository.

### H0-001 exit decision

All six H0-001 steps are accepted.

**Decision:** close H0-001 — Run Telemetry Foundation and proceed to
H0-002 — Benchmark Task Suite.

# H0-002 — Benchmark Task Suite

## Status

**Task:** 🚧 In progress
**Current step:** H0-002 complete
**Planned steps:** 5

## Objective

Define a fixed, versioned and reproducible benchmark suite before building the
automatic runner.

H0-002 owns the benchmark definitions. It does not execute benchmarks or
aggregate comparison reports.

The five planned steps are:

```text
1. Define Benchmark Contract
2. Define Benchmark Cases B01–B05
3. Define Expected Outcomes / Acceptance Rules
4. Add Deterministic Benchmark Suite Validation
5. H0-002 Acceptance / Review
```

## H0-002 Step 1 — Define Benchmark Contract

**Status:** ✅ Accepted

### Objective

Define the smallest provider-neutral and runner-neutral contract required to
describe one benchmark task reproducibly.

No benchmark case is added in Step 1.

### Architectural decision

Create:

```text
src/benchmarks/contracts.ts
```

with a versioned `BenchmarkTask` contract.

The contract contains:

```text
schemaVersion
id
title
difficulty
task
repository
constraints
successCriteria
validationCommands
expectedOutcome
```

### Difficulty vocabulary

The initial fixed suite already establishes five meaningful task classes:

```text
trivial
already-satisfied
localized
cross-file
architectural
```

The contract uses those semantic categories rather than a numeric score whose
meaning would be arbitrary before benchmark evidence exists.

### Expected outcome vocabulary

The planning contract already exposes three final semantic outcomes:

```text
changes_required
already_satisfied
blocked
```

Benchmark tasks may declare which one is expected.

Step 1 only records that expectation. Step 3 defines the deterministic
acceptance semantics around it.

### Repository reference

A benchmark must identify a reproducible repository baseline with:

```text
repository.id
repository.revision
```

The contract deliberately does not contain a local absolute path.

Why:

- `/Users/...` paths are machine-specific;
- H0-002 defines benchmark identity, not checkout mechanics;
- H0-003 will resolve repository IDs/revisions into isolated working copies.

`revision` is an opaque stable revision identifier at this boundary. H0-003 may
interpret it as a Git commit/tag or fixture revision according to repository
resolution policy.

### Validation commands

`validationCommands` are data, not execution behavior.

H0-002 records the deterministic commands associated with a benchmark.

H0-003 owns actually executing them.

### Contract helper

Expose:

```ts
defineBenchmarkTask(...)
```

as an identity/type boundary.

It must not:

- mutate definitions;
- normalize paths;
- execute commands;
- resolve repositories;
- call an LLM;
- add defaults.

This keeps suite definitions literal and reviewable.

### Files

Create:

```text
src/benchmarks/contracts.ts
src/test-benchmark-contract.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/graph/*
src/providers/*
src/telemetry/*
src/state.ts
src/index.ts
```

### Non-goals

Do not yet:

- define B01–B05 objects;
- create fixture repositories;
- clone/checkout repositories;
- execute benchmark tasks;
- run validation commands;
- calculate SFCR;
- calculate cost;
- compare models;
- aggregate telemetry;
- define benchmark reports;
- change Harness prompts, graph behavior or model strategy.

### Deterministic test

Create:

```text
src/test-benchmark-contract.ts
```

The test proves:

- schema version is explicit;
- all required task fields are representable;
- repository identity/revision are explicit;
- deterministic validation commands are data;
- expected outcome is explicit;
- `defineBenchmarkTask` preserves the supplied definition without hidden
  normalization.

No provider, repository checkout, filesystem fixture or network access is
required.

### Step 1 gate

```bash
npm run typecheck && \
npm run test:benchmark-contract && \
npm run test:run-telemetry-integration && \
npm run test:llm-call-telemetry && \
npm run test:run-telemetry-store && \
npm run test:run-lifecycle-recorder && \
npm run test:run-telemetry-contract && \
npm run test:run-lifecycle-characterization && \
npm run test:harch004-acceptance && \
npm run test:architecture-public-boundaries && \
npm run test:architecture-dependencies && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Acceptance criteria

- [x] `src/benchmarks/contracts.ts` exists.
- [x] benchmark schema version is explicit.
- [x] benchmark difficulty has the five planned semantic categories.
- [x] expected outcome uses the current final planning outcome vocabulary.
- [x] repository identity is independent of machine-local absolute paths.
- [x] repository revision is mandatory.
- [x] constraints are explicit task data.
- [x] success criteria are explicit task data.
- [x] validation commands are explicit task data.
- [x] `defineBenchmarkTask` is free of execution/normalization behavior.
- [x] no benchmark case is prematurely added.
- [x] no runner/repository checkout behavior is added.
- [x] no provider/graph/telemetry behavior changes.
- [x] no new runtime dependency is added.
- [x] deterministic benchmark contract test passes.
- [x] alpha.5 regression gate remains green.

### Commit

After acceptance:

```bash
git commit -m "feat(benchmark): define benchmark task contract"
```

### Exit condition

Step 1 is complete when benchmark definitions have one explicit, versioned,
machine-independent contract and the full alpha.5 regression gate passes.

**Next:** Step 2 — Define Benchmark Cases B01–B05.

## H0-002 Step 1 Validation Record

**Status:** ✅ Accepted

The benchmark contract and the complete alpha.5 regression gate passed in the
development environment.

Accepted contract:

```text
BenchmarkTask
  → schemaVersion
  → id
  → title
  → difficulty
  → task
  → repository.id
  → repository.revision
  → constraints[]
  → successCriteria[]
  → validationCommands[]
  → expectedOutcome
```

Accepted decisions:

- benchmark definitions are versioned;
- benchmark identity is independent of machine-local absolute paths;
- every benchmark requires an explicit repository revision;
- validation commands remain declarative data in H0-002;
- expected outcomes use the existing planning outcome vocabulary;
- semantic difficulty categories match the planned B01–B05 suite;
- `defineBenchmarkTask(...)` is an identity/type boundary with no hidden
  execution or normalization behavior;
- no benchmark cases, runner, checkout behavior, model comparison, or report
  behavior were introduced in Step 1;
- no graph, provider, telemetry, state, or executable behavior changed;
- no new runtime dependency was added.

**Decision:** proceed to H0-002 Step 2 — Define Benchmark Cases B01–B05.

## H0-002 Step 2 — Define Benchmark Cases B01–B05

**Status:** ✅ Accepted

### Objective

Materialize the five fixed benchmark cases already committed to the engineering
roadmap using the versioned `BenchmarkTask` contract accepted in Step 1.

Step 2 defines benchmark data only.

It does not create fixture repositories, resolve revisions, execute commands,
score results, or compare models.

### Fixed suite

The suite is:

```text
B01 — Trivial
B02 — Already Satisfied
B03 — Localized Change
B04 — Cross-file Feature
B05 — Architectural / Ambiguous
```

Each semantic difficulty category appears exactly once.

### B01 — Trivial

Repository identity:

```text
fixture-simple-api
revision: b01-v1
```

Task:

```text
Add GET /health with HTTP 200 JSON response.
```

Purpose:

Measure whether the Harness can solve a small, obvious task without excessive
planning/context overhead.

Expected outcome:

```text
changes_required
```

### B02 — Already Satisfied

Repository identity:

```text
fixture-health-already-present
revision: b02-v1
```

Task:

```text
Ensure GET /health exists, while the requested behavior is already present.
```

Purpose:

Measure whether the Harness can recognize existing behavior and stop without
unnecessary modifications.

Expected outcome:

```text
already_satisfied
```

### B03 — Localized Change

Repository identity:

```text
fixture-component-app
revision: b03-v1
```

Task:

```text
Add an optional compact mode to a known StatusBadge component while preserving
its default behavior and accessible semantic status text.
```

Purpose:

Measure a constrained implementation where the relevant component is known and
the correct scope should remain small.

Expected outcome:

```text
changes_required
```

### B04 — Cross-file Feature

Repository identity:

```text
qflow-workflow-canvas
revision: b04-v1
```

Task:

Evolve the Q-Flow Workflow Canvas toward the n8n-like behavior already selected
as the representative cross-file benchmark:

- canvas-local node addition;
- insertion between connected nodes;
- edge removal/insertion actions;
- preserve `@xyflow/react`;
- preserve draft source of truth;
- preserve plugin registry;
- preserve visual identity.

Purpose:

Exercise repository discovery and planning across multiple real architectural
boundaries.

Expected outcome:

```text
changes_required
```

### B05 — Architectural / Ambiguous

Repository identity:

```text
qos-harness-architecture
revision: b05-v1
```

Task:

Determine the correct architecture for failed provider-call telemetry before
implementing it.

The request intentionally contains a real architectural ambiguity:

```text
How should failed provider calls be recorded when portable elapsed/usage/error
semantics are not currently guaranteed?
```

The benchmark requires repository evidence across execution, provider lifecycle,
telemetry, and graph boundaries before concluding that implementation is safe.

Purpose:

Measure whether the Harness avoids unsupported architectural assumptions rather
than forcing a code change.

Expected outcome:

```text
blocked
```

for the initial `b05-v1` baseline, because the current architecture has no
normalized failed-provider-call telemetry/error contract and Step 5 of H0-001
explicitly avoided fabricating those metrics.

A future benchmark revision may intentionally change this expected outcome after
the repository gains that contract.

### Revision policy

The revisions:

```text
b01-v1
b02-v1
b03-v1
b04-v1
b05-v1
```

are benchmark-owned stable revision identifiers.

They are not asserted to be Git commit hashes in H0-002.

H0-003 owns repository resolution and must map each benchmark repository/revision
pair to an isolated reproducible working tree or fixture.

This avoids inventing machine-local paths or fake Git commit hashes in the
suite definition.

### Validation commands

Validation commands are declared now because they are part of benchmark intent.

They remain inert data until H0-003.

Step 2 does not execute them.

### Files

Create:

```text
src/benchmarks/cases.ts
src/test-benchmark-cases.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/benchmarks/contracts.ts
src/graph/*
src/providers/*
src/telemetry/*
src/state.ts
src/index.ts
```

### Non-goals

Do not yet:

- create benchmark fixture repositories;
- create Git tags/commits for benchmark revisions;
- resolve repository IDs;
- execute benchmark tasks;
- execute benchmark validation commands;
- define scoring/SFCR calculation;
- define allowed-file-change enforcement;
- aggregate telemetry;
- compare models;
- generate reports;
- change Harness runtime behavior.

### Deterministic test

Create:

```text
src/test-benchmark-cases.ts
```

The Step 2 test proves only facts owned by Step 2:

- exactly B01–B05 exist;
- IDs are ordered and fixed;
- every planned difficulty appears once;
- expected outcomes are explicit;
- repository IDs/revisions are non-empty;
- repository IDs are not absolute machine-local paths;
- constraints, success criteria and validation commands are present;
- B02 is the explicit `already_satisfied` case;
- B04 is the Q-Flow cross-file case;
- B05 is the initial blocked architectural case.

Deeper suite invariants belong to Step 4.

### Step 2 gate

```bash
npm run typecheck && \
npm run test:benchmark-cases && \
npm run test:benchmark-contract && \
npm run test:run-telemetry-integration && \
npm run test:llm-call-telemetry && \
npm run test:run-telemetry-store && \
npm run test:run-lifecycle-recorder && \
npm run test:run-telemetry-contract && \
npm run test:run-lifecycle-characterization && \
npm run test:harch004-acceptance && \
npm run test:architecture-public-boundaries && \
npm run test:architecture-dependencies && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Acceptance criteria

- [x] `src/benchmarks/cases.ts` exists.
- [x] exactly five benchmark cases exist.
- [x] case IDs are B01 through B05.
- [x] every planned semantic difficulty appears exactly once.
- [x] B01 represents a trivial required code change.
- [x] B02 represents already-satisfied detection.
- [x] B03 represents a localized component change.
- [x] B04 represents the Q-Flow cross-file Workflow Canvas feature.
- [x] B05 represents architectural ambiguity requiring evidence first.
- [x] every case has an explicit repository ID and revision.
- [x] no case uses a machine-local absolute repository path.
- [x] every case has explicit constraints.
- [x] every case has explicit success criteria.
- [x] every case has explicit validation commands.
- [x] every case has an explicit expected outcome.
- [x] B02 expects `already_satisfied`.
- [x] B05 initially expects `blocked`.
- [x] no fixture/checkout/runner behavior is introduced.
- [x] no graph/provider/telemetry behavior changes.
- [x] no new runtime dependency is added.
- [x] benchmark case deterministic test passes.
- [x] Step 1 benchmark contract remains green.
- [x] alpha.5 regression gate remains green.

### Commit

After acceptance:

```bash
git commit -m "feat(benchmark): define fixed benchmark cases"
```

### Exit condition

Step 2 is complete when B01–B05 are fixed as literal, reviewable benchmark data
and the complete deterministic regression gate passes.

**Next:** Step 3 — Define Expected Outcomes / Acceptance Rules.

## H0-002 Step 2 Validation Record

**Status:** ✅ Accepted

The fixed B01–B05 benchmark definitions and the complete deterministic alpha.5
regression gate passed in the development environment.

Accepted suite:

```text
B01 — Trivial
  repository: fixture-simple-api / b01-v1
  expected: changes_required

B02 — Already Satisfied
  repository: fixture-health-already-present / b02-v1
  expected: already_satisfied

B03 — Localized Change
  repository: fixture-component-app / b03-v1
  expected: changes_required

B04 — Cross-file Feature
  repository: qflow-workflow-canvas / b04-v1
  expected: changes_required

B05 — Architectural / Ambiguous
  repository: qos-harness-architecture / b05-v1
  expected: blocked
```

Accepted decisions:

- the suite contains exactly five fixed benchmark cases;
- every planned semantic difficulty appears exactly once;
- benchmark definitions use machine-independent repository IDs/revisions;
- B02 explicitly measures already-satisfied detection;
- B04 fixes the Q-Flow Workflow Canvas feature as the representative cross-file
  benchmark;
- B05 intentionally measures evidence-first architectural restraint and starts
  with `blocked` as the expected outcome for revision `b05-v1`;
- constraints, success criteria and validation commands are literal benchmark
  data;
- repository resolution, fixture checkout, command execution, scoring, SFCR
  calculation, telemetry aggregation and model comparison remain deferred;
- no graph, provider, telemetry, state or executable runtime behavior changed;
- no new runtime dependency was added.

**Decision:** proceed to H0-002 Step 3 — Define Expected Outcomes / Acceptance Rules.

## H0-002 Step 3 — Define Expected Outcomes / Acceptance Rules

**Status:** ✅ Accepted

### Objective

Define the first deterministic acceptance semantics that turn a benchmark
definition plus observed run outcome into an objective PASS/FAIL decision.

Step 3 does not execute benchmarks.

It defines how future H0-003 runner output will be judged.

### Acceptance observation contract

Create:

```text
src/benchmarks/acceptance.ts
```

with a minimal runtime-observation shape:

```text
finalOutcome
filesChanged[]
validationPassed
humanInterventionRequired
```

These are deliberately outcome-level observations.

Step 3 does not add telemetry aggregation, command execution, Git diff capture,
or repository resolution.

### Deterministic acceptance rules

A benchmark is accepted only when all applicable conditions hold.

#### Rule 1 — Expected final outcome must match

```text
observation.finalOutcome === benchmark.expectedOutcome
```

Mismatch:

```text
unexpected_outcome
```

Examples:

```text
B01 expected changes_required, observed blocked
  → FAIL

B02 expected already_satisfied, observed already_satisfied
  → potentially PASS
```

#### Rule 2 — Already-satisfied benchmarks must not modify files

For:

```text
expectedOutcome = already_satisfied
```

any changed file is a failure:

```text
unexpected_changes
```

This makes B02 explicitly detect unnecessary implementation work.

Step 3 does not yet enforce allowed-file scopes for `changes_required` cases.
That belongs to later benchmark/runner evidence because the current
`BenchmarkTask` contract has no explicit allowed-path policy.

#### Rule 3 — Deterministic validation must pass

If the runner reports:

```text
validationPassed = false
```

the benchmark fails with:

```text
validation_failed
```

Step 3 consumes this boolean outcome only.

H0-003 owns execution of `validationCommands`.

#### Rule 4 — Human intervention means the benchmark did not autonomously complete

If:

```text
humanInterventionRequired = true
```

the benchmark fails with:

```text
human_intervention_required
```

This is required by the project SFCR definition: a successful feature
completion requires no human intervention.

#### Rule 5 — Preserve all failure reasons

Acceptance is not short-circuited.

If multiple independent conditions fail, all applicable deterministic reasons
are returned in a stable order:

```text
unexpected_outcome
unexpected_changes
validation_failed
human_intervention_required
```

This gives H0-004 comparison/reporting richer evidence than a single boolean.

### Blocked semantics

A benchmark whose declared expected outcome is:

```text
blocked
```

may PASS when the observed outcome is `blocked`, validation is green, and no
human intervention was required.

This is intentional.

For B05, correct architectural restraint is part of the benchmark objective.

A benchmark system that treated every `blocked` outcome as an automatic failure
would bias agents toward unsupported changes.

### Why `successCriteria[]` are not automatically evaluated in Step 3

The benchmark contract already carries human-reviewable `successCriteria[]`.

However, Step 3 does not invent a generic deterministic interpreter for natural
language criteria such as:

```text
"draft edges remain consistent after insertion or removal"
```

Those criteria need concrete evidence from fixture tests, command results,
repository diff policy, or later benchmark-specific validators.

For now:

```text
successCriteria[]
  → benchmark intent / reviewable specification

validationPassed
  → deterministic executable evidence
```

Step 4 will validate suite structure and consistency.

H0-003 will own actual execution evidence.

### Files

Create:

```text
src/benchmarks/acceptance.ts
src/test-benchmark-acceptance.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/benchmarks/contracts.ts
src/benchmarks/cases.ts
src/graph/*
src/providers/*
src/telemetry/*
src/state.ts
src/index.ts
```

### Non-goals

Do not yet:

- execute benchmark tasks;
- execute validation commands;
- resolve benchmark repositories;
- inspect Git diffs;
- enforce allowed changed paths for change-required tasks;
- parse natural-language success criteria;
- calculate SFCR;
- calculate cost per successful completion;
- aggregate run telemetry;
- compare models;
- generate reports;
- change Harness runtime behavior.

### Deterministic test

Create:

```text
src/test-benchmark-acceptance.ts
```

The test proves:

- matching `changes_required` outcome can pass;
- matching `already_satisfied` with zero file changes can pass;
- matching `blocked` can pass;
- already-satisfied plus file changes fails;
- expected-outcome mismatch fails;
- deterministic validation failure fails;
- required human intervention fails;
- multiple failures are all preserved in deterministic order.

No LLM, network, repository checkout, Git operation or validation command is
executed.

### Step 3 gate

```bash
npm run typecheck && \
npm run test:benchmark-acceptance && \
npm run test:benchmark-cases && \
npm run test:benchmark-contract && \
npm run test:run-telemetry-integration && \
npm run test:llm-call-telemetry && \
npm run test:run-telemetry-store && \
npm run test:run-lifecycle-recorder && \
npm run test:run-telemetry-contract && \
npm run test:run-lifecycle-characterization && \
npm run test:harch004-acceptance && \
npm run test:architecture-public-boundaries && \
npm run test:architecture-dependencies && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Acceptance criteria

- [x] `src/benchmarks/acceptance.ts` exists.
- [x] acceptance consumes benchmark definition plus observed run outcome.
- [x] expected outcome mismatch deterministically fails.
- [x] already-satisfied cases deterministically reject file changes.
- [x] deterministic validation failure rejects the benchmark.
- [x] required human intervention rejects the benchmark.
- [x] a matching blocked outcome can pass.
- [x] multiple failure reasons are preserved.
- [x] failure reason ordering is deterministic.
- [x] no natural-language success-criteria interpreter is invented.
- [x] no allowed-path policy is invented before the benchmark contract contains one.
- [x] no runner/repository/command execution behavior is introduced.
- [x] no graph/provider/telemetry runtime behavior changes.
- [x] no new runtime dependency is added.
- [x] benchmark acceptance deterministic test passes.
- [x] Step 1 and Step 2 benchmark tests remain green.
- [x] alpha.5 regression gate remains green.

### Commit

After acceptance:

```bash
git commit -m "feat(benchmark): define acceptance rules"
```

### Exit condition

Step 3 is complete when benchmark PASS/FAIL semantics are deterministic for
outcome matching, already-satisfied change safety, validation status, and human
intervention, with all regression gates green.

**Next:** Step 4 — Add Deterministic Benchmark Suite Validation.

## H0-002 Step 3 Validation Record

**Status:** ✅ Accepted

The benchmark acceptance rules and complete deterministic alpha.5 regression
gate passed in the development environment.

Accepted deterministic semantics:

```text
unexpected_outcome
unexpected_changes
validation_failed
human_intervention_required
```

Accepted decisions:

- observed final outcome must match the benchmark's declared expected outcome;
- `already_satisfied` benchmarks fail if any repository file changed;
- deterministic validation failure rejects the benchmark;
- required human intervention rejects autonomous benchmark success;
- matching `blocked` outcomes may pass when `blocked` is the benchmark's expected
  outcome;
- multiple independent failure reasons are preserved in deterministic order;
- natural-language `successCriteria[]` remain benchmark intent rather than being
  falsely interpreted as generic executable assertions;
- allowed-path enforcement for change-required tasks remains deferred until the
  benchmark/runner contracts contain concrete scope evidence;
- no repository resolution, command execution, Git diff capture, telemetry
  aggregation, SFCR calculation, model comparison or report generation was
  introduced;
- no graph, provider, telemetry, state or executable runtime behavior changed;
- no new runtime dependency was added.

**Decision:** proceed to H0-002 Step 4 — Add Deterministic Benchmark Suite Validation.

## H0-002 Step 4 — Add Deterministic Benchmark Suite Validation

**Status:** ✅ Accepted

### Objective

Promote the Step 1–3 benchmark assumptions into one reusable deterministic
suite validator.

The validator protects benchmark-definition integrity before H0-003 starts
executing repositories and commands.

Step 4 does not run a benchmark.

### Architectural decision

Create:

```text
src/benchmarks/suite-validation.ts
```

with:

```ts
validateBenchmarkSuite(...)
assertValidBenchmarkSuite(...)
```

The validator consumes only `BenchmarkTask[]`.

It must not:

- resolve repositories;
- inspect the filesystem;
- invoke Git;
- execute validation commands;
- call an LLM;
- read run telemetry;
- calculate benchmark scores.

### Fixed-suite invariants

The current H0-002 benchmark suite is intentionally fixed.

Step 4 therefore protects:

```text
exactly 5 cases
ordered IDs B01 → B05
exactly one benchmark per planned difficulty
```

Changing those invariants later must be an explicit benchmark-suite revision,
not an accidental edit.

### Repository identity invariants

Every benchmark must have:

```text
non-empty repository.id
non-empty repository.revision
machine-independent repository.id
unique repository.id + revision pair
```

The validator rejects obvious POSIX, UNC and Windows absolute-path shapes.

It does not resolve whether a repository/revision actually exists.

That belongs to H0-003.

### Definition quality invariants

Every benchmark must have non-empty:

```text
title
task
constraints[]
successCriteria[]
validationCommands[]
```

Entries inside the three arrays must not be blank.

Duplicate entries inside an individual benchmark are rejected so suite data does
not silently inflate or repeat requirements.

### Schema invariant

Every benchmark must use the currently supported:

```text
BENCHMARK_TASK_SCHEMA_VERSION
```

A future schema migration must be explicit.

### Validation result

`validateBenchmarkSuite(...)` returns all detected issues:

```text
valid
issues[]
```

Each issue contains:

```text
code
benchmarkId?
detail
```

Validation does not short-circuit so the suite can be repaired from one
deterministic report.

`assertValidBenchmarkSuite(...)` is a convenience boundary for future H0-003
startup checks.

### What Step 4 deliberately does not validate

Do not attempt to prove:

- repository/revision existence;
- command availability;
- whether natural-language success criteria are executable;
- whether validation commands fully prove each criterion;
- allowed changed-file scope;
- benchmark task difficulty correctness through heuristics;
- semantic quality through an LLM.

Those require execution evidence or human benchmark-design review.

### Files

Create:

```text
src/benchmarks/suite-validation.ts
src/test-benchmark-suite-validation.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/benchmarks/contracts.ts
src/benchmarks/cases.ts
src/benchmarks/acceptance.ts
src/graph/*
src/providers/*
src/telemetry/*
src/state.ts
src/index.ts
```

### Non-goals

Do not yet:

- create repository fixtures;
- resolve benchmark repositories/revisions;
- run benchmark tasks;
- execute validation commands;
- inspect Git diffs;
- enforce implementation file scope;
- aggregate telemetry;
- calculate SFCR/cost metrics;
- compare models;
- generate reports;
- modify Harness runtime behavior.

### Deterministic test

Create:

```text
src/test-benchmark-suite-validation.ts
```

The test proves:

- the accepted B01–B05 suite validates with zero issues;
- duplicate benchmark IDs fail;
- duplicate repository/revision assignments fail;
- absolute repository IDs fail;
- blank validation commands fail;
- duplicate validation commands fail;
- missing cases fail count/order/difficulty invariants;
- assertion mode throws on an invalid suite.

No filesystem fixture, Git command, provider, network call or benchmark
execution is used.

### Step 4 gate

```bash
npm run typecheck && \
npm run test:benchmark-suite-validation && \
npm run test:benchmark-acceptance && \
npm run test:benchmark-cases && \
npm run test:benchmark-contract && \
npm run test:run-telemetry-integration && \
npm run test:llm-call-telemetry && \
npm run test:run-telemetry-store && \
npm run test:run-lifecycle-recorder && \
npm run test:run-telemetry-contract && \
npm run test:run-lifecycle-characterization && \
npm run test:harch004-acceptance && \
npm run test:architecture-public-boundaries && \
npm run test:architecture-dependencies && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Acceptance criteria

- [x] `src/benchmarks/suite-validation.ts` exists.
- [x] accepted B01–B05 suite validates deterministically.
- [x] fixed case count is protected.
- [x] B01–B05 ordering is protected.
- [x] duplicate case IDs are rejected.
- [x] exactly one case per planned difficulty is protected.
- [x] unsupported schema versions are rejected.
- [x] blank core benchmark fields are rejected.
- [x] absolute repository IDs are rejected.
- [x] blank repository revisions are rejected.
- [x] duplicate repository/revision assignments are rejected.
- [x] empty/blank benchmark definition arrays are rejected.
- [x] duplicate entries within benchmark definition arrays are rejected.
- [x] validation reports all detected issues rather than only the first.
- [x] assertion helper throws deterministic diagnostics for invalid suites.
- [x] repository existence/checkout is not validated prematurely.
- [x] validation commands are not executed.
- [x] no LLM semantic validator is introduced.
- [x] no graph/provider/telemetry runtime behavior changes.
- [x] no new runtime dependency is added.
- [x] Step 1–3 benchmark tests remain green.
- [x] alpha.5 regression gate remains green.

### Commit

After acceptance:

```bash
git commit -m "feat(benchmark): validate fixed benchmark suite"
```

### Exit condition

Step 4 is complete when the fixed benchmark suite has one deterministic,
reusable integrity gate and the full regression suite remains green.

**Next:** Step 5 — H0-002 Acceptance / Review.

## H0-002 Step 4 Validation Record

**Status:** ✅ Accepted

The deterministic benchmark suite validator and the complete alpha.5 regression
gate passed in the development environment.

Accepted suite integrity guarantees:

```text
exactly five benchmark cases
ordered IDs B01 → B05
unique benchmark IDs
exactly one case per planned difficulty
supported schema version only
machine-independent repository IDs
non-empty repository revisions
unique repository ID + revision assignments
non-empty benchmark core fields
non-empty constraints/successCriteria/validationCommands
no blank list entries
no duplicate list entries
```

Accepted decisions:

- `validateBenchmarkSuite(...)` reports all detected deterministic definition
  issues rather than short-circuiting at the first failure;
- `assertValidBenchmarkSuite(...)` provides a future H0-003 startup guard;
- repository/revision existence is intentionally not checked in H0-002;
- validation commands remain declarative and are not executed in H0-002;
- natural-language benchmark semantics are not delegated to an LLM validator;
- fixture resolution, checkout, Git isolation, command execution, diff capture,
  telemetry aggregation, SFCR/cost calculation and model comparison remain
  deferred;
- no graph, provider, telemetry, state or executable runtime behavior changed;
- no new runtime dependency was added.

**Decision:** proceed to H0-002 Step 5 — Acceptance / Review.

## H0-002 Step 5 — Acceptance / Review

**Status:** ✅ Accepted

### Objective

Close H0-002 by proving that the benchmark contract, fixed B01–B05 suite,
deterministic acceptance rules, and suite-integrity validator work together as
one coherent benchmark-definition foundation.

This is an acceptance/review step.

No benchmark runner, repository resolver, checkout behavior, telemetry
aggregation, scoring, or model comparison is added.

### Final H0-002 architecture

```text
BenchmarkTask contract
        ↓
fixed B01–B05 cases
        ↓
suite-validation
        ↓
future H0-003 execution
        ↓
BenchmarkRunObservation
        ↓
acceptance rules
        ↓
PASS / FAIL + deterministic failure reasons
```

### Review findings

#### 1. Benchmark identity is reproducible at the definition boundary

Every benchmark carries:

```text
repository.id
repository.revision
```

No case depends on a machine-local absolute path.

H0-003 must resolve those identifiers into isolated reproducible working trees.

#### 2. Suite shape is fixed and explicit

The accepted suite is:

```text
B01 — Trivial
B02 — Already Satisfied
B03 — Localized Change
B04 — Cross-file Feature
B05 — Architectural / Ambiguous
```

The suite validator protects case count, order, difficulty distribution,
schema version, repository identity and definition quality.

#### 3. Acceptance is deterministic where evidence is currently available

Current deterministic failure reasons are:

```text
unexpected_outcome
unexpected_changes
validation_failed
human_intervention_required
```

This is intentionally narrower than the eventual SFCR definition because H0-002
does not yet execute Git scope checks, builds, tests, or benchmark-specific
validators.

H0-003 will produce those observations.

#### 4. `blocked` can be a correct benchmark result

B05 intentionally expects:

```text
blocked
```

for revision `b05-v1`.

This protects evidence-driven restraint and prevents the benchmark from
rewarding unsupported architectural changes.

#### 5. Natural-language success criteria remain specification, not fake automation

`successCriteria[]` are preserved as benchmark intent.

H0-002 does not pretend that generic code can deterministically interpret
arbitrary prose.

Executable proof must come from concrete validation commands, repository
observations, or later benchmark-specific validators.

### Acceptance test

Create:

```text
src/test-h0-002-acceptance.ts
```

The test composes the existing H0-002 modules and proves:

- the real B01–B05 suite passes suite validation;
- expected outcomes remain fixed;
- a matching deterministic observation can pass for every benchmark;
- B02 still rejects unnecessary file changes;
- B05 still accepts a correct blocked outcome;
- no new execution layer is required to validate the definition foundation.

### Files

Create:

```text
src/test-h0-002-acceptance.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/benchmarks/contracts.ts
src/benchmarks/cases.ts
src/benchmarks/acceptance.ts
src/benchmarks/suite-validation.ts
src/graph/*
src/providers/*
src/telemetry/*
src/state.ts
src/index.ts
```

### Non-goals

Do not:

- create benchmark repository fixtures in this step;
- resolve repository IDs/revisions;
- clone or checkout repositories;
- execute benchmark tasks;
- execute validation commands;
- inspect Git diffs;
- calculate SFCR or cost;
- aggregate telemetry;
- compare models;
- generate comparison reports;
- change Harness runtime behavior.

### Final H0-002 gate

```bash
npm run typecheck && \
npm run test:h0-002-acceptance && \
npm run test:benchmark-suite-validation && \
npm run test:benchmark-acceptance && \
npm run test:benchmark-cases && \
npm run test:benchmark-contract && \
npm run test:run-telemetry-integration && \
npm run test:llm-call-telemetry && \
npm run test:run-telemetry-store && \
npm run test:run-lifecycle-recorder && \
npm run test:run-telemetry-contract && \
npm run test:run-lifecycle-characterization && \
npm run test:harch004-acceptance && \
npm run test:architecture-public-boundaries && \
npm run test:architecture-dependencies && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Acceptance criteria

- [x] final H0-002 acceptance test exists.
- [x] real B01–B05 suite passes deterministic suite validation.
- [x] fixed expected outcomes remain protected.
- [x] matching deterministic observations can pass for all five cases.
- [x] B02 still rejects unnecessary changes.
- [x] B05 still accepts correct evidence-driven blocking.
- [x] benchmark contract remains versioned.
- [x] suite identity remains machine-independent.
- [x] no benchmark runner is introduced.
- [x] no repository resolver/checkout behavior is introduced.
- [x] no telemetry aggregation/scoring/reporting behavior is introduced.
- [x] no graph/provider/telemetry runtime behavior changes.
- [x] no new runtime dependency is added.
- [x] all Step 1–4 benchmark tests remain green.
- [x] complete alpha.5 regression gate remains green.

### Commit

After acceptance:

```bash
git commit -m "test(benchmark): close fixed benchmark suite"
```

### Exit condition

Step 5 is complete when the final acceptance test and complete regression gate
pass.

At that point:

```text
H0-002 — Benchmark Task Suite ✅ COMPLETE
Next — H0-003 Benchmark Runner
```

## H0-002 Step 5 Validation Record

**Status:** ✅ Accepted

The final H0-002 acceptance test and the complete deterministic alpha.5
regression gate passed in the development environment.

Accepted benchmark-definition foundation:

```text
BenchmarkTask contract
        ↓
fixed B01–B05 suite
        ↓
deterministic suite validation
        ↓
future H0-003 execution observations
        ↓
deterministic benchmark acceptance
```

Final suite:

```text
B01 — Trivial
  expected: changes_required

B02 — Already Satisfied
  expected: already_satisfied

B03 — Localized Change
  expected: changes_required

B04 — Cross-file Feature
  expected: changes_required

B05 — Architectural / Ambiguous
  expected: blocked
```

Verified outcomes:

- the real B01–B05 suite passes deterministic integrity validation;
- expected outcomes remain fixed and explicit;
- matching deterministic observations can be accepted for all five cases;
- B02 rejects unnecessary file changes;
- B05 accepts correct evidence-driven blocking;
- benchmark definitions remain versioned and machine-independent;
- repository resolution, checkout/isolation, validation-command execution,
  Git-diff capture, telemetry aggregation, SFCR/cost calculation, model
  comparison and reporting remain outside H0-002;
- no graph, provider, telemetry, state or executable runtime behavior changed;
- no new runtime dependency was added.

### H0-002 conclusion

```text
H0-002 — Benchmark Task Suite ✅ COMPLETE
```

### Release decision

H0-002 adds a complete benchmark-definition capability on top of the alpha.5
telemetry baseline.

Prepare the next release as:

```text
v0.1.0-alpha.6 — Benchmark Suite Alpha
```

Version/tag publication remains a separate release commit after this accepted
Step 5 commit.

**Decision:** proceed next to `H0-003 — Benchmark Runner` only after the Step 5
commit and alpha.6 release are complete.

## H0-002A Step 1 — Characterize Current Task Entry

**Status:** ✅ Accepted

### Objective

Freeze the current executable task-entry and one-run orchestration boundaries
before defining `NormalizedHarnessTask` or extracting `runHarness(task)`.

This is characterization only.

No production source behavior changes are allowed.

### Evidence from the current repository

The executable path is currently concentrated in:

```text
src/index.ts
```

Current flow:

```text
process.env.TARGET_REPOSITORY
        ↓
hard-coded task string
        ↓
createLlmCallTelemetryCollector()
        ↓
createRunLifecycleRecorder()
        ↓
runRecorder.start({ task, repositoryPath })
        ↓
buildDevGraph(llmCallCollector)
        ↓
createJsonRunTelemetryStore()
        ↓
graph.invoke(initial DevState)
        ↓
buildRunTelemetryCompletion(result, collector.snapshot())
        ↓
activeRun.complete(...)
        ↓
telemetryStore.save(...)
        ↓
console output
```

### Current input boundary

The current executable has two direct external inputs:

```text
TARGET_REPOSITORY
MAX_PLANNING_ATTEMPTS
```

`TARGET_REPOSITORY` is required and is currently passed directly to:

```text
DevState.repositoryPath
RunTelemetryStart.repositoryPath
```

The task itself is not externally supplied yet.

It is a hard-coded string in `src/index.ts`.

### Current graph initial-state boundary

`src/index.ts` currently constructs the graph input directly with:

```text
task
repositoryPath

fileContents = {}
fileSummaries = {}
recentlyReadFiles = []

filesChanged = []

attempts = 0
maxAttempts = 3

planningAttempts = 0
reviewAttempts = 0
maxPlanningAttempts = env MAX_PLANNING_ATTEMPTS or 4

failureReason = undefined
status = pending
```

This initialization is application-run orchestration, not CLI parsing.

It is therefore a candidate to move behind `runHarness(task)` in Step 4 after
the normalized task contract is defined.

### Current telemetry boundary

`src/index.ts` currently owns the complete run telemetry lifecycle:

```text
collector creation
run start
graph execution
terminal projection
run completion
JSON persistence
telemetry path output
```

`StartRunTelemetryInput` currently requires:

```text
task
repositoryPath
```

and `buildRunTelemetryCompletion(...)` rejects non-terminal graph states.

This behavior must remain stable when application execution is extracted.

### Repository identity finding

H0-002 benchmark definitions already model repository identity as:

```text
repository.id
repository.revision
```

while current runtime execution uses:

```text
repositoryPath
```

These are not the same concept.

Step 1 records the distinction but does not reconcile it prematurely.

Working direction for later steps:

```text
NormalizedHarnessTask
  → repository identity

execution context
  → concrete repositoryPath/workspace
```

The exact handoff belongs to the Step 2 contract and later H0-003 workspace
resolution design.

### Architectural ownership finding

Based on current code, likely future ownership is:

```text
CLI/manual adapter
  → raw external input only

Task Normalizer
  → normalized task identity/request

runHarness(...)
  → collector
  → lifecycle recorder
  → graph construction/invocation
  → initial DevState
  → terminal telemetry projection
  → telemetry persistence
  → application result

Graph/Core
  → reasoning/orchestration only
```

This is a characterization finding, not permission to extract production code
in Step 1.

### Deterministic characterization test

Create:

```text
src/test-h0-002a-task-entry-characterization.ts
```

The test inspects the current source boundaries without invoking a real LLM or
creating run telemetry files.

It protects:

- `TARGET_REPOSITORY` as the current required concrete execution path;
- current missing-repository failure;
- the task remaining hard-coded in `src/index.ts`;
- current one-run composition order;
- exact graph initial-state defaults owned by `src/index.ts`;
- current terminal telemetry completion/persistence sequence;
- current telemetry start contract using `task + repositoryPath`;
- terminal-state requirement for telemetry completion;
- benchmark repository identity remaining `id + revision`;
- absence of `runHarness(...)` and `NormalizedHarnessTask` during
  characterization.

### Files

Create:

```text
src/test-h0-002a-task-entry-characterization.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/index.ts
src/graph.ts
src/state.ts
src/graph/*
src/providers/*
src/telemetry/*
src/benchmarks/*
```

### Non-goals

Do not yet:

- define `NormalizedHarnessTask`;
- define raw task-intake DTOs;
- create `src/app/run-harness.ts`;
- move orchestration out of `src/index.ts`;
- parse CLI arguments;
- externalize the hard-coded task;
- change `TARGET_REPOSITORY`;
- change telemetry contracts;
- reconcile repository identity with workspace paths;
- change graph initial-state defaults;
- add benchmark runner behavior;
- add HTTP/GitHub/Q-Flow adapters.

### Acceptance criteria

- [x] current required repository input is characterized.
- [x] current hard-coded task ownership is characterized.
- [x] current graph initial-state construction is characterized.
- [x] current planning-attempt environment/default behavior is characterized.
- [x] current LLM telemetry collector creation is characterized.
- [x] current run lifecycle start is characterized.
- [x] current graph construction/invocation order is characterized.
- [x] current terminal telemetry projection is characterized.
- [x] current telemetry persistence is characterized.
- [x] current telemetry start contract is characterized.
- [x] benchmark repository identity distinction is recorded.
- [x] no `NormalizedHarnessTask` is introduced.
- [x] no `runHarness(...)` is introduced.
- [x] no production source changes.
- [x] no real LLM/provider usage is consumed by the test.
- [x] no telemetry file is written by the characterization test.
- [x] no new runtime dependency is added.
- [x] H0-002 benchmark regression remains green.
- [x] H0-001 telemetry regression remains green.
- [x] H-ARCH architecture/runtime regression remains green.

### Targeted gate

```bash
npm run typecheck && \
npm run test:h0-002a-task-entry-characterization && \
npm run test:h0-002-acceptance && \
npm run test:benchmark-suite-validation && \
npm run test:benchmark-acceptance && \
npm run test:benchmark-cases && \
npm run test:benchmark-contract
```

### Full Step 1 gate

```bash
npm run typecheck && \
npm run test:h0-002a-task-entry-characterization && \
npm run test:h0-002-acceptance && \
npm run test:benchmark-suite-validation && \
npm run test:benchmark-acceptance && \
npm run test:benchmark-cases && \
npm run test:benchmark-contract && \
npm run test:run-telemetry-integration && \
npm run test:llm-call-telemetry && \
npm run test:run-telemetry-store && \
npm run test:run-lifecycle-recorder && \
npm run test:run-telemetry-contract && \
npm run test:run-lifecycle-characterization && \
npm run test:harch004-acceptance && \
npm run test:architecture-public-boundaries && \
npm run test:architecture-dependencies && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Commit

After acceptance:

```bash
git commit -m "test(intake): characterize current task entry"
```

### Exit condition

Step 1 is complete when the current executable entry and one-run orchestration
are deterministically characterized and the full regression gate passes.

Only then may Step 2 define `NormalizedHarnessTask` from this evidence.

## H0-002A Step 1 Validation Record

**Status:** ✅ Accepted

The targeted H0-002A characterization gate and the complete alpha.6 regression
gate passed in the development environment.

Accepted evidence:

```text
current executable entry
  → TARGET_REPOSITORY
  → hard-coded task
  → LLM telemetry collector
  → run lifecycle recorder
  → buildDevGraph(...)
  → graph.invoke(initial DevState)
  → terminal telemetry projection
  → telemetry completion
  → JSON telemetry persistence
```

The characterization confirms:

- `src/index.ts` currently owns the concrete repository-path input;
- the executable task text is still hard-coded in `src/index.ts`;
- `MAX_PLANNING_ATTEMPTS` remains an executable/runtime input with default `4`;
- graph initial-state defaults are created by the executable entry;
- the LLM telemetry collector and run lifecycle are created before graph
  execution;
- terminal telemetry is projected only after graph completion;
- telemetry is persisted after lifecycle completion;
- `StartRunTelemetryInput` still uses `task + repositoryPath`;
- benchmark repository identity remains `repository.id + repository.revision`;
- runtime `repositoryPath` and normalized repository identity are distinct
  concepts;
- `NormalizedHarnessTask` does not exist yet;
- `runHarness(...)` does not exist yet;
- no production behavior changed in Step 1;
- the characterization test consumes no real provider usage and writes no run
  telemetry.

### Step 2 evidence constraints

`NormalizedHarnessTask` must be designed from these facts rather than by moving
the current `repositoryPath` shape wholesale into the task domain.

In particular:

```text
task identity
  ≠ execution workspace

repository.id / revision?
  ≠ repositoryPath
```

Step 2 should define the normalized task contract only.

It must not yet extract `runHarness(...)`, move telemetry lifecycle ownership,
or resolve repository identity into a workspace.

**Decision:** proceed to H0-002A Step 2 — Define Normalized Harness Task
Contract.

## H0-002A Step 2 — Define Normalized Harness Task Contract

**Status:** ✅ Accepted

### Objective

Define the smallest integration-neutral task contract justified by Step 1
evidence.

This step defines data only.

It does not normalize raw input, execute the Harness, resolve repositories, or
move runtime behavior out of `src/index.ts`.

### Evidence carried from Step 1

Current runtime execution uses:

```text
task
repositoryPath
MAX_PLANNING_ATTEMPTS
```

Current benchmark definitions use machine-independent repository identity:

```text
repository.id
repository.revision
```

Step 1 established that:

```text
repository identity
  ≠
concrete execution workspace
```

The normalized task contract must preserve that distinction.

### New module

Create:

```text
src/intake/contracts.ts
```

with:

```text
HARNESS_TASK_SCHEMA_VERSION
HarnessTaskSource
HarnessRepositoryRef
NormalizedHarnessTask
defineNormalizedHarnessTask(...)
```

### Contract

Accepted Step 2 direction:

```ts
type NormalizedHarnessTask = Readonly<{
  schemaVersion: 1;
  id: string;
  source: HarnessTaskSource;
  repository: {
    id: string;
    revision?: string;
  };
  request: string;
  constraints: readonly string[];
  acceptanceCriteria: readonly string[];
  metadata: Readonly<Record<string, unknown>>;
}>;
```

### Source vocabulary

Initial sources:

```text
manual
cli
benchmark
self-improvement
```

This vocabulary is intentionally small.

Future adapters may extend it only when concrete integration work requires it.

Step 2 does not add:

```text
api
github
qflow
webhook
```

because those adapters do not exist yet.

### Repository identity

`NormalizedHarnessTask.repository` contains identity only:

```text
id
revision?
```

It does not contain:

```text
repositoryPath
workspacePath
checkoutPath
worktreePath
```

Those belong to future execution/workspace resolution.

### Request

The human/business task is represented as:

```text
request: string
```

The contract does not introduce separate planner-specific fields.

Semantic decomposition belongs to later planning stages.

### Constraints and acceptance criteria

Both are explicit arrays:

```text
constraints
acceptanceCriteria
```

They are required in the normalized shape even when empty.

Reason:

The normalizer in Step 3 should produce one predictable application contract
without optional-array branching throughout the Harness.

### Metadata

`metadata` is retained as an integration-neutral record:

```text
Readonly<Record<string, unknown>>
```

It may preserve source correlation data such as an external issue ID or
benchmark ID.

Core planning must not depend on metadata keys that belong to specific external
systems.

### Deliberately excluded fields

Do not add:

```text
repositoryPath
workspacePath
provider
model
maxTokens
providerHints
MAX_PLANNING_ATTEMPTS
graph node configuration
telemetry path
benchmark expectedOutcome
validation commands
GitHub/Q-Flow-specific fields
```

These belong to different boundaries.

### Relationship to BenchmarkTask

Step 2 does not replace or modify `BenchmarkTask`.

Later H0-003 may adapt:

```text
BenchmarkTask
      ↓
NormalizedHarnessTask
```

but benchmark-specific fields such as:

```text
validationCommands
expectedOutcome
```

remain benchmark-runner concerns and do not belong in the general Harness task.

### Type helper

`defineNormalizedHarnessTask(...)` is an identity/type-boundary helper only.

It performs no runtime validation.

Deterministic runtime normalization and validation belong to Step 3.

### Files

Create:

```text
src/intake/contracts.ts
src/test-h0-002a-task-contract.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/index.ts
src/state.ts
src/graph.ts
src/graph/*
src/providers/*
src/telemetry/*
src/benchmarks/*
```

### Non-goals

Do not yet:

- normalize raw task input;
- validate blank strings at runtime;
- create `runHarness(...)`;
- move telemetry lifecycle ownership;
- change CLI behavior;
- externalize the current hard-coded task;
- resolve repository identity to a path/worktree;
- merge `BenchmarkTask` and `NormalizedHarnessTask`;
- add API/GitHub/Q-Flow adapters;
- add provider/runtime configuration to the task domain.

### Acceptance criteria

- [x] versioned normalized task contract exists.
- [x] task ID is explicit.
- [x] task source is explicit.
- [x] initial source vocabulary is limited to current planned origins.
- [x] repository identity is machine-independent.
- [x] repository revision is optional for general tasks.
- [x] concrete workspace path is absent from the normalized task.
- [x] human/business request is explicit.
- [x] constraints are explicit.
- [x] acceptance criteria are explicit.
- [x] metadata is integration-neutral.
- [x] provider/model/runtime policy is absent from the contract.
- [x] benchmark-specific execution fields are absent.
- [x] type helper performs no runtime work.
- [x] no production runtime behavior changes.
- [x] no new runtime dependency is added.
- [x] Step 1 characterization remains green.
- [x] H0-002 benchmark regression remains green.
- [x] H0-001/H-ARCH regression remains green.

### Targeted gate

```bash
npm run typecheck && \
npm run test:h0-002a-task-contract && \
npm run test:h0-002a-task-entry-characterization && \
npm run test:h0-002-acceptance && \
npm run test:benchmark-suite-validation && \
npm run test:benchmark-acceptance && \
npm run test:benchmark-cases && \
npm run test:benchmark-contract
```

### Full Step 2 gate

```bash
npm run typecheck && \
npm run test:h0-002a-task-contract && \
npm run test:h0-002a-task-entry-characterization && \
npm run test:h0-002-acceptance && \
npm run test:benchmark-suite-validation && \
npm run test:benchmark-acceptance && \
npm run test:benchmark-cases && \
npm run test:benchmark-contract && \
npm run test:run-telemetry-integration && \
npm run test:llm-call-telemetry && \
npm run test:run-telemetry-store && \
npm run test:run-lifecycle-recorder && \
npm run test:run-telemetry-contract && \
npm run test:run-lifecycle-characterization && \
npm run test:harch004-acceptance && \
npm run test:architecture-public-boundaries && \
npm run test:architecture-dependencies && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Commit

After acceptance:

```bash
git commit -m "feat(intake): define normalized harness task"
```

### Exit condition

Step 2 is complete when the normalized task contract is explicit, integration-
neutral, machine-independent, and protected by deterministic tests.

Only then may Step 3 define runtime normalization/validation.

## H0-002A Step 2 Validation Record

**Status:** ✅ Accepted

The targeted H0-002A Step 2 gate and the complete alpha.6 regression gate
passed in the development environment.

Accepted normalized task contract:

```text
schemaVersion
id
source
repository:
  id
  revision?
request
constraints[]
acceptanceCriteria[]
metadata
```

Accepted source vocabulary:

```text
manual
cli
benchmark
self-improvement
```

Accepted boundary decisions:

- repository identity remains machine-independent;
- `repositoryPath` / workspace paths are not part of `NormalizedHarnessTask`;
- repository revision is optional for general Harness tasks;
- request text is preserved as one integration-neutral field;
- constraints and acceptance criteria are explicit arrays in the normalized
  shape;
- metadata is an opaque integration-neutral record;
- provider/model/provider-hint/runtime controls are not part of the task;
- benchmark-specific `validationCommands` and `expectedOutcome` remain outside
  the general Harness task;
- `defineNormalizedHarnessTask(...)` is an identity/type helper only;
- runtime validation/normalization remains deferred to Step 3;
- `runHarness(...)` remains deferred to Step 4;
- no production runtime behavior changed;
- no new runtime dependency was added.

### Step 3 evidence constraints

Step 3 should introduce a raw/intake input boundary and deterministic
normalization into the accepted `NormalizedHarnessTask` shape.

Normalization may:

```text
trim required strings
validate source
normalize optional arrays/metadata
reject blank list entries
reject malformed repository identity
```

Normalization must not:

```text
call an LLM
resolve repository identity to a workspace
invent acceptance criteria
select providers/models
execute the Harness
```

**Decision:** proceed to H0-002A Step 3 — Define Deterministic Task Normalizer.

## H0-002A Step 3 — Define Deterministic Task Normalizer

**Status:** ✅ Accepted

### Objective

Introduce the deterministic runtime boundary that converts raw task-intake data
into the accepted `NormalizedHarnessTask` contract.

This step validates and normalizes input only.

It does not execute the Harness, resolve repositories, or move runtime
orchestration out of `src/index.ts`.

### New module

Create:

```text
src/intake/normalize.ts
```

with:

```text
RawHarnessTaskInput
HarnessTaskNormalizationIssueCode
HarnessTaskNormalizationIssue
HarnessTaskNormalizationError
normalizeHarnessTask(...)
```

### Raw input boundary

`RawHarnessTaskInput` mirrors the externally supplied task concepts without
pretending they are already normalized:

```text
id
source: string
repository:
  id
  revision?
request
constraints?
acceptanceCriteria?
metadata?
```

The raw source remains `string`.

The normalizer owns conversion into the closed Step 2 source vocabulary.

### Deterministic normalization rules

Normalize:

```text
task ID → trim
source → trim + validate
repository.id → trim
repository.revision → trim when present
request → trim
constraints → optional → [] + trim each entry
acceptanceCriteria → optional → [] + trim each entry
metadata → optional → {}
```

Reject:

```text
blank task ID
unsupported/blank source
blank repository ID
absolute repository ID
blank repository revision when explicitly supplied
blank request
blank constraint entry
blank acceptance-criterion entry
```

### Repository-path rule

Repository identity remains machine-independent.

The normalizer rejects obvious absolute path forms:

```text
POSIX absolute
Windows drive absolute
UNC absolute
```

It does not resolve repository IDs or inspect the filesystem.

### Error model

Normalization errors are deterministic application-input errors.

Introduce:

```text
HarnessTaskNormalizationError
```

with stable issue codes.

The normalizer reports all detected issues rather than failing at the first
problem.

Stable Step 3 issue codes:

```text
blank_id
unsupported_source
blank_repository_id
absolute_repository_id
blank_repository_revision
blank_request
blank_constraint
blank_acceptance_criterion
```

### Deliberate non-validation

Step 3 does not reject:

```text
empty constraints array
empty acceptanceCriteria array
unknown metadata keys
missing repository revision
```

These are valid for a general Harness task.

Step 3 also does not interpret task semantics.

### Metadata behavior

Metadata remains opaque.

If supplied, the same metadata record is retained rather than cloned or
interpreted.

Core execution must not branch on external metadata keys.

### No LLM rule

`normalizeHarnessTask(...)` is entirely deterministic.

It must never:

```text
rewrite the task with an LLM
infer missing acceptance criteria
infer repository identity
classify complexity
select models
```

Those concerns belong elsewhere.

### Files

Create:

```text
src/intake/normalize.ts
src/test-h0-002a-task-normalizer.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/index.ts
src/intake/contracts.ts
src/state.ts
src/graph.ts
src/graph/*
src/providers/*
src/telemetry/*
src/benchmarks/*
```

### Non-goals

Do not yet:

- create `runHarness(...)`;
- change the executable entry;
- parse real CLI flags;
- externalize the hard-coded current task;
- resolve `repository.id` to a workspace;
- validate Git revisions;
- inspect filesystem/Git state;
- deduplicate constraints or acceptance criteria;
- add HTTP/GitHub/Q-Flow adapters;
- introduce LLM-based task enrichment;
- merge benchmark validation with intake normalization.

### Acceptance criteria

- [x] raw task-intake type exists.
- [x] normalization returns `NormalizedHarnessTask`.
- [x] schema version is assigned by the normalizer.
- [x] task ID is trimmed and blank IDs are rejected.
- [x] source is trimmed and validated against the accepted vocabulary.
- [x] repository ID is trimmed.
- [x] blank repository IDs are rejected.
- [x] obvious absolute repository paths are rejected.
- [x] repository revision is trimmed when supplied.
- [x] explicitly blank repository revision is rejected.
- [x] request is trimmed and blank requests are rejected.
- [x] missing constraints normalize to `[]`.
- [x] missing acceptance criteria normalize to `[]`.
- [x] blank constraint entries are rejected.
- [x] blank acceptance-criterion entries are rejected.
- [x] missing metadata normalizes to `{}`.
- [x] supplied metadata remains opaque.
- [x] all detected normalization issues are returned together.
- [x] normalization performs no filesystem/Git access.
- [x] normalization performs no LLM/provider call.
- [x] `runHarness(...)` is still not introduced.
- [x] no production runtime behavior changes.
- [x] no new runtime dependency is added.
- [x] Step 1/2 intake tests remain green.
- [x] H0-002 benchmark regression remains green.
- [x] H0-001/H-ARCH regression remains green.

### Targeted gate

```bash
npm run typecheck && \
npm run test:h0-002a-task-normalizer && \
npm run test:h0-002a-task-contract && \
npm run test:h0-002a-task-entry-characterization && \
npm run test:h0-002-acceptance && \
npm run test:benchmark-suite-validation && \
npm run test:benchmark-acceptance && \
npm run test:benchmark-cases && \
npm run test:benchmark-contract
```

### Full Step 3 gate

```bash
npm run typecheck && \
npm run test:h0-002a-task-normalizer && \
npm run test:h0-002a-task-contract && \
npm run test:h0-002a-task-entry-characterization && \
npm run test:h0-002-acceptance && \
npm run test:benchmark-suite-validation && \
npm run test:benchmark-acceptance && \
npm run test:benchmark-cases && \
npm run test:benchmark-contract && \
npm run test:run-telemetry-integration && \
npm run test:llm-call-telemetry && \
npm run test:run-telemetry-store && \
npm run test:run-lifecycle-recorder && \
npm run test:run-telemetry-contract && \
npm run test:run-lifecycle-characterization && \
npm run test:harch004-acceptance && \
npm run test:architecture-public-boundaries && \
npm run test:architecture-dependencies && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Commit

After acceptance:

```bash
git commit -m "feat(intake): normalize harness task input"
```

### Exit condition

Step 3 is complete when raw task input is converted into the accepted normalized
contract through deterministic validation only.

Only then may Step 4 extract `runHarness(task)`.

## H0-002A Step 3 Validation Record

**Status:** ✅ Accepted

The Step 3 targeted gate and complete alpha.6 regression gate passed in the
development environment.

One TypeScript-only correction was required during validation:

```text
src/intake/normalize.ts
```

The first typecheck correctly reported that `source: string` had not been
narrowed to `HarnessTaskSource` at the final return boundary even though invalid
sources already populate the deterministic issue list.

The repair added a post-validation invariant guard so TypeScript can prove the
accepted source type after `HarnessTaskNormalizationError` handling.

This correction:

- does not change accepted source semantics;
- does not bypass accumulated normalization issues;
- does not add a second user-visible validation path for malformed source input;
- changes no filesystem/Git/provider/runtime behavior.

Accepted normalizer behavior:

```text
raw input
  ↓
trim deterministic string fields
  ↓
validate source vocabulary
  ↓
validate machine-independent repository identity
  ↓
normalize optional arrays / metadata
  ↓
collect all deterministic issues
  ↓
NormalizedHarnessTask
```

Accepted normalization guarantees:

- blank task IDs are rejected;
- unsupported/blank sources are rejected;
- blank repository IDs are rejected;
- obvious POSIX/Windows/UNC absolute repository paths are rejected;
- explicitly blank revisions are rejected;
- blank task requests are rejected;
- missing constraints normalize to `[]`;
- missing acceptance criteria normalize to `[]`;
- blank constraint entries are rejected;
- blank acceptance-criterion entries are rejected;
- missing metadata normalizes to `{}`;
- supplied metadata remains opaque;
- all detected issues are reported together;
- no filesystem or Git lookup occurs;
- no LLM/provider call occurs;
- no workspace resolution occurs;
- no task semantics are invented;
- `runHarness(...)` is still absent;
- no production execution behavior changed;
- no new runtime dependency was added.

### Step 4 evidence constraints

Step 4 may now extract the one-run application execution boundary because the
task data consumed by that boundary has a stable normalized contract.

The extraction must preserve the current executable semantics characterized in
Step 1:

```text
LLM telemetry collector
run lifecycle start
graph construction
initial DevState
graph invocation
terminal telemetry projection
run completion
JSON telemetry persistence
```

Step 4 must not yet make CLI/manual intake use the new normalizer. That adapter
migration remains Step 5.

**Decision:** proceed to H0-002A Step 4 — Extract Application `runHarness(task)`.

## H0-002A Architecture Refinement Before Step 4

**Status:** ✅ Accepted design adjustment

Step 1-3 evidence exposed a boundary mismatch in the earlier informal
`runHarness(task)` wording.

The normalized task contract correctly excludes machine-local paths:

```text
NormalizedHarnessTask.repository
  → id
  → revision?
```

while current execution requires:

```text
repositoryPath
```

Putting `repositoryPath` back into `NormalizedHarnessTask` would undo the
machine-independent identity decision accepted in Step 2.

### Accepted refinement

Step 4 will therefore extract an application execution boundary shaped around
two separate inputs:

```text
NormalizedHarnessTask
  → what to do / repository identity

ResolvedWorkspace
  → where this run executes locally
```

with optional execution policy kept separate from both.

Target direction:

```ts
runHarness({
  task,
  workspace,
  execution?,
}, dependencies?)
```

### Step 4 migration rule

Step 4 creates and tests the new application boundary but does not yet migrate
`src/index.ts`.

This temporary duplication is intentional and limited to one step.

Reason:

The current executable only knows:

```text
TARGET_REPOSITORY
```

which is a concrete path.

It does not yet have a correct machine-independent repository identity for
constructing `NormalizedHarnessTask`.

Inventing an identity such as:

```text
local
basename(repositoryPath)
repositoryPath copied into repository.id
```

would create a false domain model merely to complete the extraction in one
commit.

### Step 5 responsibility

Step 5 will own the executable/manual adapter migration:

```text
raw executable input
  ↓
repository identity acquisition
  ↓
normalizeHarnessTask(...)
  ↓
resolved local workspace
  ↓
runHarness(...)
```

and only then remove the old one-run orchestration from `src/index.ts`.

### Testing rule

Step 4 should use dependency injection so application execution can be tested
deterministically without:

```text
real LLM/provider calls
real benchmark execution
real `.runs` persistence
```

Production defaults must still compose the existing real graph, telemetry
collector, lifecycle recorder, and telemetry store.

### Non-goals added by this refinement

Step 4 must not:

- invent repository identity from a local path;
- migrate the CLI/manual adapter early;
- resolve repository identity into a worktree;
- make `NormalizedHarnessTask` contain `repositoryPath`;
- introduce benchmark-only execution behavior;
- introduce a second permanent graph entry path.

**Decision:** proceed with Step 4 only after this architecture refinement is
committed to the engineering plan.

## H0-002A Step 4 — Extract Application Execution Boundary

**Status:** ✅ Accepted

### Objective

Create the reusable one-run application execution boundary agreed in the
pre-Step-4 architecture refinement.

This step extracts the execution composition into a new application module while
leaving `src/index.ts` unchanged until the CLI/manual adapter migration in
Step 5.

### New application module

Create:

```text
src/app/run-harness.ts
```

with the public application concepts:

```text
ResolvedWorkspace
HarnessExecutionOptions
RunHarnessRequest
HarnessRunResult
RunHarnessDependencies
runHarness(...)
```

### Accepted request boundary

```text
RunHarnessRequest
  task
    → NormalizedHarnessTask

  workspace
    → repositoryPath

  execution?
    → maxPlanningAttempts?
```

This preserves the accepted distinction:

```text
task.repository
  → machine-independent identity

workspace.repositoryPath
  → concrete local execution path
```

The application boundary must not derive one from the other.

### Execution ownership

`runHarness(...)` owns one run of:

```text
create LLM telemetry collector
create run lifecycle recorder
start telemetry lifecycle
create telemetry store
construct/invoke graph
construct initial DevState
project terminal telemetry
complete telemetry lifecycle
persist telemetry
return state + telemetry + persisted telemetry reference
```

### Initial DevState compatibility

Step 4 preserves the current executable defaults:

```text
fileContents = {}
fileSummaries = {}
recentlyReadFiles = []
filesChanged = []

attempts = 0
maxAttempts = 3

planningAttempts = 0
reviewAttempts = 0
maxPlanningAttempts = execution.maxPlanningAttempts ?? 4

failureReason = undefined
status = pending
```

Task text supplied to both `DevState.task` and telemetry remains:

```text
NormalizedHarnessTask.request
```

Concrete runtime path supplied to both `DevState.repositoryPath` and telemetry
remains:

```text
ResolvedWorkspace.repositoryPath
```

### Dependency injection

Step 4 introduces narrow dependency injection for deterministic application
tests.

Production defaults remain the existing real implementations:

```text
buildDevGraph
createLlmCallTelemetryCollector
createRunLifecycleRecorder
createJsonRunTelemetryStore
```

Tests may replace:

```text
collector factory
recorder factory
telemetry-store factory
graph invocation
```

This allows lifecycle/order/state verification without:

```text
real LLM/provider calls
real `.runs` writes
real repository inspection
```

Dependency injection is an application testability mechanism only.

It must not add provider/model/runtime-policy fields to
`NormalizedHarnessTask`.

### Application result

Return:

```text
state
telemetry
persistedTelemetry
```

The application layer does not print output.

Console/CLI presentation remains an adapter concern.

### Temporary duplication rule

`src/index.ts` remains unchanged in Step 4.

Therefore, for this one step only, the repository contains:

```text
existing executable one-run composition
+
new reusable application one-run composition
```

This duplication is intentional and temporary.

Step 5 must migrate the executable to the application boundary and remove the
old composition from `src/index.ts`.

### Files

Create:

```text
src/app/run-harness.ts
src/test-h0-002a-run-harness.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/index.ts
src/intake/contracts.ts
src/intake/normalize.ts
src/state.ts
src/graph.ts
src/graph/*
src/providers/*
src/telemetry/*
src/benchmarks/*
```

### Non-goals

Do not yet:

- migrate `src/index.ts`;
- parse CLI/manual task input;
- derive repository identity from `repositoryPath`;
- resolve repository identity into a workspace;
- clone/checkout repositories;
- add benchmark-runner execution;
- change telemetry contracts;
- add task ID/source/metadata to telemetry;
- change provider/runtime composition;
- add HTTP/GitHub/Q-Flow adapters;
- change graph behavior.

### Acceptance criteria

- [x] reusable `runHarness(...)` application boundary exists.
- [x] application request receives `NormalizedHarnessTask`.
- [x] application request receives an explicit `ResolvedWorkspace`.
- [x] repositoryPath remains outside normalized task identity.
- [x] optional execution policy carries `maxPlanningAttempts`.
- [x] default planning-attempt budget remains `4`.
- [x] task request is forwarded unchanged to graph state.
- [x] task request is forwarded unchanged to telemetry start.
- [x] workspace repositoryPath is forwarded unchanged to graph state.
- [x] workspace repositoryPath is forwarded unchanged to telemetry start.
- [x] current initial DevState defaults are preserved.
- [x] LLM telemetry collector is created before graph invocation.
- [x] run lifecycle starts before graph invocation.
- [x] telemetry store is created before graph invocation.
- [x] graph invocation receives the run-scoped LLM telemetry sink.
- [x] terminal telemetry is projected from graph result + collector snapshot.
- [x] telemetry lifecycle completes after graph invocation.
- [x] telemetry is persisted after lifecycle completion.
- [x] application result returns graph state.
- [x] application result returns completed telemetry.
- [x] application result returns persisted telemetry reference.
- [x] deterministic dependency injection prevents real provider use in tests.
- [x] deterministic dependency injection prevents `.runs` writes in tests.
- [x] `src/index.ts` remains unchanged.
- [x] no repository identity is invented from local path.
- [x] no new runtime dependency is added.
- [x] Step 1-3 intake regression remains green.
- [x] H0-002 benchmark regression remains green.
- [x] H0-001/H-ARCH regression remains green.

### Targeted gate

```bash
npm run typecheck && \
npm run test:h0-002a-run-harness && \
npm run test:h0-002a-task-normalizer && \
npm run test:h0-002a-task-contract && \
npm run test:h0-002a-task-entry-characterization && \
npm run test:h0-002-acceptance && \
npm run test:benchmark-suite-validation && \
npm run test:benchmark-acceptance && \
npm run test:benchmark-cases && \
npm run test:benchmark-contract
```

### Full Step 4 gate

```bash
npm run typecheck && \
npm run test:h0-002a-run-harness && \
npm run test:h0-002a-task-normalizer && \
npm run test:h0-002a-task-contract && \
npm run test:h0-002a-task-entry-characterization && \
npm run test:h0-002-acceptance && \
npm run test:benchmark-suite-validation && \
npm run test:benchmark-acceptance && \
npm run test:benchmark-cases && \
npm run test:benchmark-contract && \
npm run test:run-telemetry-integration && \
npm run test:llm-call-telemetry && \
npm run test:run-telemetry-store && \
npm run test:run-lifecycle-recorder && \
npm run test:run-telemetry-contract && \
npm run test:run-lifecycle-characterization && \
npm run test:harch004-acceptance && \
npm run test:architecture-public-boundaries && \
npm run test:architecture-dependencies && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Commit

After acceptance:

```bash
git commit -m "feat(app): extract harness run boundary"
```

### Exit condition

Step 4 is complete when one normalized task can execute against one explicit
resolved workspace through a reusable, deterministic-testable application
boundary while the current executable remains behaviorally untouched.

Only then may Step 5 migrate CLI/manual intake and remove the old orchestration
from `src/index.ts`.

## H0-002A Step 4 Validation Record

**Status:** ✅ Accepted

The targeted Step 4 gate and the complete alpha.6 regression gate passed in the
development environment.

Three implementation corrections were required during validation and are part
of the accepted Step 4 result.

### Correction 1 — graph input type

The first implementation incorrectly typed the injected graph input as the
fully materialized `DevStateType`.

The current graph accepts a narrower initial input and materializes additional
schema fields later.

The accepted application boundary now uses an explicit `HarnessGraphInput`
derived from the subset of `DevStateType` fields that `runHarness(...)`
actually owns.

This avoids unsafe casts and avoids coupling the application API to LangGraph's
internal `CommandInstance` union.

### Correction 2 — deterministic test result shape

Deterministic graph doubles return the fully materialized `DevStateType`
expected by telemetry completion.

Optional graph-state fields are explicitly represented as `undefined` in the
test doubles.

No production graph behavior changed.

### Correction 3 — lazy production graph import

Importing the real graph eagerly also imported provider modules and required a
real `NVIDIA_API_KEY` even when tests injected a deterministic `invokeGraph`
double.

The accepted implementation loads the real graph lazily only when the default
production graph path is actually used.

Therefore:

```text
injected deterministic graph
  → no real graph import
  → no provider initialization
  → no provider API key required

default production path
  → import real graph
  → existing provider/runtime composition
```

This is required for the Step 4 dependency-injection boundary to be genuinely
provider-free in deterministic tests.

### Accepted application execution flow

```text
RunHarnessRequest
  task: NormalizedHarnessTask
  workspace: ResolvedWorkspace
  execution?: HarnessExecutionOptions
        ↓
create run-scoped LLM telemetry collector
        ↓
create/start run lifecycle recorder
        ↓
create telemetry store
        ↓
invoke graph with Harness-owned initial state
        ↓
terminal DevStateType
        ↓
build terminal telemetry completion
        ↓
complete lifecycle
        ↓
persist telemetry
        ↓
HarnessRunResult
```

Accepted guarantees:

- normalized task identity remains separate from concrete workspace path;
- `repositoryPath` is supplied only through `ResolvedWorkspace`;
- task request is forwarded unchanged to graph state and telemetry;
- workspace path is forwarded unchanged to graph state and telemetry;
- current initial-state defaults are preserved;
- default `maxPlanningAttempts` remains `4`;
- execution may override `maxPlanningAttempts`;
- telemetry collector is run-scoped;
- lifecycle start occurs before graph invocation;
- telemetry completion occurs after graph invocation;
- persistence occurs after lifecycle completion;
- application result returns terminal state, telemetry, and persistence
  reference;
- deterministic tests use no real provider;
- deterministic tests require no provider API key;
- deterministic tests write no `.runs` files;
- `src/index.ts` remains unchanged in Step 4;
- no repository identity is invented from a local path;
- no new runtime dependency was added.

### Step 5 evidence constraints

Step 5 must now migrate the executable/manual entry onto the accepted
application boundary.

It must solve repository identity acquisition explicitly rather than deriving a
false identity from `TARGET_REPOSITORY`.

Required direction:

```text
raw executable/manual input
  ↓
repository identity acquisition
  ↓
normalizeHarnessTask(...)
  ↓
ResolvedWorkspace
  ↓
runHarness(...)
```

After Step 5, the old collector/recorder/graph/store orchestration must no
longer remain duplicated in `src/index.ts`.

**Decision:** proceed to H0-002A Step 5 — Introduce CLI / Manual Intake Adapter.

## H0-002A Step 5 — Introduce CLI / Manual Intake Adapter

**Status:** ✅ Accepted

### Objective

Migrate the current executable entry onto the normalized task-intake and
application execution boundaries established in Steps 2-4.

After this step, `src/index.ts` is only an adapter/presentation entry point.

The old one-run graph/telemetry composition must no longer remain duplicated
there.

### Explicit environment boundary

The manual executable now requires two distinct repository concepts:

```text
TARGET_REPOSITORY
  → concrete local execution path

TARGET_REPOSITORY_ID
  → machine-independent repository identity
```

Optional:

```text
TARGET_REPOSITORY_REVISION
  → requested/known repository revision

MAX_PLANNING_ATTEMPTS
  → execution-policy override
```

Example:

```text
TARGET_REPOSITORY=/Users/example/Projects/qflow
TARGET_REPOSITORY_ID=qflow
TARGET_REPOSITORY_REVISION=main
```

The adapter must never derive `TARGET_REPOSITORY_ID` from
`TARGET_REPOSITORY`.

### Why repository ID is now required

Before H0-002A, the executable only knew a local path.

Steps 2-4 established that:

```text
repository identity
  ≠
resolved execution workspace
```

Inventing identity from:

```text
basename(repositoryPath)
"local"
repositoryPath itself
```

would break that boundary.

The manual producer must therefore provide repository identity explicitly.

### New manual intake adapter

Create:

```text
src/intake/manual.ts
```

with:

```text
ManualHarnessIntakeInput
createManualHarnessRunRequest(...)
```

The adapter owns:

```text
read raw manual environment values
validate required workspace path
validate required repository identity presence
build raw task input
normalizeHarnessTask(...)
build ResolvedWorkspace
map optional MAX_PLANNING_ATTEMPTS to execution policy
return RunHarnessRequest
```

It does not:

```text
execute the Harness
import graph/provider code
persist telemetry
derive repository identity
inspect Git
resolve revisions
```

### Current task migration

The existing Q-Flow workflow-canvas request remains hard-coded in `src/index.ts`
for this step.

This preserves behavior while moving execution architecture.

Use the stable manual task ID:

```text
qflow-workflow-canvas-analysis
```

Externalizing arbitrary task text/ID is outside this step.

### Executable flow after migration

Target:

```text
hard-coded current request
        ↓
createManualHarnessRunRequest({
  env: process.env,
  taskId,
  request,
})
        ↓
NormalizedHarnessTask
+
ResolvedWorkspace
+
optional execution policy
        ↓
runHarness(...)
        ↓
console telemetry path
console final state
```

### Old orchestration removed from `src/index.ts`

After migration, `src/index.ts` must no longer own/import:

```text
buildDevGraph
buildRunTelemetryCompletion
createLlmCallTelemetryCollector
createRunLifecycleRecorder
createJsonRunTelemetryStore
graph.invoke(...)
activeRun.complete(...)
telemetryStore.save(...)
```

Those responsibilities belong to `runHarness(...)`.

### MAX_PLANNING_ATTEMPTS compatibility

When `MAX_PLANNING_ATTEMPTS` is present:

```text
Number(value)
  → RunHarnessRequest.execution.maxPlanningAttempts
```

When absent:

```text
execution omitted
  → runHarness default remains 4
```

This preserves the existing effective default.

### Characterization migration

The Step 1 source-characterization test must be updated because its old
assertions intentionally described pre-H0-002A ownership.

The updated characterization now proves:

```text
index delegates intake
index delegates execution
index retains current task/presentation only
manual adapter separates identity from workspace
old one-run composition is absent from index
telemetry contracts remain unchanged
benchmark repository identity remains unchanged
```

This is an intentional migration of the characterized boundary, not silent test
weakening.

### Files

Create:

```text
src/intake/manual.ts
src/test-h0-002a-manual-intake.ts
```

Modify:

```text
src/index.ts
src/test-h0-002a-task-entry-characterization.ts
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/app/run-harness.ts
src/intake/contracts.ts
src/intake/normalize.ts
src/state.ts
src/graph.ts
src/graph/*
src/providers/*
src/telemetry/*
src/benchmarks/*
```

### Non-goals

Do not yet:

- accept arbitrary task text from CLI arguments;
- add a CLI parser dependency;
- add HTTP/API submission;
- add GitHub/Q-Flow adapters;
- generate task IDs dynamically;
- infer repository identity from a local path;
- resolve Git revisions/worktrees;
- implement benchmark runner behavior;
- change telemetry schema;
- change graph/provider behavior.

### Acceptance criteria

- [x] manual intake adapter exists.
- [x] `TARGET_REPOSITORY` remains the explicit concrete workspace path.
- [x] `TARGET_REPOSITORY_ID` is required as explicit repository identity.
- [x] `TARGET_REPOSITORY_REVISION` is optional.
- [x] repository ID is never derived from repository path.
- [x] raw manual task passes through `normalizeHarnessTask(...)`.
- [x] normalized task source is `manual`.
- [x] current task text remains behaviorally unchanged.
- [x] stable current manual task ID is explicit.
- [x] `MAX_PLANNING_ATTEMPTS` maps into execution policy when provided.
- [x] absent `MAX_PLANNING_ATTEMPTS` defers to `runHarness` default.
- [x] `src/index.ts` invokes `runHarness(...)`.
- [x] `src/index.ts` prints persisted telemetry path from `HarnessRunResult`.
- [x] `src/index.ts` prints final graph state from `HarnessRunResult`.
- [x] `src/index.ts` no longer imports graph orchestration.
- [x] `src/index.ts` no longer imports telemetry orchestration.
- [x] old one-run execution composition is removed from `src/index.ts`.
- [x] updated characterization explicitly protects the migrated boundary.
- [x] manual adapter tests use no real provider.
- [x] manual adapter tests write no `.runs` files.
- [x] no new runtime dependency is added.
- [x] Step 2-4 intake/application regression remains green.
- [x] H0-002 benchmark regression remains green.
- [x] H0-001/H-ARCH regression remains green.

### Targeted gate

```bash
npm run typecheck && \
npm run test:h0-002a-manual-intake && \
npm run test:h0-002a-run-harness && \
npm run test:h0-002a-task-normalizer && \
npm run test:h0-002a-task-contract && \
npm run test:h0-002a-task-entry-characterization && \
npm run test:h0-002-acceptance && \
npm run test:benchmark-suite-validation && \
npm run test:benchmark-acceptance && \
npm run test:benchmark-cases && \
npm run test:benchmark-contract
```

### Full Step 5 gate

```bash
npm run typecheck && \
npm run test:h0-002a-manual-intake && \
npm run test:h0-002a-run-harness && \
npm run test:h0-002a-task-normalizer && \
npm run test:h0-002a-task-contract && \
npm run test:h0-002a-task-entry-characterization && \
npm run test:h0-002-acceptance && \
npm run test:benchmark-suite-validation && \
npm run test:benchmark-acceptance && \
npm run test:benchmark-cases && \
npm run test:benchmark-contract && \
npm run test:run-telemetry-integration && \
npm run test:llm-call-telemetry && \
npm run test:run-telemetry-store && \
npm run test:run-lifecycle-recorder && \
npm run test:run-telemetry-contract && \
npm run test:run-lifecycle-characterization && \
npm run test:harch004-acceptance && \
npm run test:architecture-public-boundaries && \
npm run test:architecture-dependencies && \
npm run test:architecture-boundaries-characterization && \
npm run test:harch003-acceptance && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:runtime-composition && \
npm run test:provider-hints && \
npm run test:provider-capabilities && \
npm run test:execution-policy-characterization && \
npm run test:provider-architecture && \
npm run test:cross-provider && \
npm run test:claude-provider && \
npm run test:provider-composition && \
npm run test:provider-injection && \
npm run test:provider-contract && \
npm run test:provider-characterization && \
npm run test:prompt-characterization && \
npm run test:graph-characterization && \
npm run test:tools
```

### Manual smoke prerequisite

The existing `npm run dev` path now additionally requires:

```text
TARGET_REPOSITORY_ID
```

and may use:

```text
TARGET_REPOSITORY_REVISION
```

No live smoke is required for the deterministic Step 5 gate because that would
consume a real provider. A later explicit smoke may use the configured `.env`.

### Commit

After acceptance:

```bash
git commit -m "feat(intake): route manual entry through harness"
```

### Exit condition

Step 5 is complete when the executable routes its current manual request through
deterministic task normalization and the reusable application boundary, with
repository identity and concrete workspace explicitly separated.

Only then may Step 6 perform H0-002A acceptance and architecture review.

## H0-002A Step 5 Validation Record

**Status:** ✅ Accepted

The Step 5 targeted gate and complete alpha.6 regression gate passed in the
development environment.

The executable entry now routes through the accepted intake/application path:

```text
current manual request
  ↓
createManualHarnessRunRequest(...)
  ↓
normalizeHarnessTask(...)
  ↓
NormalizedHarnessTask
+
ResolvedWorkspace
+
optional execution policy
  ↓
runHarness(...)
  ↓
HarnessRunResult
  ↓
console presentation
```

Accepted environment boundary:

```text
TARGET_REPOSITORY
  → concrete local workspace path

TARGET_REPOSITORY_ID
  → machine-independent repository identity

TARGET_REPOSITORY_REVISION?
  → optional repository revision

MAX_PLANNING_ATTEMPTS?
  → optional application execution override
```

Accepted migration guarantees:

- `TARGET_REPOSITORY_ID` is required independently from `TARGET_REPOSITORY`;
- repository identity is never derived from the local path;
- optional revision passes through deterministic task normalization;
- the current Q-Flow workflow-canvas request remains behaviorally unchanged;
- the current manual task ID is explicit and stable;
- `src/index.ts` delegates intake to `createManualHarnessRunRequest(...)`;
- `src/index.ts` delegates execution to `runHarness(...)`;
- `src/index.ts` no longer constructs graph/telemetry lifecycle directly;
- `src/index.ts` no longer imports graph internals or telemetry composition;
- persisted telemetry path and terminal state remain the executable output;
- no new CLI parser/runtime dependency was added;
- no real provider is used by the manual-intake tests;
- no `.runs` file is written by deterministic intake/application tests.

### Architecture-characterization migrations accepted during validation

The Step 5 refactor intentionally changed a previously characterized public
dependency shape. Existing H0-001/H-ARCH tests correctly detected the migration
and were updated rather than bypassed.

Accepted characterization migrations:

```text
H0-001 lifecycle characterization
  before: index.ts owns graph + telemetry lifecycle
  after:  run-harness.ts owns graph + telemetry lifecycle

H-ARCH public boundary
  before: index.ts → graph.ts
  after:  index.ts → app/run-harness.ts → graph.ts

H-ARCH dependency characterization
  before: index.ts → graph.ts + telemetry/*
  after:  index.ts → app/run-harness.ts + intake/manual.ts
```

The H-ARCH-004 final acceptance meta-gate was updated to validate the new
application boundary while retaining all original constraints on:

```text
graph compatibility boundary
graph internals
provider-neutral runtime/execution/contracts
default concrete composition
cycle/dependency protection
```

These are intentional architecture updates caused by H0-002A, not weakened
guards.

### Step 6 evidence constraints

Step 6 is acceptance/review only.

It should prove the final H0-002A architecture:

```text
producer/manual entry
  ↓
Task Intake
  ↓
deterministic normalization
  ↓
NormalizedHarnessTask
  +
ResolvedWorkspace
  ↓
application run boundary
  ↓
Harness Core
```

Step 6 must not add a new intake feature, API integration, repository resolver,
benchmark runner, or provider behavior.

**Decision:** proceed to H0-002A Step 6 — Acceptance / Architecture Review.
