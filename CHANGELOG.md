# Changelog

## [0.1.0-alpha.6] - 2026-08-21

### Added

- Versioned benchmark task contract
- Fixed B01–B05 benchmark suite covering trivial, already-satisfied, localized, cross-file and architectural/ambiguous cases
- Deterministic benchmark acceptance rules
- Deterministic benchmark suite integrity validator
- Final H0-002 benchmark-suite acceptance test

### Changed

- Benchmark definitions now use machine-independent repository IDs and explicit revisions
- Benchmark expected outcomes are explicit: `changes_required`, `already_satisfied`, or `blocked`
- Already-satisfied benchmarks deterministically reject unnecessary file changes
- Benchmark acceptance now rejects failed validation and required human intervention
- `blocked` may be a correct benchmark result when it is the declared expected outcome
- H0-002 — Benchmark Task Suite is complete

### Benchmark Suite

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

### Validation

- TypeScript typecheck
- H0-002 final acceptance
- Benchmark suite validation
- Benchmark acceptance rules
- Benchmark case definitions
- Benchmark contract
- H0-001 telemetry regression
- H-ARCH-004 architecture acceptance/public/dependency/boundary guards
- H-ARCH-003 runtime/provider lifecycle regression
- Provider architecture and cross-provider regression
- Prompt and graph characterization
- Repository tools tests

### Milestone

```text
H0-002 ✅ Benchmark Task Suite
```

### Next

- `H0-003 — Benchmark Runner`
- Resolve benchmark repository/revision identities into reproducible isolated working trees and execute the fixed suite

## [0.1.0-alpha.5] - 2026-08-21

### Added

- Versioned run telemetry contract for terminal Harness executions
- Run lifecycle recorder with generated run IDs, start/finish timestamps and duration
- JSON telemetry persistence under `.runs/<run-id>.json`
- Provider-neutral LLM call telemetry for planner, reviewer and refiner roles
- Run-scoped LLM telemetry collector with model, elapsed time and optional token usage
- Deterministic terminal `DevState` → telemetry completion projection
- End-to-end telemetry integration acceptance test

### Changed

- `src/index.ts` now acts as the application composition edge for run telemetry
- Graph construction accepts an optional run-scoped LLM telemetry sink
- Architectural characterization/acceptance guards now include the explicit telemetry boundary
- `.runs/` is ignored by Git so local telemetry does not contaminate source control
- H0-001 — Run Telemetry Foundation is complete

### Telemetry

Each terminal Harness run can now persist a versioned record containing:

```text
runId
startedAt
finishedAt
durationMs
task
repositoryPath
finalStatus
failureReason?

attempts:
  planning
  review
  task

files:
  read
  changed[]

llmCalls[]:
  role
  model
  elapsedSeconds
  promptTokens?
  completionTokens?
  totalTokens?
```

Telemetry remains outside `DevState`, provider-neutral, and isolated from the target repository.

### Validation

- TypeScript typecheck
- H0-001 telemetry integration acceptance
- LLM call telemetry tests
- Run telemetry store tests
- Run lifecycle recorder tests
- Run telemetry contract tests
- Run lifecycle characterization
- H-ARCH-004 acceptance/public/dependency/boundary guards
- H-ARCH-003 runtime/provider lifecycle regression
- Provider architecture and cross-provider regression
- Prompt and graph characterization
- Repository tools tests
- Manual Harness smoke producing a real ignored `.runs/<run-id>.json`

### Milestone

```text
H0-001 ✅ Run Telemetry Foundation
```

### Next

- `H0-002 — Benchmark Task Suite`
- Define the fixed benchmark cases that will consume the telemetry foundation before implementing the benchmark runner

## [0.1.0-alpha.4] - 2026-08-21

### Added

- Deterministic characterization of core module dependency boundaries
- Production TypeScript dependency graph and circular-dependency guard
- Public/composition boundary regression tests
- Final H-ARCH-004 architecture acceptance test

### Changed

- Architectural boundaries established in H-ARCH-001/002/003 are now enforced as repository-level invariants
- `src/graph.ts` is explicitly protected as the outer compatibility/default-composition boundary
- Graph internals are protected from depending back on `src/graph.ts`
- Graph builder and graph nodes are protected from selecting concrete provider composition
- Provider runtime core is protected from importing concrete adapters or graph/public composition

### Architecture

- Production source dependency graph must remain acyclic
- Graph internals must remain provider-neutral
- `providers/default-composition.ts` remains the concrete provider-selection root
- Runtime composition and execution boundaries remain provider-neutral
- Existing public compatibility exports are guarded during the architectural-foundation phase
- H-ARCH architectural foundation is considered complete

### Validation

- TypeScript typecheck
- H-ARCH-004 final architecture acceptance
- Public/composition boundary guards
- Module dependency and cycle guards
- Dependency-boundary characterization
- H-ARCH-003 runtime acceptance
- Provider lifecycle, execution, runtime composition, hints and capabilities
- Provider architecture and cross-provider acceptance
- Provider composition, injection and contract tests
- Prompt and graph characterization
- Repository tools tests

### Milestone

```text
H-ARCH-001 ✅ Modularize Core Harness Without Behavior Changes
H-ARCH-002 ✅ LLM Provider Contract
H-ARCH-003 ✅ Execution Policy / Runtime Composition Hardening
H-ARCH-004 ✅ Architectural Tests and Boundaries

H-ARCH ✅ COMPLETE
```

### Next

- `H0-001 — Run Telemetry Foundation`
- Benchmark and telemetry work now takes priority over additional architecture-only refactoring

## [0.1.0-alpha.3] - 2026-08-20

### Added

- Provider capability metadata for output-token limits and transport retries
- Capability-aware runtime role configuration
- Portable `executeStructuredLlm(...)` execution boundary
- Cooperative `AbortSignal` cancellation in the shared structured LLM request
- NVIDIA cancellation across fetch, retry backoff and GPT-OSS recovery
- Claude CLI child-process cancellation through `SIGTERM`
- Deterministic provider lifecycle tests
- Final H-ARCH-003 cross-provider runtime acceptance test

### Changed

- Ambiguous shared `maxTokens` / `maxRetries` request controls were replaced by explicit provider hints
- Runtime composition now removes unsupported provider hints before graph execution
- Graph LLM nodes delegate complete provider calls through the portable execution boundary
- Retry ownership is explicitly separated between provider transport retry, future whole-call retry and graph/task retry
- Provider lifecycle semantics are now cancellation-aware without introducing a premature timeout policy

### Architecture

- Provider capabilities describe semantic controls rather than transport implementation details
- `providerHints.maxOutputTokens` and `providerHints.transportRetries` remain provider-owned controls
- Portable cancellation is distinct from provider-specific hints
- NVIDIA keeps HTTP/network retries inside its adapter
- Claude CLI keeps process lifecycle inside its adapter
- Graph nodes remain provider-neutral and do not inspect capabilities
- Whole-provider-call retry remains owned by the portable execution boundary but intentionally unimplemented
- Timeout policy is deferred until production-hardening evidence defines duration, defaults and observability requirements

### Validation

- TypeScript typecheck
- H-ARCH-003 final cross-provider runtime acceptance
- Provider lifecycle cancellation tests
- Portable LLM execution tests
- Runtime composition tests
- Provider hint and capability tests
- Execution-policy characterization
- Provider architecture tests
- Mixed NVIDIA/Claude acceptance
- Claude provider tests
- Provider composition and injection tests
- Provider contract and NVIDIA characterization tests
- Prompt and graph characterization tests
- Repository tools tests

### Deferred

- Harness-level whole-provider-call retry requires a normalized retryable-error taxonomy
- Runtime timeout duration/default policy remains deferred to production hardening
- Provider fallback, rate-limit orchestration and operational observability remain outside this alpha

## [0.1.0-alpha.2] - 2026-08-20

### Added

- Provider-neutral `StructuredLlmProvider` contract
- NVIDIA provider adapter
- Claude CLI provider adapter
- Role-based provider/model composition for planner, reviewer and refiner
- Provider injection into graph nodes
- Deterministic provider contract, composition and injection tests
- Claude CLI provider tests and live smoke test
- Cross-provider deterministic acceptance test
- Cross-provider live acceptance test for NVIDIA and Claude
- Provider architecture boundary test

### Changed

- Graph nodes no longer depend directly on NVIDIA-specific APIs
- Provider/model selection now resolves through explicit role bindings
- `src/graph.ts` acts as the default runtime/composition compatibility boundary
- Shared structured JSON extraction is provider-neutral
- `maxTokens` and `maxRetries` are documented as optional execution hints rather than universal cross-provider guarantees
- `H-ARCH-003` replanned as Execution Policy / Runtime Composition Hardening

### Architecture

- NVIDIA and Claude CLI now satisfy the same structured LLM provider contract
- Mixed provider composition validated without graph-node changes
- Concrete provider dependencies remain outside graph nodes and graph builder
- Dependency direction is protected by deterministic architecture tests
- NVIDIA remains the default runtime composition

### Validation

- TypeScript typecheck
- Provider architecture tests
- Cross-provider deterministic acceptance
- Cross-provider live acceptance
- Claude provider tests
- Provider composition tests
- Provider injection tests
- Provider contract tests
- NVIDIA provider characterization tests
- Prompt characterization tests
- Graph characterization tests
- Repository tools tests

### Known alpha limitation

- Claude Code CLI does not expose direct equivalents for `maxTokens` and `maxRetries`
- These fields remain optional execution hints and will be revisited in `H-ARCH-003`

## [0.1.0-alpha.1] - 2026-08-20

### Added

- Graph behavior characterization tests
- Prompt characterization tests
- Structured graph schemas module
- Context helpers module
- Prompt builders module
- Router module
- Graph node module
- Dedicated LangGraph builder

### Changed

- `src/graph.ts` reduced to a compatibility/public API boundary

### Architecture

- Removed graph-builder circular dependency
- Established modular graph foundation for future providers,
  telemetry, repository intelligence and multi-agent orchestration

### Validation

- TypeScript typecheck
- Graph characterization tests
- Prompt characterization tests
- Repository tools tests
