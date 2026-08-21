import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import type {
  CapabilityAwareStructuredLlmProvider,
  StructuredLlmRequest,
  StructuredLlmResult,
} from "./providers/contracts.js";

import { defineLlmRoleBindings } from "./providers/role-composition.js";
import { buildDevGraph } from "./graph/build-dev-graph.js";

function fakeProvider(id: string): CapabilityAwareStructuredLlmProvider {
  return {
    capabilities: {
      supportsOutputTokenLimit: true,
      supportsTransportRetries: true,
    },
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
    providerHints: {
      maxOutputTokens: 101,
      transportRetries: 1,
    },
  },
  reviewer: {
    provider: providerB,
    model: "reviewer-test-model",
    providerHints: {
      maxOutputTokens: 202,
      transportRetries: 2,
    },
  },
  refiner: {
    provider: providerA,
    model: "refiner-test-model",
    providerHints: {
      maxOutputTokens: 303,
      transportRetries: 3,
    },
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
