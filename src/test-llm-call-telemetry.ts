import assert from "node:assert/strict";
import type {
  CapabilityAwareStructuredLlmProvider,
  StructuredLlmRequest,
  StructuredLlmResult,
} from "./providers/contracts.js";
import { defineLlmRuntimeConfig } from "./providers/runtime-composition.js";
import type { DevStateType } from "./state.js";
import {
  captureStructuredLlmCall,
  createLlmCallTelemetryCollector,
} from "./telemetry/llm-calls.js";
import { createGraphNodes } from "./graph/nodes.js";

class FakeStructuredProvider
  implements CapabilityAwareStructuredLlmProvider
{
  readonly capabilities = {
    supportsOutputTokenLimit: false,
    supportsTransportRetries: false,
  } as const;

  async generateStructured<T>(
    request: StructuredLlmRequest<T>,
  ): Promise<StructuredLlmResult<T>> {
    if (request.model === "planner-model") {
      return {
        data: request.validate({
          understanding: "Planner result",
          needsMoreContext: false,
          filesToRead: [],
          observations: [],
          unknowns: [],
        }),
        elapsedSeconds: 1.25,
        usage: {
          promptTokens: 120,
          completionTokens: 40,
          totalTokens: 160,
        },
      };
    }

    if (request.model === "reviewer-model") {
      return {
        data: request.validate({
          decision: "enough_context",
          missingEvidence: [],
          issues: [],
          summary: "Enough context",
        }),
        elapsedSeconds: 0.5,
      };
    }

    return {
      data: request.validate({
        outcome: "already_satisfied",
        understanding: "Refined result",
        changes: [],
        validation: [],
        blockingUnknowns: [],
        nonBlockingNotes: [],
      }),
      elapsedSeconds: 2,
      usage: {
        totalTokens: 80,
      },
    };
  }
}

const provider = new FakeStructuredProvider();

const runtime = defineLlmRuntimeConfig({
  planner: {
    provider,
    model: "planner-model",
  },
  reviewer: {
    provider,
    model: "reviewer-model",
  },
  refiner: {
    provider,
    model: "refiner-model",
  },
});

const collector = createLlmCallTelemetryCollector();

const {
  planNode,
  reviewPlanNode,
  refineNode,
} = createGraphNodes(runtime, collector);

const baseState: DevStateType = {
  task: "Add GET /health",
  repositoryPath: "/tmp/example",
  repositoryContext: undefined,
  fileContents: {},
  fileSummaries: {},
  recentlyReadFiles: [],
  explorationPlan: undefined,
  planReview: undefined,
  refinedPlan: undefined,
  planningAttempts: 0,
  reviewAttempts: 0,
  maxPlanningAttempts: 4,
  analysis: undefined,
  filesChanged: [],
  validationOutput: undefined,
  attempts: 0,
  maxAttempts: 3,
  failureReason: undefined,
  status: "pending",
};

await planNode(baseState);

const explorationPlan = {
  understanding: "Enough repository context",
  needsMoreContext: false,
  filesToRead: [],
  observations: [],
  unknowns: [],
};

await reviewPlanNode({
  ...baseState,
  explorationPlan,
});

await refineNode({
  ...baseState,
  explorationPlan,
  planReview: {
    decision: "enough_context",
    missingEvidence: [],
    issues: [],
    summary: "Enough context",
  },
});

assert.deepEqual(collector.snapshot(), [
  {
    role: "planner",
    model: "planner-model",
    elapsedSeconds: 1.25,
    promptTokens: 120,
    completionTokens: 40,
    totalTokens: 160,
  },
  {
    role: "reviewer",
    model: "reviewer-model",
    elapsedSeconds: 0.5,
  },
  {
    role: "refiner",
    model: "refiner-model",
    elapsedSeconds: 2,
    totalTokens: 80,
  },
]);

// The capture helper is a no-op when telemetry is not configured.
captureStructuredLlmCall(
  undefined,
  "planner",
  "unused-model",
  {
    data: {
      ok: true,
    },
    elapsedSeconds: 99,
  },
);

assert.equal(collector.snapshot().length, 3);

// Snapshots are copies and cannot mutate the collector's internal array.
const snapshot = collector.snapshot();
(snapshot as Array<unknown>).push({
  role: "planner",
});

assert.equal(snapshot.length, 4);
assert.equal(collector.snapshot().length, 3);

console.log("✅ H0-001 Step 5 LLM call telemetry capture passed.");
