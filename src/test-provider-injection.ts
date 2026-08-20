import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import type {
  StructuredLlmProvider,
  StructuredLlmRequest,
  StructuredLlmResult,
} from "./providers/contracts.js";

import { defineLlmRoleBindings } from "./providers/role-composition.js";
import { buildDevGraph } from "./graph/build-dev-graph.js";

function fakeProvider(id: string): StructuredLlmProvider {
  return {
    async generateStructured<T>(
      request: StructuredLlmRequest<T>,
    ): Promise<StructuredLlmResult<T>> {
      return {
        data: request.validate({
          provider: id,
          model: request.model,
        }),
        elapsedSeconds: 0,
      };
    },
  };
}

const providerA = fakeProvider("provider-a");
const providerB = fakeProvider("provider-b");

const bindings = defineLlmRoleBindings({
  planner: {
    provider: providerA,
    model: "planner-test-model",
    maxTokens: 101,
    maxRetries: 1,
  },
  reviewer: {
    provider: providerB,
    model: "reviewer-test-model",
    maxTokens: 202,
    maxRetries: 2,
  },
  refiner: {
    provider: providerA,
    model: "refiner-test-model",
    maxTokens: 303,
    maxRetries: 3,
  },
});

const graph = buildDevGraph(bindings);
assert.ok(graph);

const nodesSource = await readFile(
  new URL("./graph/nodes.ts", import.meta.url),
  "utf8",
);

assert.doesNotMatch(nodesSource, /callNvidiaJson/);
assert.doesNotMatch(nodesSource, /providers\/nvidia/);
assert.doesNotMatch(nodesSource, /NVIDIA_PLANNER_MODEL/);
assert.doesNotMatch(nodesSource, /NVIDIA_REVIEW_MODEL/);
assert.match(nodesSource, /resolveLlmRole/);
assert.match(nodesSource, /binding\.provider\.generateStructured/);

console.log("✅ H-ARCH-002 Step 6 provider injection tests passed.");
