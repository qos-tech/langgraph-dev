# QOS Harness — Engineering Plan

**Status:** Active
**Version:** 2.0
**Current milestone:** `H-ARCH`
**Current task:** `Release v0.1.0-alpha.2`
**Task status:** Ready for release

---

### Current Release

**Version:** `v0.1.0-alpha.2`
**Status:** Provider Abstraction Alpha
**Milestone:** `H-ARCH-002 — LLM Provider Contract` ✅

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

`v0.1.0-alpha.2` represents the provider-abstraction architecture baseline of the QOS Harness. It is not yet a production-ready autonomous development system.

The release proves provider-neutral graph execution with NVIDIA and Claude CLI behind the same structured LLM contract, including mixed-provider composition and deterministic architecture boundaries.

### Next architecture task

`H-ARCH-003 — Execution Policy / Runtime Composition Hardening`


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
afterPlanRouter
reviewRouter
afterReadRouter
planGateRouter
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

| Responsibility | Step 3 decision | Reason |
| --- | --- | --- |
| JSON object extraction | **Shared** | Pure transformation of model text; no NVIDIA dependency |
| HTTP transport/auth | NVIDIA adapter | Provider-specific infrastructure |
| Retry/backoff/Retry-After | NVIDIA adapter | Bound to HTTP/provider behavior |
| Nemotron request body | NVIDIA adapter | Model/provider-specific |
| GPT-OSS reasoning/recovery | NVIDIA adapter | Model-specific workaround |
| Response content lookup | NVIDIA adapter | NVIDIA/OpenAI-compatible response shape |
| Timing | NVIDIA adapter for now | Measures concrete provider execution |
| Token usage mapping | NVIDIA adapter for now | NVIDIA currently returns snake_case |
| Validation invocation | NVIDIA adapter for now | Current error context includes provider/model behavior |
| Normalized provider errors | Deferred | Requires an explicit error contract, not yet defined |

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
REVIEW_MODEL.startsWith("openai/gpt-oss") ? 1800 : 1400
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

# Release Procedure — v0.1.0-alpha.2

Run the full release gate:

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

Run the live provider smoke:

```bash
npm run test:cross-provider-live
```

Update package metadata:

```bash
npm version 0.1.0-alpha.2 --no-git-tag-version
git diff -- package.json package-lock.json
```

Stage and review:

```bash
git add package.json package-lock.json CHANGELOG.md QOS-HARNESS-ENGINEERING-PLAN.md
git diff --cached --stat
git diff --cached
git diff --check
```

Create the release commit:

```bash
git commit -m "chore(release): prepare v0.1.0-alpha.2"
```

Create and verify the annotated tag:

```bash
git tag -a v0.1.0-alpha.2 \
  -m "QOS Harness v0.1.0-alpha.2 - provider abstraction"

git show v0.1.0-alpha.2 --stat
```

Publish:

```bash
git push origin main
git push origin v0.1.0-alpha.2
```

Final verification:

```bash
git status
git tag --list "v0.1.0*"
```

After publication, development continues with:

`H-ARCH-003 — Execution Policy / Runtime Composition Hardening`
