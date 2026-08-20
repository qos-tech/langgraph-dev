# Changelog

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
