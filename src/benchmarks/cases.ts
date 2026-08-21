import {
  BENCHMARK_TASK_SCHEMA_VERSION,
  defineBenchmarkTask,
  type BenchmarkTask,
} from "./contracts.js";

export const BENCHMARK_CASE_IDS = [
  "B01",
  "B02",
  "B03",
  "B04",
  "B05",
] as const;

export const benchmarkCases = [
  defineBenchmarkTask({
    schemaVersion: BENCHMARK_TASK_SCHEMA_VERSION,
    id: "B01",
    title: "Trivial — Add GET /health",
    difficulty: "trivial",
    task:
      "Add a GET /health endpoint that returns HTTP 200 with a small JSON health payload. Make only the minimum required change.",
    repository: {
      id: "fixture-simple-api",
      revision: "b01-v1",
    },
    constraints: [
      "preserve existing behavior",
      "do not add unrelated dependencies",
      "do not change files outside the minimum implementation scope",
    ],
    successCriteria: [
      "GET /health exists",
      "GET /health returns HTTP 200",
      "the response is JSON",
      "existing behavior remains green",
    ],
    validationCommands: [
      "npm run typecheck",
      "npm test",
    ],
    expectedOutcome: "changes_required",
  }),
  defineBenchmarkTask({
    schemaVersion: BENCHMARK_TASK_SCHEMA_VERSION,
    id: "B02",
    title: "Already Satisfied — Detect existing health endpoint",
    difficulty: "already-satisfied",
    task:
      "Ensure the application exposes GET /health returning HTTP 200 with a JSON health payload. If the requested behavior already exists, report that no code change is required.",
    repository: {
      id: "fixture-health-already-present",
      revision: "b02-v1",
    },
    constraints: [
      "do not modify files when the requested behavior is already satisfied",
      "verify existing behavior before proposing implementation work",
    ],
    successCriteria: [
      "the existing GET /health behavior is recognized",
      "no repository files are modified",
      "the final planning outcome is already_satisfied",
    ],
    validationCommands: [
      "npm run typecheck",
      "npm test",
    ],
    expectedOutcome: "already_satisfied",
  }),
  defineBenchmarkTask({
    schemaVersion: BENCHMARK_TASK_SCHEMA_VERSION,
    id: "B03",
    title: "Localized Change — Extend a known component",
    difficulty: "localized",
    task:
      "Add an optional compact mode to the existing StatusBadge component. In compact mode it must keep the same semantic status text while rendering without the secondary description. Preserve the public behavior when compact mode is not enabled.",
    repository: {
      id: "fixture-component-app",
      revision: "b03-v1",
    },
    constraints: [
      "keep the change localized to the component and directly related tests",
      "preserve the default StatusBadge behavior",
      "do not redesign unrelated UI",
    ],
    successCriteria: [
      "StatusBadge accepts an optional compact mode",
      "compact mode preserves accessible semantic status text",
      "compact mode omits the secondary description",
      "default rendering remains unchanged",
    ],
    validationCommands: [
      "npm run typecheck",
      "npm test",
    ],
    expectedOutcome: "changes_required",
  }),
  defineBenchmarkTask({
    schemaVersion: BENCHMARK_TASK_SCHEMA_VERSION,
    id: "B04",
    title: "Cross-file Feature — Q-Flow Workflow Canvas n8n-like behavior",
    difficulty: "cross-file",
    task:
      "Evolve the Q-Flow Workflow Canvas toward an n8n-like creation experience. The user must be able to add a node directly from the canvas through a nearby add affordance, insert a node between two connected nodes, and access edge actions to remove an edge or insert a step. Preserve the existing @xyflow/react architecture, workflow draft model, plugin registry, and visual identity. Investigate before changing code.",
    repository: {
      id: "qflow-workflow-canvas",
      revision: "b04-v1",
    },
    constraints: [
      "preserve @xyflow/react",
      "preserve the workflow draft as the source of truth",
      "preserve plugin-registry-driven capability selection",
      "preserve existing visual identity",
      "avoid unrelated workflow-builder refactors",
    ],
    successCriteria: [
      "a node can be added from a canvas-local affordance",
      "a node can be inserted between two currently connected nodes",
      "edge actions support edge removal",
      "edge actions support inserting a step",
      "draft edges remain consistent after insertion or removal",
      "existing workflow-builder behavior remains green",
    ],
    validationCommands: [
      "npm run typecheck",
      "npm test",
      "npm run build",
    ],
    expectedOutcome: "changes_required",
  }),
  defineBenchmarkTask({
    schemaVersion: BENCHMARK_TASK_SCHEMA_VERSION,
    id: "B05",
    title: "Architectural / Ambiguous — Discover the correct boundary first",
    difficulty: "architectural",
    task:
      "Add support for recording failed provider-call telemetry without fabricating metrics when a structured LLM provider throws before returning a normal result. Investigate the current provider execution, error, lifecycle, telemetry, and graph boundaries first. Produce an implementation plan only when the repository evidence establishes where the responsibility belongs.",
    repository: {
      id: "qos-harness-architecture",
      revision: "b05-v1",
    },
    constraints: [
      "do not invent elapsed time or token usage for failed calls",
      "preserve provider neutrality",
      "preserve the existing graph-state boundary",
      "do not introduce a provider-specific branch in graph nodes",
      "prefer an explicit blocked outcome over an unsupported architectural assumption",
    ],
    successCriteria: [
      "the relevant execution and telemetry boundaries are identified from repository evidence",
      "the plan does not fabricate unavailable provider metrics",
      "the plan preserves provider-neutral dependency direction",
      "the plan identifies any missing error contract required before implementation",
      "the final outcome is changes_required when evidence supports a safe design, otherwise blocked with the blocking evidence stated",
    ],
    validationCommands: [
      "npm run typecheck",
      "npm run test:provider-architecture",
      "npm run test:llm-execution",
      "npm run test:llm-call-telemetry",
    ],
    expectedOutcome: "blocked",
  }),
] as const satisfies readonly BenchmarkTask[];
