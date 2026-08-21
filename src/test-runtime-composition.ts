import assert from "node:assert/strict";

import type {
  CapabilityAwareStructuredLlmProvider,
  StructuredLlmRequest,
} from "./providers/contracts.js";

import {
  defineLlmRuntimeConfig,
  resolveLlmRoleRuntime,
} from "./providers/runtime-composition.js";

function fakeProvider(
  capabilities: CapabilityAwareStructuredLlmProvider["capabilities"],
): CapabilityAwareStructuredLlmProvider {
  return {
    capabilities,

    async generateStructured<T>(request: StructuredLlmRequest<T>) {
      return {
        data: request.validate({ ok: true }),
        elapsedSeconds: 0,
      };
    },
  };
}

const fullProvider = fakeProvider({
  supportsOutputTokenLimit: true,
  supportsTransportRetries: true,
});

const limitedProvider = fakeProvider({
  supportsOutputTokenLimit: false,
  supportsTransportRetries: false,
});

const config = defineLlmRuntimeConfig({
  planner: {
    provider: fullProvider,
    model: "planner-model",
    providerHints: {
      maxOutputTokens: 1000,
      transportRetries: 2,
    },
  },

  reviewer: {
    provider: limitedProvider,
    model: "reviewer-model",
    providerHints: {
      maxOutputTokens: 1200,
      transportRetries: 3,
    },
  },

  refiner: {
    provider: fullProvider,
    model: "refiner-model",
  },
});

assert.deepEqual(resolveLlmRoleRuntime(config, "planner"), {
  provider: fullProvider,
  model: "planner-model",
  providerHints: {
    maxOutputTokens: 1000,
    transportRetries: 2,
  },
});

assert.deepEqual(resolveLlmRoleRuntime(config, "reviewer"), {
  provider: limitedProvider,
  model: "reviewer-model",
});

assert.deepEqual(resolveLlmRoleRuntime(config, "refiner"), {
  provider: fullProvider,
  model: "refiner-model",
});

console.log("✅ H-ARCH-003 Step 4 runtime role configuration passed.");
