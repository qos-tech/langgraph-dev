# Changelog

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
