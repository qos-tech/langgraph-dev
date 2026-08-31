# QOS Harness — Engineering Plan

**Status:** Active
**Version:** 2.0
**Current milestone:** `H0`
**Current task:** `H0-003 — Benchmark Runner`
**Task status:** 🚧 H0-004 Step 2B implementation in progress

---

### Current Release

**Version:** `v0.1.0-alpha.7`
**Status:** Task Intake Foundation Alpha
**Milestone:** `H0-002A — Task Intake Foundation` ✅

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

`v0.1.0-alpha.7` represents the completed Task Intake Foundation of the QOS Harness. It is not yet a production-ready autonomous development system.

The release proves that external/manual work can enter through one deterministic normalized task contract, that repository identity remains machine-independent from concrete execution workspaces, and that one-run Harness execution now crosses a reusable application boundary before the Benchmark Runner is introduced.

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

# H0-003 — Benchmark Runner

## Status

**Milestone:** H0
**Current step:** Step 1 — Characterize Runner Boundary
**Release baseline:** `v0.1.0-alpha.7 — Task Intake Foundation Alpha`

## Milestone objective

Execute the fixed H0-002 benchmark suite reproducibly through the same
application boundary used by normal Harness tasks.

The Benchmark Runner must add repository/revision resolution, isolated
workspaces, validation-command execution, observation capture, and benchmark
acceptance without creating a benchmark-only graph path.

Target architecture:

```text
BenchmarkTask
    ↓
benchmark adapter
    ↓
NormalizedHarnessTask

BenchmarkTask.repository
    ↓
workspace resolver
    ↓
isolated ResolvedWorkspace

NormalizedHarnessTask + ResolvedWorkspace
    ↓
runHarness(...)
    ↓
HarnessRunResult

benchmark validation commands
    ↓
BenchmarkObservation
    ↓
evaluateBenchmarkAcceptance(...)
```

## Milestone non-goals

H0-003 must not:

- change benchmark task definitions or expected outcomes merely to make runs pass;
- change benchmark acceptance semantics;
- change planner/reviewer/refiner prompts;
- change provider/model strategy;
- implement Repository Intelligence;
- implement the Context Engine;
- add comparison/reporting UI;
- add dynamic routing;
- add a job queue;
- add self-improvement;
- let benchmark code call graph internals directly;
- put machine-local workspace paths into benchmark/task identity.

---

## H0-003 Step 1 — Characterize Runner Boundary

**Status:** ✅ Accepted

### Objective

Freeze the exact contracts and ownership boundaries H0-003 must connect before
introducing Git/worktree execution code.

This is a characterization/specification step.

No production behavior changes are allowed.

### Evidence to characterize

Step 1 must inspect the current accepted alpha.7 source for:

```text
src/benchmarks/contracts.ts
src/benchmarks/cases.ts
src/benchmarks/acceptance.ts
src/benchmarks/suite-validation.ts

src/intake/contracts.ts
src/intake/normalize.ts

src/app/run-harness.ts

src/telemetry/contracts.ts
src/telemetry/store.ts
```

and the existing benchmark/intake/application acceptance tests.

### Questions Step 1 must answer

#### 1. Benchmark → normalized task adapter

Determine the exact existing fields that map directly from `BenchmarkTask` to
`NormalizedHarnessTask`.

The adapter must preserve benchmark identity and request semantics without
moving benchmark-only execution data into the normalized domain contract.

Expected direction:

```text
BenchmarkTask.id
  → NormalizedHarnessTask.id

source
  → benchmark

BenchmarkTask.repository.id
BenchmarkTask.repository.revision
  → NormalizedHarnessTask.repository

BenchmarkTask.request/task text
  → NormalizedHarnessTask.request
```

The exact field names must come from current source evidence.

#### 2. Workspace resolution ownership

Characterize what H0-003 must resolve from:

```text
repository.id + revision
```

into:

```text
ResolvedWorkspace.repositoryPath
```

Resolution belongs to benchmark infrastructure, not task normalization and not
`runHarness(...)`.

Step 1 must explicitly reject these designs:

```text
NormalizedHarnessTask.repositoryPath
runHarness resolves Git repository identity
benchmark code calls graph directly
```

#### 3. Isolation contract

Define the minimum observable properties of a reproducible benchmark workspace.

At minimum the later resolver must be able to prove:

```text
fresh isolated working directory
requested repository/revision checked out
benchmark mutations cannot affect the source/baseline checkout
workspace can be cleaned deterministically
```

Step 1 does not implement worktrees yet.

#### 4. Validation-command ownership

Characterize where validation commands currently live in `BenchmarkTask`.

Validation execution happens after Harness execution and remains benchmark
infrastructure.

It must not become:

```text
NormalizedHarnessTask.metadata interpreted by Harness core
graph node behavior
runHarness concern
```

#### 5. Observation boundary

Characterize the data already available after a run:

```text
HarnessRunResult.state
HarnessRunResult.telemetry
HarnessRunResult.persistedTelemetry
Git/workspace diff (future H0-003 infrastructure)
validation command results (future H0-003 infrastructure)
human intervention flag / final benchmark outcome inputs
```

Determine the smallest future `BenchmarkObservation` required by the already
accepted H0-002 acceptance function.

Do not redesign acceptance rules in Step 1.

#### 6. Runner orchestration ownership

The future runner should own sequencing only:

```text
select benchmark
adapt task
resolve isolated workspace
runHarness(...)
execute benchmark validations
capture diff/observation
evaluate existing acceptance
cleanup workspace
```

It must not own planner/provider logic.

### Step 1 production rule

No production source change.

Step 1 may add only a deterministic characterization test and PLAN metadata.

Expected test:

```text
src/test-h0-003-runner-boundary-characterization.ts
```

The test should use source inspection and existing contracts only.

No Git clone/worktree command and no provider call should run in Step 1.

### Acceptance criteria

- [x] current `BenchmarkTask` identity/repository/request fields are explicitly characterized.
- [x] exact benchmark validation fields are characterized.
- [x] exact current acceptance-input/observation fields are characterized.
- [x] normalized task mapping is defined from source evidence.
- [x] benchmark source is explicitly `benchmark`.
- [x] repository identity and concrete workspace remain separate.
- [x] workspace resolution ownership is assigned to H0-003 infrastructure.
- [x] validation-command execution is outside `runHarness(...)`.
- [x] `runHarness(...)` remains the only Harness execution application boundary.
- [x] benchmark runner is forbidden from importing graph internals.
- [x] benchmark-specific validation data is forbidden from leaking into `NormalizedHarnessTask`.
- [x] isolation requirements are recorded before implementation.
- [x] no production source changes.
- [x] no provider call.
- [x] no Git mutation/worktree creation.
- [x] no new runtime dependency.
- [x] H0-002A acceptance remains green.
- [x] H0-002 benchmark acceptance remains green.
- [x] H0-001 telemetry/H-ARCH regression remains green.

### Targeted gate

After the characterization test is implemented:

```bash
npm run typecheck && \
npm run test:h0-003-runner-boundary-characterization && \
npm run test:h0-002a-acceptance && \
npm run test:h0-002-acceptance && \
npm run test:benchmark-suite-validation && \
npm run test:benchmark-acceptance && \
npm run test:benchmark-contract
```

### Commit

After acceptance:

```bash
git commit -m "test(benchmark): characterize runner boundary"
```

### Exit condition

Step 1 is complete only when we can define the next implementation slice from
observed contracts rather than assumptions.

Expected Step 2 decision after evidence:

```text
Benchmark → NormalizedHarnessTask adapter
```

or, if source evidence shows workspace resolution must be established first:

```text
Benchmark Workspace Resolver contract
```

We will choose between those only after Step 1 characterization.

## H0-003 Step 1 Evidence Record

**Status:** ✅ Accepted

Alpha.7 source evidence establishes the following exact boundary.

### Benchmark contract

Current `BenchmarkTask` owns:

```text
schemaVersion
id
title
difficulty
task
repository:
  id
  revision
constraints[]
successCriteria[]
validationCommands[]
expectedOutcome
```

Repository revision is mandatory for benchmarks and repository identity remains
machine-independent.

### Benchmark → normalized task mapping

The source-supported mapping for the next adapter is:

```text
BenchmarkTask.id
  → NormalizedHarnessTask.id

source
  → benchmark

BenchmarkTask.repository
  → NormalizedHarnessTask.repository

BenchmarkTask.task
  → NormalizedHarnessTask.request

BenchmarkTask.constraints
  → NormalizedHarnessTask.constraints

BenchmarkTask.successCriteria
  → NormalizedHarnessTask.acceptanceCriteria
```

The following remain benchmark infrastructure and must not enter the normalized
task domain:

```text
title
difficulty
validationCommands
expectedOutcome
```

`title` and `difficulty` may later be retained as opaque adapter metadata only
if a concrete reporting requirement justifies it. Step 1 does not require that.

### Application boundary

Current application execution is already the required shape:

```text
RunHarnessRequest
  → task: NormalizedHarnessTask
  → workspace: ResolvedWorkspace
  → execution?

ResolvedWorkspace
  → repositoryPath

HarnessRunResult
  → state
  → telemetry
  → persistedTelemetry
```

`runHarness(...)` remains benchmark-neutral and reaches the Harness core only
through the public graph boundary.

### Observation gap

Current H0-002 acceptance consumes:

```text
finalOutcome
filesChanged[]
validationPassed
humanInterventionRequired
```

Current run telemetry directly provides changed-file evidence, but its
`finalStatus` vocabulary is only:

```text
completed
failed
```

and therefore must not be confused with benchmark outcomes:

```text
changes_required
already_satisfied
blocked
```

`validationPassed` and `humanInterventionRequired` are not current
`HarnessRunResult` fields. They remain Benchmark Runner observation concerns.

The exact derivation of `finalOutcome` from terminal Harness state must be
defined from state/refined-plan evidence in a later H0-003 step rather than
guessed here.

### Workspace / telemetry finding

Default JSON telemetry persistence roots itself at `process.cwd()`.

`runHarness(...)` already permits telemetry-store injection, so H0-003 does not
need to put benchmark workspace identity into telemetry contracts or task
identity merely to isolate benchmark artifacts.

### Step 2 decision

Evidence supports implementing the smallest independent next slice first:

```text
H0-003 Step 2 — Benchmark Task Adapter
```

Step 2 should deterministically convert one already-valid `BenchmarkTask` into
one `NormalizedHarnessTask`.

It must not yet:

```text
resolve repositories
create worktrees
execute validation commands
run providers
evaluate benchmark acceptance
```

Workspace resolver design follows after the adapter boundary is accepted.

## H0-003 Step 1 Validation Record

**Status:** ✅ Accepted

The Step 1 development-environment gate passed after one test-only TypeScript
correction that added the explicit `string` parameter and `Promise<string>`
return type to the source-reading helper.

No production source behavior changed.

Accepted evidence:

```text
BenchmarkTask
  → normalized task adapter inputs are known

repository.id + revision
  → remain machine-independent identity

ResolvedWorkspace.repositoryPath
  → remains separate runtime execution location

validationCommands
expectedOutcome
  → remain benchmark infrastructure

runHarness(...)
  → remains the single Harness application execution boundary

BenchmarkRunObservation
  → finalOutcome
  → filesChanged
  → validationPassed
  → humanInterventionRequired
```

The characterization also confirmed that run telemetry `finalStatus` is only:

```text
completed
failed
```

and must not be conflated with benchmark outcomes:

```text
changes_required
already_satisfied
blocked
```

### Step 2 decision

Proceed with:

```text
H0-003 Step 2 — Benchmark Task Adapter
```

The next slice must only map an already-valid `BenchmarkTask` into one
`NormalizedHarnessTask`.

It must not yet resolve repositories, create worktrees, execute validations,
call providers, or evaluate benchmark acceptance.

## H0-003 Step 2 — Benchmark Task Adapter

**Status:** ✅ Accepted

### Objective

Introduce the smallest deterministic adapter from the fixed H0-002
`BenchmarkTask` contract into the H0-002A `NormalizedHarnessTask` contract.

This step connects benchmark task identity to the shared Harness intake domain.
It does not execute a benchmark.

### Accepted mapping

```text
BenchmarkTask.id
  → NormalizedHarnessTask.id

source
  → "benchmark"

BenchmarkTask.repository.id
BenchmarkTask.repository.revision
  → NormalizedHarnessTask.repository

BenchmarkTask.task
  → NormalizedHarnessTask.request

BenchmarkTask.constraints
  → NormalizedHarnessTask.constraints

BenchmarkTask.successCriteria
  → NormalizedHarnessTask.acceptanceCriteria
```

The adapter must delegate validation/normalization to the existing deterministic
`normalizeHarnessTask(...)` boundary rather than duplicate its rules.

### Benchmark-only data

These fields remain outside `NormalizedHarnessTask`:

```text
title
difficulty
validationCommands
expectedOutcome
```

They belong to benchmark selection/reporting/execution/acceptance.

Step 2 does not copy them into metadata merely because metadata exists.

A future reporting requirement may justify selected opaque metadata, but that
must be evidence-driven and separate from this adapter.

### Production shape

Create:

```text
src/benchmarks/task-adapter.ts
```

Preferred API:

```ts
adaptBenchmarkTaskToHarnessTask(
  benchmark: BenchmarkTask,
): NormalizedHarnessTask
```

The function must remain pure apart from deterministic normalization.

### Tests

Create:

```text
src/test-h0-003-benchmark-task-adapter.ts
```

The deterministic test must prove:

```text
id mapping
source = benchmark
repository id/revision mapping
task → request
constraints mapping
successCriteria → acceptanceCriteria
metadata remains empty
validationCommands do not leak
expectedOutcome does not leak
title/difficulty do not leak
normalizer errors propagate deterministically
fixed B01-B05 cases can all be adapted
```

No provider, graph, filesystem, Git or command execution is allowed.

### Files

Create:

```text
src/benchmarks/task-adapter.ts
src/test-h0-003-benchmark-task-adapter.ts
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
src/intake/contracts.ts
src/intake/normalize.ts
src/app/run-harness.ts
```

### Non-goals

Do not:

- resolve repository IDs;
- clone repositories;
- create Git worktrees;
- create temporary directories;
- execute `runHarness(...)`;
- execute validation commands;
- derive `BenchmarkRunObservation`;
- evaluate benchmark acceptance;
- add runner orchestration;
- add benchmark metadata to the normalized task without evidence;
- change the fixed B01-B05 suite;
- change task normalization semantics.

### Acceptance criteria

- [x] `src/benchmarks/task-adapter.ts` exists.
- [x] adapter accepts one `BenchmarkTask`.
- [x] adapter returns one `NormalizedHarnessTask`.
- [x] adapter delegates to `normalizeHarnessTask(...)`.
- [x] source is always `benchmark`.
- [x] benchmark `id` maps to normalized task `id`.
- [x] benchmark repository `id + revision` map unchanged.
- [x] benchmark `task` maps to `request`.
- [x] constraints map unchanged after normalizer trimming.
- [x] success criteria map to acceptance criteria.
- [x] normalized metadata is empty.
- [x] `title` does not leak into normalized task.
- [x] `difficulty` does not leak into normalized task.
- [x] `validationCommands` do not leak into normalized task.
- [x] `expectedOutcome` does not leak into normalized task.
- [x] all fixed B01-B05 tasks adapt successfully.
- [x] malformed benchmark task input still receives deterministic normalizer errors.
- [x] no Git/filesystem/process/provider call occurs.
- [x] no new runtime dependency is added.
- [x] H0-003 Step 1 characterization remains green.
- [x] H0-002A/H0-002 regression remains green.

### Targeted gate

```bash
npm run typecheck && \
npm run test:h0-003-benchmark-task-adapter && \
npm run test:h0-003-runner-boundary-characterization && \
npm run test:h0-002a-acceptance && \
npm run test:h0-002-acceptance && \
npm run test:benchmark-suite-validation && \
npm run test:benchmark-acceptance && \
npm run test:benchmark-contract
```

### Commit

After acceptance:

```bash
git commit -m "feat(benchmark): adapt tasks to harness intake"
```

### Exit condition

Step 2 is accepted when every fixed benchmark can cross the shared normalized
task boundary without carrying benchmark execution/scoring concerns with it.

## H0-003 Step 2 Implementation Record

**Status:** ✅ Accepted

Implemented boundary:

```text
BenchmarkTask
    ↓
adaptBenchmarkTaskToHarnessTask(...)
    ↓
normalizeHarnessTask(...)
    ↓
NormalizedHarnessTask
```

The adapter performs no benchmark execution.

It intentionally excludes:

```text
title
difficulty
validationCommands
expectedOutcome
```

from both normalized top-level fields and metadata.

The adapter relies on the existing task normalizer for trimming, repository
identity validation, blank-field validation, and stable issue codes.

The deterministic test covers one synthetic mapping, all fixed B01-B05 cases,
benchmark-only-field non-leakage, and malformed-input error propagation.

## H0-003 Step 2 Validation Record

**Status:** ✅ Accepted

The Step 2 development-environment gate passed after one test-only correction
to use the actual fixed-suite export:

```text
benchmarkCases
```

instead of the initially assumed:

```text
BENCHMARK_TASKS
```

No production behavior changed.

Accepted production boundary:

```text
BenchmarkTask
    ↓
adaptBenchmarkTaskToHarnessTask(...)
    ↓
normalizeHarnessTask(...)
    ↓
NormalizedHarnessTask
```

Accepted mapping:

```text
id
  → id

source
  → benchmark

repository.id + repository.revision
  → repository.id + repository.revision

task
  → request

constraints
  → constraints

successCriteria
  → acceptanceCriteria
```

Benchmark-only concerns remain outside the normalized Harness task:

```text
title
difficulty
validationCommands
expectedOutcome
```

They are not copied into metadata.

The deterministic test proves:

```text
synthetic mapping
B01-B05 adaptation
normalizer trimming
stable normalization errors
no benchmark-only field leakage
```

### Step 3 direction

Proceed to:

```text
H0-003 Step 3 — Benchmark Workspace Resolver Contract
```

Step 3 should define the repository/revision → isolated `ResolvedWorkspace`
boundary and its lifecycle semantics before implementing real Git worktrees.

The contract should make cleanup ownership, baseline immutability, revision
verification, and isolation explicit.

Step 3 should remain contract/characterization-first. Real Git mutation should
follow only after that contract is accepted.

**Expected next step:** define the benchmark workspace resolver contract and its
isolation semantics before implementing Git worktrees.

## H0-003 Step 3 — Benchmark Workspace Resolver Contract

**Status:** ✅ Accepted

### Objective

Define the stable contract and lifecycle semantics for resolving a benchmark
repository identity into one isolated `ResolvedWorkspace` before introducing
real Git/worktree mutation.

This step is contract-first.

It must establish what later Git infrastructure is required to guarantee, but
must not yet create or remove worktrees.

### Problem

H0-002 benchmark tasks use machine-independent identity:

```text
repository.id
repository.revision
```

while `runHarness(...)` requires:

```text
ResolvedWorkspace.repositoryPath
```

H0-003 therefore needs one infrastructure boundary that can translate:

```text
repository identity
    ↓
isolated local execution workspace
```

without leaking local paths back into task identity.

### Architectural direction

Preferred contract shape:

```ts
type BenchmarkWorkspaceRequest = Readonly<{
  repository: BenchmarkRepositoryRef;
}>;

type ResolvedBenchmarkWorkspace = Readonly<{
  workspace: ResolvedWorkspace;
  cleanup(): Promise<void>;
}>;
```

The exact exported names may be refined by implementation evidence, but the
following semantics are requirements:

```text
input
  → machine-independent repository id + revision

output
  → concrete isolated repositoryPath

lifecycle
  → explicit cleanup ownership
```

### Resolver responsibility

The future resolver will own:

```text
repository.id lookup
revision verification
isolated checkout/worktree creation
workspace path allocation
baseline immutability
cleanup
```

It must not own:

```text
BenchmarkTask → NormalizedHarnessTask adaptation
runHarness(...)
validation commands
benchmark acceptance
provider/model selection
telemetry schema
```

### Isolation invariants

A resolved benchmark workspace must eventually prove:

1. **Fresh isolation**
   - each benchmark run receives a dedicated execution directory;
   - stale mutations from a previous benchmark cannot enter a new run.

2. **Requested revision**
   - execution starts at the exact requested benchmark revision;
   - revision mismatch must fail deterministically before Harness execution.

3. **Baseline immutability**
   - mutations made by the Harness cannot modify the source/baseline checkout
     used to create benchmark runs.

4. **Explicit lifecycle**
   - cleanup is owned by the resolved workspace/resolver boundary;
   - caller can clean the workspace even if Harness execution or validation
     fails.

5. **No identity leakage**
   - local workspace paths never become `BenchmarkRepositoryRef.id`;
   - local workspace paths never become `NormalizedHarnessTask.repository.id`.

6. **No hidden global process mutation**
   - workspace resolution must not require changing process-wide `cwd`;
   - `runHarness(...)` receives the resolved path explicitly.

### Repository lookup boundary

Step 3 does not decide yet whether repository IDs are resolved through:

```text
configured local repository catalog
fixture repository registry
Git URL mapping
future pluggable repository source
```

That is an infrastructure concern.

The contract should therefore separate:

```text
repository identity
```

from:

```text
how repository identity is located
```

Do not put Git URLs or absolute paths into `BenchmarkTask` merely to make the
resolver easier to implement.

### Cleanup semantics

The future orchestration must be able to use:

```ts
const resolved = await resolver.resolve(...);

try {
  await runHarness(...);
  // validation / observation
} finally {
  await resolved.cleanup();
}
```

Cleanup must therefore be:

```text
explicit
awaitable
idempotent if practical
safe after partial failures
```

Whether cleanup idempotency is mandatory or best-effort should be decided from
the first deterministic implementation test.

### Step 3 production rule

Step 3 may add only:

```text
workspace resolver contract/types
deterministic contract test
PLAN metadata
package test script
```

No real Git command is allowed.

Preferred files:

```text
src/benchmarks/workspace.ts
src/test-h0-003-workspace-contract.ts
```

`src/benchmarks/workspace.ts` should contain interfaces/types only in this step.

### Deterministic test requirements

The Step 3 test must prove:

```text
resolver consumes BenchmarkRepositoryRef
resolver returns explicit ResolvedWorkspace
resolved path is runtime-only
cleanup is explicit and awaitable
a fake resolver can satisfy the contract without Git
benchmark task adapter remains independent from workspace resolution
runHarness remains independent from repository lookup
no concrete Git command/process implementation exists in the contract module
```

No filesystem mutation, temp directory, Git command, provider call, or Harness
execution is required.

### Files

Create:

```text
src/benchmarks/workspace.ts
src/test-h0-003-workspace-contract.ts
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
src/benchmarks/task-adapter.ts
src/intake/*
src/app/run-harness.ts
src/telemetry/*
src/graph/*
```

### Non-goals

Do not yet:

- call `git`;
- use `git worktree`;
- clone repositories;
- allocate temp directories;
- delete directories;
- execute Harness runs;
- execute benchmark validations;
- calculate diffs;
- derive benchmark observations;
- evaluate acceptance;
- add repository URLs to benchmark tasks;
- add machine-local paths to normalized task identity;
- add a repository database/registry implementation.

### Acceptance criteria

- [x] workspace resolver contract module exists.
- [x] resolver input is based on `BenchmarkRepositoryRef`.
- [x] resolver output carries `ResolvedWorkspace`.
- [x] cleanup ownership is explicit.
- [x] cleanup is asynchronous/awaitable.
- [x] a deterministic fake resolver satisfies the contract.
- [x] repository path remains outside benchmark identity.
- [x] repository path remains outside normalized task identity.
- [x] benchmark task adapter does not resolve workspaces.
- [x] `runHarness(...)` does not resolve repository IDs.
- [x] contract module imports no concrete Git/process/filesystem implementation.
- [x] no Git mutation occurs.
- [x] no filesystem mutation occurs.
- [x] no provider/Harness run occurs.
- [x] no new runtime dependency is added.
- [x] H0-003 Steps 1-2 remain green.
- [x] H0-002A/H0-002 regression remains green.

### Targeted gate

```bash
npm run typecheck && \
npm run test:h0-003-workspace-contract && \
npm run test:h0-003-benchmark-task-adapter && \
npm run test:h0-003-runner-boundary-characterization && \
npm run test:h0-002a-acceptance && \
npm run test:h0-002-acceptance && \
npm run test:benchmark-suite-validation && \
npm run test:benchmark-acceptance && \
npm run test:benchmark-contract
```

### Commit

After acceptance:

```bash
git commit -m "feat(benchmark): define workspace resolver contract"
```

### Exit condition

Step 3 is accepted when the isolation/lifecycle boundary is explicit and can be
satisfied by a deterministic fake without depending on Git.

Only then may Step 4 introduce real isolated workspace infrastructure.

## H0-003 Step 3 Implementation Record

**Status:** ✅ Accepted

Implemented contract:

```text
BenchmarkWorkspaceRequest
  → repository: BenchmarkRepositoryRef

BenchmarkWorkspaceResolver.resolve(...)
  ↓
ResolvedBenchmarkWorkspace
  → workspace: ResolvedWorkspace
  → cleanup(): Promise<void>
```

The contract deliberately contains no concrete Git, process, filesystem, temp
directory, repository-catalog, or clone/worktree implementation.

The deterministic test uses a fake resolver and proves:

```text
repository identity is input
repositoryPath is output-only runtime data
cleanup is explicit and awaitable
task adapter remains workspace-independent
runHarness remains lookup-independent
benchmark and normalized task identities contain no repositoryPath
contract module contains no concrete Git/filesystem/process behavior
```

Real workspace mutation remains deferred to Step 4.

## H0-003 Step 3 Validation Record

**Status:** ✅ Accepted

The Step 3 development-environment gate passed with the workspace resolver
contract and deterministic fake implementation.

Accepted boundary:

```text
BenchmarkWorkspaceRequest
  → repository: BenchmarkRepositoryRef

BenchmarkWorkspaceResolver.resolve(...)
  ↓
ResolvedBenchmarkWorkspace
  → workspace: ResolvedWorkspace
  → cleanup(): Promise<void>
```

Verified invariants:

```text
repository identity
  ≠ runtime workspace path

BenchmarkTask
  ≠ workspace resolution

NormalizedHarnessTask
  ≠ workspace resolution

runHarness(...)
  ≠ repository lookup

workspace contract
  ≠ concrete Git/filesystem/process implementation
```

The contract now makes cleanup ownership explicit and awaitable while preserving
the separation between machine-independent benchmark identity and concrete local
execution location.

### Step 4 direction

Proceed to:

```text
H0-003 Step 4 — Git Worktree Workspace Resolver
```

Step 4 must implement the accepted contract using deterministic local Git
fixtures.

Required evidence before full runner orchestration:

```text
exact requested revision
fresh isolated workspace per resolution
baseline checkout remains unchanged after workspace mutation
cleanup removes the isolated worktree
cleanup behavior is safe after partial failure
no process-wide cwd mutation
```

Step 4 must still avoid provider calls, benchmark validation execution, and
benchmark acceptance evaluation.

**Expected next step:**

```text
H0-003 Step 4 — Git Worktree Workspace Resolver
```

Step 4 must implement the accepted contract with deterministic local Git
fixtures before any full benchmark orchestration is introduced.

## H0-003 Step 4 — Git Worktree Workspace Resolver

**Status:** ✅ Accepted

### Objective

Implement the accepted `BenchmarkWorkspaceResolver` contract using local Git
worktrees and deterministic local repository fixtures.

This is the first H0-003 step that performs real workspace mutation.

The implementation must prove isolation and revision correctness before any
full benchmark runner orchestration is introduced.

### Accepted contract

Step 3 established:

```text
BenchmarkWorkspaceRequest
  → repository: BenchmarkRepositoryRef

BenchmarkWorkspaceResolver.resolve(...)
  ↓
ResolvedBenchmarkWorkspace
  → workspace: ResolvedWorkspace
  → cleanup(): Promise<void>
```

Step 4 implements that boundary.

### Architectural split

The worktree resolver needs two independent concerns:

```text
repository identity
  → source repository lookup

source repository + revision
  → isolated Git worktree
```

Do not collapse these concepts by treating `BenchmarkRepositoryRef.id` as an
absolute local path.

Preferred direction:

```ts
type BenchmarkRepositoryLocator = Readonly<{
  locate(repositoryId: string): Promise<string>;
}>;
```

and:

```text
GitWorktreeBenchmarkWorkspaceResolver
  → BenchmarkRepositoryLocator
  → Git command runner
  → workspace root allocator
```

The exact helper names may be refined by implementation evidence, but repository
identity lookup must remain injectable and independent from worktree mechanics.

### Concrete resolver responsibilities

The Step 4 resolver must:

1. locate the source repository for `repository.id`;
2. verify the requested `repository.revision`;
3. create a fresh isolated worktree at that exact revision;
4. return the worktree path through `ResolvedWorkspace.repositoryPath`;
5. preserve the source/baseline checkout;
6. expose cleanup that removes the worktree;
7. handle partial-failure cleanup deterministically where possible.

### Git execution policy

Use the system Git CLI through Node process execution.

No new Git library dependency should be added.

Preferred commands should be explicit argument arrays rather than shell command
strings.

Expected operations may include:

```text
git -C <source> rev-parse --verify <revision>^{commit}
git -C <source> worktree add --detach <workspace> <resolved-commit>
git -C <source> worktree remove --force <workspace>
git -C <source> worktree prune
```

Exact command sequence must be driven by tests.

Do not use shell interpolation for repository paths, revisions, or worktree
paths.

### Revision semantics

The resolver must not merely trust the requested revision string.

It must resolve/verify the revision before Harness execution.

The isolated workspace must start at the exact commit that Git resolves for the
requested benchmark revision.

The deterministic test should compare:

```text
requested revision
  → source repository resolved commit

workspace HEAD
  → same commit
```

### Isolation semantics

The deterministic fixture test must prove all of the following:

#### Fresh workspace

Two sequential resolutions must not reuse the same execution directory.

#### Source checkout immutability

After mutating a file inside the resolved worktree:

```text
source repository working tree
  → unchanged

source repository HEAD
  → unchanged
```

#### Workspace independence

Mutating one resolved worktree must not alter another resolved worktree.

#### Detached execution

The benchmark worktree should not move a source branch merely because the
Harness modifies files.

A detached worktree is the preferred baseline.

### Workspace root

Worktree directories must live outside the source repository working tree.

The resolver should receive an explicit workspace root from outer benchmark
infrastructure rather than silently using the current project directory.

For deterministic tests, use a temporary root created by the test.

The production resolver itself should not mutate process-wide `cwd`.

### Cleanup semantics

Cleanup must:

```text
remove the Git worktree
remove/prune Git worktree registration as needed
be awaitable
```

The first implementation should aim for idempotency.

Calling cleanup twice should not corrupt the source repository or fail merely
because the workspace has already been removed.

If exact idempotency cannot be implemented safely with current evidence, the
test must characterize the chosen behavior before acceptance.

### Partial failures

If worktree creation fails after allocating a target directory or registering a
worktree, the resolver must make a best-effort cleanup before propagating the
original failure.

Do not swallow the original error.

### Repository locator

Step 4 may include a minimal deterministic locator implementation only if
required for local execution.

Preferred production boundary:

```text
BenchmarkRepositoryLocator
```

with tests using an in-memory/static mapping:

```text
fixture-repository
  → /tmp/.../source
```

Do not introduce:

```text
GitHub
remote clone
HTTP download
database repository catalog
Q-Flow repository registry
```

Those remain outside Step 4.

### Process execution boundary

Git command execution should be injectable for focused tests if the resulting
abstraction remains small.

Avoid creating a generic command-execution framework.

A narrow Git runner abstraction is acceptable only when it directly improves:

```text
argument safety
deterministic failure tests
cleanup tests
```

### Files

Expected new production files:

```text
src/benchmarks/git-worktree-workspace.ts
```

Step 4 may extend:

```text
src/benchmarks/workspace.ts
```

only for a repository-locator contract if justified.

Expected deterministic test:

```text
src/test-h0-003-git-worktree-workspace.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

### Production boundaries that must remain unchanged

Do not modify:

```text
src/benchmarks/cases.ts
src/benchmarks/task-adapter.ts
src/benchmarks/acceptance.ts
src/intake/*
src/app/run-harness.ts
src/telemetry/*
src/graph/*
src/providers/*
```

unless the Step 4 deterministic gate exposes a concrete pre-existing contract
defect.

### Non-goals

Do not yet:

- execute `runHarness(...)`;
- execute benchmark validation commands;
- derive `BenchmarkRunObservation`;
- evaluate benchmark acceptance;
- run the complete B01-B05 suite;
- clone remote repositories;
- fetch Git remotes;
- add GitHub/Q-Flow integrations;
- add a generic job queue;
- change telemetry schema;
- change benchmark definitions;
- change provider/model behavior;
- introduce comparison reporting.

### Deterministic fixture strategy

The test must create its own temporary local Git repository.

Suggested fixture lifecycle:

```text
mkdtemp
  ↓
git init
  ↓
configure local test user
  ↓
create commit A
  ↓
tag or reference benchmark revision
  ↓
create source working-tree state
  ↓
resolve isolated benchmark worktree
  ↓
assert exact HEAD
  ↓
mutate isolated worktree
  ↓
assert source untouched
  ↓
cleanup
  ↓
assert worktree removed
  ↓
remove temp fixture root
```

The test may execute the local Git binary.

It must not require network access.

### Acceptance criteria

- [x] concrete Git worktree resolver exists.
- [x] resolver implements `BenchmarkWorkspaceResolver`.
- [x] repository identity lookup is separate from local path identity.
- [x] repository locator is injectable/deterministic.
- [x] workspace root is explicit.
- [x] requested revision is verified before Harness execution.
- [x] resulting worktree HEAD equals the resolved requested commit.
- [x] worktree is isolated from source checkout.
- [x] source checkout remains unchanged after worktree mutation.
- [x] two resolutions produce distinct workspace directories.
- [x] one worktree mutation does not affect another.
- [x] execution worktree is detached from source branch movement.
- [x] cleanup removes the worktree.
- [x] cleanup is safe when invoked after normal resolution.
- [x] cleanup behavior after repeated invocation is characterized.
- [x] partial creation failure performs best-effort cleanup.
- [x] original creation failure is propagated.
- [x] resolver does not change process-wide `cwd`.
- [x] Git arguments are passed without shell interpolation.
- [x] no network access is required.
- [x] no new runtime dependency is added.
- [x] no Harness/provider call occurs.
- [x] H0-003 Steps 1-3 remain green.
- [x] H0-002A/H0-002 regression remains green.

### Targeted gate

```bash
npm run typecheck && \
npm run test:h0-003-git-worktree-workspace && \
npm run test:h0-003-workspace-contract && \
npm run test:h0-003-benchmark-task-adapter && \
npm run test:h0-003-runner-boundary-characterization && \
npm run test:h0-002a-acceptance && \
npm run test:h0-002-acceptance && \
npm run test:benchmark-suite-validation && \
npm run test:benchmark-acceptance && \
npm run test:benchmark-contract
```

### Commit

After acceptance:

```bash
git commit -m "feat(benchmark): resolve isolated git worktrees"
```

### Exit condition

Step 4 is accepted only when a deterministic local Git fixture proves exact
revision execution, source immutability, independent worktrees, and cleanup.

Only after that may H0-003 begin composing workspace resolution with
`runHarness(...)`.

## H0-003 Step 4 Implementation Record

**Status:** ✅ Accepted

Implemented infrastructure:

```text
BenchmarkRepositoryLocator
  ↓
GitWorktreeBenchmarkWorkspaceResolver
  ↓
system Git CLI (execFile argument arrays)
  ↓
detached isolated worktree
```

The resolver:

```text
locates repository id through an injected locator
verifies repository.revision to an exact commit
allocates a unique path under an explicit workspace root
creates a detached Git worktree
verifies worktree HEAD equals the resolved commit
returns ResolvedWorkspace.repositoryPath
owns explicit awaitable cleanup
makes repeated successful cleanup a no-op
performs best-effort cleanup on partial resolution failure
rethrows the original resolution failure
```

The production implementation uses no shell command strings and adds no runtime
dependency.

The deterministic test creates a temporary local Git repository and proves:

```text
exact revision
detached worktree
fresh path per resolution
source checkout immutability
cross-worktree isolation
cleanup removes path and registration
repeated cleanup is safe
partial failure attempts cleanup and prune
original failure remains observable
process cwd is unchanged
no network is required
```

Harness execution, benchmark validation commands, observation derivation, and
acceptance evaluation remain deferred.

## H0-003 Step 4 Validation Record

**Status:** ✅ Accepted

The Step 4 development-environment gate passed after one test-only TypeScript
correction that made the `failedCommands` collection mutable.

No production behavior changed after the implementation patch.

Accepted infrastructure:

```text
BenchmarkRepositoryLocator
  ↓
GitWorktreeBenchmarkWorkspaceResolver
  ↓
system Git CLI via execFile argument arrays
  ↓
detached isolated worktree
```

Verified behavior:

```text
repository id lookup remains separate from local path identity
requested benchmark revision is resolved to an exact commit
worktree HEAD equals the resolved commit
worktree runs detached
two resolutions receive distinct paths
source checkout HEAD remains unchanged
source checkout working tree remains unchanged
mutating one worktree does not affect another
cleanup removes worktree path and Git registration
repeated cleanup is safe
partial resolution failure attempts best-effort cleanup
original resolution failure remains observable
process-wide cwd remains unchanged
no network is required
no runtime dependency was added
```

### Step 5 direction

Proceed to:

```text
H0-003 Step 5 — Benchmark Run Orchestration
```

Step 5 should compose only:

```text
BenchmarkTask
  ↓
adaptBenchmarkTaskToHarnessTask(...)
  ↓
BenchmarkWorkspaceResolver.resolve(...)
  ↓
runHarness(...)
  ↓
HarnessRunResult
  ↓
workspace cleanup
```

The orchestration must guarantee cleanup with `try/finally`.

Step 5 must still keep these concerns outside the orchestration slice:

```text
validation command execution
Git diff / filesChanged observation derivation
BenchmarkRunObservation construction
benchmark acceptance evaluation
comparison reporting
```

Those should be introduced as later H0-003 slices after the execution lifecycle
is proven independently.

**Expected next step:**

```text
H0-003 Step 5 — Benchmark Run Orchestration
```

Step 5 should connect:

```text
BenchmarkTask
  → task adapter
  → workspace resolver
  → runHarness(...)
```

without yet conflating validation-command execution or acceptance evaluation.

## H0-003 Step 5 — Benchmark Run Orchestration

**Status:** ✅ Accepted

### Objective

Compose the already-accepted H0-003 boundaries into one minimal benchmark
execution lifecycle:

```text
BenchmarkTask
  ↓
adaptBenchmarkTaskToHarnessTask(...)
  ↓
BenchmarkWorkspaceResolver.resolve(...)
  ↓
runHarness(...)
  ↓
HarnessRunResult
  ↓
cleanup()
```

Step 5 proves lifecycle orchestration only.

It must not yet execute validation commands, derive benchmark observations, or
evaluate acceptance.

### Architectural rule

The orchestration layer owns sequencing and cleanup.

It must not duplicate logic already owned by:

```text
task-adapter.ts
workspace resolver
runHarness(...)
```

The orchestration should therefore remain thin.

### Preferred API

Create:

```text
src/benchmarks/run-benchmark.ts
```

Preferred shape:

```ts
type RunBenchmarkRequest = Readonly<{
  benchmark: BenchmarkTask;
}>;

type RunBenchmarkDependencies = Readonly<{
  workspaceResolver: BenchmarkWorkspaceResolver;
  runHarness?: typeof runHarness;
}>;

async function runBenchmark(
  request: RunBenchmarkRequest,
  dependencies: RunBenchmarkDependencies,
): Promise<HarnessRunResult>
```

Exact names may be refined by implementation evidence, but the following are
required:

```text
BenchmarkTask input
workspace resolver dependency
runHarness dependency/injection seam
HarnessRunResult output
cleanup in finally
```

### Sequencing contract

The orchestration must execute in this order:

```text
1. adapt BenchmarkTask → NormalizedHarnessTask
2. resolve BenchmarkRepositoryRef → isolated workspace
3. call runHarness({ task, workspace })
4. return HarnessRunResult
5. cleanup workspace in finally
```

Cleanup must happen when:

```text
runHarness succeeds
runHarness throws
```

### Failure semantics

If workspace resolution fails:

```text
runHarness must not execute
cleanup is resolver-owned for partial resolution failure
original resolution error propagates
```

If `runHarness(...)` fails:

```text
cleanup must execute
original Harness error propagates after cleanup
```

If cleanup itself fails after a successful Harness run:

```text
cleanup failure must not be silently swallowed
```

If cleanup fails while a Harness error is already propagating, Step 5 must
characterize and document the chosen behavior instead of inventing a generic
error aggregation framework.

Prefer preserving the primary Harness error if the implementation can do so
without adding broad error infrastructure.

### Dependency injection

The deterministic test must not invoke a real provider or graph.

Use:

```text
fake BenchmarkWorkspaceResolver
fake/injected runHarness
```

The fake `runHarness` should prove the exact inputs passed by orchestration.

No Git fixture is required in this step because Git lifecycle was already
accepted in Step 4.

### Required deterministic tests

Create:

```text
src/test-h0-003-run-benchmark.ts
```

The tests must prove:

```text
BenchmarkTask is adapted before execution
source becomes benchmark
repository identity is preserved
resolved workspace path is passed to runHarness
runHarness is invoked exactly once on success
HarnessRunResult is returned unchanged
cleanup runs after success
cleanup runs after runHarness failure
runHarness is not called when workspace resolution fails
resolution failure propagates
Harness failure propagates
cleanup failure after success propagates
validationCommands are not executed
benchmark acceptance is not evaluated
graph internals are not imported directly
```

### Production boundaries

Step 5 may import:

```text
BenchmarkTask
adaptBenchmarkTaskToHarnessTask
BenchmarkWorkspaceResolver
runHarness
HarnessRunResult
```

Step 5 must not import:

```text
graph internals
providers
benchmark acceptance evaluator
child_process
filesystem
Git resolver implementation directly
```

The caller supplies the workspace resolver implementation.

### Files

Create:

```text
src/benchmarks/run-benchmark.ts
src/test-h0-003-run-benchmark.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/benchmarks/cases.ts
src/benchmarks/task-adapter.ts
src/benchmarks/git-worktree-workspace.ts
src/benchmarks/acceptance.ts
src/intake/*
src/app/run-harness.ts
src/telemetry/*
src/graph/*
src/providers/*
```

unless the deterministic test exposes a concrete pre-existing boundary defect.

### Non-goals

Do not yet:

- execute benchmark validation commands;
- calculate Git diff/filesChanged;
- derive `finalOutcome`;
- derive `humanInterventionRequired`;
- construct `BenchmarkRunObservation`;
- call `evaluateBenchmarkAcceptance(...)`;
- run B01-B05 end-to-end;
- build comparison reports;
- change telemetry schema;
- add job scheduling or concurrency;
- change provider/model selection.

### Acceptance criteria

- [x] `src/benchmarks/run-benchmark.ts` exists.
- [x] orchestration accepts one `BenchmarkTask`.
- [x] orchestration uses the accepted task adapter.
- [x] orchestration uses injected `BenchmarkWorkspaceResolver`.
- [x] orchestration calls `runHarness(...)` through the application boundary.
- [x] normalized task source is `benchmark`.
- [x] resolved workspace is passed unchanged to `runHarness(...)`.
- [x] `HarnessRunResult` is returned unchanged.
- [x] cleanup runs after successful Harness execution.
- [x] cleanup runs after failed Harness execution.
- [x] workspace resolution failure prevents Harness execution.
- [x] resolution failure propagates.
- [x] Harness failure propagates.
- [x] cleanup failure after success propagates.
- [x] no validation command executes.
- [x] no benchmark acceptance evaluation occurs.
- [x] no graph-internal import occurs.
- [x] no provider call occurs in deterministic tests.
- [x] no Git/filesystem/process implementation is added.
- [x] no new runtime dependency is added.
- [x] H0-003 Steps 1-4 remain green.
- [x] H0-002A/H0-002 regression remains green.

### Targeted gate

```bash
npm run typecheck && \
npm run test:h0-003-run-benchmark && \
npm run test:h0-003-git-worktree-workspace && \
npm run test:h0-003-workspace-contract && \
npm run test:h0-003-benchmark-task-adapter && \
npm run test:h0-003-runner-boundary-characterization && \
npm run test:h0-002a-acceptance && \
npm run test:h0-002-acceptance && \
npm run test:benchmark-suite-validation && \
npm run test:benchmark-acceptance && \
npm run test:benchmark-contract
```

### Commit

After acceptance:

```bash
git commit -m "feat(benchmark): orchestrate harness run lifecycle"
```

### Exit condition

Step 5 is accepted when benchmark task adaptation, isolated workspace
resolution, Harness execution, and guaranteed cleanup are proven as one thin
lifecycle without pulling validation or scoring concerns into the same layer.

**Expected next step:**

```text
H0-003 Step 6 — Benchmark Validation Command Execution
```

Step 6 should add deterministic post-Harness validation execution while keeping
acceptance evaluation separate.

## H0-003 Step 5 Implementation Record

**Status:** ✅ Accepted

Implemented lifecycle:

```text
BenchmarkTask
  ↓
adaptBenchmarkTaskToHarnessTask(...)
  ↓
BenchmarkWorkspaceResolver.resolve(...)
  ↓
runHarness(...)
  ↓
HarnessRunResult
  ↓
cleanup() in finally
```

The orchestration is intentionally thin.

It owns only sequencing and cleanup.

Deterministic dependency seams:

```text
BenchmarkWorkspaceResolver
BenchmarkHarnessExecutor
```

allow the Step 5 test to prove the lifecycle without invoking a real provider,
graph, Git implementation, filesystem mutation, or validation command.

Failure behavior is characterized as:

```text
workspace resolution failure
  → runHarness is not called
  → original resolution failure propagates

Harness failure
  → cleanup runs
  → original Harness failure propagates

cleanup failure after Harness success
  → cleanup failure propagates

Harness failure + cleanup failure
  → primary Harness failure is preserved
```

Step 5 does not import or execute:

```text
validationCommands
benchmark acceptance
BenchmarkRunObservation
Git worktree implementation
graph internals
providers
```

Validation execution and benchmark observation remain deferred.

## H0-003 Step 5 Validation Record

**Status:** ✅ Accepted

The Step 5 development-environment gate passed with deterministic fake
dependencies and no provider, graph, Git, filesystem, or validation-command
execution.

Accepted lifecycle:

```text
BenchmarkTask
  ↓
adaptBenchmarkTaskToHarnessTask(...)
  ↓
BenchmarkWorkspaceResolver.resolve(...)
  ↓
runHarness(...)
  ↓
HarnessRunResult
  ↓
cleanup() in finally
```

Verified failure semantics:

```text
workspace resolution failure
  → runHarness is not called
  → original resolution failure propagates

Harness failure
  → cleanup runs
  → original Harness failure propagates

cleanup failure after Harness success
  → cleanup failure propagates

Harness failure + cleanup failure
  → primary Harness failure is preserved
```

The orchestration remains intentionally thin and does not import or execute:

```text
validationCommands
BenchmarkRunObservation
evaluateBenchmarkAcceptance(...)
Git worktree implementation
graph internals
providers
```

### Step 6 direction

Proceed to:

```text
H0-003 Step 6 — Benchmark Validation Command Execution
```

Step 6 should introduce deterministic post-Harness validation execution in the
resolved workspace while keeping observation construction and acceptance
evaluation outside the same slice.

The validation layer should characterize:

```text
ordered command execution
working-directory ownership
stdout/stderr capture
exit status
short-circuit vs continue policy
no shell interpolation unless explicitly required by benchmark command format
no provider/model concerns
```

Only after validation execution is accepted should H0-003 derive the remaining
`BenchmarkRunObservation` fields and call the existing acceptance evaluator.

## H0-003 Step 6 — Benchmark Validation Command Execution

**Status:** ✅ Accepted

### Objective

Add deterministic execution of benchmark `validationCommands` inside the
already-resolved benchmark workspace.

This step owns validation execution only.

It must not yet derive the complete `BenchmarkRunObservation`, evaluate
benchmark acceptance, calculate comparison reports, or change Harness/provider
behavior.

### Input boundary

Validation execution consumes:

```text
workspace.repositoryPath
benchmark.validationCommands[]
```

The commands remain benchmark-owned data.

They must not be copied into:

```text
NormalizedHarnessTask
Harness state
telemetry schema
provider prompts
```

### Output boundary

Introduce a narrow validation result contract.

Preferred shape:

```ts
type BenchmarkValidationCommandResult = Readonly<{
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
}>;

type BenchmarkValidationResult = Readonly<{
  passed: boolean;
  commands: readonly BenchmarkValidationCommandResult[];
}>;
```

Exact names may be refined by implementation evidence, but Step 6 must expose
enough deterministic evidence for the later observation layer to derive:

```text
validationPassed
```

without re-running commands.

### Execution policy

Validation commands execute:

```text
after runHarness(...)
before workspace cleanup
inside the resolved workspace
in benchmark-defined order
```

The orchestration sequence will eventually become:

```text
BenchmarkTask
  ↓
task adapter
  ↓
workspace resolver
  ↓
runHarness(...)
  ↓
validation executor
  ↓
validation result
  ↓
cleanup
```

Step 6 should not yet collapse this full sequence into acceptance evaluation.

### Command format

Current H0-002 benchmark tasks define validation commands as strings.

Step 6 must characterize how those strings are executed safely.

Preferred policy:

```text
spawn through an explicit shell only because the existing benchmark contract
stores commands as shell strings
```

If a shell is used:

```text
cwd must be the resolved workspace
stdio must be captured
environment inheritance must remain explicit/default Node behavior
the command string must come only from trusted benchmark definitions
```

Do not pretend string commands can be passed to `execFile` as safe argv without
parsing semantics.

Step 6 should keep the command runner narrow and benchmark-specific.

### Short-circuit policy

Preferred initial policy:

```text
execute in order
stop on first non-zero exit
passed = false
return evidence collected so far
```

Rationale:

```text
later commands often depend on earlier build/typecheck success
avoids unnecessary cost
matches gate-style benchmark semantics
```

The deterministic test must lock this behavior before acceptance.

### Failure semantics

A validation command exiting non-zero is expected benchmark evidence, not an
infrastructure exception.

Therefore:

```text
command exit non-zero
  → BenchmarkValidationResult.passed = false
  → command result captures exitCode/stdout/stderr
  → remaining commands are not executed
```

Infrastructure failure to launch the shell/process is different:

```text
spawn/exec infrastructure failure
  → propagate error
```

The exact Node API may return non-zero exits as rejected promises; Step 6 must
normalize that into validation evidence while still distinguishing launch-level
failures.

### stdout / stderr

Capture text output for every executed command.

Do not print command output directly from production infrastructure.

The caller/reporting layer may decide later what to display.

### Working directory

Every command must execute with:

```text
cwd = resolved workspace.repositoryPath
```

The validation layer must never change process-wide `cwd`.

### Dependency injection

Provide a narrow injection seam for deterministic tests.

Preferred concept:

```text
BenchmarkValidationCommandRunner
```

The focused unit test should prove ordering and failure policy without launching
real commands.

A second deterministic integration test may execute harmless local commands if
needed to prove cwd/stdout/stderr behavior.

Avoid a generic process execution framework.

### Production files

Preferred new file:

```text
src/benchmarks/validation.ts
```

Step 6 may modify:

```text
src/benchmarks/run-benchmark.ts
```

only if required to insert validation into the existing lifecycle while keeping
the return contract coherent.

However, prefer first establishing the validation executor independently.

If changing `runBenchmark(...)` would force a premature return-contract redesign,
keep Step 6 standalone and compose it in the next slice.

### Deterministic tests

Preferred test:

```text
src/test-h0-003-benchmark-validation.ts
```

The tests must prove:

```text
commands execute in benchmark-defined order
cwd is the resolved workspace
stdout is captured
stderr is captured
zero exit marks command success
all-zero commands produce passed = true
first non-zero exit produces passed = false
execution stops after first failure
non-zero exit is evidence, not thrown infrastructure failure
launch/infrastructure failure propagates
process-wide cwd is unchanged
no provider/graph/Harness call occurs
no acceptance evaluator is imported/called
```

### Files

Create:

```text
src/benchmarks/validation.ts
src/test-h0-003-benchmark-validation.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify yet:

```text
src/benchmarks/acceptance.ts
src/benchmarks/cases.ts
src/benchmarks/task-adapter.ts
src/benchmarks/git-worktree-workspace.ts
src/intake/*
src/app/run-harness.ts
src/telemetry/*
src/graph/*
src/providers/*
```

### Non-goals

Do not yet:

- derive `finalOutcome`;
- derive `filesChanged`;
- derive `humanInterventionRequired`;
- construct `BenchmarkRunObservation`;
- call `evaluateBenchmarkAcceptance(...)`;
- run B01-B05 end-to-end;
- build benchmark reports;
- change benchmark command definitions;
- add remote execution;
- add Docker/sandbox execution;
- add concurrency;
- change provider/model selection;
- change telemetry contracts.

### Acceptance criteria

- [x] benchmark validation executor exists.
- [x] validation consumes workspace path + benchmark command strings.
- [x] commands execute in declared order.
- [x] commands execute in the resolved workspace.
- [x] stdout is captured.
- [x] stderr is captured.
- [x] exit code is captured.
- [x] all-zero exits produce `passed = true`.
- [x] first non-zero exit produces `passed = false`.
- [x] execution short-circuits after first failed command.
- [x] non-zero exit is returned as validation evidence.
- [x] infrastructure launch failure propagates.
- [x] process-wide cwd is unchanged.
- [x] validation output is not written directly by production code.
- [x] validation commands remain outside normalized task data.
- [x] no acceptance evaluation occurs.
- [x] no provider/graph/Harness execution occurs in focused tests.
- [x] no new runtime dependency is added.
- [x] H0-003 Steps 1-5 remain green.
- [x] H0-002A/H0-002 regression remains green.

### Targeted gate

```bash
npm run typecheck && \
npm run test:h0-003-benchmark-validation && \
npm run test:h0-003-run-benchmark && \
npm run test:h0-003-git-worktree-workspace && \
npm run test:h0-003-workspace-contract && \
npm run test:h0-003-benchmark-task-adapter && \
npm run test:h0-003-runner-boundary-characterization && \
npm run test:h0-002a-acceptance && \
npm run test:h0-002-acceptance && \
npm run test:benchmark-suite-validation && \
npm run test:benchmark-acceptance && \
npm run test:benchmark-contract
```

### Commit

After acceptance:

```bash
git commit -m "feat(benchmark): execute validation commands"
```

### Exit condition

Step 6 is accepted when benchmark validation commands can be executed
deterministically inside the resolved workspace with ordered, captured,
short-circuiting evidence.

Only after that should H0-003 derive benchmark observation fields and invoke the
existing acceptance evaluator.

**Expected next step:**

```text
H0-003 Step 7 — Benchmark Observation Derivation
```

## H0-003 Step 6 Implementation Record

**Status:** ✅ Accepted

Implemented validation boundary:

```text
repositoryPath
  +
validationCommands[]
  ↓
executeBenchmarkValidation(...)
  ↓
BenchmarkValidationResult
  → passed
  → ordered command evidence[]
```

Each command evidence captures:

```text
command
exitCode
stdout
stderr
```

The default runner uses Node's shell execution because the existing H0-002
benchmark contract stores validation commands as trusted shell strings.

Execution policy is now explicit:

```text
cwd = resolved workspace
execute in declared order
capture stdout/stderr
non-zero exit becomes validation evidence
stop after first non-zero exit
all-zero exits → passed = true
launch/infrastructure failure → propagate
process cwd remains unchanged
```

The command runner is injectable for focused deterministic tests.

The integration portion uses only a temporary local directory and harmless
local shell commands; it requires no network, Harness, graph, provider, Git, or
acceptance evaluator.

Step 6 remains standalone and does not yet change the `runBenchmark(...)`
return contract.

Composition with run lifecycle and observation derivation remains deferred.

## H0-003 Step 6 Validation Record

**Status:** ✅ Accepted

The Step 6 development-environment gate passed with deterministic focused tests
and harmless local shell integration coverage.

Accepted validation boundary:

```text
repositoryPath
  +
validationCommands[]
  ↓
executeBenchmarkValidation(...)
  ↓
BenchmarkValidationResult
  → passed
  → commands[]
      command
      exitCode
      stdout
      stderr
```

Verified execution semantics:

```text
commands execute in declared order
cwd is the resolved workspace
stdout is captured
stderr is captured
exit code is captured
all-zero exits produce passed = true
first non-zero exit produces passed = false
execution stops after first failed command
non-zero exit is evidence rather than infrastructure exception
launch/infrastructure failure propagates
process-wide cwd remains unchanged
```

The default runner intentionally uses shell execution because the current H0-002
benchmark contract stores validation commands as trusted shell strings.

Step 6 remains independent from:

```text
BenchmarkRunObservation
evaluateBenchmarkAcceptance(...)
Git diff/filesChanged derivation
finalOutcome derivation
humanInterventionRequired derivation
Harness/provider/model behavior
```

### Step 7 direction

Proceed to:

```text
H0-003 Step 7 — Benchmark Observation Derivation
```

Step 7 must derive the existing H0-002 acceptance input:

```text
finalOutcome
filesChanged
validationPassed
humanInterventionRequired
```

from already-accepted execution evidence.

It must preserve the existing acceptance semantics and must not change the
B01-B05 expected outcomes merely to make the runner pass.

Before implementing `finalOutcome`, Step 7 should inspect the exact terminal
Harness state/refined-plan evidence available from `HarnessRunResult.state`
rather than infer outcome from telemetry `completed | failed`.

`filesChanged` should prefer deterministic repository/workspace evidence rather
than LLM claims.

Step 7 should derive:

```text
finalOutcome
filesChanged
validationPassed
humanInterventionRequired
```

from accepted execution evidence without changing acceptance semantics.

## H0-003 Step 7 — Benchmark Observation Derivation

**Status:** ✅ Accepted

### Objective

Derive the existing H0-002 `BenchmarkRunObservation` from accepted H0-003
execution evidence without changing benchmark acceptance semantics.

The target contract already exists:

```ts
type BenchmarkRunObservation = Readonly<{
  finalOutcome: BenchmarkExpectedOutcome;
  filesChanged: readonly string[];
  validationPassed: boolean;
  humanInterventionRequired: boolean;
}>;
```

Step 7 must populate those four fields deterministically.

### Source evidence

Current Harness state exposes the final planning outcome explicitly:

```text
state.refinedPlan.outcome
  → changes_required
  → already_satisfied
  → blocked
```

Current graph behavior is important:

```text
changes_required / already_satisfied
  → valid plan gate
  → report
  → state.status = completed
  → failureReason = undefined

blocked
  → plan gate copies blockingUnknowns into failureReason
  → failed route
  → state.status = failed
  → refinedPlan.outcome remains blocked
```

Therefore:

```text
telemetry.finalStatus
```

must not determine benchmark outcome.

In particular:

```text
blocked
```

is a legitimate benchmark outcome even though the current graph terminates with:

```text
status = failed
```

### `finalOutcome` derivation

Preferred deterministic rule:

```text
if refinedPlan is absent
  → observation cannot be derived

if refinedPlan.outcome = blocked
  and state.status = failed
  and failureReason is present
  → finalOutcome = blocked

if refinedPlan.outcome = already_satisfied
  and state.status = completed
  and failureReason is absent
  → finalOutcome = already_satisfied

if refinedPlan.outcome = changes_required
  and state.status = completed
  and failureReason is absent
  → finalOutcome = changes_required

otherwise
  → observation cannot be derived
```

This prevents malformed/failed plan-gate states from being scored as successful
benchmark outcomes merely because a `refinedPlan` object exists.

Step 7 should introduce a narrow deterministic derivation error rather than
fabricating an outcome when terminal state evidence is inconsistent.

### `filesChanged` derivation

Do not trust LLM claims.

Do not use `state.filesChanged` as the primary benchmark source in H0-003.

Current application initialization sets:

```text
filesChanged = []
```

and the current planning graph does not deterministically populate it.

Step 7 must derive changed files from the isolated Git workspace before cleanup.

Preferred evidence:

```text
git status --porcelain
```

or another deterministic Git query that can represent:

```text
modified
added/untracked
deleted
renamed
```

The resulting observation should expose repository-relative paths only.

The Git evidence collector must:

```text
run inside / against the resolved workspace
not change process cwd
not use LLM output
not mutate repository state
not require network
```

Exact porcelain parsing must be locked by deterministic tests.

### `validationPassed` derivation

Step 6 already established:

```text
BenchmarkValidationResult.passed
```

Therefore:

```text
validationPassed
  ← validationResult.passed
```

No validation command may be re-executed during observation derivation.

### `humanInterventionRequired` semantics

This field is operational, not semantic.

A benchmark concluding:

```text
blocked
```

does **not** by itself mean that a human intervened in the run.

This distinction is required by the existing H0-002 acceptance evaluator:

```text
if humanInterventionRequired
  → human_intervention_required failure
```

If Step 7 mapped:

```text
blocked → humanInterventionRequired = true
```

then the fixed B05 benchmark, whose expected outcome is `blocked`, could never
be accepted.

Therefore:

```text
humanInterventionRequired
```

must represent an actual external/manual intervention requirement in the runner
lifecycle.

The current H0-003 automated path has no manual-intervention mechanism.

For the current runner baseline:

```text
humanInterventionRequired = false
```

must be supplied/recorded explicitly by deterministic runner evidence.

Do not infer it from:

```text
finalOutcome
failureReason
status
blockingUnknowns
```

A future interactive runner may add a real intervention signal, but that is not
part of Step 7.

### Preferred observation input

Introduce a narrow evidence input rather than passing arbitrary benchmark state.

Preferred conceptual shape:

```ts
type BenchmarkObservationEvidence = Readonly<{
  harnessResult: HarnessRunResult;
  filesChanged: readonly string[];
  validation: BenchmarkValidationResult;
  humanInterventionRequired: boolean;
}>;
```

Then:

```ts
deriveBenchmarkRunObservation(
  evidence: BenchmarkObservationEvidence,
): BenchmarkRunObservation
```

The exact name may be refined by implementation evidence.

### Git changed-files collector

Preferred new infrastructure:

```text
src/benchmarks/changed-files.ts
```

with a narrow API such as:

```ts
collectBenchmarkChangedFiles(
  repositoryPath: string,
): Promise<readonly string[]>
```

It should use the system Git CLI with explicit argument arrays.

Do not reuse the worktree resolver's private Git implementation by creating
cross-layer coupling.

A very small shared Git runner abstraction may be extracted only if source
evidence shows duplication is becoming harmful; structural refactor must remain
separate from behavior.

### Observation derivation module

Preferred file:

```text
src/benchmarks/observation.ts
```

This module should remain pure except for receiving already-collected evidence.

It must not:

```text
run Git
run validation commands
run Harness
call providers
evaluate benchmark acceptance
```

### Deterministic tests

Preferred tests:

```text
src/test-h0-003-benchmark-changed-files.ts
src/test-h0-003-benchmark-observation.ts
```

The changed-files test must use a temporary local Git fixture and prove:

```text
clean workspace → []
modified tracked file → relative path
untracked file → relative path
deleted file → relative path
renamed file → deterministic repository-relative representation
no process cwd mutation
no repository mutation from collection
no network
```

The observation test must prove:

```text
completed + changes_required → changes_required
completed + already_satisfied → already_satisfied
failed + valid blocked refined plan → blocked

missing refinedPlan → derivation error
failed changes_required → derivation error
failed already_satisfied → derivation error
completed blocked → derivation error
failureReason on completed success outcome → derivation error

filesChanged passes through deterministic Git evidence
validationPassed comes only from validation result
humanInterventionRequired passes through explicit runner evidence
blocked does not automatically imply human intervention
acceptance evaluator is not called
```

### Composition boundary

Step 7 may add derivation/collection modules independently.

Do not yet redesign `runBenchmark(...)` if doing so would mix:

```text
execution
validation
changed-file collection
observation
acceptance
```

into one large behavioral patch.

Prefer accepting observation derivation first.

Full runner composition belongs to the next H0-003 slice.

### Files

Preferred create:

```text
src/benchmarks/changed-files.ts
src/benchmarks/observation.ts
src/test-h0-003-benchmark-changed-files.ts
src/test-h0-003-benchmark-observation.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/benchmarks/acceptance.ts
src/benchmarks/cases.ts
src/benchmarks/contracts.ts
src/benchmarks/task-adapter.ts
src/benchmarks/git-worktree-workspace.ts
src/benchmarks/validation.ts
src/intake/*
src/app/run-harness.ts
src/state.ts
src/graph/*
src/providers/*
src/telemetry/*
```

unless deterministic implementation evidence exposes a concrete pre-existing
contract defect.

### Non-goals

Do not yet:

- change H0-002 acceptance semantics;
- change B01-B05 expected outcomes;
- make `blocked` imply manual intervention;
- infer outcome from telemetry `completed | failed`;
- trust LLM-provided changed-file claims;
- execute validation commands again;
- invoke `evaluateBenchmarkAcceptance(...)`;
- run B01-B05 end-to-end;
- create comparison reports;
- alter provider/model behavior;
- change graph routing;
- change refined-plan schema.

### Acceptance criteria

- [x] observation derivation module exists.
- [x] changed-file collection is deterministic Git evidence.
- [x] changed files are repository-relative.
- [x] clean workspace produces no changed files.
- [x] modified/untracked/deleted files are detected.
- [x] rename behavior is deterministic and characterized.
- [x] changed-file collection does not mutate cwd.
- [x] `finalOutcome` comes from valid terminal refined-plan evidence.
- [x] telemetry final status is not used as benchmark outcome.
- [x] valid `blocked` state derives `blocked` despite graph status `failed`.
- [x] invalid/inconsistent terminal states fail derivation.
- [x] missing refined plan fails derivation.
- [x] `validationPassed` comes from Step 6 evidence.
- [x] validation commands are not rerun.
- [x] `humanInterventionRequired` is explicit runner evidence.
- [x] `blocked` does not imply human intervention.
- [x] no acceptance evaluation occurs.
- [x] no provider/Harness execution occurs in focused tests.
- [x] no new runtime dependency is added.
- [x] H0-003 Steps 1-6 remain green.
- [x] H0-002A/H0-002 regression remains green.

### Targeted gate

```bash
npm run typecheck && \
npm run test:h0-003-benchmark-changed-files && \
npm run test:h0-003-benchmark-observation && \
npm run test:h0-003-benchmark-validation && \
npm run test:h0-003-run-benchmark && \
npm run test:h0-003-git-worktree-workspace && \
npm run test:h0-003-workspace-contract && \
npm run test:h0-003-benchmark-task-adapter && \
npm run test:h0-003-runner-boundary-characterization && \
npm run test:h0-002a-acceptance && \
npm run test:h0-002-acceptance && \
npm run test:benchmark-suite-validation && \
npm run test:benchmark-acceptance && \
npm run test:benchmark-contract
```

### Commit

After acceptance:

```bash
git commit -m "feat(benchmark): derive run observation"
```

### Exit condition

Step 7 is accepted when all four existing `BenchmarkRunObservation` fields can
be derived from deterministic, source-backed evidence without changing H0-002
acceptance semantics.

**Expected next step:**

```text
H0-003 Step 8 — Complete Benchmark Runner Composition
```

## H0-003 Step 7 Implementation Record

**Status:** ✅ Accepted

Implemented deterministic evidence boundaries:

```text
isolated Git workspace
  ↓
collectBenchmarkChangedFiles(...)
  ↓
repository-relative filesChanged[]

HarnessRunResult.state
  +
BenchmarkValidationResult
  +
explicit intervention evidence
  ↓
deriveBenchmarkRunObservation(...)
  ↓
BenchmarkRunObservation
```

Changed-file collection uses only Git evidence:

```text
git diff --name-only --relative HEAD --
git ls-files --others --exclude-standard
```

The collector returns a sorted, deduplicated list of repository-relative paths
and performs no repository mutation.

Rename behavior is characterized by Git's tracked diff semantics:

```text
staged rename
  → destination path
```

Observation derivation enforces terminal-state consistency:

```text
changes_required
  → completed
  → no failureReason

already_satisfied
  → completed
  → no failureReason

blocked
  → failed
  → failureReason required
```

Missing or inconsistent refined-plan evidence produces a deterministic
`BenchmarkObservationDerivationError`.

The derivation explicitly does not infer:

```text
blocked → human intervention
telemetry completed/failed → benchmark outcome
state.filesChanged → benchmark changed files
```

`validationPassed` is taken directly from accepted Step 6 evidence and
`humanInterventionRequired` is explicit runner evidence.

No validation command is rerun and no acceptance evaluator is called.

## H0-003 Step 7 Validation Record

**Status:** ✅ Accepted

The Step 7 development-environment gate passed after one test-only correction
that preserved the leading status column returned by `git status --porcelain`
by replacing a full-string trim with trailing-whitespace trimming.

No production behavior changed after the implementation patch.

Accepted deterministic evidence boundaries:

```text
isolated Git workspace
  ↓
collectBenchmarkChangedFiles(...)
  ↓
repository-relative filesChanged[]

HarnessRunResult.state
  +
BenchmarkValidationResult
  +
explicit runner intervention evidence
  ↓
deriveBenchmarkRunObservation(...)
  ↓
BenchmarkRunObservation
```

Verified outcome semantics:

```text
changes_required
  → completed
  → no failureReason

already_satisfied
  → completed
  → no failureReason

blocked
  → failed
  → failureReason required
```

Verified evidence semantics:

```text
filesChanged
  → Git evidence, not LLM/state claims

validationPassed
  → Step 6 validation result

humanInterventionRequired
  → explicit runner evidence

blocked
  ≠ human intervention
```

Inconsistent terminal-state combinations fail with
`BenchmarkObservationDerivationError` rather than being scored.

Changed-file collection is deterministic, repository-relative, non-mutating,
offline, and independent from process-wide `cwd`.

### Step 8 direction

Proceed to:

```text
H0-003 Step 8 — Complete Benchmark Runner Composition
```

Step 8 should compose the already-accepted boundaries:

```text
BenchmarkTask
  ↓
task adapter
  ↓
workspace resolver
  ↓
runHarness(...)
  ↓
validation executor
  ↓
changed-file collector
  ↓
observation derivation
  ↓
evaluateBenchmarkAcceptance(...)
  ↓
runner result
  ↓
cleanup in finally
```

Step 8 must preserve existing H0-002 acceptance semantics and keep comparison
reporting outside the runner.

The first implementation should use injected dependencies in deterministic tests
so the full lifecycle can be proven without provider cost before any B01-B05
end-to-end benchmark execution.

Step 8 should compose:

```text
task adapter
workspace resolution
runHarness
validation
changed-file collection
observation derivation
existing acceptance evaluator
cleanup
```

into one benchmark-run result while preserving the already-accepted ownership
boundaries.

## H0-003 Step 8 — Complete Benchmark Runner Composition

**Status:** ✅ Accepted

### Objective

Compose the already-accepted H0-003 boundaries into one complete deterministic
benchmark runner lifecycle:

```text
BenchmarkTask
  ↓
adaptBenchmarkTaskToHarnessTask(...)
  ↓
BenchmarkWorkspaceResolver.resolve(...)
  ↓
runHarness(...)
  ↓
executeBenchmarkValidation(...)
  ↓
collectBenchmarkChangedFiles(...)
  ↓
deriveBenchmarkRunObservation(...)
  ↓
evaluateBenchmarkAcceptance(...)
  ↓
BenchmarkRunnerResult
  ↓
cleanup in finally
```

Step 8 is the final H0-003 composition slice.

It must preserve every ownership boundary established in Steps 1-7 and must not
change H0-002 acceptance semantics.

### Architectural rule

The runner owns sequencing only.

It must not duplicate or reimplement:

```text
task normalization
workspace isolation
Harness execution
validation command policy
Git changed-file detection
observation semantics
acceptance semantics
```

Those concerns already have accepted boundaries.

### Preferred production API

Create or evolve:

```text
src/benchmarks/run-benchmark.ts
```

toward a complete runner result.

Preferred conceptual shape:

```ts
type BenchmarkRunnerResult = Readonly<{
  harness: HarnessRunResult;
  validation: BenchmarkValidationResult;
  observation: BenchmarkRunObservation;
  acceptance: BenchmarkAcceptanceResult;
}>;

type RunBenchmarkDependencies = Readonly<{
  workspaceResolver: BenchmarkWorkspaceResolver;
  runHarness?: BenchmarkHarnessExecutor;
  executeValidation?: typeof executeBenchmarkValidation;
  collectChangedFiles?: typeof collectBenchmarkChangedFiles;
  evaluateAcceptance?: typeof evaluateBenchmarkAcceptance;
}>;
```

Exact names may be refined by implementation evidence.

### Required sequence

The runner must execute in this exact order:

```text
1. adapt BenchmarkTask → NormalizedHarnessTask
2. resolve BenchmarkRepositoryRef → isolated workspace
3. run Harness in resolved workspace
4. execute benchmark validation commands in the same workspace
5. collect deterministic changed-file evidence before cleanup
6. derive BenchmarkRunObservation
7. evaluate existing H0-002 acceptance
8. return complete runner result
9. cleanup workspace in finally
```

### Cleanup rule

Workspace cleanup must remain guaranteed with `try/finally`.

Cleanup must happen after:

```text
successful runner completion
Harness failure
validation infrastructure failure
changed-files infrastructure failure
observation derivation failure
acceptance evaluation failure
```

A normal benchmark validation failure:

```text
exitCode != 0
```

is not an infrastructure exception and therefore should still produce:

```text
validation.passed = false
observation.validationPassed = false
acceptance result
```

before cleanup.

### Failure semantics

#### Workspace resolution failure

```text
no Harness call
no validation
no changed-file collection
no observation
no acceptance
resolution error propagates
```

#### Harness failure

```text
cleanup executes
downstream validation/observation/acceptance do not execute
original Harness error propagates
```

This step does not reinterpret Harness infrastructure failure as benchmark
`blocked`.

#### Validation infrastructure failure

```text
cleanup executes
changed-file collection does not execute
observation/acceptance do not execute
original infrastructure error propagates
```

#### Validation command failure

```text
validation result is returned as evidence
changed-file collection still executes
observation derives validationPassed = false
acceptance evaluator decides benchmark failure
runner returns acceptance evidence
```

#### Changed-file collection failure

```text
cleanup executes
observation/acceptance do not execute
original collector error propagates
```

#### Observation derivation failure

```text
cleanup executes
acceptance does not execute
derivation error propagates
```

#### Cleanup failure

Preserve Step 5 semantics:

```text
cleanup failure after otherwise successful runner
  → cleanup failure propagates

primary runner failure + cleanup failure
  → primary runner failure is preserved
```

Do not add generic aggregate-error infrastructure in this step.

### Human intervention baseline

The current automated H0-003 runner has no manual intervention mechanism.

Therefore Step 8 must pass explicit deterministic runner evidence:

```text
humanInterventionRequired = false
```

into observation derivation.

Do not infer it from:

```text
blocked
failureReason
status
validation failure
```

A future interactive runner may replace this with a real intervention signal.

### Acceptance boundary

Step 8 must call the existing:

```text
evaluateBenchmarkAcceptance(...)
```

without changing:

```text
BenchmarkRunObservation
BenchmarkAcceptanceResult
failure codes
expected outcome semantics
B01-B05 definitions
```

The runner should pass:

```text
benchmark
observation
```

exactly as required by the current H0-002 acceptance function.

### Deterministic dependency injection

The focused Step 8 test must avoid provider cost.

Use injected fakes for:

```text
workspace resolver
runHarness
validation executor
changed-file collector
```

The real acceptance evaluator and observation derivation may be used directly
because they are deterministic and already accepted.

If helpful, acceptance evaluation may also remain injectable for sequencing
tests, but the final deterministic test must prove compatibility with the real
H0-002 evaluator.

### Required deterministic tests

Create or evolve:

```text
src/test-h0-003-run-benchmark.ts
```

or add:

```text
src/test-h0-003-complete-benchmark-runner.ts
```

Prefer a new focused test if changing the existing Step 5 test would obscure
the earlier lifecycle guarantees.

The Step 8 test must prove:

```text
exact lifecycle ordering
same resolved workspace is used for Harness, validation, and changed-file collection
validation receives benchmark.validationCommands unchanged
changed files are collected before cleanup
observation uses final Harness state + validation + changed files
humanInterventionRequired baseline is false
real acceptance evaluator accepts a matching synthetic case
real acceptance evaluator rejects a mismatched synthetic case
validation failure is evidence, not runner infrastructure failure
cleanup runs after full success
cleanup runs after each infrastructure failure boundary
acceptance runs only after observation is derived
no graph/provider internals are imported directly
no benchmark definitions are mutated
```

### Result contract

The final H0-003 runner result must preserve evidence needed by H0-004.

At minimum it should expose:

```text
HarnessRunResult
BenchmarkValidationResult
BenchmarkRunObservation
BenchmarkAcceptanceResult
```

Do not discard telemetry contained in `HarnessRunResult`.

H0-004 comparison reporting will consume this evidence later.

### Files

Expected modify:

```text
src/benchmarks/run-benchmark.ts
src/test-h0-003-run-benchmark.ts
```

or create a separate focused test:

```text
src/test-h0-003-complete-benchmark-runner.ts
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
src/benchmarks/task-adapter.ts
src/benchmarks/workspace.ts
src/benchmarks/git-worktree-workspace.ts
src/benchmarks/validation.ts
src/benchmarks/changed-files.ts
src/benchmarks/observation.ts
src/intake/*
src/app/run-harness.ts
src/state.ts
src/graph/*
src/providers/*
src/telemetry/*
```

unless deterministic composition exposes a concrete pre-existing contract
defect.

### Non-goals

Do not yet:

- execute B01-B05 against real providers;
- add benchmark-suite iteration;
- add concurrency;
- add comparison reporting;
- calculate SFCR aggregates across runs;
- change telemetry schema;
- change benchmark definitions;
- change provider/model routing;
- add job queues;
- add UI;
- add remote repository cloning;
- add retry policy around benchmark infrastructure.

### Acceptance criteria

- [x] complete benchmark runner result exists.
- [x] runner composes all accepted Steps 2-7 boundaries.
- [x] lifecycle order is deterministic.
- [x] same isolated workspace is used by Harness, validation, and changed-file collection.
- [x] validation commands come from the selected BenchmarkTask unchanged.
- [x] validation command failure remains evidence, not infrastructure exception.
- [x] changed files are collected before cleanup.
- [x] observation is derived exactly once.
- [x] `humanInterventionRequired` baseline is explicit false.
- [x] existing H0-002 acceptance evaluator is called.
- [x] acceptance semantics are unchanged.
- [x] matching synthetic observation is accepted.
- [x] mismatched synthetic observation is rejected with existing failure codes.
- [x] complete runner result preserves Harness/validation/observation/acceptance evidence.
- [x] cleanup runs after successful complete execution.
- [x] cleanup runs after Harness failure.
- [x] cleanup runs after validation infrastructure failure.
- [x] cleanup runs after changed-file collection failure.
- [x] cleanup runs after observation derivation failure.
- [x] primary failure is preserved if cleanup also fails.
- [x] no direct graph/provider import exists.
- [x] no benchmark definition is mutated.
- [x] no new runtime dependency is added.
- [x] H0-003 Steps 1-7 remain green.
- [x] H0-002A/H0-002 regression remains green.

### Targeted gate

```bash
npm run typecheck && \
npm run test:h0-003-complete-benchmark-runner && \
npm run test:h0-003-benchmark-changed-files && \
npm run test:h0-003-benchmark-observation && \
npm run test:h0-003-benchmark-validation && \
npm run test:h0-003-run-benchmark && \
npm run test:h0-003-git-worktree-workspace && \
npm run test:h0-003-workspace-contract && \
npm run test:h0-003-benchmark-task-adapter && \
npm run test:h0-003-runner-boundary-characterization && \
npm run test:h0-002a-acceptance && \
npm run test:h0-002-acceptance && \
npm run test:benchmark-suite-validation && \
npm run test:benchmark-acceptance && \
npm run test:benchmark-contract
```

### Commit

After acceptance:

```bash
git commit -m "feat(benchmark): compose complete runner"
```

### Exit condition

H0-003 is functionally complete when one `BenchmarkTask` can move through:

```text
task adaptation
workspace isolation
Harness execution
validation
changed-file evidence
observation derivation
acceptance evaluation
cleanup
```

and return a complete deterministic result without violating any accepted
boundary.

After Step 8, do not immediately begin H1.

The next milestone is:

```text
H0-004 — Comparison Report
```

## H0-003 Step 8 Implementation Record

**Status:** ✅ Accepted

Implemented a separate complete composition boundary:

```text
src/benchmarks/complete-runner.ts
```

The earlier Step 5 `runBenchmark(...)` lifecycle remains unchanged so its
focused orchestration contract and regression test remain intact.

Complete runner sequence:

```text
BenchmarkTask
  ↓
adaptBenchmarkTaskToHarnessTask(...)
  ↓
BenchmarkWorkspaceResolver.resolve(...)
  ↓
runHarness(...)
  ↓
executeBenchmarkValidation(...)
  ↓
collectBenchmarkChangedFiles(...)
  ↓
deriveBenchmarkRunObservation(...)
  ↓
evaluateBenchmarkAcceptance(...)
  ↓
CompleteBenchmarkRunnerResult
  ↓
cleanup in finally
```

The complete result preserves:

```text
HarnessRunResult
BenchmarkValidationResult
BenchmarkRunObservation
BenchmarkAcceptanceResult
```

The automated H0-003 baseline supplies:

```text
humanInterventionRequired = false
```

explicitly rather than inferring intervention from `blocked`, status, or
failureReason.

Failure policy remains boundary-specific:

```text
workspace resolution failure
  → no execution lifecycle

Harness / validation infrastructure / changed-files / observation / acceptance
failure
  → cleanup
  → primary error propagates

validation command non-zero exit
  → normal validation evidence
  → observation
  → existing acceptance evaluator

cleanup failure after success
  → cleanup error propagates

primary runner failure + cleanup failure
  → primary runner error preserved
```

Focused tests use injected dependencies and the real H0-002 observation and
acceptance semantics without provider cost.

No benchmark definitions, acceptance semantics, graph/provider behavior, or
telemetry contracts are changed.

## H0-003 Final Validation Record

**Status:** ✅ Milestone accepted

The complete Step 8 development-environment gate passed.

H0-003 now has a complete deterministic benchmark runner composition:

```text
BenchmarkTask
  ↓
adaptBenchmarkTaskToHarnessTask(...)
  ↓
BenchmarkWorkspaceResolver.resolve(...)
  ↓
runHarness(...)
  ↓
executeBenchmarkValidation(...)
  ↓
collectBenchmarkChangedFiles(...)
  ↓
deriveBenchmarkRunObservation(...)
  ↓
evaluateBenchmarkAcceptance(...)
  ↓
CompleteBenchmarkRunnerResult
  ↓
cleanup in finally
```

Accepted runner evidence:

```text
HarnessRunResult
BenchmarkValidationResult
BenchmarkRunObservation
BenchmarkAcceptanceResult
```

Accepted behavioral guarantees across H0-003:

```text
machine-independent task identity
isolated exact-revision Git worktrees
baseline immutability
explicit cleanup ownership
benchmark-neutral Harness application boundary
ordered validation execution
captured validation evidence
Git-derived changed-file evidence
source-backed finalOutcome derivation
blocked does not imply human intervention
existing H0-002 acceptance semantics preserved
primary failures preserved across cleanup
no direct graph/provider ownership in benchmark runner
```

### H0-003 milestone conclusion

H0-003 is functionally complete.

The runner can now execute one benchmark task through all required deterministic
boundaries and return evidence suitable for comparison.

No B01-B05 provider-backed comparison is claimed yet.

### Next milestone

Proceed to:

```text
H0-004 — Comparison Report
```

H0-004 must use the fixed benchmark suite to measure the Harness rather than
continue adding architecture.

The comparison milestone should produce evidence around:

```text
SFCR / accepted completion
outcome correctness
validation success
human intervention
latency
LLM calls / usage / cost where available
files changed
failure reasons
task-by-task evidence
```

H0-004 is the GO / PIVOT / STOP checkpoint.

Do not automatically start H1 Repository Intelligence or H2 Context Engine
until the comparison evidence is reviewed.

H0-004 should execute and compare the fixed benchmark suite and produce the
evidence required for the GO / PIVOT / STOP checkpoint before repository
intelligence or Context Engine work begins.

## H0-004 Step 1 — Comparison Contract & Metrics

**Status:** ✅ Accepted

### Objective

Freeze the comparison contract before executing B01-B05 against the real Harness.

H0-004 is a measurement milestone, not an architecture milestone. The comparison
layer must consume evidence already produced by H0-003 and H0-001 telemetry and
summarize it without changing task definitions, acceptance semantics, provider
behavior, or runner behavior.

### Decision question

```text
Does the Harness provide enough measurable value to justify continued
investment beyond H0?
```

The milestone must support a final:

```text
GO
PIVOT
STOP
```

decision.

### Unit of comparison

```text
BenchmarkTask
  +
CompleteBenchmarkRunnerResult
  ↓
BenchmarkComparisonRecord
```

The comparison record must preserve task-level evidence rather than only
aggregate numbers.

### Required per-task evidence

Each record must preserve at least:

```text
benchmarkId
difficulty
expectedOutcome
observedOutcome
accepted
acceptanceFailures[]
validationPassed
humanInterventionRequired
filesChanged[]
Harness duration / latency
LLM call count
token / usage evidence when available
cost evidence when available
terminal failureReason when available
```

### SFCR

Primary metric:

```text
SFCR = Successful First Completion Rate
```

For H0-004, successful first completion means:

```text
benchmark acceptance = accepted
humanInterventionRequired = false
no external re-run of the benchmark task
```

Do not redefine SFCR from only `status = completed`, `validationPassed = true`,
or outcome equality.

### Outcome correctness

Track independently:

```text
expectedOutcome === observation.finalOutcome
```

This remains useful even when acceptance fails because of unexpected changes,
validation failure, or human intervention.

### Validation success

Track independently:

```text
observation.validationPassed
```

### Human intervention

Track:

```text
observation.humanInterventionRequired
```

Do not infer intervention from `blocked`.

### Files changed

Preserve the exact Git-derived:

```text
observation.filesChanged[]
```

The comparison layer may additionally derive `filesChangedCount`.

### Latency

Use existing H0-001 run telemetry when available.

Do not mix Harness execution duration, workspace setup, validation, and report
generation into one unlabeled metric.

If telemetry exposes start/end timestamps instead of a direct duration, Step 1
must characterize the exact derivation before implementation.

### LLM usage

Use provider-neutral H0-001 telemetry.

Track where available:

```text
LLM call count
provider/model identifiers
input token evidence
output token evidence
total token evidence
provider-reported usage
```

Do not fabricate missing usage. Missing usage is unavailable, not zero.

### Cost

Cost is optional evidence.

If telemetry already contains cost, preserve it. Otherwise:

```text
cost = unavailable
```

Do not add provider pricing tables in Step 1.

### Failure evidence

Preserve independently:

```text
BenchmarkAcceptanceResult.failures[]
Harness state.failureReason
```

Do not collapse them into one generic failure string.

### Aggregate metrics enabled by this contract

The future report must be able to compute:

```text
total tasks
accepted tasks
SFCR
outcome correctness rate
validation success rate
human-intervention rate
mean/median Harness duration
total LLM calls
token totals where complete
task-by-task acceptance failures
```

With only five fixed tasks, raw task records must remain visible beside
aggregates.

### Missing-data semantics

Missing evidence must be explicit, preferably `number | null` or an equivalent
strongly typed representation.

Do not silently coerce:

```text
unknown token usage → 0
unknown cost → 0
missing failure reason → success
```

### Step 1 source inspection

Before implementation, inspect exact current contracts for:

```text
CompleteBenchmarkRunnerResult
BenchmarkAcceptanceResult
BenchmarkRunObservation
RunTelemetry
LLM-call telemetry
PersistedRunTelemetry
```

Exact field names and missing-data semantics must come from current source.

### Preferred module

```text
src/benchmarks/comparison.ts
```

Preferred conceptual record:

```ts
type BenchmarkComparisonRecord = Readonly<{
  benchmarkId: string;
  difficulty: BenchmarkDifficulty;
  expectedOutcome: BenchmarkExpectedOutcome;
  observedOutcome: BenchmarkExpectedOutcome;
  accepted: boolean;
  acceptanceFailures: readonly BenchmarkAcceptanceFailure[];
  validationPassed: boolean;
  humanInterventionRequired: boolean;
  filesChanged: readonly string[];
  harnessDurationSeconds: number | null;
  llmCallCount: number;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  cost: number | null;
  terminalFailureReason: string | null;
}>;
```

Exact names must be source-backed.

### Deterministic test

Preferred:

```text
src/test-h0-004-comparison-contract.ts
```

It must prove that one complete runner result maps to one comparison record while
preserving existing acceptance and observation evidence, and that unavailable
usage/cost remains explicit.

No provider, graph, runner, Git, validation, or workspace execution is allowed.

### Files

Preferred create:

```text
src/benchmarks/comparison.ts
src/test-h0-004-comparison-contract.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not change benchmark definitions, acceptance semantics, complete runner,
telemetry contracts, providers, graph, or Harness behavior merely to simplify
reporting.

### Non-goals

Do not yet:

- run B01-B05;
- add suite iteration;
- generate Markdown/JSON reports;
- define GO/PIVOT/STOP thresholds;
- estimate costs from external pricing;
- change telemetry;
- change prompts/models/providers;
- add retries to improve benchmark scores.

### Acceptance criteria

- [x] comparison record contract exists.
- [x] benchmark identity/difficulty are preserved.
- [x] expected and observed outcomes are preserved.
- [x] acceptance result is preserved, not recomputed.
- [x] validation evidence is preserved.
- [x] human-intervention evidence is preserved.
- [x] exact filesChanged list is preserved.
- [x] Harness duration source is characterized.
- [x] LLM call-count source is characterized.
- [x] token usage missing-data semantics are explicit.
- [x] cost missing-data semantics are explicit.
- [x] terminal Harness failureReason is preserved independently.
- [x] no provider/runner execution occurs.
- [x] no benchmark semantics change.
- [x] no new runtime dependency is added.
- [x] H0-003 full gate remains green.
- [x] H0-002/H0-001 regressions remain green.

### Commit

```bash
git commit -m "feat(benchmark): define comparison metrics"
```

### Exit condition

Step 1 is accepted when one `CompleteBenchmarkRunnerResult` can be transformed
into one comparison-ready record with explicit missing-data semantics and
without re-running or re-scoring the benchmark.

## H0-004 Step 1 Source Evidence Record

Current contracts establish these exact comparison sources:

```text
Harness duration
  ← HarnessRunResult.telemetry.durationMs

LLM call count
  ← HarnessRunResult.telemetry.llmCalls.length

LLM model identity
  ← RunTelemetry.llmCalls[].model

LLM role
  ← RunTelemetry.llmCalls[].role

prompt tokens
completion tokens
total tokens
  ← optional per-call H0-001 telemetry fields

provider identity
  → not currently present in LlmCallTelemetry

cost
  → not currently present in H0-001 telemetry

terminal failure reason
  ← HarnessRunResult.state.failureReason
```

Token aggregation semantics are source-safe:

```text
zero LLM calls
  → known total = 0

one or more calls and every call reports a token field
  → sum the field

one or more calls and any call omits a token field
  → aggregate = null
```

Cost remains:

```text
null
```

because current telemetry has no cost evidence.

The comparison record preserves full per-call `LlmCallTelemetry[]` so model,
role, elapsed time, and any available usage remain available to later H0-004
reporting without expanding telemetry contracts.

## H0-004 Step 1 Implementation Record

**Status:** ✅ Accepted

Implemented:

```text
BenchmarkTask
  +
CompleteBenchmarkRunnerResult
  ↓
createBenchmarkComparisonRecord(...)
  ↓
BenchmarkComparisonRecord
```

The record preserves existing acceptance and observation evidence rather than
recomputing benchmark correctness.

It also derives only source-backed summaries:

```text
filesChangedCount
harnessDurationMs
llmCallCount
complete token aggregates when available
```

No runner, provider, graph, workspace, validation command, or benchmark
acceptance execution occurs in the focused test.

## H0-004 Step 1 Validation Record

**Status:** ✅ Accepted

The focused comparison-contract gate passed.

Accepted comparison sources:

```text
Harness duration
  ← RunTelemetry.durationMs

LLM call count
  ← RunTelemetry.llmCalls.length

LLM model / role / elapsed
  ← RunTelemetry.llmCalls[]

promptTokens / completionTokens / totalTokens
  ← optional per-call telemetry fields

cost
  → unavailable in current telemetry
  → represented as null

terminal failure reason
  ← HarnessRunResult.state.failureReason
```

Accepted missing-data semantics:

```text
zero LLM calls
  → known token total = 0

one or more calls with complete usage
  → summed token totals

one or more calls with incomplete usage
  → token aggregate = null

missing cost evidence
  → cost = null
```

The comparison layer preserves H0-003 observation/acceptance evidence and does
not recompute benchmark correctness.

### Step 2 direction

Proceed to:

```text
H0-004 Step 2 — Benchmark Suite Runner
```

Step 2 should execute the fixed B01-B05 suite through the accepted complete
runner and persist one comparison record per benchmark execution.

Before real provider-backed execution, Step 2 must first prove suite iteration,
result persistence, failure isolation, and no hidden retry/re-run behavior with
deterministic injected runners.

**Expected next step:**

```text
H0-004 Step 2 — Benchmark Suite Runner
```

## H0-004 Step 2 — Benchmark Suite Runner

**Status:** ✅ Accepted

### Objective

Execute the fixed H0-002 benchmark suite through the accepted H0-003 complete
runner and persist one task-level comparison record per execution.

Step 2 must first prove suite sequencing, persistence, failure isolation, and
first-run semantics with deterministic injected dependencies before any
provider-backed B01-B05 execution.

### Fixed suite boundary

The suite is the existing immutable H0-002 benchmark set:

```text
B01
B02
B03
B04
B05
```

Step 2 must consume the existing exported benchmark suite.

It must not redefine, reorder for convenience, or mutate benchmark cases merely
to improve scores.

### Runner composition

For each selected `BenchmarkTask`:

```text
BenchmarkTask
  ↓
runCompleteBenchmark(...)
  ↓
CompleteBenchmarkRunnerResult
  ↓
createBenchmarkComparisonRecord(...)
  ↓
persist comparison record
```

The suite runner owns iteration and persistence only.

It must not duplicate:

```text
workspace resolution
Harness execution
validation
changed-file collection
observation derivation
acceptance evaluation
comparison-record mapping
```

### First-run semantics

H0-004 measures first completion.

Therefore the suite runner must not automatically retry a benchmark task after:

```text
Harness failure
validation failure
acceptance failure
blocked outcome
comparison failure
```

One selected benchmark execution corresponds to one suite attempt.

Infrastructure retry policy is explicitly outside Step 2.

### Failure isolation

A single benchmark infrastructure failure must not erase already-completed
comparison records.

Preferred behavior:

```text
B01 completes
  → record persisted

B02 infrastructure failure
  → failure record/evidence persisted or surfaced

B03...
```

The exact continuation policy must be explicit.

Preferred initial policy:

```text
continue to remaining benchmark tasks after one task-level infrastructure
failure
```

Rationale:

```text
the comparison milestone needs evidence across the full fixed suite
one broken benchmark must not hide results from the others
```

The suite result must preserve which tasks could not produce a normal
`BenchmarkComparisonRecord`.

### Suite result contract

Preferred conceptual shape:

```ts
type BenchmarkSuiteTaskResult =
  | Readonly<{
      benchmarkId: string;
      status: "completed";
      comparison: BenchmarkComparisonRecord;
    }>
  | Readonly<{
      benchmarkId: string;
      status: "infrastructure_failed";
      error: BenchmarkSuiteTaskError;
    }>;

type BenchmarkSuiteRunResult = Readonly<{
  tasks: readonly BenchmarkSuiteTaskResult[];
}>;
```

Error shape should be deterministic and serializable.

Do not persist raw `Error` objects as the report contract.

Preferred task error evidence:

```text
name
message
```

Stack traces may remain local diagnostic data but should not be required for
comparison reporting.

### Persistence boundary

Step 2 needs a narrow persistence contract.

Preferred concept:

```ts
interface BenchmarkComparisonStore {
  saveTaskResult(result: BenchmarkSuiteTaskResult): Promise<void>;
}
```

The suite runner should depend on this interface rather than hard-code JSON
filesystem behavior into iteration logic.

A deterministic in-memory store must be sufficient for focused tests.

A concrete JSON/file store may be introduced in Step 2 only if it stays narrow
and is required to perform real suite execution later in the same milestone.

### Persistence semantics

Persistence must happen task-by-task, immediately after each task result is
known.

Do not wait until all B01-B05 finish before writing any evidence.

This guarantees partial evidence survives later failures.

### Ordering

Execute benchmarks in the fixed suite order.

No concurrency in Step 2.

Reasons:

```text
simpler first-run evidence
predictable provider load
deterministic persistence order
easier task-by-task debugging
```

### Dependency injection

Focused deterministic tests must not call a real provider.

Inject a narrow complete-runner function:

```text
BenchmarkTask → CompleteBenchmarkRunnerResult
```

or equivalent dependency seam.

Use the real:

```text
createBenchmarkComparisonRecord(...)
```

where practical to prove comparison compatibility.

### Required deterministic tests

Preferred test:

```text
src/test-h0-004-benchmark-suite-runner.ts
```

The test must prove:

```text
fixed suite order is preserved
each benchmark is executed exactly once
no automatic retry occurs
comparison record is created once per successful task
result is persisted immediately after each task
infrastructure failure is captured deterministically
suite continues after one infrastructure failure
already-completed task evidence remains preserved
all B01-B05 produce one suite task result
benchmark definitions are not mutated
provider/graph/Git real execution does not occur in focused tests
```

Also prove that an acceptance failure is still:

```text
status = completed
comparison.accepted = false
```

not an infrastructure failure.

### Real-suite readiness

Step 2 is not accepted merely because injected iteration works.

Before Step 2 closes, we must also establish how real B01-B05 repository IDs
map to local source repositories/workspace roots.

Do not add absolute paths to benchmark definitions.

Use the accepted:

```text
BenchmarkRepositoryLocator
```

boundary.

If the benchmark fixture repositories do not yet exist locally or revision tags
cannot resolve, record that as a real-suite readiness blocker rather than
changing benchmark identity.

### Files

Preferred create:

```text
src/benchmarks/suite-runner.ts
src/test-h0-004-benchmark-suite-runner.ts
```

Potentially create a narrow persistence module:

```text
src/benchmarks/comparison-store.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify:

```text
src/benchmarks/cases.ts
src/benchmarks/contracts.ts
src/benchmarks/acceptance.ts
src/benchmarks/complete-runner.ts
src/benchmarks/comparison.ts
src/telemetry/*
src/app/run-harness.ts
src/graph/*
src/providers/*
```

unless deterministic source evidence exposes a concrete pre-existing contract
defect.

### Non-goals

Do not yet:

- generate the final Markdown/JSON comparison report;
- aggregate SFCR/mean/median metrics;
- define GO/PIVOT/STOP thresholds;
- run benchmarks concurrently;
- retry failed tasks;
- change benchmark definitions;
- change provider/model behavior;
- add remote clone/download logic;
- add UI.

### Acceptance criteria

- [ ] suite runner exists.
- [ ] fixed B01-B05 suite order is preserved.
- [ ] each benchmark executes at most once per suite run.
- [ ] no automatic retry exists.
- [ ] complete runner is injected/used through a narrow boundary.
- [ ] successful task produces one comparison record.
- [ ] acceptance failure remains a completed comparison result.
- [ ] infrastructure failure is represented separately.
- [ ] suite continues after one task infrastructure failure.
- [ ] one task result exists for each selected benchmark.
- [ ] task result is persisted immediately.
- [ ] persistence order matches execution order.
- [ ] partial completed evidence survives later failures.
- [ ] benchmark definitions are not mutated.
- [ ] focused tests use no provider/graph/Git real execution.
- [ ] no new runtime dependency is added.
- [ ] H0-004 Step 1 remains green.
- [ ] H0-003 full gate remains green.
- [ ] H0-002/H0-001 regressions remain green.
- [ ] real-suite repository/revision readiness is characterized.

### Targeted gate

```bash
npm run typecheck && \
npm run test:h0-004-benchmark-suite-runner && \
npm run test:h0-004-comparison-contract && \
npm run test:h0-003-complete-benchmark-runner && \
npm run test:h0-003-benchmark-changed-files && \
npm run test:h0-003-benchmark-observation && \
npm run test:h0-003-benchmark-validation && \
npm run test:h0-003-run-benchmark && \
npm run test:h0-003-git-worktree-workspace && \
npm run test:h0-003-workspace-contract && \
npm run test:h0-003-benchmark-task-adapter && \
npm run test:h0-003-runner-boundary-characterization && \
npm run test:h0-002a-acceptance && \
npm run test:h0-002-acceptance
```

Run exact existing H0-002/H0-001 regression scripts if package names differ.

### Commit

After acceptance:

```bash
git commit -m "feat(benchmark): run fixed comparison suite"
```

### Exit condition

Step 2 is accepted when the fixed benchmark suite can be executed exactly once
per task, task-level evidence is persisted incrementally, infrastructure
failures remain isolated, and real B01-B05 repository/revision readiness is
known.

## H0-004 Step 2 Implementation Record

**Status:** 🚧 Implemented; awaiting development-environment gate

Implemented the suite-level sequencing boundary:

```text
src/benchmarks/suite-runner.ts
```

The runner consumes the existing fixed `benchmarkCases` export by default and
owns only:

```text
ordered iteration
one execution per benchmark
comparison-record creation
task-level infrastructure-error normalization
incremental persistence
continuation after task execution/comparison infrastructure failure
```

Execution flow:

```text
BenchmarkTask
  ↓
CompleteBenchmarkExecutor
  ↓
CompleteBenchmarkRunnerResult
  ↓
createBenchmarkComparisonRecord(...)
  ↓
BenchmarkSuiteTaskResult
  ↓
BenchmarkComparisonStore.saveTaskResult(...)
  ↓
next benchmark
```

Accepted distinction in the implementation:

```text
CompleteBenchmarkRunnerResult with acceptance.accepted = false
  → status = completed

throw during benchmark execution/comparison derivation
  → status = infrastructure_failed
```

No task is automatically retried.

Infrastructure errors are normalized to serializable:

```text
name
message
```

rather than storing raw `Error` objects.

Persistence is awaited immediately after every task result. A persistence-store
failure aborts the suite, because continuing after evidence cannot be retained
would violate incremental-evidence guarantees.

The deterministic focused test uses the literal B01-B05 suite, verifies exact
order and exactly-once execution, forces B04 infrastructure failure, verifies
B05 still executes, and verifies B03 acceptance failure remains a completed
comparison result.

No real provider, graph, workspace, Git, or validation execution occurs.

## H0-004 Step 2 Real-Suite Readiness Record

The fixed suite requires these machine-independent repository/revision pairs:

```text
B01  fixture-simple-api / b01-v1
B02  fixture-health-already-present / b02-v1
B03  fixture-component-app / b03-v1
B04  qflow-workflow-canvas / b04-v1
B05  qos-harness-architecture / b05-v1
```

Current source evidence confirms the IDs/revisions but does not provide
machine-local `BenchmarkRepositoryLocator` mappings or prove that all five
revisions currently resolve in local Git repositories.

Therefore real provider-backed suite execution is **not yet claimed ready**.

Before Step 2 acceptance, development-environment readiness must explicitly
verify:

```text
repository ID → local repository path
requested revision → resolvable Git commit
```

through the accepted locator/workspace boundary, without placing absolute paths
inside benchmark definitions.

## H0-004 Step 2A — Benchmark Fixture Materialization

**Status:** ✅ Accepted

### Trigger

Development-environment readiness check for the fixed benchmark revisions returned:

```text
b01-v1 → NOT FOUND
b02-v1 → NOT FOUND
b03-v1 → NOT FOUND
b04-v1 → NOT FOUND
b05-v1 → NOT FOUND
```

Therefore H0-004 Step 2 cannot yet be accepted as real-suite ready.

The benchmark definitions are valid machine-independent identities, but the
required repository/revision fixtures have not yet been materialized in the
local development environment.

### Objective

Create deterministic local Git repositories for B01-B03 and deterministic local
Git fixture repositories for B04-B05 so every fixed benchmark repository ID and
revision can resolve through the accepted `BenchmarkRepositoryLocator` boundary.

This substep is fixture/infrastructure preparation only.

It must not change benchmark task semantics or make the benchmark easier.

### Required mappings

```text
fixture-simple-api             → b01-v1
fixture-health-already-present → b02-v1
fixture-component-app          → b03-v1
qflow-workflow-canvas          → b04-v1
qos-harness-architecture       → b05-v1
```

### Important rule

Do not create the required tags on arbitrary current production repositories.

Each benchmark revision must represent the exact baseline state intended by the
benchmark definition.

For B04/B05, if a historical source baseline is required, create a dedicated
fixture repository/snapshot rather than tagging today's mutable development
repository as `b04-v1` or `b05-v1`.

### Source-of-truth inspection

Before materialization, inspect the exact existing B01-B05 definitions and any
H0-002 fixture descriptions/tests to determine the minimum repository contents
required by each task.

Do not infer fixture contents from benchmark titles alone.

### Preferred layout

Use a repository-local or explicitly configured benchmark fixture root, for
example:

```text
<project>/benchmark-fixtures/
  fixture-simple-api/
  fixture-health-already-present/
  fixture-component-app/
  qflow-workflow-canvas/
  qos-harness-architecture/
```

The fixture root itself must not leak into benchmark identity.

`BenchmarkRepositoryLocator` maps stable repository IDs to these machine-local
paths.

### Fixture requirements

Each fixture repository must:

```text
be a valid Git repository
contain a deterministic baseline commit
resolve the required revision tag exactly
have no uncommitted changes after creation
be independent from the benchmark execution worktree
be reproducible from repository-controlled fixture source/scripts
```

### Reproducibility

Do not rely on one-off manual shell history.

Preferred implementation:

```text
scripts/materialize-benchmark-fixtures.ts
```

or equivalent deterministic repository-controlled script.

Running the materializer twice should be safe and should not silently rewrite an
existing mismatched fixture.

If an existing fixture has the expected revision and baseline, it may be reused.

If it exists but differs from the expected baseline, fail loudly.

### Locator

Provide a narrow local locator implementation/configuration that maps:

```text
repositoryId → fixture repository path
```

without adding absolute paths to `src/benchmarks/cases.ts`.

The exact mechanism may be:

```text
environment/config supplied root + repositoryId
```

or another deterministic boundary consistent with the accepted
`BenchmarkRepositoryLocator`.

### Deterministic validation

Add a focused test/readiness command proving:

```text
all five repository IDs resolve
all five paths are Git repositories
all five required revisions resolve to commits
fixture worktrees are clean
materialization is idempotent
benchmark definitions remain unchanged
```

No LLM/provider call is permitted.

### Non-goals

Do not:

- execute B01-B05 through the Harness yet;
- alter benchmark success criteria;
- alter expected outcomes;
- retag arbitrary live project HEADs;
- add remote clone/download behavior;
- change provider/model routing;
- generate H0-004 aggregates or reports.

### Acceptance criteria

- [ ] deterministic fixture materializer exists.
- [ ] B01 fixture repository exists and resolves `b01-v1`.
- [ ] B02 fixture repository exists and resolves `b02-v1`.
- [ ] B03 fixture repository exists and resolves `b03-v1`.
- [ ] B04 fixture repository exists and resolves `b04-v1`.
- [ ] B05 fixture repository exists and resolves `b05-v1`.
- [ ] all fixture repositories are clean after materialization.
- [ ] materialization is idempotent.
- [ ] existing mismatched fixture fails loudly rather than being overwritten.
- [ ] locator resolves each stable repository ID without absolute paths in benchmark definitions.
- [ ] benchmark definitions are unchanged.
- [ ] no provider execution occurs.
- [ ] H0-004 Step 2 deterministic suite-runner gate remains green.
- [ ] H0-003/H0-002 regressions remain green.

## H0-004 Step 2A Source-Evidence Record

**Status:** ⛔ Blocked on fixture source baselines

The supplied H0-002 sources establish the exact benchmark identities, requested
behavior, constraints, validation commands, and expected outcomes for B01-B05.

They do **not** contain repository fixture blueprints, source snapshots, commit
SHAs, or materialization scripts for any of the five benchmark baselines.

Confirmed from source:

```text
B01
repository: fixture-simple-api
revision: b01-v1
validation: npm run typecheck; npm test
expected: changes_required

B02
repository: fixture-health-already-present
revision: b02-v1
validation: npm run typecheck; npm test
expected: already_satisfied

B03
repository: fixture-component-app
revision: b03-v1
validation: npm run typecheck; npm test
expected: changes_required

B04
repository: qflow-workflow-canvas
revision: b04-v1
validation: npm run typecheck; npm test; npm run build
expected: changes_required

B05
repository: qos-harness-architecture
revision: b05-v1
validation:
  npm run typecheck
  npm run test:provider-architecture
  npm run test:llm-execution
  npm run test:llm-call-telemetry
expected: blocked
```

The H0-002 acceptance and suite-validation tests intentionally validate task
contracts and acceptance semantics only. They do not define repository contents.

### Consequence

Step 2A must not invent fixture contents from benchmark prose.

In particular:

```text
B03
  → source does not define the existing StatusBadge API/component tree.

B04
  → source does not define the intended historical Q-Flow Workflow Canvas
    baseline or which commit represents the pre-feature state.

B05
  → source does not define the intended Harness architectural baseline or which
    commit contains the exact provider/telemetry boundary expected by b05-v1.
```

Creating arbitrary minimal repositories for these tasks would make the benchmark
score a synthetic reconstruction rather than the fixed H0-002 benchmark intent.

Tagging the current Q-Flow or Harness HEAD as b04-v1/b05-v1 would also violate
the Step 2A baseline rule.

### Required source evidence before implementation

For B01-B03, provide either:

```text
existing fixture directories/repositories from prior work
or
the original source files/snapshots used when the benchmark cases were authored
```

For B04-B05, provide:

```text
the relevant Q-Flow and Harness Git repositories
plus enough Git history to identify the intended pre-benchmark baseline commit
```

The baseline may then be frozen into dedicated fixture repositories and tagged
with the benchmark revision without mutating live development repositories.

### No-code decision

No fixture materializer is implemented in this record because the current
source set is insufficient to produce faithful, reproducible baselines.

This is a benchmark-integrity blocker, not an implementation failure.

## H0-004 Step 2A Baseline Decision Record

The additional historical inspection resolves the B04/B05 provenance blocker.

### B04 — Q-Flow Workflow Canvas

Freeze:

```text
source repository: qflow
source commit: 986051f70be5ea06323d4dd508a5465b797a5396
fixture revision: b04-v1
```

Evidence at this commit shows the Workflow Builder foundation, draft model,
plugin-registry architecture, workflow graph/domain infrastructure, and canvas
feature specifications are present.

The inspected source also shows existing add-action/add-condition behavior, but
no evidence of the benchmark's requested canvas-local edge affordances such as
edge removal or insert-between behavior.

This makes `986051f` a valid pre-feature baseline rather than a post-solution
snapshot.

### B05 — Harness Architecture

Freeze:

```text
source repository: langgraph
source commit: 4329623bb82bda660c245074739617e662ff3b68
fixture revision: b05-v1
```

This commit contains provider-neutral provider/execution boundaries and H0-001
telemetry contracts/recording.

Provider implementations can throw before a normal structured result is
returned, while token usage is attached to normal successful provider results.

The inspected evidence does not establish an existing failed-provider-call
telemetry contract with safe elapsed/usage semantics. Therefore the benchmark's
expected `blocked` outcome remains coherent at this baseline.

### B01-B03 canonical fixture policy

No historical source snapshots exist for B01-B03.

They are now explicitly materialized as canonical dependency-free fixtures
controlled by the Harness repository:

```text
B01
  minimal Node HTTP service
  existing root behavior
  no GET /health

B02
  minimal Node HTTP service
  GET /health already returns 200 JSON

B03
  localized StatusBadge component
  semantic role=status text
  secondary description present
  no compact option
```

These newly frozen canonical baselines are a repair of the H0-002 fixture
completeness gap. Their provenance is explicit and they must not be silently
rewritten later to improve benchmark results.

## H0-004 Step 2A Implementation Record

**Status:** ✅ Accepted

Implemented:

```text
src/benchmarks/fixture-materializer.ts
src/benchmarks/local-fixture-locator.ts
scripts/materialize-benchmark-fixtures.ts
src/test-h0-004-benchmark-fixture-materialization.ts
```

The materializer:

```text
creates deterministic Git repositories
tags b01-v1 through b05-v1
uses canonical source-controlled blueprints for B01-B03
uses git archive snapshots for historical B04/B05 commits
records fixture metadata outside each repository
verifies recorded commit/tree/cleanliness on reuse
is idempotent
fails loudly when an existing fixture is dirty or mismatched
```

The locator maps stable benchmark repository IDs beneath a supplied local
fixture root without embedding machine-specific absolute paths in benchmark
definitions.

B01-B03 are dependency-free and their own `npm run typecheck` / `npm test`
commands are exercised by the focused test.

B04/B05 dependency installation/worktree dependency availability is deliberately
not fabricated in this substep; after materialization, real-suite readiness must
verify how their validation commands resolve dependencies inside isolated
worktrees before provider-backed execution.

### Exit condition

Step 2A fixture materialization itself is ready when the same readiness diagnostic
that previously returned five `NOT FOUND` results can resolve all five required
benchmark revisions.

Real-suite readiness is not yet satisfied because B04 revealed an execution-
environment isolation defect after fixture materialization:

```text
Git worktree isolation        ✅
dependency installation       ✅
B04 typecheck                 ✅
B04 build                     ✅
B04 npm test                  ❌ contaminated persistent qflow_test database
B05 isolated validation       ✅
```

The B04 source snapshot remains valid. The failure is caused by the historical
Vitest global setup reusing a persistent `qflow_test` database across revisions.

Therefore Step 2A must not rewrite `b04-v1`, alter B04 validation commands, or
patch Q-Flow production/test behavior merely to make the benchmark green.

Before H0-004 Step 2 can be accepted, complete Step 2B below.

## H0-004 Step 2B — Benchmark Validation Environment Isolation

**Status:** ✅ Accepted

### Trigger

Real B04 readiness proved that filesystem/worktree isolation is insufficient for
a reproducible benchmark when validation depends on mutable external state.

The historical B04 Vitest configuration injects:

```text
DATABASE_URL = TEST_DATABASE_URL
  or postgresql://qflow:qflow@localhost:5432/qflow_test
```

and its global setup creates `qflow_test` only when absent. It does not recreate
or clean the database for the historical revision.

A database populated by a later Q-Flow revision therefore leaks later lookup
rows into the historical B04 validation run.

Observed contamination:

```text
plugin_categories
  expected historical seed: financial_erp, messaging, workflow_utility
  leaked row: custom

plugin_operation_types
  expected historical seed: trigger, action, query
  leaked rows: condition, transform
```

Direct inspection outside Vitest showed the historical source and
`prepareTestDatabase()` remain consistent at the expected 3/3 rows. The failure
appears only when the historical Vitest run is pointed at the persistent
`qflow_test` database.

### Decision

Introduce an explicit benchmark execution-environment boundary.

Repository/worktree resolution and external execution environment are separate
responsibilities:

```text
BenchmarkTask
    ↓
BenchmarkWorkspaceResolver
    ↓
ResolvedBenchmarkWorkspace
    ↓
BenchmarkEnvironmentPreparer
    ↓
PreparedBenchmarkEnvironment
    ↓
runHarness + validation with the same environment
    ↓
environment cleanup
    ↓
worktree cleanup
```

The boundary must remain benchmark/runtime infrastructure. It must not be added
to benchmark task identity and must not require benchmark-specific branches in
the Harness graph or provider layer.

### Minimal contract direction

The implementation should converge on a narrow injectable contract equivalent
to:

```ts
export type PreparedBenchmarkEnvironment = Readonly<{
  env: Readonly<Record<string, string>>;
  cleanup: () => Promise<void>;
}>;

export interface BenchmarkEnvironmentPreparer {
  prepare(request: Readonly<{
    benchmark: BenchmarkTask;
    workspace: ResolvedWorkspace;
  }>): Promise<PreparedBenchmarkEnvironment>;
}
```

Exact naming may change during implementation if current source boundaries prove
a smaller mechanically compatible shape.

The important contract properties are:

```text
prepare receives benchmark identity + resolved workspace
prepare returns environment overrides + cleanup
environment is execution-scoped
environment is not persisted into BenchmarkTask
environment is provider-neutral
```

### No-op behavior

Benchmarks without external-state requirements must require no special setup.

For the current fixed suite:

```text
B01 → no-op environment
B02 → no-op environment
B03 → no-op environment
B04 → isolated PostgreSQL environment
B05 → no-op environment
```

The no-op preparer returns an empty environment and an idempotent cleanup.

### B04 PostgreSQL isolation

B04 must receive a unique disposable database per benchmark execution.

Required behavior:

```text
1. derive a collision-resistant execution database name;
2. create an empty database before Harness/validation execution;
3. expose its connection string through DATABASE_URL;
4. if compatibility requires it, expose the same URL through TEST_DATABASE_URL;
5. run the Harness and all B04 validation commands with the same environment;
6. drop the disposable database during cleanup.
```

Do not mutate or drop the developer's shared `qflow_test` database.

Do not change the historical Q-Flow fixture to compensate for environmental
contamination.

Do not weaken:

```text
npm run typecheck
npm test
npm run build
```

### Environment propagation

The same prepared environment must be visible to:

```text
Harness execution
validation command execution
```

This prevents the Harness from inspecting/executing against one environment
while deterministic validation runs against another.

Environment overrides must be additive over the process environment rather than
silently deleting unrelated required variables.

Secrets or environment values must not be copied into benchmark comparison
records or telemetry unless an existing explicit redaction-safe contract already
requires them.

### Failure semantics

Preparation failure is infrastructure failure.

```text
environment prepare fails
  → benchmark task status = infrastructure_failed
  → Harness does not execute
  → validation does not execute
```

Cleanup is mandatory after successful preparation, regardless of:

```text
Harness success
Harness failure
validation success
validation failure
comparison construction failure
persistence/result handling failure where cleanup is still reachable
```

If a primary failure already exists, cleanup failure must not replace/mask that
primary failure.

If execution otherwise succeeds but environment cleanup fails, the failure must
remain observable as infrastructure failure/evidence rather than being silently
ignored.

The implementation must preserve the already accepted worktree cleanup
semantics and define deterministic ordering between environment cleanup and
worktree cleanup.

Preferred ordering:

```text
environment cleanup
then
worktree cleanup
```

because the environment may still require files/configuration from the resolved
workspace during teardown.

### Dependency preparation is not part of this decision

Step 2B does not generalize dependency installation.

The real readiness exercise already proved that B04/B05 can install dependencies
with `npm ci` in isolated worktrees.

If automated dependency preparation is later required by the suite runner, it
must be specified separately rather than hidden inside the environment contract.

### Unit-test strategy

Production contract/orchestration tests must not require a real PostgreSQL
server.

Use deterministic fakes to prove:

```text
no-op preparation
environment propagation to Harness
environment propagation to validation
prepare-before-execute ordering
cleanup-after-execute ordering
cleanup on Harness failure
cleanup on validation failure
prepare failure prevents execution
primary failure survives cleanup failure
successful execution + cleanup failure remains observable
B01/B02/B03/B05 need no benchmark-specific infrastructure
```

Real PostgreSQL is reserved for the development-environment readiness gate.

### Real readiness gate

After deterministic tests pass, prove B04 against an actual disposable database.

The readiness run must demonstrate:

```text
fresh database created
historical B04 migrations/seed own the database state
npm run typecheck passes
npm test passes without custom/condition/transform contamination
npm run build passes
database is removed after the run
shared qflow_test remains untouched
```

B05 isolated validation must remain green.

### Files expected during implementation

Expected production scope:

```text
src/benchmarks/environment.ts                 (or equivalent narrow contract)
src/benchmarks/complete-runner.ts             (or current orchestration owner)
src/benchmarks/validation.ts                  (only if env is not already injectable)
```

Expected test scope:

```text
src/test-h0-004-benchmark-environment.ts
```

Potential local PostgreSQL implementation may live under:

```text
src/benchmarks/postgres-environment.ts
```

only if source inspection proves this is the narrowest ownership boundary.

Do not add PostgreSQL-specific branches to:

```text
src/app/run-harness.ts
src/graph/*
src/providers/*
src/telemetry/*
src/benchmarks/cases.ts
```

### Non-goals

Do not in Step 2B:

- alter `b04-v1`;
- alter B04 task wording, constraints, success criteria, expected outcome, or
  validation commands;
- patch Q-Flow's historical Vitest setup;
- delete/recreate the shared developer `qflow_test` database;
- introduce Docker orchestration unless source evidence proves it necessary;
- add provider/model routing behavior;
- aggregate H0-004 suite metrics;
- generate the comparison report;
- start H1/H2;
- solve general-purpose environment orchestration beyond evidence required by
  the fixed benchmark suite.

### Acceptance criteria

- [ ] an explicit injectable benchmark environment-preparation boundary exists.
- [ ] no-op preparation preserves B01/B02/B03/B05 behavior.
- [ ] B04 receives a unique disposable PostgreSQL database per execution.
- [ ] prepared environment is propagated to both Harness execution and validation.
- [ ] benchmark task identity remains machine-independent and environment-free.
- [ ] preparation failure prevents Harness/validation and is surfaced as infrastructure failure.
- [ ] environment cleanup runs after every successful preparation.
- [ ] cleanup ordering with worktree cleanup is deterministic.
- [ ] cleanup failure does not mask a pre-existing primary failure.
- [ ] successful execution followed by cleanup failure remains observable.
- [ ] deterministic tests require no real PostgreSQL server.
- [ ] B04 real readiness passes `typecheck`, `test`, and `build` against a fresh disposable database.
- [ ] the shared `qflow_test` database is not mutated/dropped by benchmark isolation.
- [ ] B05 isolated validation remains green.
- [ ] benchmark definitions and `b04-v1` remain unchanged.
- [ ] H0-004 Step 1/Step 2 deterministic gates remain green.
- [ ] H0-003/H0-002 regressions remain green.

### Step 2A integrity follow-up

Before final Step 2/2A/2B acceptance, independently tighten fixture reuse so
historical metadata verifies the requested `sourceRevision` in addition to the
stored fixture revision/commit/tree/cleanliness.

This is an integrity correction to Step 2A and must not be mixed with the
external-environment behavior introduced by Step 2B.

### Step 2B exit condition

Step 2B is accepted only after:

```text
spec/decision
→ implementation
→ deterministic tests
→ real B04 disposable-database readiness
→ PLAN acceptance metadata
→ full regression gate
```

After Step 2B and the Step 2A sourceRevision integrity follow-up are accepted,
return to H0-004 Step 2 and close its real-suite readiness criterion.

Only then proceed to:

```text
H0-004 Step 3 — Result Aggregation
```

Step 3 should compute suite-level SFCR, outcome correctness, validation success,
intervention rate, latency, and usage aggregates from persisted task records.

# Release Procedure — v0.1.0-alpha.7

`H0-002A — Task Intake Foundation` is accepted.

Release name:

```text
v0.1.0-alpha.7 — Task Intake Foundation Alpha
```

Release scope:

```text
versioned NormalizedHarnessTask
deterministic task normalization
explicit repository identity
ResolvedWorkspace separation
runHarness application boundary
manual/executable intake adapter
H0-001/H-ARCH boundary migration
H0-002A final acceptance
```

Run the final deterministic release gate:

```bash
npm run typecheck && \
npm run test:h0-002a-acceptance && \
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

After the full gate is green:

```bash
git add package.json package-lock.json CHANGELOG.md QOS-HARNESS-ENGINEERING-PLAN.md
git diff --cached --check
git diff --cached
git commit -m "chore(release): v0.1.0-alpha.7"
git tag -a v0.1.0-alpha.7 -m "v0.1.0-alpha.7 — Task Intake Foundation Alpha"
git push
git push origin v0.1.0-alpha.7
```

Next engineering task:

```text
H0-003 — Benchmark Runner
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

## H0-002A Step 6 — Acceptance / Architecture Review

**Status:** ✅ Accepted

### Objective

Close H0-002A with one deterministic acceptance test that proves the complete
task-intake/application architecture introduced by Steps 1-5.

This step adds no new runtime behavior.

### Final architecture under acceptance

```text
manual/executable producer
        ↓
Manual Intake Adapter
        ↓
Deterministic Task Normalizer
        ↓
NormalizedHarnessTask
        +
ResolvedWorkspace
        +
optional execution policy
        ↓
Application run boundary
        ↓
public graph boundary
        ↓
Harness Core
```

### Files

Create:

```text
src/test-h0-002a-acceptance.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify production source.

### Acceptance criteria

- [x] versioned normalized task contract remains intact.
- [x] repository identity remains machine-independent.
- [x] `repositoryPath` remains outside normalized task identity.
- [x] manual intake requires explicit repository identity.
- [x] manual intake carries concrete workspace path separately.
- [x] deterministic normalization remains provider/graph independent.
- [x] entrypoint delegates intake and execution.
- [x] entrypoint contains no direct graph/telemetry orchestration.
- [x] application execution consumes normalized task + resolved workspace.
- [x] application boundary reaches Harness core through public graph boundary.
- [x] application boundary does not cross graph/provider internals.
- [x] H-ARCH public-boundary guard covers the application layer.
- [x] generalized dependency/cycle guard remains active.
- [x] no production source changes in Step 6.
- [x] no new runtime dependency is added.
- [x] all H0-002A Step 1-5 tests remain green.
- [x] H0-002/H0-001/H-ARCH regression remains green.

### Targeted gate

```bash
npm run typecheck && \
npm run test:h0-002a-acceptance && \
npm run test:h0-002a-manual-intake && \
npm run test:h0-002a-run-harness && \
npm run test:h0-002a-task-normalizer && \
npm run test:h0-002a-task-contract && \
npm run test:h0-002a-task-entry-characterization
```

### Full Step 6 gate

```bash
npm run typecheck && \
npm run test:h0-002a-acceptance && \
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

### Commit

After acceptance:

```bash
git commit -m "test(intake): accept task intake architecture"
```

### Exit condition

H0-002A is implementation-complete when this acceptance test and the complete
regression gate pass.

After final PLAN acceptance metadata and one final full gate, H0-002A may be
marked accepted and the roadmap may return to:

```text
H0-003 — Benchmark Runner

## H0-002A Final Validation Record

**Status:** ✅ Accepted

The H0-002A Step 6 targeted acceptance gate and the complete alpha.6 regression
gate passed in the development environment.

H0-002A is therefore accepted as the stable task-intake/application boundary
before H0-003.

### Accepted architecture

```text
manual/executable producer
        ↓
Manual Intake Adapter
        ↓
Deterministic Task Normalizer
        ↓
NormalizedHarnessTask
        +
ResolvedWorkspace
        +
optional execution policy
        ↓
runHarness(...)
        ↓
public graph boundary
        ↓
Harness Core
```

### Accepted domain/runtime separation

```text
NormalizedHarnessTask.repository
  → machine-independent identity
  → id + revision?

ResolvedWorkspace
  → concrete execution location
  → repositoryPath
```

A local path is not task identity and must not be converted into one.

### Accepted task-intake guarantees

- one versioned integration-neutral normalized task contract exists;
- task source is explicit;
- manual/CLI-style intake uses deterministic normalization;
- normalization performs no LLM call;
- normalization performs no filesystem or Git lookup;
- malformed task data produces deterministic structured issues;
- constraints and acceptance criteria are explicit normalized arrays;
- metadata remains opaque to the Harness core;
- provider/model/runtime policy is not part of the task domain.

### Accepted application-execution guarantees

- `runHarness(...)` is the reusable application execution boundary;
- it receives a normalized task and resolved workspace separately;
- it owns one-run graph/telemetry orchestration;
- current initial-state defaults remain preserved;
- run-scoped LLM telemetry collection remains preserved;
- lifecycle start/completion and telemetry persistence remain preserved;
- deterministic dependency injection allows provider-free tests;
- the production graph is loaded lazily only when the real execution path is
  used;
- application execution does not parse CLI/GitHub/Q-Flow/API payloads.

### Accepted executable boundary

`src/index.ts` now owns only:

```text
current manual request
manual intake call
runHarness(...) call
console presentation
```

It no longer owns:

```text
graph construction
provider composition
run lifecycle recorder
LLM telemetry collector
terminal telemetry projection
telemetry persistence
```

### Accepted architecture-guard migrations

H0-001 and H-ARCH characterization tests were intentionally updated where the
public dependency shape changed.

Final guarded direction:

```text
index.ts
  → app/run-harness.ts
  → public graph boundary

index.ts
  → intake/manual.ts

app/run-harness.ts
  ✗ graph internals
  ✗ concrete providers

provider-neutral runtime/execution/contracts
  ✗ concrete provider composition
  ✗ graph/public composition
```

Generalized dependency/cycle protection remains active.

### H0-003 handoff

H0-003 must build on this boundary rather than create a benchmark-only execution
path.

Required direction:

```text
BenchmarkTask
    ↓
benchmark adapter
    ↓
NormalizedHarnessTask

repository.id + revision
    ↓
benchmark workspace resolver
    ↓
ResolvedWorkspace

NormalizedHarnessTask + ResolvedWorkspace
    ↓
runHarness(...)
    ↓
validation commands
    ↓
benchmark observation
    ↓
acceptance
```

H0-003 owns repository/revision resolution and isolated reproducible worktrees.

It must not:

- put local paths into normalized task identity;
- call graph internals directly;
- duplicate application execution;
- move benchmark-specific validation fields into `NormalizedHarnessTask`.

### Release decision

H0-002A introduced a meaningful reusable application boundary and changed the
executable composition, but remained inside H0 Benchmark Foundation.

Release/tag strategy should be decided separately before or after the first
H0-003 slice based on desired checkpoint granularity.

**Decision:** H0-002A accepted. Resume roadmap at H0-003 — Benchmark Runner.
```

## H0-004 Step 2B — Slice 1 Implementation Record

**Status:** ✅ Accepted

### Scope implemented

Slice 1 establishes the environment lifecycle without provisioning a real
PostgreSQL database yet.

Created:

```text
src/benchmarks/environment.ts
src/test-h0-004-benchmark-environment.ts
```

Modified:

```text
src/app/run-harness.ts
src/benchmarks/complete-runner.ts
src/benchmarks/validation.ts
src/test-h0-003-benchmark-validation.ts
package.json
```

### Implemented ownership

```text
BenchmarkEnvironmentPreparer
        ↓
PreparedBenchmarkEnvironment { env, cleanup }
        ↓
runCompleteBenchmark(...)
        ├─ runHarness(..., environment)
        └─ executeBenchmarkValidation(..., environment)
        ↓
environment cleanup
        ↓
workspace cleanup
```

The default preparer is intentionally a no-op. No benchmark-specific PostgreSQL
behavior exists in Slice 1.

### Environment propagation rule

`RunHarnessRequest` now carries optional execution-scoped `environment` data.
This is runtime context, not task identity.

The current Harness graph does not execute target-repository application
commands, so Slice 1 does not mutate `process.env` or inject target environment
values into provider composition.

The complete benchmark runner nevertheless passes the exact prepared environment
to the Harness execution boundary so any current/future execution adapter has an
explicit scoped contract instead of relying on process-global mutation.

Validation command execution receives the same environment and merges it over
the inherited child-process environment:

```text
child env = process.env + prepared benchmark overrides
```

The parent `process.env` is not mutated.

### Cleanup semantics

After successful environment preparation:

```text
environment cleanup
then
workspace cleanup
```

Both cleanup attempts run even when environment cleanup fails.

If execution already has a primary failure, cleanup failures do not replace it.

If execution succeeds and environment cleanup fails, that cleanup failure remains
observable after workspace cleanup is attempted.

If environment cleanup succeeds and workspace cleanup fails, the workspace
cleanup failure remains observable.

If environment preparation fails, Harness/validation do not run and workspace
cleanup still runs.

### Deterministic tests

New focused gate:

```bash
npm run typecheck && \
npm run test:h0-004-benchmark-environment && \
npm run test:h0-003-benchmark-validation && \
npm run test:h0-003-complete-benchmark-runner && \
npm run test:h0-004-benchmark-suite-runner && \
npm run test:h0-004-comparison-contract
```

The Step 2B test proves:

- prepare occurs after workspace resolution and before Harness execution;
- Harness and validation receive the same environment;
- environment cleanup precedes workspace cleanup;
- prepare failure prevents Harness/validation;
- workspace cleanup still runs after prepare failure;
- environment cleanup runs on Harness and validation failures;
- primary execution failure survives environment cleanup failure;
- workspace cleanup still runs after environment cleanup failure;
- successful execution followed by cleanup failure remains observable;
- the default preparer is a no-op.

The H0-003 validation test additionally proves child commands inherit the parent
environment, benchmark overrides win for the child, and `process.env` is not
mutated.

### Deferred to Slice 2

Do not accept Step 2B yet.

Slice 2 still owns:

```text
B04-specific disposable PostgreSQL preparer
unique database naming
database create/drop lifecycle
DATABASE_URL / TEST_DATABASE_URL compatibility
real B04 readiness
shared qflow_test non-interference proof
```

No B04 fixture, benchmark definition, validation command, graph, provider or
telemetry behavior changed in Slice 1.

## H0-004 Step 2B — Slice 2 Disposable PostgreSQL Implementation Record

**Status:** ✅ Accepted

### Scope implemented

Slice 2 adds the concrete external-state environment required by the current B04
Q-Flow benchmark without changing `b04-v1`, its benchmark definition, or its
validation commands.

Created:

```text
src/benchmarks/postgres-environment.ts
src/test-h0-004-benchmark-postgres-environment.ts
```

Modified:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

`src/benchmarks/complete-runner.ts` remains unchanged in this slice because
Slice 1 already established the injectable `BenchmarkEnvironmentPreparer`
boundary and propagates the prepared environment to both Harness execution and
deterministic validation.

### Concrete environment ownership

`DisposablePostgresBenchmarkEnvironmentPreparer` is benchmark infrastructure.

For the current fixed suite:

```text
qflow-workflow-canvas
  → disposable PostgreSQL environment

all other benchmark repositories
  → no-op environment
```

The preparer does not change benchmark task identity and does not introduce
PostgreSQL knowledge into graph/provider/telemetry code.

### Administrative connection

B04 requires an explicit administrative PostgreSQL connection:

```text
QOS_BENCHMARK_POSTGRES_ADMIN_URL
```

Example development value:

```text
postgresql://qflow:qflow@localhost:5432/postgres
```

The preparer does not infer administrative credentials from the benchmark task
or persist them into comparison/telemetry records.

The default infrastructure runner invokes the local `psql` client and supplies
the administrative URL through the child-process `PGDATABASE` environment
instead of placing the connection URL in the command argument list.

No new npm runtime dependency is introduced.

### Disposable database lifecycle

Each B04 preparation creates a collision-resistant database name:

```text
qos_b04_<pid>_<random-suffix>
```

Generated names are validated against a strict PostgreSQL-identifier-safe
vocabulary before any command runs.

Preparation executes:

```text
CREATE DATABASE "<unique-name>" TEMPLATE template0;
```

and returns:

```text
DATABASE_URL      = postgres URL for <unique-name>
TEST_DATABASE_URL = same postgres URL
```

Both values are execution-scoped and are consumed through the Slice 1
environment propagation contract.

Cleanup executes:

```text
DROP DATABASE IF EXISTS "<unique-name>" WITH (FORCE);
```

The developer/shared `qflow_test` database is never selected for create/drop by
the Harness preparer.

The historical Q-Flow Vitest global setup may still check whether `qflow_test`
exists because that behavior belongs to the frozen B04 source. The benchmark
infrastructure itself does not drop, truncate, seed, or otherwise rewrite the
shared database.

### Failure semantics

If database creation fails:

```text
prepare rejects
→ Harness does not run
→ validation does not run
→ workspace cleanup remains owned by complete-runner Slice 1 semantics
```

If database cleanup fails, the cleanup rejection remains visible to the
complete runner, whose already-tested Slice 1 semantics preserve any earlier
primary failure and still attempt workspace cleanup.

### Deterministic tests

New focused test:

```bash
npm run test:h0-004-benchmark-postgres-environment
```

It uses an injected fake PostgreSQL command runner and therefore requires:

```text
no real PostgreSQL server
no psql execution
no Docker
no network
```

The test proves:

- non-Q-Flow benchmark repositories remain no-op;
- B04 requires an explicit administrative URL;
- unique database URL derivation preserves connection parameters;
- `DATABASE_URL` and `TEST_DATABASE_URL` point to the same disposable database;
- source environment input is not mutated;
- CREATE runs before the environment is returned;
- cleanup issues DROP only for the generated disposable database;
- unsafe generated database names are rejected before command execution;
- create failure propagates;
- cleanup failure propagates.

### Slice 2 deterministic gate

Run:

```bash
npm run typecheck && \
npm run test:h0-004-benchmark-postgres-environment && \
npm run test:h0-004-benchmark-environment && \
npm run test:h0-003-benchmark-validation && \
npm run test:h0-003-complete-benchmark-runner && \
npm run test:h0-004-benchmark-suite-runner && \
npm run test:h0-004-comparison-contract
```

### Real B04 readiness still required

Do not accept Step 2B from deterministic tests alone.

After this gate passes, execute the historical B04 validation commands through
the concrete disposable PostgreSQL preparer with:

```text
QOS_BENCHMARK_POSTGRES_ADMIN_URL
```

and prove:

```text
fresh disposable database created
npm run typecheck passes
npm test passes without leaked custom/condition/transform lookup rows
npm run build passes
disposable database removed afterward
shared qflow_test remains unchanged
```

B05 isolated validation must remain green.

### Non-goals retained

Slice 2 does not:

- alter `b04-v1`;
- alter B04 validation commands;
- patch historical Q-Flow Vitest setup;
- drop/truncate/reseed the developer's `qflow_test`;
- add Docker orchestration;
- add an npm PostgreSQL client dependency;
- change graph/provider/telemetry behavior;
- aggregate comparison metrics;
- generate H0-004 reports;
- start H0-004 Step 3.

### Step 2B acceptance state

```text
Slice 1 environment lifecycle       ✅ deterministic gate reported green
Slice 2 disposable PostgreSQL       🧪 deterministic gate pending
Real B04 readiness                  ⏳ pending
Step 2A sourceRevision integrity    ⏳ pending
H0-004 Step 2 final acceptance      ⏳ pending
```

## H0-004 Step 2C — B04 Fixture Hermeticity Repair Specification

**Status:** ✅ Accepted

### Problem

Real B04 validation against a fresh disposable PostgreSQL database proved that
the historical `b04-v1` snapshot is not test-hermetic.

The environment isolation itself is working:

```text
shared qflow_test contamination removed
disposable database created successfully
typecheck passes
build passes
disposable database cleanup succeeds
```

However, the frozen B04 test suite depends on database state that is not
established by the failing test itself.

Observed behavior:

```text
full suite on fresh database
  → 309 test files pass
  → billing-pipeline.spec.ts reaches execution recording
  → fails because workflow execution status "pending" is absent

billing-pipeline.spec.ts in isolation on fresh database
  → fails earlier because plugin definition "evolution_api" is absent
```

The historical source also shows:

```text
ensureLookupData(...)
  → seeds workflowStatuses / workflowNodeTypes / nodeFailurePolicies
  → does not seed workflowExecutionStatuses
  → does not seed nodeExecutionStatuses

syncPluginRegistry(...)
  → is the established owner that materializes plugin definitions such as
    evolution_api
  → is called explicitly by many plugin-related tests
  → is also called by the application migration/bootstrap path
```

Therefore the B04 failure is a fixture/test-bootstrap defect, not evidence that
the disposable PostgreSQL environment is incorrect.

### Decision

Repair B04 hermeticity as a **benchmark fixture overlay** applied during fixture
materialization.

Do not teach Harness runtime/environment infrastructure about Q-Flow domain
entities such as:

```text
evolution_api
workflowExecutionStatuses
nodeExecutionStatuses
pending
running
completed
failed
cancelled
succeeded
```

The repair must remain inside the materialized B04 fixture.

### Repair boundary

The overlay may modify only B04 test/bootstrap infrastructure required to make
the frozen historical validation reproducible from an empty database.

Preferred smallest repair:

```text
src/tests/e2e/billing-pipeline.spec.ts
```

The E2E test should explicitly establish its own prerequisites before executing
the billing pipeline:

```text
prepareTestDatabase()
  ↓
syncPluginRegistry(db)
  ↓
insert workflow execution status lookup rows required by the recorder
  ↓
insert node execution status lookup rows required by the recorder
  ↓
execute scenario
```

The exact inserted status vocabulary must be copied from already-existing
historical tests/contracts in `b04-v1`; it must not be invented by Harness.

Current source evidence already establishes the historical vocabularies used by
`execution-recorder.service.test.ts`:

```text
workflow:
  pending
  running
  completed
  failed
  cancelled

node:
  pending
  running
  succeeded
  failed
  cancelled
```

The overlay must use idempotent inserts (`onConflictDoNothing`) so repeated
setup remains deterministic.

### Why the repair is localized to the E2E test

Do not broaden `prepareTestDatabase()` merely to make one historical E2E pass.

Reasons:

- many tests intentionally call `syncPluginRegistry()` themselves;
- changing the global helper would alter setup semantics for the entire frozen
  test suite;
- workflow/node execution statuses have no established central seed owner in
  this snapshot;
- a localized E2E prerequisite repair is smaller, rollback-friendly, and easier
  to prove unrelated to the workflow-canvas behavior being benchmarked.

### Fixture identity

The historical source revision remains frozen:

```text
Q-Flow source:
986051f70be5ea06323d4dd508a5465b797a5396
```

The benchmark-facing fixture revision remains:

```text
b04-v1
```

Materialization may create a deterministic fixture commit that consists of:

```text
historical source snapshot
+
explicit benchmark-only hermeticity overlay
```

The external fixture metadata must continue recording the original historical
`sourceRevision`.

The overlay must be deterministic: same source revision + same overlay produces
the same fixture tree/commit.

### Feature-isolation rule

The overlay is forbidden from changing any behavior measured by B04.

It must not touch:

```text
workflow canvas UI
node-add affordances
edge actions
insert-between behavior
@xyflow/react integration
workflow draft behavior
plugin operation behavior
production workflow execution behavior
application production bootstrap
benchmark task definition
benchmark validation commands
```

Only test/bootstrap code needed for hermetic validation may change.

### SourceRevision integrity dependency

Step 2A still has a separate known integrity gap:

```text
existing materialized historical fixture reuse does not yet reject a changed
requested sourceRevision
```

That correction remains required.

It may be implemented in the same fixture-materializer development phase only
as a separate, independently tested change/commit boundary. It must not be
hidden inside the B04 hermeticity behavior patch.

### Deterministic tests required for Step 2C implementation

Harness-side tests must prove:

- overlay is applied only to B04;
- B01/B02/B03/B05 materialization remains unchanged;
- B04 overlay touches only the approved test/bootstrap path;
- generated fixture remains clean and tagged `b04-v1`;
- metadata preserves the frozen historical source revision;
- materialization is idempotent;
- changing the overlay changes the resulting fixture tree deterministically;
- feature implementation files are not modified by the overlay;
- no provider, graph, benchmark definition, or validation-command behavior is
  changed.

No real PostgreSQL is required by the deterministic materializer test.

### Real readiness gate

After deterministic fixture-materializer tests pass, rematerialize B04 from the
frozen source into a clean fixture root and validate against a fresh disposable
database.

Required result:

```text
npm ci                         PASS
npm run typecheck              PASS
npm test                       PASS
npm run build                  PASS
shared qflow_test untouched
disposable benchmark DB removed after validation
```

The repaired `billing-pipeline.spec.ts` must also pass when run independently
against a fresh disposable database.

This isolated E2E pass is required specifically to prove removal of the
test-order dependency.

### Acceptance criteria

Step 2C is accepted only when:

- [ ] B04 historical source revision remains `986051f70...`.
- [ ] benchmark revision remains `b04-v1`.
- [ ] repair is an explicit deterministic materialization overlay.
- [ ] overlay is B04-only.
- [ ] overlay changes only approved test/bootstrap infrastructure.
- [ ] `billing-pipeline.spec.ts` establishes plugin-registry prerequisites.
- [ ] workflow execution status prerequisites are explicit and idempotent.
- [ ] node execution status prerequisites are explicit and idempotent.
- [ ] status vocabularies come from historical source evidence.
- [ ] no B04 feature behavior is pre-implemented.
- [ ] no production Q-Flow source behavior is changed by the overlay.
- [ ] no Harness runtime/environment Q-Flow-domain knowledge is introduced.
- [ ] materialization remains deterministic and idempotent.
- [ ] B01/B02/B03/B05 fixtures remain unchanged.
- [ ] isolated billing-pipeline test passes on a fresh disposable DB.
- [ ] full B04 typecheck/test/build passes on a fresh disposable DB.
- [ ] shared `qflow_test` remains untouched.
- [ ] disposable DB cleanup succeeds.
- [ ] Step 2B deterministic gates remain green.
- [ ] Step 2A sourceRevision integrity gap is closed separately before final
      H0-004 Step 2 acceptance.

### Non-goals

Step 2C does not:

- change the B04 task request;
- change B04 success criteria;
- change B04 validation commands;
- advance the fixture to a later Q-Flow feature commit;
- change Harness planning/provider/model behavior;
- introduce dependency installation into the runner;
- change comparison aggregation/reporting;
- start H0-004 Step 3.

### Exit condition

After Step 2C and the independent Step 2A sourceRevision integrity correction
are accepted, rerun the complete H0-004 Step 2 gate.

Only then may H0-004 Step 2 be finalized and committed before moving to
H0-004 Step 3.

## H0-004 Step 2C — Implementation Record

**Status:** ✅ Accepted

### Implemented slice

The materializer now applies one deterministic B04-only hermeticity overlay to:

```text
src/tests/e2e/billing-pipeline.spec.ts
```

The overlay does not modify Harness runtime/environment code and does not alter
B04 workflow-canvas implementation files.

It makes the historical E2E test explicitly establish the prerequisites that
were previously inherited accidentally from test-suite order:

```text
prepareTestDatabase()
  → syncPluginRegistry(db)
  → workflow execution status lookup rows
  → node execution status lookup rows
```

The status vocabularies are copied from the historical
`execution-recorder.service.test.ts` evidence:

```text
workflow: pending, running, completed, failed, cancelled
node:     pending, running, succeeded, failed, cancelled
```

All inserts are idempotent through `onConflictDoNothing`.

### Deterministic protection

`test:h0-004-benchmark-fixture-materialization` now additionally proves:

- B04 receives the overlay;
- historical B04 source content and materialized B04 content differ explicitly;
- B04 metadata preserves the historical source revision;
- B05 remains unchanged;
- plugin-registry synchronization is explicit;
- workflow/node execution lookup prerequisites are explicit;
- lookup setup is idempotent;
- existing materialization idempotence remains intact.

### Important separation retained

This implementation does **not** close the separate Step 2A
`sourceRevision`-reuse integrity gap. Existing fixture reuse validation still
needs its own correction and test before final H0-004 Step 2 acceptance.

### Targeted gate

```bash
npm run typecheck && npm run test:h0-004-benchmark-fixture-materialization && npm run test:h0-004-benchmark-postgres-environment && npm run test:h0-004-benchmark-environment
```

After the deterministic gate passes, rematerialize B04 into a fresh fixture
root and rerun:

```text
isolated billing-pipeline.spec.ts on fresh disposable DB
full npm test on fresh disposable DB
npm run typecheck
npm run build
```

Do not accept Step 2C until both isolated and full real readiness are green.

### Step 2C real-materialization correction — resilient database-ready anchor

The first real B04 rematerialization exposed a materializer-only defect:

```text
B04 hermeticity overlay setup anchor not found
```

The implementation had required one exact multi-line block containing both:

```text
await prepareTestDatabase();

db = getDb();
```

The historical snapshot does not preserve that exact adjacency/whitespace shape,
even though the semantic `db = getDb();` boundary exists.

**Decision:** anchor the overlay after the unique database-ready statement:

```text
db = getDb();
```

instead of matching a brittle multi-line formatting block.

The materializer now requires exactly one such anchor and fails loudly if zero
or multiple matches are found.

This correction does not change:

- B04 source revision;
- benchmark revision;
- overlay contents;
- status vocabularies;
- fixture scope;
- Harness runtime/environment behavior;
- validation commands.

The deterministic fixture test now deliberately places a harmless line between
`prepareTestDatabase()` and `db = getDb()` so future changes cannot
accidentally restore the brittle adjacency assumption.

After this correction, rerun the Step 2C deterministic gate before attempting
real rematerialization again.



### Step 2C real-readiness correction — execution mode prerequisite

The isolated B04 readiness run advanced past plugin-registry and execution
status prerequisites, then failed because `workflow_executions.execution_mode_id`
references an empty `execution_modes` lookup.

Historical source evidence establishes the fixture-local prerequisite used by
the existing execution tests:

```text
executionModes
  name: production
  slug: production
```

The billing executor hard-codes `executionModeId: 1` and
`triggerMechanismId: 1`. The historical `ensureLookupData()` already populates
`triggerMechanisms`, so no trigger-mechanism overlay is added.

**Correction:** extend only the B04 hermeticity overlay with an idempotent
`executionModes` insert for the historical `production` value.

No production Q-Flow behavior, workflow-canvas feature code, Harness
runtime/environment code, benchmark definition, or validation command changes.

After this correction, rerun the focused deterministic gate, rematerialize B04
from a clean fixture root, and rerun the isolated E2E readiness before the full
B04 suite.

### Step 2C acceptance record

Step 2C is accepted based on the reported development-environment evidence:

```text
focused deterministic Step 2C gate      PASS
fresh B04 fixture materialization       PASS
isolated billing-pipeline.spec.ts       PASS
B04 typecheck                           PASS
B04 full test suite                     PASS
B04 production build                    PASS
disposable PostgreSQL cleanup           PASS
```

The real readiness sequence also exposed and corrected two fixture-hermeticity
details without widening the repair beyond B04 test/bootstrap infrastructure:

```text
database-ready overlay anchor
execution_modes.production prerequisite
```

No workflow-canvas feature behavior, production Q-Flow bootstrap behavior,
Harness provider/runtime behavior, or benchmark validation command was changed
by those corrections.

Step 2C is closed. Do not change B04 hermeticity again unless a later
deterministic gate produces new evidence.

## H0-004 Step 2A — Historical sourceRevision reuse integrity correction

**Status:** ✅ Accepted

### Problem

Historical fixture metadata already records:

```text
sourceRevision
```

when a fixture is first materialized, but the existing reuse path validated only:

```text
benchmark revision
synthetic fixture commit
fixture tree
clean Git status
```

Therefore a caller could request a different historical source revision while
an older materialized fixture already existed at the same fixture root, and the
old fixture could be silently reused.

That violates benchmark reproducibility.

### Decision

For every existing fixture reuse, derive:

```text
expectedSourceRevision =
  blueprint.historicalSource?.revision ?? null
```

and require the stored metadata `sourceRevision` to match it exactly.

This applies consistently to:

```text
historical fixtures → exact requested source revision required
generated fixtures  → stored sourceRevision must remain null
```

A mismatch uses the existing fail-loudly baseline-integrity error. The
materializer must never silently rebuild, mutate, or reuse a fixture whose
recorded source provenance differs from the current request.

### Deterministic regression

The fixture-materialization test now:

```text
1. materializes the historical Q-Flow fixture;
2. confirms metadata records the original source revision;
3. creates a second commit in the source repository;
4. requests materialization using that changed source revision and the same
   fixture root;
5. requires reuse to fail with the existing baseline-integrity error.
```

This test exercises the reuse path directly; it does not depend on real Q-Flow,
real PostgreSQL, providers, or external services.

### Scope

Modify only:

```text
src/benchmarks/fixture-materializer.ts
src/test-h0-004-benchmark-fixture-materialization.ts
QOS-HARNESS-ENGINEERING-PLAN.md
```

### Non-goals

This correction does not:

- change historical source commits selected for B04/B05;
- change benchmark revision tags;
- change B04 hermeticity overlay behavior;
- change workspace resolution;
- change PostgreSQL environment isolation;
- change suite execution/comparison behavior;
- change provider/model/runtime behavior;
- start H0-004 Step 3.

### Focused deterministic gate

```bash
npm run typecheck && \
npm run test:h0-004-benchmark-fixture-materialization
```

After this focused gate passes, finalize the H0-004 Step 2 acceptance record and
run the complete Step 2 regression gate before the consolidation commit.

## H0-004 Step 2 — Final Acceptance Record

**Status:** ✅ Accepted

H0-004 Step 2 is accepted based on the complete reported development-environment
evidence collected across the suite-runner readiness work.

Accepted deterministic and real-environment evidence:

```text
suite runner deterministic behavior             PASS
comparison contract                             PASS
H0-003 validation / complete runner regressions PASS
fixture materialization                         PASS
historical sourceRevision reuse integrity       PASS
benchmark environment lifecycle                 PASS
disposable PostgreSQL environment               PASS
fresh B04 materialization                       PASS
isolated B04 billing pipeline                   PASS
B04 typecheck                                   PASS
B04 full test suite                             PASS
B04 production build                            PASS
disposable PostgreSQL cleanup                   PASS
complete H0-004 Step 2 regression gate          PASS
```

The final shell status for the complete Step 2 regression gate was:

```text
0
```

### Accepted Step 2 boundaries

The fixed suite remains:

```text
B01 → B02 → B03 → B04 → B05
```

The suite runner owns only suite iteration, comparison-record persistence, and
task-level infrastructure-failure isolation.

It does not duplicate:

```text
workspace resolution
Harness execution
validation
changed-file collection
observation derivation
acceptance evaluation
comparison-record mapping
```

One selected benchmark task remains one suite attempt. No hidden task-level
retry/re-run behavior is introduced.

### Fixture provenance and hermeticity

Accepted fixture behavior:

```text
B01-B03
  → canonical Harness-controlled fixtures

B04
  → historical Q-Flow source
     986051f70be5ea06323d4dd508a5465b797a5396
  → benchmark revision b04-v1
  → deterministic benchmark-only test-hermeticity overlay

B05
  → historical Harness source
     4329623bb82bda660c245074739617e662ff3b68
  → benchmark revision b05-v1
```

Existing historical fixture reuse now requires exact metadata
`sourceRevision` equality with the requested historical revision.

A source-revision mismatch fails loudly and cannot silently reuse an older
fixture.

### B04 environment conclusion

The original B04 readiness failure was caused by persistent shared PostgreSQL
state, not by the historical source revision itself.

The accepted environment boundary now provides:

```text
fresh disposable PostgreSQL database per B04 run
DATABASE_URL / TEST_DATABASE_URL scoped to execution
no process.env mutation by the Harness environment boundary
environment cleanup before workspace cleanup
primary failure preservation across cleanup
no mutation/drop of shared qflow_test
```

The B04 historical test suite also required a benchmark-only hermeticity repair
for prerequisites that had previously depended on test ordering. That repair
remains localized to fixture test/bootstrap infrastructure and does not alter
the workflow-canvas behavior being measured.

### Commit-boundary recovery note

During Step 2 readiness investigation, Step 2A/2B/2C changes became interleaved
before their intended individual commit boundaries.

To avoid risky retroactive history reconstruction, the accepted recovery
decision is:

```text
one consolidation commit for H0-004 Step 2
```

This is an explicit exception caused by the already-interleaved working tree,
not a change to the engineering rule.

After this consolidation commit, development returns to:

```text
spec/decision
→ implementation
→ tests
→ plan
→ full gate
→ one self-contained commit
```

for subsequent work.

### Exit condition

H0-004 Step 2 is complete.

After the consolidation commit, the next allowed implementation step is:

```text
H0-004 Step 3 — Result Aggregation
```

Do not automatically proceed to H1/H2. H0-004 remains the GO / PIVOT / STOP
checkpoint and must be completed and reviewed first.

## H0-004 Step 3 — Result Aggregation

**Status:** ✅ Accepted

### Objective

Transform the persisted task-level `BenchmarkComparisonRecord` evidence produced
by Step 2 into one deterministic suite-level summary suitable for the H0-004
GO / PIVOT / STOP review.

Step 3 aggregates evidence only.

It must not execute benchmarks, reinterpret acceptance, call providers, inspect
workspaces, or invent missing telemetry.

### Input boundary

Step 3 consumes the ordered task results already produced by the accepted
H0-004 Step 2 suite runner.

Conceptually:

```text
BenchmarkSuiteRunResult
  └── tasks[]
        ├── completed
        │     └── BenchmarkComparisonRecord
        └── infrastructure_failed
              └── deterministic task error
```

The aggregation layer must preserve the distinction between:

```text
benchmark completed but not accepted
```

and:

```text
benchmark could not produce a normal comparison record because infrastructure
failed
```

Infrastructure failure must never be silently treated as a benchmark rejection,
a successful completion, or missing data that disappears from denominators.

### Output contract direction

Create a suite-level aggregate contract in:

```text
src/benchmarks/aggregation.ts
```

Preferred public shape:

```ts
export type BenchmarkSuiteAggregation = Readonly<{
  selectedTaskCount: number;
  completedTaskCount: number;
  infrastructureFailureCount: number;

  acceptedTaskCount: number;
  sfcr: number | null;

  outcomeMatchCount: number;
  outcomeCorrectnessRate: number | null;

  validationPassedCount: number;
  validationSuccessRate: number | null;

  humanInterventionRequiredCount: number;
  humanInterventionRate: number | null;

  totalHarnessDurationMs: number;
  averageHarnessDurationMs: number | null;

  totalLlmCallCount: number;
  averageLlmCallsPerCompletedTask: number | null;

  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;

  cost: number | null;

  terminalFailureReasonCounts: Readonly<Record<string, number>>;
  infrastructureFailureReasonCounts: Readonly<Record<string, number>>;
}>;
```

The exact field names may be adjusted during implementation only if repository
type evidence requires it. The semantics below are frozen.

### Metric semantics

#### Selected / completed / infrastructure-failed counts

```text
selectedTaskCount
  = every task result returned by the suite runner

completedTaskCount
  = task results with status "completed"

infrastructureFailureCount
  = task results with status "infrastructure_failed"
```

Invariant:

```text
selectedTaskCount
  = completedTaskCount + infrastructureFailureCount
```

### SFCR

Primary H0 metric:

```text
acceptedTaskCount
  = completed comparison records where accepted === true

sfcr
  = acceptedTaskCount / selectedTaskCount
```

The denominator is **all selected benchmark tasks**, not only completed records.

Reason:

an infrastructure failure prevented autonomous successful completion and must
remain visible in the viability metric.

For an empty selected suite:

```text
sfcr = null
```

Do not invent `0%` when no benchmark was selected.

### Outcome correctness

For completed comparison records:

```text
outcome matches
  when observedOutcome === expectedOutcome
```

Rate:

```text
outcomeCorrectnessRate
  = outcomeMatchCount / selectedTaskCount
```

Infrastructure failures therefore reduce suite-level outcome correctness rather
than disappearing from the metric.

Empty suite:

```text
outcomeCorrectnessRate = null
```

### Validation success

For completed comparison records:

```text
validationPassed === true
```

Rate:

```text
validationSuccessRate
  = validationPassedCount / selectedTaskCount
```

An infrastructure-failed task cannot count as validation success.

Empty suite:

```text
validationSuccessRate = null
```

### Human intervention

For completed comparison records:

```text
humanInterventionRequired === true
```

Infrastructure failure is **not** reclassified as human intervention.

Rate:

```text
humanInterventionRate
  = humanInterventionRequiredCount / selectedTaskCount
```

This preserves the difference between:

```text
autonomy failure caused by human intervention
```

and:

```text
suite execution infrastructure failure
```

Empty suite:

```text
humanInterventionRate = null
```

### Latency

Only completed records contain authoritative Harness duration evidence.

Aggregate:

```text
totalHarnessDurationMs
  = sum(comparison.harnessDurationMs) for completed tasks

averageHarnessDurationMs
  = totalHarnessDurationMs / completedTaskCount
```

Infrastructure-failure wall-clock duration is not currently part of the
comparison evidence and must not be guessed.

No completed tasks:

```text
averageHarnessDurationMs = null
totalHarnessDurationMs = 0
```

### LLM call counts

Only completed comparison records carry accepted per-task LLM call evidence.

```text
totalLlmCallCount
  = sum(comparison.llmCallCount)

averageLlmCallsPerCompletedTask
  = totalLlmCallCount / completedTaskCount
```

No completed tasks:

```text
averageLlmCallsPerCompletedTask = null
totalLlmCallCount = 0
```

Do not divide by selectedTaskCount because infrastructure-failed tasks have no
authoritative LLM-call comparison record.

### Token aggregation

Step 1 already established source-safe task-level token semantics:

```text
zero calls
  → known token total = 0

one or more calls with complete usage
  → known summed token total

one or more calls with incomplete usage
  → null
```

Step 3 extends the same rule across completed task records.

For each token field independently:

```text
no completed tasks
  → 0

every completed comparison reports a non-null aggregate
  → sum

any completed comparison reports null
  → null
```

Infrastructure-failed tasks do not fabricate token evidence and do not
automatically force token aggregates to null; they are represented explicitly by
`infrastructureFailureCount`.

This preserves the difference between:

```text
usage evidence incomplete for a completed benchmark
```

and:

```text
benchmark never produced a comparison record
```

### Cost

Current comparison evidence has no authoritative cost data.

Therefore Step 3 must retain:

```text
cost = null
```

Do not infer cost from tokens, model names, public pricing, or provider defaults
inside the aggregation layer.

Cost calculation requires an explicit later evidence source.

### Failure-reason aggregation

Completed task records may expose:

```text
terminalFailureReason
```

Aggregate each non-empty value into:

```text
terminalFailureReasonCounts
```

Infrastructure-failed task results must aggregate their deterministic serialized
error reason/code separately into:

```text
infrastructureFailureReasonCounts
```

Do not merge both categories.

They represent different failure boundaries.

### Purity and determinism

The aggregator must be a pure transformation.

It must not:

```text
read/write files
load fixture repositories
call the Harness
run validation commands
call providers
use Date.now()
generate IDs
read process.env
mutate input records
persist reports
```

Given identical suite task results, it must return structurally identical output.

### Deterministic tests

Create:

```text
src/test-h0-004-benchmark-aggregation.ts
```

The focused test must cover at least:

1. **all accepted completed tasks**
   - SFCR = 1;
   - outcome/validation rates = 1;
   - intervention rate = 0;
   - latency and LLM calls aggregate correctly.

2. **mixed accepted/rejected completed tasks**
   - accepted count and SFCR use all selected tasks;
   - rejection does not erase telemetry.

3. **infrastructure failure**
   - selected denominator includes the failed task;
   - completed count excludes it;
   - SFCR/outcome/validation reflect the failure;
   - infrastructure reason is counted separately;
   - human intervention is not synthesized.

4. **incomplete token evidence**
   - one completed record with a null token field makes that suite token field
     null;
   - other token fields remain independently aggregatable.

5. **zero-call completed task**
   - zero remains known usage rather than null.

6. **empty suite**
   - counts are zero;
   - rate/average metrics are null;
   - token totals follow the explicit empty-suite semantics;
   - cost remains null.

7. **failure-reason grouping**
   - repeated reasons increment stable counts;
   - terminal and infrastructure failures remain distinct.

8. **input immutability**
   - aggregation does not mutate the supplied suite result.

### Scope

Create:

```text
src/benchmarks/aggregation.ts
src/test-h0-004-benchmark-aggregation.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

only when implementation begins.

This specification patch changes only:

```text
QOS-HARNESS-ENGINEERING-PLAN.md
```

### Non-goals

Step 3 does not:

- execute B01-B05;
- introduce a second suite runner;
- persist an aggregate report;
- render CLI/Markdown/JSON reports;
- make GO / PIVOT / STOP automatically;
- define viability thresholds;
- compare multiple models/providers;
- calculate model cost from public pricing;
- change benchmark acceptance semantics;
- change comparison-record semantics;
- change suite-runner continuation policy;
- change B04 fixtures/environment isolation;
- change telemetry contracts;
- change providers, graph, prompts, models, or runtime composition;
- begin H1 Repository Intelligence or H2 Context Engine.

### Focused implementation gate

After implementation:

```bash
npm run typecheck && \
npm run test:h0-004-benchmark-aggregation && \
npm run test:h0-004-benchmark-suite-runner && \
npm run test:h0-004-comparison-contract
```

### Full regression requirement

Step 3 is not accepted from the focused gate alone.

Required sequence remains:

```text
spec/decision
→ implementation
→ focused deterministic tests
→ PLAN implementation/acceptance metadata
→ full H0-004 regression gate
→ one self-contained commit
```

### Exit condition

Step 3 is complete when suite-level aggregation is deterministic, preserves
missing/infrastructure evidence correctly, all focused/full gates are green, and
the Engineering Plan records the accepted metric semantics.

Only then proceed to the next H0-004 step.

The later H0-004 final checkpoint must still review real benchmark evidence and
make the explicit:

```text
GO
PIVOT
STOP
```

decision before H1/H2 work begins.

### Step 3 implementation record

Implemented the pure suite aggregation boundary in:

```text
src/benchmarks/aggregation.ts
```

with deterministic coverage in:

```text
src/test-h0-004-benchmark-aggregation.ts
```

and the package gate:

```text
test:h0-004-benchmark-aggregation
```

The implementation consumes only `BenchmarkSuiteRunResult` and preserves the
accepted Step 2 distinction between completed comparison records and
`infrastructure_failed` task results.

Implemented metric semantics:

```text
SFCR
  → accepted completed tasks / all selected tasks

outcome correctness
  → matching completed outcomes / all selected tasks

validation success
  → validation-passed completed tasks / all selected tasks

human intervention rate
  → intervention-required completed tasks / all selected tasks

Harness latency
  → completed comparison records only

LLM call averages
  → completed comparison records only

token totals
  → sum when every completed record has evidence
  → null independently per token field when any completed record is null
  → 0 when there are no completed records

cost
  → null
```

Infrastructure failures remain explicit in the selected-task denominators but
are not reclassified as human intervention and do not fabricate latency, LLM
usage, token, or terminal Harness evidence.

Because the current `BenchmarkSuiteTaskError` contract contains deterministic
`name` and `message` fields but no normalized infrastructure error code, Step 3
groups infrastructure failure reasons by `error.name`. It does not invent a new
error taxonomy in the aggregation layer.

Completed Harness terminal failures continue to group separately by the existing
`terminalFailureReason` string.

The aggregator is pure and does not execute benchmarks, read environment state,
persist output, call providers, use clocks/IDs, mutate task results, or inspect
repositories.

Deterministic tests cover:

```text
all-accepted suite
mixed accepted/rejected completed tasks
infrastructure failure denominator behavior
independent incomplete-token propagation
known zero-call usage
empty-suite semantics
terminal/infrastructure failure grouping
input immutability
```

No runner, comparison-record, acceptance, provider, telemetry, fixture, or B04
environment behavior is changed by this implementation.

Run the focused gate before adding acceptance metadata:

```bash
npm run typecheck && \
npm run test:h0-004-benchmark-aggregation && \
npm run test:h0-004-benchmark-suite-runner && \
npm run test:h0-004-comparison-contract
```

### Step 3 acceptance record

The focused deterministic Step 3 gate passed in the development environment:

```text
npm run typecheck                              PASS
npm run test:h0-004-benchmark-aggregation     PASS
npm run test:h0-004-benchmark-suite-runner    PASS
npm run test:h0-004-comparison-contract       PASS
```

Accepted aggregation semantics:

```text
selectedTaskCount
  = all suite task results

completedTaskCount
  = status "completed"

infrastructureFailureCount
  = status "infrastructure_failed"

acceptedTaskCount
  = completed comparison records with accepted=true

SFCR
  = acceptedTaskCount / selectedTaskCount
  = null only for an empty selected suite

outcomeCorrectnessRate
  = completed matching outcomes / selectedTaskCount

validationSuccessRate
  = completed validation-passed records / selectedTaskCount

humanInterventionRate
  = completed intervention-required records / selectedTaskCount

average Harness duration
  = completed records only

average LLM calls
  = completed records only
```

Infrastructure failures remain visible in the suite-level completion/outcome/
validation denominators but are not reclassified as human intervention and do
not fabricate Harness duration or LLM usage evidence.

Accepted token semantics remain source-safe and field-independent:

```text
no completed records
  → 0

all completed records have known value
  → sum

any completed record has null for that token field
  → null for that field
```

Cost remains:

```text
null
```

because no authoritative cost evidence exists in the current comparison
contract.

Failure categories remain intentionally separate:

```text
terminalFailureReasonCounts
  → completed Harness terminal reasons

infrastructureFailureReasonCounts
  → BenchmarkSuiteTaskError.name
```

No new infrastructure error taxonomy is invented in Step 3.

The deterministic test also proves the aggregation function does not mutate its
input suite result.

### Step 3 full-gate requirement

Focused acceptance does not close the implementation commit.

Before committing Step 3, run the complete H0-004 regression gate after this
acceptance metadata is applied.

Only a green full gate may close the Step 3 implementation commit.

## H0-004 Step 4 — Comparison Report Contract and Deterministic Rendering

**Status:** ✅ Accepted

### Objective

Create the smallest deterministic report boundary that turns:

```text
BenchmarkSuiteRunResult
        +
BenchmarkSuiteAggregation
```

into one auditable H0-004 comparison artifact suitable for later real-suite
execution and the final GO / PIVOT / STOP review.

Step 4 is reporting only. It must not execute benchmarks, change aggregation
semantics, make the viability decision automatically, or introduce a dashboard.

### Input boundary

Step 4 consumes already-produced evidence only:

```text
BenchmarkSuiteRunResult
BenchmarkSuiteAggregation
```

Preferred direction:

```text
BenchmarkSuiteRunResult
        +
BenchmarkSuiteAggregation
        ↓
createBenchmarkComparisonReport(...)
        ↓
BenchmarkComparisonReport
        ↓
deterministic JSON / Markdown rendering
```

The report must not recompute benchmark acceptance or suite aggregation.

### Versioned report contract

Create:

```text
src/benchmarks/report.ts
```

Preferred contract:

```ts
export const BENCHMARK_COMPARISON_REPORT_SCHEMA_VERSION = 1 as const;

export type BenchmarkComparisonReport = Readonly<{
  schemaVersion: typeof BENCHMARK_COMPARISON_REPORT_SCHEMA_VERSION;
  suite: BenchmarkSuiteAggregation;
  tasks: readonly BenchmarkSuiteTaskResult[];
}>;
```

The exact names may change only if repository type evidence requires it.
Semantics are frozen:

```text
explicit schema version
suite aggregation preserved unchanged
ordered task evidence preserved unchanged
no timestamps generated
no run IDs generated
```

### Evidence preservation

Completed task results retain the complete existing
`BenchmarkComparisonRecord`.

Infrastructure-failed task results retain:

```text
benchmarkId
status
error.name
error.message
```

Do not flatten away task-level evidence merely because Step 3 provides
aggregates.

### Pure report factory

`createBenchmarkComparisonReport(...)` must be pure.

It must not:

```text
execute benchmarks
run validation
call Harness/providers
read environment/files
write files
use Date.now()
generate IDs
mutate inputs
recalculate comparison records
recalculate aggregation
```

### Deterministic JSON rendering

Provide:

```ts
renderBenchmarkComparisonReportJson(report): string
```

Requirements:

```text
valid JSON
stable indentation
trailing newline
task order preserved
no environment-derived fields
no generated timestamp/ID
no hidden evidence filtering
```

JSON is the canonical machine-readable H0-004 report.

### Deterministic Markdown rendering

Provide:

```ts
renderBenchmarkComparisonReportMarkdown(report): string
```

Stable sections:

```text
title / schema version

suite summary:
  selected
  completed
  infrastructure failed
  accepted
  SFCR
  outcome correctness
  validation success
  human intervention
  total/average Harness duration
  total/average LLM calls
  token aggregates
  cost

task-by-task table:
  benchmark
  status
  expected
  observed
  accepted
  validation
  intervention
  duration
  LLM calls
  failure summary

terminal failure reasons
infrastructure failure reasons
```

### Formatting rules

Rates:

```text
null → n/a
non-null → percentage with exactly 2 decimal places
```

Examples:

```text
1    → 100.00%
0.6  → 60.00%
0    → 0.00%
null → n/a
```

Unknown aggregate evidence:

```text
null → n/a
```

Known zero remains `0`.

Do not transform unknown values into zero.

### Infrastructure failure presentation

`infrastructure_failed` must remain distinct from a completed but rejected
benchmark.

Do not label infrastructure failure as rejected, validation failure, or human
intervention unless that evidence actually exists.

### Persistence decision

Step 4 does not persist reports automatically.

Artifact location, naming, timestamps, and run identity must be decided with the
later real-suite execution where lifecycle ownership actually exists.

Therefore Step 4 defines only:

```text
report contract
report factory
JSON renderer
Markdown renderer
```

and does not create:

```text
filesystem report store
.reports directory
timestamped filenames
database
dashboard
```

### Deterministic tests

Create:

```text
src/test-h0-004-comparison-report.ts
```

It must prove:

1. schema version is explicit;
2. suite aggregation is retained unchanged;
3. ordered task evidence is retained;
4. factory does not mutate or recompute input evidence;
5. JSON rendering is byte-deterministic and valid;
6. JSON preserves completed and infrastructure-failed evidence;
7. Markdown rates use exactly two decimal places;
8. Markdown renders null as `n/a` and known zero as zero;
9. completed rejection and infrastructure failure remain visually distinct;
10. terminal and infrastructure failure summaries remain separate;
11. empty-suite output is valid and deterministic.

### Scope

Create:

```text
src/benchmarks/report.ts
src/test-h0-004-comparison-report.ts
```

Modify during implementation:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

This specification patch modifies only the Engineering Plan.

### Non-goals

Step 4 does not:

- execute real B01-B05;
- call providers;
- persist reports;
- create dashboard/UI/HTML/PDF;
- generate report IDs or timestamps;
- define filesystem naming;
- change suite-runner behavior;
- change aggregation semantics;
- change benchmark acceptance or definitions;
- infer missing cost;
- compare model/provider strategies;
- decide GO / PIVOT / STOP;
- define viability thresholds;
- begin H1/H2.

### Focused implementation gate

```bash
npm run typecheck && \
npm run test:h0-004-comparison-report && \
npm run test:h0-004-benchmark-aggregation && \
npm run test:h0-004-benchmark-suite-runner && \
npm run test:h0-004-comparison-contract
```

### Development boundary

```text
spec/decision
→ commit spec
→ implementation
→ focused deterministic gate
→ PLAN acceptance metadata
→ full H0-004 regression gate
→ one self-contained implementation commit
```

### Exit condition

Step 4 is complete when a versioned deterministic machine-readable and
human-readable report can be created from Step 2/3 evidence without executing
or recomputing benchmark behavior.

After Step 4, the expected next H0-004 slice is the first real fixed-suite
execution/report capture.

The final GO / PIVOT / STOP decision remains deferred until real B01-B05
comparison evidence exists and has been reviewed.

### Step 4 implementation record

Implemented:

```text
src/benchmarks/report.ts
src/test-h0-004-comparison-report.ts
```

and package script:

```text
test:h0-004-comparison-report
```

The report factory preserves the exact supplied Step 3 aggregation object and
the exact ordered Step 2 task-results array. It does not recompute either layer.

Accepted implementation direction pending gate:

```text
BenchmarkSuiteRunResult
        +
BenchmarkSuiteAggregation
        ↓
createBenchmarkComparisonReport(...)
        ↓
BenchmarkComparisonReport schemaVersion=1
        ├── deterministic JSON
        └── deterministic Markdown
```

JSON uses stable two-space indentation and a trailing newline.

Markdown renders:

```text
rates
  → exactly 2 decimal percentage places
  → null as n/a

unknown nullable aggregate evidence
  → n/a

known zero
  → 0
```

Completed benchmark rejection and infrastructure failure remain distinct task
states.

The task table preserves original suite order and does not synthesize
acceptance, validation, intervention, latency, or LLM evidence for
`infrastructure_failed` tasks.

Terminal Harness failure reasons and infrastructure failure reasons remain
separate sections.

No persistence, timestamp, report ID, provider execution, benchmark execution,
aggregation recomputation, acceptance recomputation, or GO/PIVOT/STOP decision
is introduced.

Run the focused gate before adding acceptance metadata:

```bash
npm run typecheck && \
npm run test:h0-004-comparison-report && \
npm run test:h0-004-benchmark-aggregation && \
npm run test:h0-004-benchmark-suite-runner && \
npm run test:h0-004-comparison-contract
```

### Step 4 acceptance record

The focused deterministic Step 4 gate passed in the development environment:

```text
npm run typecheck                         PASS
npm run test:h0-004-comparison-report    PASS
npm run test:h0-004-benchmark-aggregation PASS
npm run test:h0-004-benchmark-suite-runner PASS
npm run test:h0-004-comparison-contract  PASS
```

Accepted report boundary:

```text
BenchmarkSuiteRunResult
        +
BenchmarkSuiteAggregation
        ↓
BenchmarkComparisonReport schemaVersion=1
        ├── deterministic JSON
        └── deterministic Markdown
```

The report factory preserves the supplied aggregation and ordered task evidence
rather than recomputing either layer.

Accepted deterministic JSON semantics:

```text
valid JSON
two-space indentation
trailing newline
stable task order
no generated timestamp
no generated report ID
no environment-derived fields
```

Accepted Markdown semantics:

```text
rates
  → exactly two decimal percentage places

null aggregate evidence
  → n/a

known zero
  → 0
```

Completed benchmark rejection and infrastructure failure remain distinct.

Infrastructure-failed tasks do not receive synthesized acceptance, validation,
intervention, Harness latency, or LLM evidence.

Terminal Harness failure summaries remain separate from infrastructure failure
summaries.

Step 4 introduces no report persistence, filesystem naming policy, dashboard,
HTML/PDF rendering, benchmark execution, provider execution, aggregation
recomputation, acceptance recomputation, or automatic GO / PIVOT / STOP
decision.

### Step 4 full-gate requirement

Focused acceptance does not close the implementation commit.

Before committing Step 4, run the complete H0-004 regression gate after this
acceptance metadata is applied.

Only a green full gate may close the Step 4 implementation commit.

## H0-004 Step 5 — First Real Fixed-Suite Execution and Report Capture

**Status:** 🧪 Implemented — deterministic gate pending

### Objective

Execute the accepted fixed benchmark suite:

```text
B01 → B02 → B03 → B04 → B05
```

through the real H0 application/runtime path, then capture the first auditable
H0-004 baseline report using the Step 2–4 infrastructure exactly as accepted.

This is the first measurement step.

It is not a fixture-repair, prompt-tuning, provider-tuning, model-selection, or
GO / PIVOT / STOP decision step.

### Primary rule

The benchmark must measure the Harness that exists at the start of Step 5.

Do not modify benchmark definitions, expected outcomes, fixture product behavior,
prompts, provider composition, runtime policy, acceptance semantics, or
aggregation semantics in response to the measured result.

If the baseline performs poorly, record the poor result.

Do not improve the system during the measurement and then call the new result
the original baseline.

### Fixed benchmark set

The execution set is exactly the accepted H0-002 suite:

```text
B01
B02
B03
B04
B05
```

Step 5 must not:

```text
skip a difficult benchmark
add an easier benchmark
change expectedOutcome
change validation commands
change success criteria
change fixture source revision
change the B04 hermeticity overlay
```

### Baseline runtime composition

The first baseline uses the repository's currently accepted default runtime
composition.

Step 5 must not introduce a special benchmark-only provider/model composition.

Conceptually:

```text
benchmark
  → NormalizedHarnessTask
  → runHarness(...)
  → existing default runtime composition
```

The exact resolved provider/model bindings used by the run must be recorded as
execution evidence before/with the captured result.

If environment overrides affect the current default composition, the Step 5
runner must record the resolved values actually used.

Step 5 does not compare alternative providers or models.

### Reproducibility identity

Before execution, capture the source identity of the Harness being measured:

```text
Harness repository HEAD SHA
Harness package version
benchmark fixture revisions
resolved provider/model bindings
```

The capture must reject a dirty Harness working tree before starting the real
suite.

Reason:

the baseline must correspond to one reviewable source state.

Untracked/generated report output created by the Step 5 command itself must not
be interpreted as pre-existing source dirtiness.

### Fixture preflight

Before any provider-backed benchmark execution:

1. materialize/verify B01-B05 fixtures using the accepted Step 2A materializer;
2. verify historical fixture provenance/revision integrity;
3. verify B04 disposable PostgreSQL prerequisites;
4. verify the report output directory is writable/creatable;
5. verify required provider runtime configuration is available.

Preflight failure must abort before the first benchmark provider call.

Do not partially run the suite when the deterministic environment is known to
be invalid.

### Provider preflight boundary

Provider preflight must validate configuration only.

It must not consume an extra planning/reviewer/refiner model call merely to test
credentials.

Examples of acceptable checks:

```text
required API environment value exists
required Claude executable exists when the configured composition uses Claude
model/provider binding resolves successfully
```

Live provider behavior is measured by the benchmark itself.

### B04 environment

B04 continues using the accepted disposable PostgreSQL boundary.

Requirements remain:

```text
fresh disposable database
same scoped DATABASE_URL / TEST_DATABASE_URL for Harness + validation
no process.env mutation
environment cleanup before workspace cleanup
no mutation/drop of shared qflow_test
```

Step 5 must not replace this with a shared persistent database for convenience.

### Suite execution semantics

Use the accepted Step 2 suite runner behavior.

For each benchmark:

```text
run once
persist/store task result immediately
continue after task-level infrastructure failure
do not silently retry the benchmark
```

A task-level `infrastructure_failed` result remains part of the baseline.

The suite must not automatically rerun a failed task in the same baseline
capture.

### Distinguish preflight failure from task infrastructure failure

Two failure boundaries must remain distinct:

```text
preflight failure
  → suite never starts
  → no baseline report is accepted

task infrastructure failure
  → suite already started
  → task result is infrastructure_failed
  → suite continues
  → result remains in baseline report
```

This avoids producing a misleading partial baseline when the whole environment
was invalid before execution.

### Step 5 execution service

Create a small application/infrastructure boundary that composes the already
accepted components.

Preferred direction:

```text
src/benchmarks/real-suite.ts
```

Conceptual responsibilities:

```text
assert clean Harness source state
collect source/runtime identity
run deterministic preflight
run fixed B01-B05 suite
aggregate suite result
create comparison report
render JSON + Markdown
persist both artifacts atomically
return capture metadata
```

It must reuse:

```text
fixture materialization
suite runner
environment preparer
complete benchmark runner
aggregation
comparison report
```

It must not duplicate their internal algorithms.

### Capture metadata

Step 4 intentionally kept run identity outside
`BenchmarkComparisonReport schemaVersion=1`.

Step 5 therefore introduces a capture envelope rather than mutating the report
contract merely to add lifecycle data.

Preferred conceptual shape:

```ts
export type BenchmarkComparisonCapture = Readonly<{
  schemaVersion: 1;
  capturedAt: string;
  harness: Readonly<{
    gitRevision: string;
    packageVersion: string;
  }>;
  runtime: Readonly<{
    roles: Readonly<Record<string, Readonly<{
      provider: string;
      model: string;
    }>>>;
  }>;
  fixtures: readonly Readonly<{
    benchmarkId: string;
    repositoryId: string;
    revision: string;
    sourceRevision: string | null;
  }>[];
  report: BenchmarkComparisonReport;
}>;
```

Exact type names may be adjusted from repository evidence during implementation,
but the evidence categories are frozen.

### Timestamp rule

`capturedAt` is lifecycle evidence for a real run and is allowed in the Step 5
capture envelope.

It must be created once at the outer Step 5 execution boundary.

Do not generate independent timestamps inside:

```text
suite runner
aggregation
report factory
JSON report renderer
Markdown report renderer
```

The Step 4 report remains deterministic from its inputs.

### Provider identity

Do not infer provider identity from model-name string conventions.

The resolved runtime composition must expose or be projected into a stable
capture representation at the Step 5 boundary.

If the current composition contracts do not expose a stable provider identity,
implementation must add the smallest outer-boundary projection justified by
current source evidence.

Do not add provider identity to core planning state merely for reporting.

### Artifact location

Persist the first real baseline under a dedicated repository-local generated
artifact directory:

```text
.benchmark-results/h0-004/
```

The Step 5 command writes exactly:

```text
baseline.json
baseline.md
```

for the first accepted baseline capture.

The directory must be treated as generated benchmark evidence, not product
source.

Do not introduce timestamped filenames in Step 5.

Reason:

this step captures one canonical H0-004 baseline, not a historical run database.

Future repeated/provider-comparison runs may introduce history/versioned naming
in a later task if evidence justifies it.

### Atomic persistence

Do not leave a final-looking half-written baseline.

Preferred behavior:

```text
render both artifacts in memory
write temporary files
rename into baseline.json / baseline.md only after both renders succeed
```

If final persistence fails, the Step 5 command fails.

Do not claim a captured baseline unless both canonical artifacts exist.

### Canonical machine-readable artifact

`baseline.json` is the canonical evidence artifact.

It contains the capture envelope including the exact Step 4 report.

`baseline.md` is the human-readable review artifact and should include:

```text
capture identity
Harness git revision/package version
resolved provider/model bindings
fixture revisions
Step 4 Markdown comparison report
```

The Markdown must not contain metrics that are absent from the canonical JSON
capture.

### CLI/script boundary

Add one explicit package command for the real suite.

Preferred script:

```text
benchmark:h0-004-baseline
```

It may use a thin script under:

```text
scripts/run-h0-004-baseline.ts
```

The script owns process-level concerns only:

```text
invoke Step 5 service
print artifact paths
set non-zero exit code on failure
```

It must not implement benchmark scoring/report algorithms itself.

### Execution result and exit status

A completed baseline capture may contain rejected or infrastructure-failed
benchmarks and still exit successfully at the process level.

Reason:

```text
poor benchmark result
≠
measurement command failure
```

The command exits non-zero only when the measurement itself could not be
completed/captured, for example:

```text
preflight failure
unexpected suite/store fatal failure
aggregation/report construction failure
artifact persistence failure
cleanup failure that invalidates execution integrity
```

Do not make `acceptedTaskCount < selectedTaskCount` a CLI process failure.

### No hidden rerun policy

If Step 5 completes and the baseline contains:

```text
B01 PASS
B02 PASS
B03 rejected
B04 infrastructure_failed
B05 blocked/accepted
```

that is the baseline.

Do not rerun B03/B04 automatically to obtain a cleaner report.

Any later rerun must be an explicit new measurement decision with its own
recorded rationale.

### Deterministic tests before live execution

Create a deterministic Step 5 test that uses fake/mocked execution dependencies.

Preferred:

```text
src/test-h0-004-real-suite.ts
```

It must prove at least:

1. fixed B01-B05 order is preserved;
2. preflight runs before suite execution;
3. preflight failure prevents suite execution;
4. clean-source requirement is enforced;
5. exactly one suite execution occurs;
6. task-level infrastructure failure can still produce a completed capture;
7. aggregation/report are produced from that single suite result;
8. capture metadata preserves source/runtime/fixture identity;
9. JSON and Markdown are both persisted;
10. persistence failure prevents successful capture;
11. product benchmark failure does not by itself make the command fail;
12. no task rerun/retry is introduced;
13. test consumes zero real provider usage.

### Live execution prerequisites

The real baseline command may run only after:

```text
Step 5 deterministic test gate passes
full H0-004 regression gate passes
Step 5 implementation is committed
Harness working tree is clean at that implementation commit
fixtures preflight passes
provider configuration preflight passes
B04 PostgreSQL admin configuration is available
```

The captured `harness.gitRevision` must equal that Step 5 implementation commit
HEAD.

### Live baseline run

Run once:

```bash
npm run benchmark:h0-004-baseline
```

Do not run this command casually during implementation because it consumes real
provider usage and constitutes the baseline measurement.

### Post-run verification

After the command completes, verify deterministically:

```text
.benchmark-results/h0-004/baseline.json exists
.benchmark-results/h0-004/baseline.md exists

JSON parses
capture schema version matches
Harness revision matches measured HEAD
task order is B01-B05
selectedTaskCount = 5
completed + infrastructure failures = 5
report task count = 5
Markdown is derived from the same capture/report evidence
```

### Baseline acceptance versus benchmark success

Step 5 acceptance means:

> the measurement was executed reproducibly and captured correctly.

It does **not** mean:

> the Harness performed well enough to proceed.

Therefore Step 5 can be accepted even with poor SFCR, provided the measurement
itself is valid.

Performance interpretation belongs to the next checkpoint.

### GO / PIVOT / STOP boundary

Do not automatically proceed to H1/H2 after capturing the baseline.

After Step 5, create a separate H0-004 viability review using the captured
evidence.

That review must consider at least:

```text
SFCR
outcome correctness
validation success
human intervention
infrastructure failures
Harness duration
LLM calls
token evidence
terminal failure reasons
task-level evidence for B01-B05
```

Cost remains unavailable unless an authoritative cost source exists by then.

The review must produce an explicit:

```text
GO
PIVOT
STOP
```

decision with rationale tied to the baseline evidence.

### Scope

Expected implementation files:

```text
src/benchmarks/real-suite.ts
src/test-h0-004-real-suite.ts
scripts/run-h0-004-baseline.ts
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

The live evidence capture later adds:

```text
.benchmark-results/h0-004/baseline.json
.benchmark-results/h0-004/baseline.md
```

These two canonical baseline artifacts are intentionally tracked evidence for
the H0-004 viability checkpoint. Do not add `.benchmark-results/` to
`.gitignore` in Step 5.

Additional small source changes are allowed only if exact current contracts
require a minimal identity/persistence composition hook.

Any such expansion must be justified from source evidence before implementation.

### Non-goals

Step 5 does not:

- tune prompts;
- change provider/model defaults;
- compare NVIDIA versus Claude;
- add dynamic model routing;
- change benchmark definitions;
- change fixture product behavior;
- change expected outcomes;
- change acceptance semantics;
- change aggregation semantics;
- change Step 4 report semantics;
- automatically retry failed benchmarks;
- calculate provider cost from public pricing;
- create a benchmark dashboard;
- create a benchmark history database;
- introduce timestamped artifact history;
- make the GO / PIVOT / STOP decision;
- begin H1/H2.

### Deterministic implementation gate

Before any live baseline run:

```bash
npm run typecheck && \
npm run test:h0-004-real-suite && \
npm run test:h0-004-comparison-report && \
npm run test:h0-004-benchmark-aggregation && \
npm run test:h0-004-benchmark-suite-runner && \
npm run test:h0-004-comparison-contract && \
npm run test:h0-004-benchmark-fixture-materialization && \
npm run test:h0-004-benchmark-postgres-environment && \
npm run test:h0-004-benchmark-environment
```

### Full regression gate before live measurement

After the focused Step 5 gate and before consuming real provider usage, run the
complete H0-004 regression gate.

The exact command must include all currently accepted H0-004, H0-003, H0-002A,
H0-002, H0-001, and H-ARCH regression gates affected by the execution path.

Only after that gate is green may the real baseline command run.

### Development sequence

The original Step 5 sequence contained one contradictory requirement:

```text
working tree must be clean before the real baseline
```

while also requiring:

```text
implementation changes remain uncommitted until after the real baseline
```

Those conditions cannot both be true while measuring the exact code being
executed.

Step 5 therefore uses two explicit commit boundaries:

```text
Step 5 spec/decision
→ commit spec

Step 5 implementation
→ deterministic focused gate
→ full regression gate
→ implementation commit

clean working tree at the implementation commit
→ deterministic preflight
→ one real B01-B05 baseline run
→ artifact verification

PLAN baseline acceptance metadata
+ canonical baseline.json
+ baseline.md
→ final regression gate
→ evidence commit

then:
H0-004 GO / PIVOT / STOP review
```

The implementation commit is the exact Harness source revision recorded by the
baseline capture.

The evidence commit must not change runtime source behavior. It contains only
the captured baseline artifacts and acceptance/documentation metadata required
to audit the measurement.

### Exit condition

Step 5 is complete only when:

```text
the fixed B01-B05 suite ran once through the accepted real Harness path
the measured Harness source state is identified
the actual runtime provider/model bindings are recorded
all five task results are represented
the canonical JSON capture is valid
the Markdown review artifact exists
artifact evidence matches the measured run
no benchmark was silently retried/repaired during measurement
the Engineering Plan records the baseline result
```

Step 5 completion authorizes only the H0-004 viability review.

Commit-boundary invariant:

```text
baseline harness.gitRevision
  = Step 5 implementation commit

evidence commit
  = baseline artifacts + PLAN metadata only
```

The evidence commit must not alter the Harness implementation that was measured.

It does not authorize H1/H2 implementation.

### Step 5 implementation record

Implemented the deterministic/live execution boundary:

```text
src/benchmarks/real-suite.ts
src/test-h0-004-real-suite.ts
scripts/run-h0-004-baseline.ts
```

and package commands:

```text
test:h0-004-real-suite
benchmark:h0-004-baseline
```

The Step 5 service now composes existing accepted boundaries rather than
duplicating their algorithms:

```text
fixture materializer
→ local fixture locator
→ Git worktree workspace resolver
→ disposable B04 PostgreSQL environment
→ complete benchmark runner
→ fixed suite runner
→ aggregation
→ comparison report
→ baseline capture persistence
```

The real baseline preflight requires:

```text
clean measured Harness working tree
QOS_BENCHMARK_FIXTURE_ROOT
QFLOW_REPOSITORY
QOS_BENCHMARK_POSTGRES_ADMIN_URL
NVIDIA_API_KEY
psql availability
canonical baseline artifacts absent
fixture materialization/provenance integrity
writable canonical artifact directory
```

`HARNESS_REPOSITORY` remains optional and defaults to the measured Harness
repository for the historical B05 source snapshot.

The measured source identity is:

```text
current Harness HEAD
current package.json version
```

The current default runtime is projected at the outer Step 5 boundary as:

```text
planner  → nvidia + resolved planner model
reviewer → nvidia + resolved reviewer model
refiner  → nvidia + resolved refiner model
```

Provider identity is established from the concrete default composition/provider
object at the outer measurement boundary. It is not inferred from model-name
strings and is not added to graph/planning state.

The canonical capture envelope records:

```text
capture schema version
capturedAt
Harness git revision/package version
resolved runtime role provider/model identity
B01-B05 fixture revision/commit/source revision evidence
Step 4 BenchmarkComparisonReport
```

The capture service rejects a suite result that is not exactly:

```text
B01 → B02 → B03 → B04 → B05
```

and invokes the suite exactly once.

A task-level `infrastructure_failed` result remains a valid measured task result
and does not itself fail capture.

Preflight failure prevents suite execution.

The baseline command also refuses to run when either canonical artifact already
exists, preventing an implicit overwrite/rerun of the first baseline.

Persistence renders both artifacts before publication and removes a partially
published counterpart if the second rename fails.

Canonical paths remain:

```text
.benchmark-results/h0-004/baseline.json
.benchmark-results/h0-004/baseline.md
```

The deterministic Step 5 test uses injected fake suite/preflight dependencies
and consumes zero provider usage. It covers:

```text
preflight-before-suite ordering
preflight failure blocks suite
single suite execution
fixed B01-B05 order
task infrastructure failure capture
capture identity
JSON/Markdown persistence
partial-publication rollback
canonical JSON/Markdown equivalence
```

No live baseline has been executed by this implementation patch.

Before the implementation commit, run:

```bash
npm run typecheck && \
npm run test:h0-004-real-suite && \
npm run test:h0-004-comparison-report && \
npm run test:h0-004-benchmark-aggregation && \
npm run test:h0-004-benchmark-suite-runner && \
npm run test:h0-004-comparison-contract && \
npm run test:h0-004-benchmark-fixture-materialization && \
npm run test:h0-004-benchmark-postgres-environment && \
npm run test:h0-004-benchmark-environment
```

Then run the complete H0-004 regression gate.

Do not execute:

```text
npm run benchmark:h0-004-baseline
```

until the deterministic/full gates are green, the implementation is committed,
and the working tree is clean.

### Step 5 live baseline attempt 1 — invalidated measurement

**Status:** ❌ Not accepted as canonical baseline

The first live command completed and captured artifacts with process exit `0`,
but post-run inspection exposed a Step 5 measurement-infrastructure defect.

Observed capture identity:

```text
capturedAt:
  2026-08-30T20:29:29.697Z

Harness gitRevision:
  63824c5d9a1bd319f1e9a9f5b784a120f3712501

package:
  0.1.0-alpha.7
```

Observed task results:

```text
B01 completed / accepted
B02 completed / accepted
B03 completed / accepted
B04 infrastructure_failed
B05 infrastructure_failed
```

The generated aggregate reported:

```text
selectedTaskCount = 5
completedTaskCount = 3
infrastructureFailureCount = 2
acceptedTaskCount = 3
SFCR = 60.00%
```

These numbers are retained as diagnostic evidence only.

They must **not** be used for the H0-004 GO / PIVOT / STOP decision.

#### Why attempt 1 is invalid

B04 failed before Harness execution while creating the disposable PostgreSQL
database.

The accepted PostgreSQL command runner supplied the complete admin URI through:

```text
PGDATABASE=<postgresql://...>
```

but the real `psql` process attempted the local default Unix socket instead of
the configured PostgreSQL server.

Therefore the disposable PostgreSQL implementation had not been proven against
the real libpq process behavior.

Step 5 preflight also checked only:

```text
psql --version
```

plus URL syntax.

It did not execute a real admin connection probe through the same command path
used by B04.

That violates the Step 5 preflight requirement that invalid B04 PostgreSQL
prerequisites abort before the first provider-backed benchmark execution.

Because B04 was prevented from being measured by the measurement
infrastructure itself, attempt 1 is not a valid canonical viability baseline.

#### B05 observation retained

B05 reached the Harness but later surfaced:

```text
BenchmarkObservationDerivationError:
Cannot derive benchmark outcome without refinedPlan.
```

The console evidence also showed planning-attempt exhaustion.

This is retained as genuine diagnostic Harness/runner evidence.

Do not fix or reinterpret B05 as part of the PostgreSQL correction.

The next valid baseline rerun must measure B05 unchanged.

### Step 5A — PostgreSQL real-process/preflight correction

**Status:** 🧪 Implemented — deterministic gate pending

Correction scope:

```text
src/benchmarks/postgres-environment.ts
src/test-h0-004-benchmark-postgres-environment.ts
src/benchmarks/real-suite.ts
QOS-HARNESS-ENGINEERING-PLAN.md
```

Decision:

1. Parse `QOS_BENCHMARK_POSTGRES_ADMIN_URL` into standard libpq environment
   fields:
   - `PGHOST`
   - `PGPORT` when present
   - `PGUSER` when present
   - `PGPASSWORD` when present
   - `PGDATABASE`
   - `PGSSLMODE` when present

2. Keep credentials out of the `psql` argv.

3. Use the exact same real `PsqlPostgresAdminCommandRunner` during Step 5
   preflight with:

```sql
SELECT 1;
```

4. A PostgreSQL connection failure now aborts preflight before any benchmark
   provider call.

5. Do not change B04 fixture source/revision, disposable database semantics,
   benchmark definitions, prompts, models, acceptance, aggregation, or report
   semantics.

6. Do not change B05 behavior in this correction.

### Attempt-1 artifact handling

The untracked canonical files produced by invalid attempt 1:

```text
.benchmark-results/h0-004/baseline.json
.benchmark-results/h0-004/baseline.md
```

must not be committed as the canonical baseline.

After Step 5A is accepted and committed, explicitly remove those two invalid
canonical files before the authorized rerun.

The invalid attempt remains documented in this Engineering Plan and in the
separately retained diagnostic evidence.

The rerun is **explicitly authorized** because attempt 1 is invalidated by a
measurement-infrastructure defect. This is not a hidden retry to improve a poor
benchmark score.

### Step 5A focused gate

```bash
npm run typecheck && \
npm run test:h0-004-benchmark-postgres-environment && \
npm run test:h0-004-real-suite && \
npm run test:h0-004-benchmark-environment && \
npm run test:h0-004-comparison-report && \
npm run test:h0-004-benchmark-aggregation && \
npm run test:h0-004-benchmark-suite-runner
```

After the focused gate, run the complete H0-004 regression gate.

Only then commit Step 5A.

After that commit:

```text
remove invalid attempt-1 canonical artifacts
confirm clean working tree
confirm new HEAD
run deterministic preflight through baseline command
perform exactly one authorized replacement baseline run
```

The replacement capture must record the new Step 5A commit SHA.

### Step 5 canonical baseline — accepted capture

**Status:** ✅ Accepted as the canonical H0-004 baseline

The explicitly authorized replacement run completed with process exit `0` and
produced both canonical artifacts:

```text
.benchmark-results/h0-004/baseline.json
.benchmark-results/h0-004/baseline.md
```

Capture identity:

```text
capturedAt:
  2026-08-31T01:07:14.759Z

Harness gitRevision:
  2664cb9d46eaa79e2bbece570ed78cba722129ef

packageVersion:
  0.1.0-alpha.7
```

The captured Harness revision is exactly the committed Step 5A source revision
used for the replacement measurement.

Resolved runtime bindings:

```text
planner:
  provider = nvidia
  model = nvidia/nemotron-3.5-lightning-30b-a3b

reviewer:
  provider = nvidia
  model = openai/gpt-oss-20b

refiner:
  provider = nvidia
  model = nvidia/nemotron-3.5-lightning-30b-a3b
```

Fixed-suite provenance:

```text
B01 fixture-simple-api
  revision = b01-v1
  commit = e4eec8d1560ed76c027581da72f224ca1ad98632

B02 fixture-health-already-present
  revision = b02-v1
  commit = 756c2105d32e2bbc70b5991e3c5fca51f495a908

B03 fixture-component-app
  revision = b03-v1
  commit = dc7c900578323848c9039962b643bb3cc9f052ba

B04 qflow-workflow-canvas
  revision = b04-v1
  commit = 8e3d67d789fd12484206eade90a021300997f241
  sourceRevision = 986051f70be5ea06323d4dd508a5465b797a5396

B05 qos-harness-architecture
  revision = b05-v1
  commit = f2c541714e125e01fc77ef6a1fb331cde2a96194
  sourceRevision = 4329623bb82bda660c245074739617e662ff3b68
```

Canonical task order and results:

```text
B01 completed / accepted
B02 completed / accepted
B03 completed / accepted
B04 infrastructure_failed
B05 infrastructure_failed
```

Both B04 and B05 reached the accepted benchmark execution path and surfaced the
same post-Harness observation-boundary failure:

```text
BenchmarkObservationDerivationError:
Cannot derive benchmark outcome without refinedPlan.
```

The prior B04 PostgreSQL connection defect is absent from the canonical run.
Therefore the replacement capture is valid measurement evidence rather than a
measurement-infrastructure failure.

Canonical aggregate:

```text
selectedTaskCount = 5
completedTaskCount = 3
infrastructureFailureCount = 2
acceptedTaskCount = 3

SFCR = 60.00%
outcomeCorrectnessRate = 60.00%
validationSuccessRate = 60.00%
humanInterventionRate = 0.00%

totalHarnessDurationMs = 128479
averageHarnessDurationMs = 42826.333333333336

totalLlmCallCount = 16
averageLlmCallsPerCompletedTask = 5.333333333333333

promptTokens = 15033
completionTokens = 2261
totalTokens = 17294

cost = null
```

Failure evidence:

```text
terminalFailureReasonCounts = {}

infrastructureFailureReasonCounts:
  BenchmarkObservationDerivationError = 2
```

The JSON and Markdown artifacts contain the same capture identity, runtime
bindings, fixture provenance, fixed B01-B05 ordering, aggregate metrics, task
results, and failure evidence.

No hidden retry was performed after this canonical replacement run.

The canonical baseline is accepted because the measurement pipeline completed
successfully and reproducibly captured the fixed suite. Acceptance does not
mean that 60% SFCR is considered adequate product performance.

### Step 5 exit state

H0-004 Step 5 is complete once:

```text
canonical baseline artifacts are committed
this acceptance metadata is committed
final H0-004 regression gate is green
```

The next activity is the separate H0-004 viability checkpoint:

```text
GO / PIVOT / STOP
```

That decision must use the canonical evidence above, including the two
`BenchmarkObservationDerivationError` outcomes.

Do not begin H1/H2 before that checkpoint is explicitly completed.

# H0-004 Viability Checkpoint

**Decision:** 🔄 PIVOT

The first valid fixed-suite baseline is complete and versioned.

Canonical evidence:

```text
selectedTaskCount = 5
completedTaskCount = 3
infrastructureFailureCount = 2
acceptedTaskCount = 3
SFCR = 60.00%
outcomeCorrectnessRate = 60.00%
validationSuccessRate = 60.00%
humanInterventionRate = 0.00%
totalHarnessDurationMs = 128479
totalLlmCallCount = 16
totalTokens = 17294
cost = null
```

Task-level result:

```text
B01 completed / accepted
B02 completed / accepted
B03 completed / accepted
B04 infrastructure_failed
B05 infrastructure_failed
```

B04 and B05 both surfaced:

```text
BenchmarkObservationDerivationError:
Cannot derive benchmark outcome without refinedPlan.
```

The checkpoint decision is:

```text
GO:    no
STOP:  no
PIVOT: yes
```

### Why this is not GO

The Harness has demonstrated autonomous viability on B01-B03 with zero recorded
human intervention, but the current benchmark observation boundary cannot
represent terminal planning states when no `refinedPlan` exists.

The two most complex fixed cases therefore collapse into benchmark
infrastructure failures instead of auditable benchmark outcomes.

Advancing directly to H1/H2 would mix new capability work with an unresolved
measurement/terminal-state semantic defect.

### Why this is not STOP

The baseline does not show a generally non-viable Harness:

```text
B01-B03 = 3/3 accepted
humanInterventionRate = 0%
```

The failure mode is narrow, reproducible, and located at the terminal
outcome/evidence boundary.

### Pivot target

Proceed to:

```text
H0-004A — Terminal Outcome Observability
```

Do not change providers, models, prompts, fixed benchmark definitions, fixture
revisions, acceptance thresholds, or validation semantics merely to improve the
60% baseline.

H1/H2 remain blocked until H0-004A is implemented and the same fixed suite is
measured again as a new explicit baseline.

# H0-004A — Terminal Outcome Observability

**Status:** 📋 Specification / decision

## Objective

Make every supported Harness terminal state deterministically observable by the
benchmark runner even when `state.refinedPlan` is absent.

The purpose is not to make B04/B05 pass.

The purpose is to preserve terminal evidence so that benchmark acceptance can
decide whether the observed Harness result matches the benchmark expectation.

The target boundary is:

```text
Harness terminal state/evidence
        ↓
deterministic terminal classification
        ↓
benchmark observation
        ↓
existing acceptance semantics
```

The observation layer must no longer require a successful `refinedPlan` merely
to explain how the Harness terminated.

## Baseline defect exposed by H0-004

The accepted H0-003 observation rule intentionally defined:

```text
if refinedPlan is absent
  → observation cannot be derived
```

That rule was safe for the execution evidence understood at the time, but the
real H0-004 baseline exposed a missing terminal-state contract.

B04 and B05 reached Harness execution and exhausted the planning lifecycle
without a usable `refinedPlan`.

The benchmark layer then threw:

```text
BenchmarkObservationDerivationError
```

and the suite normalized both results as:

```text
infrastructure_failed
```

This loses the distinction between:

```text
measurement infrastructure failed
```

and:

```text
Harness completed its allowed lifecycle but did not produce an executable or
accepted planning result
```

H0-004A corrects only that semantic gap.

## Architectural decision

Introduce a deterministic terminal-classification contract before benchmark
outcome derivation.

Preferred conceptual contract:

```ts
type HarnessTerminalKind =
  | "completed_with_plan"
  | "blocked_with_plan"
  | "planning_exhausted"
  | "execution_failed"
  | "validation_failed"
  | "provider_failed"
  | "infrastructure_failed";

type HarnessTerminalEvidence = Readonly<{
  kind: HarnessTerminalKind;
  status: DevStateType["status"];
  failureReason: string | null;
  planningAttempts: number;
  maxPlanningAttempts: number;
  reviewAttempts: number;
  refinedPlanOutcome: BenchmarkExpectedOutcome | null;
}>;
```

Exact names may be refined from current source contracts, but the semantic
categories are frozen by this specification.

Do not add terminal categories merely because a single benchmark would become
easier to score.

## Source-of-truth rule

Terminal classification must use deterministic runtime evidence already exposed
by the Harness state/lifecycle.

Preferred sources include:

```text
state.status
state.failureReason
state.planningAttempts
state.maxPlanningAttempts
state.reviewAttempts
state.refinedPlan?.outcome
provider/runtime failure evidence where already explicit
validation result where already explicit
```

Do not classify terminal state from:

```text
LLM prose
console text parsing
benchmark expected outcome
benchmark ID
model name
fixture name
```

The benchmark expected outcome must never influence the observed terminal
classification.

## Required terminal semantics

### Completed with plan

Existing successful semantics remain valid:

```text
refinedPlan.outcome = changes_required
state.status = completed
failureReason absent
```

or:

```text
refinedPlan.outcome = already_satisfied
state.status = completed
failureReason absent
```

These continue to produce the existing benchmark outcomes.

### Blocked with plan

Existing blocked-plan semantics remain valid:

```text
refinedPlan.outcome = blocked
state.status = failed
failureReason present
```

This remains an observable benchmark outcome of:

```text
blocked
```

A failed graph status does not automatically mean infrastructure failure.

### Planning exhausted without refined plan

A planning-exhausted terminal state must be represented explicitly when all of
the following deterministic evidence is true:

```text
refinedPlan absent
planning lifecycle reached its configured terminal attempt condition
Harness returned a terminal failed state
failure evidence indicates planning could not produce a usable plan
```

The exact attempt-boundary comparison must follow the current graph/runtime
semantics and be locked by characterization tests before implementation.

Do not infer exhaustion solely from:

```text
refinedPlan absent
```

because refined-plan absence can also occur after unrelated failures.

### Provider failure

A provider/API/transport failure that prevents the Harness lifecycle from
producing a terminal planning result must remain distinguishable from planning
exhaustion.

Do not convert provider failure into `planning_exhausted` merely because no
`refinedPlan` exists.

Use existing provider/runtime error evidence when available.

### Measurement infrastructure failure

Workspace, fixture, process-launch, database, persistence, and other benchmark
or runner infrastructure failures remain suite-level/task-level
`infrastructure_failed` behavior.

H0-004A must not reclassify genuine benchmark infrastructure defects as Harness
terminal outcomes.

The boundary is:

```text
Harness lifecycle reached a deterministic terminal state
  → terminal evidence / benchmark observation

benchmark infrastructure prevented valid Harness lifecycle measurement
  → infrastructure_failed
```

### Execution and validation failures

If current production Harness contracts expose deterministic implementation or
validation terminal failures, H0-004A must preserve them as explicit terminal
kinds rather than collapsing them into planning exhaustion.

Do not invent new implementation/validation behavior if the current graph does
not yet execute those phases.

Characterize exact current evidence first.

## Benchmark observation decision

`BenchmarkRunObservation.finalOutcome` remains the existing domain:

```text
changes_required
already_satisfied
blocked
```

Do not silently add `planning_exhausted` or `provider_failed` to
`BenchmarkExpectedOutcome` in H0-004A.

Instead, separate:

```text
Harness terminal kind
```

from:

```text
benchmark domain outcome
```

For terminal states that cannot legitimately produce one of the existing
benchmark outcomes, the benchmark result must remain a completed measured result
with explicit terminal failure evidence, not a measurement infrastructure
exception.

Preferred direction:

```ts
type BenchmarkRunObservation = Readonly<{
  finalOutcome: BenchmarkExpectedOutcome | null;
  terminal: HarnessTerminalEvidence;
  filesChanged: readonly string[];
  validationPassed: boolean;
  humanInterventionRequired: boolean;
}>;
```

Exact shape may change after inspecting current acceptance/comparison contracts.
The invariant is frozen:

```text
no domain outcome available
  !=
benchmark infrastructure failed
```

## Acceptance semantics

H0-004A must not make a benchmark accepted merely because its execution became
observable.

The acceptance layer must distinguish:

```text
expected benchmark outcome matched
```

from:

```text
Harness terminated in a measurable but non-domain terminal state
```

For example:

```text
planning_exhausted
```

must normally produce a completed/rejected benchmark comparison unless the
existing benchmark contract is explicitly extended in a later, separately
specified change.

B05 must not automatically become `blocked` merely because planning attempts
were exhausted.

`blocked` remains valid only when deterministic evidence supports the existing
blocked-domain semantics.

## Comparison/report semantics

The next measurement must make terminal-state evidence visible without losing
existing aggregate compatibility.

At minimum, completed rejected tasks must be able to retain a stable terminal
failure reason/category such as:

```text
planning_exhausted
provider_failed
execution_failed
validation_failed
```

The suite must reserve:

```text
infrastructure_failed
```

for failures in the measurement/runner infrastructure rather than ordinary
Harness terminal behavior.

Do not recompute historical H0-004 baseline artifacts.

The current 60% canonical baseline is immutable evidence of the pre-pivot
system.

## Existing observation invariants preserved

Existing deterministic rules remain unchanged:

```text
filesChanged
  ← isolated Git workspace evidence

validationPassed
  ← already executed BenchmarkValidationResult

humanInterventionRequired
  ← explicit runner lifecycle evidence
```

Do not infer any of these fields from terminal kind.

In particular:

```text
planning_exhausted
blocked
provider_failed
```

must not automatically imply human intervention.

## Scope

Expected first implementation scope:

```text
src/benchmarks/observation.ts
src/benchmarks/complete-runner.ts
src/benchmarks/acceptance.ts        only if nullable/no-domain outcome requires it
src/benchmarks/comparison.ts        only if terminal evidence needs projection
src/benchmarks/aggregation.ts       only if existing reason aggregation cannot preserve it
src/benchmarks/report.ts            only if required to expose new terminal evidence
focused deterministic tests
package.json                        only for a new test script
QOS-HARNESS-ENGINEERING-PLAN.md
```

Small changes outside this list require direct evidence from current contracts
before implementation.

## Non-goals

H0-004A does not:

- change B01-B05 definitions;
- change expected outcomes;
- change fixture revisions or source revisions;
- change providers or provider selection;
- change planner/reviewer/refiner models;
- tune prompts;
- increase/decrease planning attempts to improve benchmark score;
- change context-window strategy;
- add repository intelligence;
- add Context Engine behavior;
- add H1/H2 capability work;
- reinterpret planning exhaustion as `blocked` without deterministic blocked evidence;
- rewrite the accepted H0-004 canonical baseline;
- automatically authorize GO after implementation.

## Deterministic characterization required before behavior change

Before implementing terminal derivation, inspect and lock the exact current
runtime behavior for at least:

```text
successful changes_required terminal state
successful already_satisfied terminal state
blocked-with-refined-plan terminal state
planning-attempt exhaustion with no refinedPlan
provider/runtime exception before refinedPlan
malformed/inconsistent refinedPlan terminal state
```

The characterization must establish which source fields distinguish those
cases.

Do not implement a branch for a state that current evidence cannot distinguish
reliably.

## Required deterministic tests

H0-004A tests must prove at least:

```text
1. existing changes_required observation remains unchanged
2. existing already_satisfied observation remains unchanged
3. existing blocked-with-plan observation remains unchanged
4. planning exhaustion without refinedPlan is observable and is not infrastructure_failed
5. refinedPlan absence alone is insufficient to classify planning exhaustion
6. provider failure is not classified as planning exhaustion
7. malformed/inconsistent plan evidence is not accepted as a valid domain outcome
8. benchmark expected outcome/ID does not affect terminal classification
9. filesChanged semantics remain Git-derived
10. validationPassed semantics remain validation-result-derived
11. humanInterventionRequired remains independent of terminal kind
12. comparison/report evidence preserves the explicit terminal category/reason
```

All focused tests must use fake/deterministic inputs and zero real provider
usage.

## Development sequence

```text
spec/decision
→ commit spec
→ deterministic characterization
→ implementation
→ focused deterministic gate
→ full H0 regression gate
→ implementation commit
→ clean working tree
→ one explicit post-pivot fixed-suite measurement
→ evidence review
→ GO / PIVOT / STOP checkpoint
```

No live benchmark run occurs before the implementation commit.

## Measurement after implementation

After H0-004A implementation and full regression acceptance:

```text
commit implementation
confirm clean working tree
run the unchanged fixed B01-B05 suite exactly once as a new explicit measurement
capture new versioned evidence without overwriting the H0-004 canonical baseline
```

The post-pivot run must not reuse the existing canonical filenames if doing so
would overwrite historical evidence.

Persistence/version naming for the post-pivot measurement must be specified
before that live run.

## Pivot success criteria

Primary success condition:

```text
Harness terminal states that complete their lifecycle are no longer counted as
benchmark infrastructure failures solely because refinedPlan is absent.
```

The first post-pivot target is therefore not `SFCR = 100%`.

The first target is:

```text
infrastructureFailureCount = 0
```

for B04/B05 if their runs reach valid deterministic Harness terminal states and
no independent measurement-infrastructure failure occurs.

A result such as:

```text
B04 completed / rejected / planning_exhausted
B05 completed / rejected / planning_exhausted
```

is more useful and architecturally healthier than:

```text
B04 infrastructure_failed
B05 infrastructure_failed
```

If B04/B05 remain rejected after becoming observable, the next pivot decision
must use that evidence to determine whether the bottleneck is planning,
provider/model composition, prompts, or missing context/repository intelligence.

## Exit condition

H0-004A is complete only when:

```text
terminal semantics are characterized and deterministic
implementation preserves existing B01-B03 behavior
focused gate is green
full H0 regression gate is green
implementation is committed
one explicit post-pivot B01-B05 measurement is captured
measurement evidence is reviewed
GO / PIVOT / STOP is decided again
```

H1/H2 remain blocked until that second viability checkpoint.


## H0-004A Step 1 — Terminal State Characterization

**Status:** 🧪 Implemented — deterministic gate pending

### Characterization evidence

Step 1 adds a source-level deterministic characterization test only:

```text
src/test-h0-004a-terminal-state-characterization.ts
```

No production runtime source changes are introduced.

The characterized current behavior is:

```text
planning attempt increment
  = state.planningAttempts + 1

planning exhaustion boundary
  = state.planningAttempts >= state.maxPlanningAttempts

review decision enough_context
  → refine before exhaustion check

planning exhaustion
  → reviewRouter returns failed
  → failedNode returns status=failed
  → failedNode does not synthesize refinedPlan
  → failedNode does not synthesize failureReason
```

Therefore the canonical B04/B05 shape can legitimately reach:

```text
status = failed
planningAttempts >= maxPlanningAttempts
refinedPlan = absent
failureReason = absent
```

without a benchmark/measurement infrastructure defect.

The existing observation contract still intentionally rejects that shape in
Step 1:

```text
refinedPlan absent
  → BenchmarkObservationDerivationError
```

That behavior remains unchanged until the later H0-004A classification step.

Blocked-with-plan behavior is also preserved and characterized separately:

```text
refinedPlan.outcome = blocked
failureReason present
terminal status = failed
  → existing observation may derive blocked
```

This proves that graph `failed` status alone cannot identify infrastructure
failure or benchmark-domain failure.

### Provider/runtime exception gap

Current provider-neutral execution returns the concrete provider promise
directly.

`runHarness` awaits `invokeGraph(...)` without a catch/normalization boundary.

Therefore a provider/runtime exception before a graph state is returned:

```text
propagates as an exception
returns no HarnessRunResult
has no terminal DevState available to observation
```

The current contracts consequently do **not** expose enough returned-state
evidence to classify provider failure as a normal Harness terminal kind.

H0-004A must preserve this distinction. A later behavior step may introduce a
narrow explicit error boundary if required, but Step 1 does not fabricate a
provider terminal state from missing evidence.

### Safety characterization

The test also locks the accepted H0-003 rules:

```text
changes_required / already_satisfied
  require completed + no failureReason

blocked
  requires failed + failureReason

refinedPlan absent
  remains a derivation error today

telemetry.finalStatus
benchmark ID
benchmark expectedOutcome
  do not drive outcome derivation
```

The characterization consumes zero real provider calls and does not modify:

```text
B01-B05
fixtures
prompts
models
provider composition
planning attempt limits
acceptance semantics
observation behavior
```

### Focused deterministic gate

```bash
npm run typecheck && \
npm run test:h0-004a-terminal-state-characterization && \
npm run test:h0-003-benchmark-observation && \
npm run test:h0-003-complete-benchmark-runner
```

After the focused gate passes, run the complete H0 regression gate before
accepting Step 1.

### Step 1 exit decision

If the focused/full gates remain green, Step 1 establishes enough evidence to
proceed to:

```text
H0-004A Step 2 — Terminal Evidence Contract
```

Step 2 must distinguish planning exhaustion from completed/blocked plan states
without using benchmark expectations, while separately addressing the observed
provider-exception evidence gap.

### H0-004A Step 1 acceptance record

**Status:** ✅ Accepted

Focused deterministic gate:

```text
PASS
```

Full H0 regression gate:

```text
PASS
exit code = 0
```

Accepted characterization findings:

```text
PLAN increments:
  planningAttempts = previous + 1

planning exhaustion boundary:
  planningAttempts >= maxPlanningAttempts

review-router exhaustion behavior:
  → route = failed

failed terminal node:
  → state.status = failed
  → does not synthesize refinedPlan
  → does not synthesize failureReason

blocked-with-plan:
  → remains distinguishable from planning exhaustion
  → refinedPlan.outcome = blocked
  → failed terminal status may still represent a valid benchmark domain outcome

provider/runtime exception before terminal state:
  → propagates through invokeGraph/runHarness
  → no HarnessRunResult is produced
  → therefore no provider_failed terminal state exists in the current returned-state contract

telemetry.finalStatus:
  → is not sufficient to determine benchmark domain outcome
```

No production behavior changed in Step 1.

No benchmark definitions, fixture revisions, prompts, providers, models, execution
limits, acceptance rules, or aggregation semantics changed.

### Step 1 conclusion

The current source evidence is sufficient to distinguish:

```text
completed_with_plan
blocked_with_plan
planning_exhausted
```

from one another.

The current returned Harness state is **not** sufficient to represent a provider
exception as a terminal state because provider/runtime exceptions propagate before
`HarnessRunResult` is produced.

Therefore H0-004A Step 2 must define the smallest deterministic terminal-evidence
contract that:

```text
preserves existing successful/blocked semantics
represents planning exhaustion without requiring refinedPlan
does not fabricate provider_failed state
keeps propagated provider/runtime exceptions distinct from returned Harness terminal states
keeps benchmark infrastructure failures distinct from Harness lifecycle results
```

Proceed to:

```text
H0-004A Step 2 — Terminal Evidence Contract
```

Only after Step 2 is specified and accepted may production observation behavior
change.

## H0-004A Step 2 — Terminal Evidence Contract

**Status:** 📋 Specification / decision

### Objective

Define the smallest deterministic terminal-evidence contract required to represent
current Harness terminal states without changing benchmark domain outcomes,
acceptance semantics, provider behavior, prompts, models, attempt limits, or fixed
benchmark definitions.

Step 2 is contract design only.

It must not yet change the runtime observation behavior.

### Inputs proven by Step 1

Step 1 established these current facts:

```text
planningAttempts increments once per PLAN call

planning exhaustion:
  planningAttempts >= maxPlanningAttempts
  review router returns failed

failed terminal node:
  state.status = failed
  refinedPlan is not synthesized
  failureReason is not synthesized for exhaustion

blocked-with-plan:
  refinedPlan.outcome = blocked
  failed terminal status can still represent a valid benchmark domain outcome

provider/runtime exception:
  propagates through invokeGraph/runHarness
  no HarnessRunResult is produced

telemetry.finalStatus:
  cannot determine benchmark domain outcome by itself
```

The Step 2 contract must encode only what can be supported by those deterministic
facts.

### Architectural boundary

Introduce terminal evidence at the benchmark observation boundary, not inside the
benchmark expected-outcome domain.

Preferred direction:

```ts
type HarnessTerminalKind =
  | "completed_with_plan"
  | "blocked_with_plan"
  | "planning_exhausted";
```

Do **not** add `provider_failed` to this returned-state contract in Step 2.

Current provider/runtime exceptions do not produce `HarnessRunResult`, so adding a
returned terminal kind would fabricate evidence the current runtime does not expose.

Provider/runtime exceptions remain propagated execution failures until a later,
separately specified boundary is introduced.

### Preferred terminal evidence contract

Preferred shape:

```ts
export type HarnessTerminalEvidence = Readonly<{
  kind: HarnessTerminalKind;
  status: DevStateType["status"];
  failureReason: string | null;
  planningAttempts: number;
  maxPlanningAttempts: number;
  reviewAttempts: number;
  refinedPlanOutcome: BenchmarkExpectedOutcome | null;
}>;
```

Exact exported names may be refined during implementation, but the semantic fields
are frozen unless current source contracts make one of them redundant.

### Derivation rules

#### `completed_with_plan`

Derive only when:

```text
refinedPlan exists
refinedPlan.outcome ∈ {changes_required, already_satisfied}
state.status = completed
failureReason absent
```

The existing benchmark domain outcome remains:

```text
refinedPlan.outcome
```

#### `blocked_with_plan`

Derive only when:

```text
refinedPlan exists
refinedPlan.outcome = blocked
state.status = failed
failureReason present
```

The existing benchmark domain outcome remains:

```text
blocked
```

#### `planning_exhausted`

Derive only when:

```text
refinedPlan absent
state.status = failed
planningAttempts >= maxPlanningAttempts
```

and the run has returned normally from the Harness lifecycle.

`failureReason` may be absent for this terminal kind because current exhaustion
routing does not synthesize one.

Planning exhaustion must **not** produce a benchmark domain outcome automatically.

Therefore:

```text
terminal.kind = planning_exhausted
finalOutcome = null
```

at the observation boundary.

### Invalid / inconsistent evidence

The terminal classifier must reject inconsistent combinations rather than
fabricating a terminal kind.

Examples:

```text
refinedPlan.outcome = blocked + state.status = completed
refinedPlan.outcome = changes_required + state.status = failed
refinedPlan.outcome = already_satisfied + failureReason present
refinedPlan absent + planningAttempts < maxPlanningAttempts + state.status = failed
```

These remain derivation errors unless a later specification establishes a distinct
supported terminal category.

### Benchmark observation contract direction

The current `BenchmarkRunObservation` domain outcome must become nullable so a
valid measured Harness terminal can exist without a benchmark-domain outcome.

Preferred shape:

```ts
type BenchmarkRunObservation = Readonly<{
  finalOutcome: BenchmarkExpectedOutcome | null;
  terminal: HarnessTerminalEvidence;
  filesChanged: readonly string[];
  validationPassed: boolean;
  humanInterventionRequired: boolean;
}>;
```

The important invariant is:

```text
finalOutcome = null
```

means:

```text
the Harness run was measured successfully but did not produce one of the benchmark
domain outcomes
```

It does **not** mean:

```text
benchmark infrastructure failed
```

### Acceptance semantics direction

Existing successful acceptance remains unchanged when:

```text
finalOutcome !== null
```

For:

```text
finalOutcome = null
```

the acceptance evaluator must reject the task deterministically with a stable
failure category rather than throw.

Preferred new acceptance failure category:

```text
terminal_outcome_unavailable
```

The failure should preserve terminal evidence so comparison/report layers can expose
why the domain outcome was unavailable.

Do not map:

```text
planning_exhausted → blocked
```

even when the benchmark expected outcome is `blocked`.

The expected outcome must not participate in terminal classification.

### Comparison semantics direction

A measured task that reaches `planning_exhausted` should eventually be represented
as:

```text
status = completed
accepted = false
observedOutcome = null
terminalFailureReason = planning_exhausted
```

or an equivalent stable representation supported by current comparison contracts.

It must not be normalized by the suite runner as:

```text
infrastructure_failed
```

solely because no `refinedPlan` exists.

### Aggregation compatibility

Step 2 does not change aggregation yet.

The later implementation must preserve these invariants:

```text
selectedTaskCount unchanged
completedTaskCount includes measurable rejected planning-exhausted tasks
infrastructureFailureCount excludes measurable planning-exhausted tasks
acceptedTaskCount unchanged by observability alone
SFCR denominator remains the fixed selected-task count
```

No historical H0-004 baseline artifact is recomputed.

### Error-boundary rule

The contract must preserve three distinct layers:

```text
1. returned Harness terminal evidence
   → completed_with_plan / blocked_with_plan / planning_exhausted

2. propagated Harness/provider/runtime exception
   → execution exception, no HarnessRunResult

3. benchmark/measurement infrastructure exception
   → suite infrastructure_failed
```

Step 2 defines only layer 1.

Do not collapse layers 2 or 3 into the terminal-evidence contract.

### Files changed / validation / intervention

Existing evidence ownership remains unchanged:

```text
filesChanged
  ← deterministic Git workspace evidence

validationPassed
  ← existing BenchmarkValidationResult

humanInterventionRequired
  ← explicit runner lifecycle evidence
```

None of these fields may be inferred from terminal kind.

### Expected implementation scope after Step 2 acceptance

Likely implementation files:

```text
src/benchmarks/observation.ts
src/benchmarks/acceptance.ts
src/benchmarks/comparison.ts
src/benchmarks/complete-runner.ts
src/test-h0-003-benchmark-observation.ts
new H0-004A focused test(s)
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

`aggregation.ts`, `report.ts`, or `suite-runner.ts` may change only if exact current
contracts require a minimal projection to preserve terminal evidence.

Any such expansion must be justified from source evidence before implementation.

### Non-goals

Step 2 does not:

- change production behavior yet;
- add provider failure normalization;
- catch provider/runtime exceptions in `runHarness`;
- change B01-B05 definitions;
- change expected outcomes;
- change fixture revisions;
- change prompts or models;
- change planning limits;
- change validation commands;
- change acceptance thresholds;
- add H1/H2 capability work;
- change historical baseline artifacts.

### Required Step 2 contract tests after implementation

The later implementation must prove:

```text
1. completed changes_required derives completed_with_plan + domain outcome
2. completed already_satisfied derives completed_with_plan + domain outcome
3. blocked derives blocked_with_plan + blocked outcome
4. planning exhaustion derives planning_exhausted + finalOutcome=null
5. planning exhaustion does not throw observation infrastructure error
6. refinedPlan absence below exhaustion remains derivation error
7. inconsistent plan/status combinations remain derivation errors
8. expected benchmark outcome does not influence terminal classification
9. planning_exhausted task is measured/rejected, not infrastructure_failed
10. filesChanged/validation/intervention semantics remain unchanged
11. provider/runtime exception propagation remains unchanged
12. zero real provider usage in focused tests
```

### Exit condition

Step 2 is accepted when the repository records a precise terminal-evidence and
nullable-domain-outcome contract that is consistent with Step 1 characterization.

Only after Step 2 acceptance may H0-004A Step 3 implement the contract.

## H0-004A Step 3 — Implement Terminal Evidence Contract

**Status:** 🧪 Implemented — focused gate pending

### Implementation

Implemented the Step 2 contract with a narrow benchmark-owned terminal evidence
module:

```text
src/benchmarks/terminal-evidence.ts
```

Supported returned Harness terminal kinds are exactly:

```text
completed_with_plan
blocked_with_plan
planning_exhausted
```

No `provider_failed` returned state was added because Step 1 proved provider/runtime
exceptions currently propagate before `HarnessRunResult` exists.

### Observation behavior

`deriveBenchmarkRunObservation(...)` now derives terminal evidence first.

Mappings:

```text
completed_with_plan
  → finalOutcome = changes_required | already_satisfied

blocked_with_plan
  → finalOutcome = blocked

planning_exhausted
  → finalOutcome = null
```

Planning exhaustion requires:

```text
refinedPlan absent
state.status = failed
planningAttempts >= maxPlanningAttempts
```

Refined-plan absence below the exhaustion boundary remains a deterministic
derivation error.

Malformed plan/status combinations remain derivation errors.

### Acceptance behavior

`BenchmarkRunObservation.finalOutcome` now permits `null` for a measured Harness
terminal that has no benchmark-domain outcome.

A null domain outcome is rejected with the stable acceptance failure:

```text
terminal_outcome_unavailable
```

It is not converted into `unexpected_outcome` and is never inferred as `blocked`.

### Comparison/report behavior

`BenchmarkComparisonRecord.observedOutcome` now permits `null`.

For planning exhaustion:

```text
observedOutcome = null
accepted = false
terminalFailureReason = planning_exhausted
```

Markdown renders a null observed outcome as:

```text
n/a
```

Aggregation algorithms do not change. A planning-exhausted task that reaches the
comparison boundary remains a completed/rejected task and naturally does not count
as an outcome match.

### Compatibility

The optional terminal-evidence field on manually constructed
`BenchmarkRunObservation` values preserves compatibility for existing deterministic
fixtures while all observations produced by `deriveBenchmarkRunObservation(...)`
include terminal evidence.

Provider/runtime exception propagation is unchanged.

Workspace, fixture, database, process-launch, persistence, and other measurement
infrastructure exceptions remain suite `infrastructure_failed` behavior.

No benchmark definitions, fixture revisions, prompts, providers, models, planning
limits, validation commands, or historical baseline artifacts changed.

### Focused deterministic gate

```bash
npm run typecheck && \
npm run test:h0-004a-terminal-evidence && \
npm run test:h0-004a-terminal-state-characterization && \
npm run test:h0-003-benchmark-observation && \
npm run test:h0-003-complete-benchmark-runner && \
npm run test:benchmark-acceptance && \
npm run test:h0-004-comparison-contract && \
npm run test:h0-004-benchmark-suite-runner && \
npm run test:h0-004-benchmark-aggregation && \
npm run test:h0-004-comparison-report
```

No live provider or B01-B05 measurement is part of this gate.

After the focused gate passes, run the complete H0 regression gate before Step 3
acceptance and commit.

### H0-004A Step 3 acceptance record

**Status:** ✅ Accepted

Focused deterministic gate:

```text
PASS
```

Full regression gate:

```text
PASS
exit code = 0
```

Accepted implementation behavior:

```text
completed_with_plan
  → finalOutcome = changes_required | already_satisfied

blocked_with_plan
  → finalOutcome = blocked

planning_exhausted
  → finalOutcome = null
  → measured benchmark result
  → accepted = false
  → acceptance failure = terminal_outcome_unavailable
  → comparison observedOutcome = null
  → comparison terminalFailureReason = planning_exhausted
  → not normalized as infrastructure_failed
```

Accepted terminal-classification invariants:

```text
planning_exhausted requires:
  refinedPlan absent
  state.status = failed
  planningAttempts >= maxPlanningAttempts

refinedPlan absence before exhaustion
  → derivation error

invalid refinedPlan/status combinations
  → derivation error

expected benchmark outcome
  → does not participate in terminal classification

telemetry.finalStatus
  → does not determine benchmark domain outcome
```

Provider/runtime exception behavior remains unchanged:

```text
provider/runtime exception
  → propagates through runHarness
  → no HarnessRunResult
  → no fabricated provider_failed terminal evidence
```

The Step 1 characterization test was updated only to follow the new terminal-evidence
boundary. Its behavioral invariants remain unchanged.

No benchmark definitions, fixture revisions, prompts, providers, models, planning
limits, or historical baseline artifacts changed.

### Step 3 conclusion

The H0-004A observation boundary can now represent planning exhaustion as a valid
measured terminal state without inventing a benchmark-domain outcome.

This removes the specific measurement defect observed in the canonical H0-004
baseline while preserving the distinction between:

```text
measured Harness terminal rejection
propagated Harness/provider/runtime exception
benchmark infrastructure failure
```

Proceed to:

```text
H0-004A Step 4 — Controlled Re-measurement
```

The fixed B01-B05 suite must remain unchanged.

Before the next live run:

```text
1. commit this accepted implementation
2. ensure working tree is clean
3. record the exact implementation SHA
4. define a new versioned H0-004A measurement artifact path
5. do not overwrite the canonical H0-004 baseline
6. execute the fixed real suite exactly once
7. review the new result before GO/PIVOT/STOP
```

H1/H2 remain blocked until that new measurement is reviewed.

## H0-004A Step 4 — Controlled Re-measurement Boundary

**Status:** 📋 Specification / decision

### Objective

Create the smallest explicit measurement-output boundary required to capture the
post-pivot H0-004A evidence without weakening the existing clean-repository
preflight and without moving, renaming, overwriting, or temporarily hiding the
canonical H0-004 baseline.

This step is measurement-infrastructure work only.

It must not execute B01-B05 yet.

### Evidence motivating this step

The accepted real-suite boundary currently derives the canonical artifact path
internally:

```text
Harness repository
  → .benchmark-results/h0-004
  → baseline.json
  → baseline.md
```

The same preflight also requires the Harness repository to be clean before the
suite may execute.

Therefore a wrapper that mutates `.benchmark-results` before preflight is
structurally invalid: it causes the clean-repository guard to reject the run.

The correct boundary is to make artifact destination explicit while preserving
all existing defaults.

### Architectural decision

Extend only the outer default baseline options with an optional explicit artifact
directory:

```ts
export type DefaultH0BaselineOptions = Readonly<{
  harnessRepositoryPath?: string;
  env?: ProcessEnvironment;
  artifactDirectory?: string;
}>;
```

Resolution semantics:

```text
options.artifactDirectory provided
  → resolve that explicit path
  → use it as BenchmarkBaselinePreflightEvidence.artifactDirectory

options.artifactDirectory absent
  → preserve current default exactly
  → <harnessRepositoryPath>/.benchmark-results/h0-004
```

The canonical H0-004 command therefore remains behaviorally unchanged.

### H0-004A measurement destination

The real H0-004A measurement must write outside the Harness working tree.

Required destination shape:

```text
~/.cache/qos-harness/measurements/h0-004a/<implementation-sha>/
  baseline.json
  baseline.md
```

The directory name is the exact committed Harness implementation SHA being
measured.

No H0-004A live evidence may be written inside the repository before or during
preflight.

### Canonical baseline immutability

The existing historical artifacts remain immutable:

```text
.benchmark-results/h0-004/baseline.json
.benchmark-results/h0-004/baseline.md
```

Step 4 must not:

```text
move them
rename them
delete them
temporarily hide them
rewrite them
copy a new run over them
relax their existing rerun guard
```

The canonical `benchmark:h0-004-baseline` command must continue refusing an
implicit rerun when those artifacts already exist.

### Explicit H0-004A command

Introduce a dedicated script/command for the post-pivot measurement, for example:

```text
scripts/run-h0-004a-remeasurement.ts
benchmark:h0-004a-remeasurement
```

The script must:

```text
1. resolve the current Harness repository path
2. require a clean working tree through the existing real-suite preflight
3. obtain the exact current HEAD SHA
4. derive the external artifact directory from that SHA
5. require the target artifact directory to contain no existing baseline artifact
6. invoke runDefaultH0BaselineCapture(...) exactly once
7. pass only the explicit external artifactDirectory override
8. verify the returned capture harness.gitRevision equals the SHA used in the path
9. print artifact paths and summary only after successful capture
```

The script must not:

```text
mutate Git state
create measurement files inside the Harness repository
delete previous H0-004A evidence
retry the suite
loop over benchmark execution
change benchmark selection/order
change runtime composition
```

### Artifact-existence semantics

The existing `assertBaselineArtifactsAbsent(...)` guard remains the persistence
safety boundary.

For the H0-004A external directory:

```text
baseline.json exists
OR
baseline.md exists
  → preflight fails
  → live suite must not execute
```

This makes an already-captured implementation SHA non-rerunnable through the
dedicated command.

The implementation must not silently choose another directory, timestamp, or
suffix after such a failure.

### Exact measurement identity

The H0-004A artifact path and captured evidence must agree:

```text
artifact directory SHA
  =
capture.harness.gitRevision
  =
git rev-parse HEAD at accepted implementation commit
```

A mismatch is a measurement-integrity failure.

Package version remains captured through the existing real-suite behavior.

### Fixed-suite invariants

Step 4 does not modify:

```text
B01
B02
B03
B04
B05
```

It does not modify:

```text
benchmark IDs
benchmark revisions
expected outcomes
historical source revisions
fixture materialization
workspace isolation
PostgreSQL isolation
validation commands
suite ordering
suite retry semantics
comparison semantics
aggregation semantics
terminal-evidence semantics
```

The existing `assertFixedSuiteResult(...)` remains authoritative.

### Runtime invariants

Do not change:

```text
providers
provider selection
models
prompts
planning-attempt limits
review-attempt behavior
token/provider hints
runtime composition
telemetry contracts
```

The post-pivot run must measure only the accepted H0-004A observability change
plus this narrow artifact-destination boundary.

### Deterministic implementation scope

Expected production change:

```text
src/benchmarks/real-suite.ts
```

Expected new adapter:

```text
scripts/run-h0-004a-remeasurement.ts
```

Expected deterministic test:

```text
src/test-h0-004a-remeasurement-boundary.ts
```

Expected metadata changes:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify unrelated benchmark, provider, graph, fixture, validation, telemetry,
or acceptance modules unless a deterministic test exposes a concrete pre-existing
contract defect.

### Deterministic test requirements

The Step 4 focused test must use injected/fake dependencies where necessary and
must execute zero real provider calls and zero real B01-B05 suite runs.

It must prove at least:

```text
1. default options still resolve to .benchmark-results/h0-004
2. explicit artifactDirectory overrides only the artifact destination
3. explicit relative/absolute path resolution is deterministic
4. clean-repository preflight remains required
5. canonical baseline rerun protection remains unchanged
6. external H0-004A target with existing baseline.json is rejected
7. external H0-004A target with existing baseline.md is rejected
8. no benchmark definition/order changes are introduced
9. no provider/model/runtime configuration changes are introduced
10. the dedicated remeasurement script performs no hidden retry/loop
11. the dedicated command is distinct from benchmark:h0-004-baseline
12. no real provider usage is consumed
```

### Focused deterministic gate

After implementation:

```bash
npm run typecheck && \
npm run test:h0-004a-remeasurement-boundary && \
npm run test:h0-004-real-suite && \
npm run test:h0-004a-terminal-evidence && \
npm run test:h0-004a-terminal-state-characterization && \
npm run test:h0-004-comparison-report && \
npm run test:h0-004-benchmark-aggregation && \
npm run test:h0-004-benchmark-suite-runner && \
npm run test:h0-004-comparison-contract
```

No live provider or B01-B05 measurement is part of this gate.

### Full regression requirement

Step 4 is not accepted from the focused gate alone.

Required sequence:

```text
spec/decision
→ implementation
→ focused deterministic gate
→ PLAN implementation/acceptance metadata
→ full H0 regression gate
→ one self-contained implementation commit
→ confirm clean working tree
→ freeze exact implementation SHA
→ execute benchmark:h0-004a-remeasurement exactly once
→ persist resulting evidence separately
→ review GO / PIVOT / STOP
```

### Live-run authorization boundary

The real post-pivot measurement is explicitly forbidden until the Step 4
implementation commit exists and the working tree is clean.

The earlier aborted attempts are preflight failures only and are not benchmark
measurements because the fixed suite never began execution.

After the Step 4 implementation is committed:

```text
one implementation SHA
→ one external H0-004A artifact directory
→ one authorized real B01-B05 execution
```

If that run produces poor benchmark results, it is still valid evidence and must
not be rerun merely to improve the score.

### Primary post-pivot review target

The first review question remains:

```text
Do valid returned Harness terminal states for B04/B05 stop being counted as
benchmark infrastructure failures?
```

The target is not:

```text
SFCR = 100%
```

Planning exhaustion may remain a measured rejected benchmark result.

A genuine provider/runtime/infrastructure exception may still remain
`infrastructure_failed` when supported by actual evidence.

### Non-goals

Step 4 does not:

```text
change H0-004A terminal classification
change acceptance thresholds
change benchmark expected outcomes
reinterpret planning_exhausted as blocked
catch/normalize provider exceptions
change B01-B05
change fixtures/source revisions
change providers/models/prompts
change planning budgets
change validation
change aggregation formulas
change comparison scoring
introduce H1 Repository Intelligence
introduce H2 Context Engine
make GO/PIVOT/STOP automatically
execute the real post-pivot measurement during implementation
```

### Exit condition

Step 4 implementation is accepted when:

```text
external artifact destination is explicit and deterministic
canonical H0-004 behavior remains unchanged
canonical H0-004 artifacts remain immutable
clean-repository preflight remains intact
same fixed B01-B05 suite remains intact
focused gate passes
full H0 regression gate passes
implementation is committed in one self-contained commit
working tree is clean
exact implementation SHA is frozen
```

Only then may the dedicated H0-004A command be executed exactly once.

H1/H2 remain blocked until the resulting post-pivot evidence is reviewed and a
new GO / PIVOT / STOP decision is recorded.

### H0-004A Step 4 implementation record

**Status:** 🧪 Implemented — focused gate pending

Implemented the controlled remeasurement boundary without executing the real
B01-B05 suite.

Production boundary change:

```text
DefaultH0BaselineOptions.artifactDirectory?
  → optional explicit artifact destination

absent
  → existing canonical default remains:
    <harnessRepositoryPath>/.benchmark-results/h0-004

present
  → resolve the explicit destination
  → preserve all existing preflight, suite, persistence, and fixed-suite behavior
```

Dedicated live adapter:

```text
scripts/run-h0-004a-remeasurement.ts
```

The adapter derives:

```text
current committed Harness HEAD
  ↓
~/.cache/qos-harness/measurements/h0-004a/<HEAD>
```

and passes that destination to the existing default real-suite capture boundary.

The canonical H0-004 command remains unchanged.

Deterministic guard:

```text
src/test-h0-004a-remeasurement-boundary.ts
```

The focused test characterizes default-path preservation, explicit path
resolution, existing clean-tree/artifact guards, dedicated command wiring,
measurement identity verification, and absence of hidden retry/loop behavior.

No provider, model, prompt, benchmark case, fixture revision, acceptance,
terminal-evidence, aggregation, validation, or planning-budget behavior is
changed.

No live provider call or B01-B05 measurement has been executed by this
implementation step.

Proceed only with the deterministic focused gate defined above. Do not run
`benchmark:h0-004a-remeasurement` until Step 4 passes the full regression gate,
the implementation is committed, the worktree is clean, and the exact new
implementation SHA is frozen.

### H0-004A Step 4 validation and acceptance record

**Status:** ✅ Accepted

Focused deterministic gate:

```text
PASS
```

Full H0 regression gate:

```text
PASS
```

Accepted Step 4 behavior:

```text
default H0-004 capture
  → remains <harnessRepositoryPath>/.benchmark-results/h0-004

explicit H0-004A remeasurement
  → uses an external artifact directory
  → ~/.cache/qos-harness/measurements/h0-004a/<implementation-sha>

canonical H0-004 artifacts
  → remain immutable

repository preflight
  → still requires a clean Harness worktree

fixed suite
  → B01-B05 definitions/order/revisions remain unchanged
```

Accepted implementation commit:

```text
58a1fc4a0d2353a0db51a7f7a67000358351db0d
```

No real provider usage or B01-B05 execution was part of the deterministic
acceptance gates.

## H0-004A Post-pivot Measurement Record

**Implementation SHA:** `58a1fc4a0d2353a0db51a7f7a67000358351db0d`

**Measurement status:** ⚠️ Inconclusive — provider/runtime transport stall

### Observed live execution

The single authorized H0-004A real B01-B05 execution started successfully and
entered the real Harness lifecycle.

Observed evidence during B01 included:

```text
planner/refiner model:
  nvidia/nemotron-3.5-lightning-30b-a3b

reviewer model:
  openai/gpt-oss-20b

same reviewer model:
  one earlier call completed in approximately 16.7s

later reviewer call:
  remained pending for several minutes
  process remained alive with near-zero CPU
  Node process retained an ESTABLISHED HTTPS connection
  provider eventually emitted:
    NVIDIA network error; retry 1/6
  retry attempt then remained pending without progress
```

The run was manually interrupted after the provider/runtime call remained stalled
well beyond its previously observed normal latency.

### Artifact outcome

The H0-004A external target contained no completed:

```text
baseline.json
baseline.md
```

The canonical H0-004 baseline remained byte-for-byte unchanged:

```text
baseline.json
sha256 = b96388d821dc9e160bc4face1bb201cb9cbb9de9fbccc4d266fa5ec5172f5f47

baseline.md
sha256 = 65d31d6c85b44912c9c5ee26eb1abbf5cc553786c7cab54db782cc7c5bdbfe91
```

The Harness worktree remained clean after the interrupted run.

### Measurement interpretation

This execution is not a valid completed comparison capture because persistence
was never reached.

It is still valid live evidence because the fixed benchmark suite had already
entered real provider execution.

Therefore the run must not be silently discarded and repeated merely to obtain a
cleaner score.

The observed failure is distinct from the H0-004 terminal-observation defect that
motivated H0-004A.

Current evidence indicates:

```text
H0-004A terminal outcome observability implementation
  → deterministic implementation accepted

post-pivot comparison measurement
  → not completed

blocking condition
  → provider/runtime transport stall

effective whole-call deadline
  → absent

provider transport retry
  → present, but one retry attempt can remain pending for minutes
```

### Second viability checkpoint

Decision:

```text
PIVOT
```

Reason:

```text
the benchmark measurement boundary is now trustworthy enough to expose a
different operational blocker: provider-call reliability/deadline behavior
prevents a bounded reproducible real-suite measurement
```

Do not classify this as evidence that B04/B05 now pass or fail.

Do not authorize H1/H2 yet.

Do not change provider/model selection merely to force the H0-004A benchmark to
finish.

Proceed to a narrow provider-call reliability characterization before another
real suite measurement is authorized.

# H0-004B — Provider Call Reliability Characterization

**Status:** 📋 Specification / decision

## Objective

Determine whether the observed live stall is primarily:

```text
model/route specific
provider transport specific
or a general missing-deadline weakness in Harness provider execution
```

before changing runtime policy or benchmark model selection.

H0-004B is diagnostic first.

It must not rerun B01-B05 during characterization.

## Problem statement

Current provider execution supports cooperative cancellation through
`AbortSignal`, and NVIDIA owns transport retry behavior.

However the live H0-004A run demonstrated that:

```text
one provider attempt can remain pending for many minutes
```

before the adapter reports a network error.

After the first network error:

```text
retry 1/6
```

the next transport attempt may again remain pending for minutes.

A retry count alone therefore does not provide a bounded wall-clock execution
policy.

## Step 1 — Deterministic Reliability Characterization

### Objective

Freeze the exact current provider-call behavior before introducing timeout or
deadline policy.

No production behavior change.

### Required characterization

Step 1 must prove from current source/tests that:

```text
1. executeStructuredLlm does not create a whole-call timeout/deadline
2. StructuredLlmRequest.signal can reach the NVIDIA fetch boundary
3. NVIDIA transport retry is adapter-owned
4. abort stops retry progression when cancellation is actually signalled
5. retry count does not itself impose a wall-clock deadline on an in-flight fetch
6. provider/runtime exceptions propagate through the current application boundary
7. no benchmark expected outcome influences provider reliability behavior
8. no B01-B05 execution is required for these assertions
```

### Expected deterministic test

Create:

```text
src/test-h0-004b-provider-reliability-characterization.ts
```

The test must consume zero real provider usage.

It should rely on deterministic fake/mocked transport and source-level
characterization only where direct runtime proof is not practical.

### Non-goals

Step 1 does not:

```text
add timeoutMs
add AbortSignal.timeout()
change NVIDIA retry count
change retry backoff
change reviewer model
change planner/refiner model
add provider fallback
add whole-call retry
rerun B01-B05
change benchmark expectations
change fixtures
change prompts
change planning budgets
change H0-004A terminal evidence
```

### Focused gate

At minimum:

```bash
npm run typecheck && \
npm run test:h0-004b-provider-reliability-characterization && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:execution-policy-characterization && \
npm run test:provider-characterization
```

No real NVIDIA request is allowed.

## Step 2 — Isolated Live Provider Probe

Step 2 is authorized only after Step 1 is accepted and committed.

The probe must remain outside B01-B05 and compare provider-call reliability
without changing the benchmark suite.

Initial controlled comparison:

```text
A:
  provider = NVIDIA
  model = openai/gpt-oss-20b

B:
  provider = NVIDIA
  model = nvidia/nemotron-3.5-lightning-30b-a3b
```

Hold all other probe semantics constant wherever the adapters permit.

The probe should record per call:

```text
model
attempt index
startedAt
finishedAt
durationMs
success/error
usage when available
transport retry evidence when observable
```

The purpose is not model quality scoring.

The question is:

```text
does the prolonged stall follow gpt-oss-20b specifically,
or does it reproduce across NVIDIA model routes?
```

Do not run the full benchmark suite as part of Step 2.

## Step 3 — Reliability Policy Decision

Only after deterministic characterization plus isolated live evidence may the
project decide whether to introduce a bounded provider-call deadline.

A future deadline must use the existing cooperative cancellation path so that
underlying provider work is actually aborted.

Do not implement a fake timeout using only `Promise.race()`.

The timeout value must be justified by observed live latency rather than chosen
arbitrarily.

## H0-004B exit condition

H0-004B is complete only when:

```text
current reliability semantics are deterministically characterized
isolated live probe evidence is captured
model-specific vs transport/general behavior is assessed
deadline policy is explicitly accepted or rejected
any accepted reliability change passes deterministic regression gates
a new committed measurement SHA is frozen
a new explicit real-suite measurement is authorized
```

Until then:

```text
H1/H2 remain blocked
H0-004A is not rerun
provider/model changes are diagnostic only, not benchmark-score tuning
```

## H0-004B Step 1 Implementation Record

**Status:** 🧪 Implemented — focused deterministic gate pending

### Source evidence

The current accepted provider runtime already establishes the required
characterization boundary:

```text
executeStructuredLlm(...)
  → exactly one provider.generateStructured(...) invocation
  → forwards request.signal when present
  → creates no Harness whole-call timeout
  → creates no Harness whole-call retry

StructuredLlmRequest
  → signal?: AbortSignal
  → providerHints.transportRetries is explicitly provider/transport-owned

NVIDIA adapter
  → owns HTTP/network retry loop
  → forwards signal to fetch
  → aborts retry backoff
  → does not retry after cancellation
  → has no AbortSignal.timeout / portable deadline
```

### Deterministic characterization added

Create:

```text
src/test-h0-004b-provider-reliability-characterization.ts
```

The test uses only fake providers, mocked NVIDIA `fetch`, and source inspection.

It proves:

```text
1. executeStructuredLlm creates no whole-call deadline
2. cooperative AbortSignal crosses the portable execution boundary unchanged
3. NVIDIA forwards that signal to the real transport boundary
4. NVIDIA transport retry remains adapter-owned
5. transportRetries=6 does not cause another attempt while the current fetch is pending
6. a pending fetch remains pending until transport completion/failure/cancellation
7. cancelling that fetch prevents retry progression
8. provider/runtime exceptions propagate unchanged through portable execution
9. provider execution/NVIDIA transport contains no benchmark expectedOutcome dependency
10. no B01-B05 execution or real provider usage is required
```

The existing H0-002A application-boundary regression remains part of the focused
gate so provider/runtime propagation is not characterized in isolation from the
shared `runHarness(...)` path.

### Files

Create:

```text
src/test-h0-004b-provider-reliability-characterization.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

No production source is modified.

### Focused deterministic gate

```bash
npm run typecheck && \
npm run test:h0-004b-provider-reliability-characterization && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:execution-policy-characterization && \
npm run test:provider-characterization && \
npm run test:h0-002a-run-harness
```

No real NVIDIA or Claude request is allowed.

### Acceptance state

Do not mark Step 1 accepted until the focused gate passes in the development
environment.

If accepted, commit the characterization before authorizing the isolated live
provider probe from H0-004B Step 2.

## H0-004B Step 1 Validation Record

**Status:** ✅ Accepted

The focused deterministic gate passed in the development environment:

```bash
npm run typecheck && \
npm run test:h0-004b-provider-reliability-characterization && \
npm run test:provider-lifecycle && \
npm run test:llm-execution && \
npm run test:execution-policy-characterization && \
npm run test:provider-characterization && \
npm run test:h0-002a-run-harness
```

Accepted characterization:

```text
executeStructuredLlm
  → creates no whole-call timeout/deadline
  → creates no Harness whole-call retry
  → forwards cooperative AbortSignal unchanged
  → propagates provider/runtime errors

StructuredLlmRequest.signal
  → reaches NVIDIA fetch

NVIDIA transport retries
  → remain adapter-owned
  → transportRetries is a retry-count hint, not a wall-clock deadline
  → no next retry begins while the current fetch remains pending
  → cancellation stops retry progression

benchmark expectedOutcome
  → does not participate in provider execution/reliability policy
```

The test consumed zero real provider usage and did not execute B01-B05.

### Step 1 conclusion

H0-004B Step 1 confirms the live H0-004A stall was compatible with the current
runtime contract rather than contradicting it:

```text
a transport attempt may remain pending for an unbounded wall-clock duration
until the underlying transport resolves, rejects, or receives cancellation
```

The existing retry count does not bound that duration.

No production behavior changed in Step 1.

**Decision:** proceed to H0-004B Step 2 — Isolated Live Provider Probe.

Before any B01-B05 rerun or timeout implementation, compare the same small
provider scenario across:

```text
A: NVIDIA / openai/gpt-oss-20b
B: NVIDIA / nvidia/nemotron-3.5-lightning-30b-a3b
```

The probe must remain separate from the benchmark suite and must record live
latency/error evidence rather than model quality.

## H0-004B Step 2 — Isolated Live Provider Probe Implementation

**Status:** 🧪 Implemented — deterministic probe-boundary gate pending

### Objective

Create a bounded diagnostic probe that compares the same NVIDIA structured-output
scenario across the two current model routes without executing B01-B05.

The probe is diagnostic evidence, not a model-quality benchmark.

### Controlled comparison

The live sequence alternates models by round:

```text
round 1:
  openai/gpt-oss-20b
  nvidia/nemotron-3.5-lightning-30b-a3b

round 2:
  openai/gpt-oss-20b
  nvidia/nemotron-3.5-lightning-30b-a3b

round 3:
  openai/gpt-oss-20b
  nvidia/nemotron-3.5-lightning-30b-a3b
```

All calls use the same:

```text
provider = NVIDIA
prompt = tiny fixed structured-output probe
maxOutputTokens = 256
transportRetries = 0
diagnostic deadline = 120000 ms
```

`transportRetries=0` is deliberate.

The purpose is to compare one transport/model-route attempt at a time without
allowing adapter retry/backoff to obscure whether a prolonged stall follows a
specific model route.

### Diagnostic deadline

The 120-second deadline exists only inside the H0-004B live probe.

It is not a production runtime policy and does not modify:

```text
executeStructuredLlm
runtime composition
NVIDIA adapter defaults
benchmark execution
```

The deadline uses the already-accepted cooperative `AbortSignal` path, so an
expired probe call aborts the underlying NVIDIA fetch rather than only stopping
an outer await.

The value is intentionally diagnostic: it is more than seven times the
approximately 16.7-second successful reviewer latency observed before the
H0-004A stall, while preventing another multi-minute unbounded diagnostic hang.

No production timeout value is accepted by this step.

### Evidence artifact

The committed live wrapper writes exactly one artifact per Harness SHA:

```text
~/.cache/qos-harness/probes/h0-004b/<implementation-sha>/probe.json
```

The wrapper requires:

```text
clean Harness worktree
artifact absent for current SHA
```

and records:

```text
Harness SHA
provider
models
rounds
diagnostic timeout
provider hints
per-call sequence index
round
startedAt
finishedAt
durationMs
success/error/timeout
provider elapsed time when available
usage when available
error text when present
```

An existing artifact for the same SHA is non-rerunnable by design.

### Files

Create:

```text
src/benchmarks/provider-reliability-probe.ts
src/test-h0-004b-provider-probe.ts
scripts/run-h0-004b-provider-probe.ts
```

Modify:

```text
package.json
QOS-HARNESS-ENGINEERING-PLAN.md
```

Do not modify production provider/runtime/graph behavior.

### Deterministic gate before commit

```bash
npm run typecheck && \
npm run test:h0-004b-provider-probe && \
npm run test:h0-004b-provider-reliability-characterization && \
npm run test:provider-lifecycle && \
npm run test:llm-execution
```

This gate must consume zero real provider usage.

### Live authorization rule

Do not run the live probe until:

```text
deterministic gate passes
probe implementation is committed
worktree is clean
exact implementation SHA is frozen
external probe target is absent
```

Then run exactly once for that SHA:

```bash
npm run probe:h0-004b-provider-reliability
```

Bad/timeout/error observations are valid evidence and must not be erased by
rerunning the same SHA.

### Interpretation boundary

The probe answers only:

```text
does prolonged latency/stall appear to follow openai/gpt-oss-20b specifically,
or does it also appear on nvidia/nemotron-3.5-lightning-30b-a3b under the same
NVIDIA provider and diagnostic call shape?
```

It does not decide model quality, SFCR, benchmark acceptance, or production
timeout policy.

## H0-004B Step 2 Deterministic Validation Record

**Status:** ✅ Accepted for live probe execution

The deterministic Step 2 gate passed in the development environment:

```bash
npm run typecheck && \
npm run test:h0-004b-provider-probe && \
npm run test:h0-004b-provider-reliability-characterization && \
npm run test:provider-lifecycle && \
npm run test:llm-execution
```

Accepted probe boundary:

```text
provider
  → NVIDIA only

models
  → openai/gpt-oss-20b
  → nvidia/nemotron-3.5-lightning-30b-a3b

sequence
  → alternating by round
  → 3 rounds
  → 6 total calls

per-call controls
  → identical tiny structured-output prompt
  → maxOutputTokens = 256
  → transportRetries = 0
  → diagnostic deadline = 120000 ms
```

The deterministic gate consumed zero real provider usage and did not execute
B01-B05.

### Live execution authorization

The Step 2 source must now be committed before any real provider call.

After commit:

```text
worktree
  → clean

implementation SHA
  → exact and frozen

probe artifact
  → ~/.cache/qos-harness/probes/h0-004b/<implementation-sha>/probe.json
  → must not already exist
```

Then exactly one live execution is authorized for that SHA:

```bash
npm run probe:h0-004b-provider-reliability
```

Timeouts and provider errors are valid observations.

Do not rerun the same SHA merely to improve or replace the evidence.

Do not run B01-B05 as part of this diagnostic step.

## H0-004B Step 2 Live Probe Record

**Implementation SHA:** `26d1abe86bdb035bc0764fad02246da3e93716f7`

**Status:** ✅ Completed — diagnostic evidence captured

The single authorized H0-004B live provider probe completed successfully and
persisted:

```text
~/.cache/qos-harness/probes/h0-004b/26d1abe86bdb035bc0764fad02246da3e93716f7/probe.json
```

### Fixed probe settings

```text
provider = NVIDIA
models:
  A = openai/gpt-oss-20b
  B = nvidia/nemotron-3.5-lightning-30b-a3b
rounds = 3
calls = 6
timeoutMs = 120000
maxOutputTokens = 256
transportRetries = 0
```

### Observations

```text
#1 GPT-OSS   success   2720 ms
#2 Nemotron  error      395 ms   NVIDIA HTTP 502 / Bad Gateway
#3 GPT-OSS   success   2433 ms
#4 Nemotron  success   1628 ms
#5 GPT-OSS   success   2060 ms
#6 Nemotron  success   2534 ms
```

Aggregate diagnostic view:

```text
GPT-OSS:
  success = 3/3
  timeout = 0/3
  error = 0/3
  successful latency range = 2060-2720 ms

Nemotron:
  success = 2/3
  timeout = 0/3
  error = 1/3
  error = HTTP 502 Bad Gateway / upstream request failed
  successful latency range = 1628-2534 ms

all calls:
  timeout = 0/6
  total probe wall time ≈ 11.8 s
```

### Interpretation

The live evidence does **not** support the hypothesis that the H0-004A stall is
specific to `openai/gpt-oss-20b`.

In this controlled sample GPT-OSS completed all three calls normally.

The only observed provider failure occurred on the Nemotron route:

```text
HTTP 502
Bad Gateway
Upstream request failed
```

This is evidence of transient upstream/provider transport unreliability that is
not unique to GPT-OSS.

The probe also did not reproduce the prior multi-minute stall, so it cannot prove
that every model route has the same long-hang probability.

The strongest supported conclusion is therefore:

```text
model-specific GPT-OSS failure
  → not supported by current probe

provider/upstream transient failure
  → directly observed

unbounded single-attempt wait risk
  → already proven by Step 1 semantics
  → observed operationally during H0-004A
  → not reproduced in this short Step 2 sample
```

Changing reviewer model is therefore not accepted as the reliability fix.

## H0-004B Step 3 — Bounded Provider Call Deadline Policy

**Status:** 📋 Specification / decision

### Decision

Proceed with a portable bounded provider-call deadline.

Reason:

```text
H0-004A live execution demonstrated an operationally unacceptable multi-minute
provider stall

H0-004B Step 1 proved retry count does not bound one in-flight transport attempt

H0-004B Step 2 showed transient upstream failure can occur across the NVIDIA
provider and did not implicate GPT-OSS specifically

cooperative cancellation is already implemented end-to-end
```

A bounded deadline is therefore the minimum reliability control justified by
evidence.

### Scope

Introduce a complete-call deadline at the portable execution boundary:

```text
executeStructuredLlm(...)
```

The deadline must abort underlying provider work through the existing
`AbortSignal` lifecycle path.

Do not implement a timeout using only `Promise.race()`.

### Policy shape

The deadline belongs to portable Harness execution policy, not provider hints.

Target conceptual shape:

```text
runtime role config
  → callTimeoutMs?
  → executeStructuredLlm(...)
  → composed AbortSignal
  → provider.generateStructured(...)
  → NVIDIA fetch / Claude process
```

The final field name and composition mechanism must be derived from the current
runtime-composition source before implementation.

### Initial value decision

Do **not** adopt the Step 2 diagnostic `120000 ms` as the production default.

Step 3 must first inspect current role/runtime configuration and choose a
conservative initial deadline that:

```text
bounds pathological multi-minute stalls
does not treat normal model latency as failure
is role-configurable or otherwise explicitly scoped
preserves existing external cancellation
```

The chosen value must be documented as an operational alpha policy rather than a
statistical SLA.

### Required behavior

Step 3 must prove deterministically:

```text
1. a call exceeding the configured deadline aborts underlying provider work
2. existing caller-supplied cancellation still works
3. caller cancellation and deadline cancellation compose safely
4. timeout produces a stable distinguishable error/reason
5. no hidden whole-call retry is introduced
6. NVIDIA transport retry ownership remains adapter-local
7. Claude process cancellation still terminates the real child lifecycle
8. no graph/task retry semantics change
9. no provider fallback is introduced
10. benchmark expectedOutcome does not influence timeout behavior
```

### Non-goals

Do not:

```text
change reviewer model
change planner/refiner model
change prompts
change B01-B05
change benchmark expected outcomes
add provider fallback
add Harness whole-call retry
change NVIDIA retry/backoff schedule
tune model quality
rerun H0-004A
```

### Exit condition

After the deadline policy passes deterministic regression gates:

```text
commit implementation
freeze a new SHA
authorize a new controlled real-suite measurement under a new measurement identity
```

Only that new measurement may decide whether the original H0-004A observability
target can now be evaluated reliably.

H1/H2 remain blocked until that measurement and the next GO/PIVOT/STOP checkpoint.

