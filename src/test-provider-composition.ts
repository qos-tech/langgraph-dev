import assert from "node:assert/strict";

import type {
  StructuredLlmProvider,
  StructuredLlmRequest,
  StructuredLlmResult,
} from "./providers/contracts.js";

import {
  defineLlmRoleBindings,
  resolveLlmRole,
} from "./providers/role-composition.js";

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

const customBindings = defineLlmRoleBindings({
  planner: {
    provider: providerA,
    model: "planner-model",
    providerHints: {
      maxOutputTokens: 1000,
      transportRetries: 2,
    },
  },
  reviewer: {
    provider: providerB,
    model: "reviewer-model",
    providerHints: {
      maxOutputTokens: 1200,
      transportRetries: 3,
    },
  },
  refiner: {
    provider: providerA,
    model: "refiner-model",
    providerHints: {
      maxOutputTokens: 1400,
      transportRetries: 4,
    },
  },
});

assert.equal(resolveLlmRole(customBindings, "planner").provider, providerA);
assert.equal(resolveLlmRole(customBindings, "reviewer").provider, providerB);
assert.equal(resolveLlmRole(customBindings, "refiner").provider, providerA);
assert.equal(resolveLlmRole(customBindings, "reviewer").model, "reviewer-model");

process.env.NVIDIA_API_KEY = "test-key";
process.env.NVIDIA_PLANNER_MODEL = "nvidia/nemotron-step5-test";
process.env.NVIDIA_REVIEW_MODEL = "openai/gpt-oss-step5-test";

const { defaultLlmRoleBindings } = await import(
  "./providers/default-composition.js"
);

assert.equal(
  defaultLlmRoleBindings.planner.model,
  "nvidia/nemotron-step5-test",
);
assert.equal(
  defaultLlmRoleBindings.reviewer.model,
  "openai/gpt-oss-step5-test",
);
assert.equal(
  defaultLlmRoleBindings.refiner.model,
  "nvidia/nemotron-step5-test",
);

assert.deepEqual(defaultLlmRoleBindings.planner.providerHints, {
  maxOutputTokens: 1800,
  transportRetries: 6,
});
assert.deepEqual(defaultLlmRoleBindings.reviewer.providerHints, {
  maxOutputTokens: 1800,
  transportRetries: 6,
});
assert.deepEqual(defaultLlmRoleBindings.refiner.providerHints, {
  maxOutputTokens: 2600,
  transportRetries: 6,
});

assert.equal(
  defaultLlmRoleBindings.planner.provider,
  defaultLlmRoleBindings.reviewer.provider,
);
assert.equal(
  defaultLlmRoleBindings.planner.provider,
  defaultLlmRoleBindings.refiner.provider,
);

console.log("✅ H-ARCH-002 Step 5 provider composition tests passed.");
