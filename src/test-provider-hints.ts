import assert from "node:assert/strict";

import type {
  StructuredLlmProvider,
  StructuredLlmRequest,
} from "./providers/contracts.js";

import {
  defineLlmRoleBindings,
  resolveLlmRole,
} from "./providers/role-composition.js";

const calls: Array<StructuredLlmRequest<unknown>> = [];

const provider: StructuredLlmProvider = {
  async generateStructured<T>(request: StructuredLlmRequest<T>) {
    calls.push(request as StructuredLlmRequest<unknown>);

    return {
      data: request.validate({ ok: true }),
      elapsedSeconds: 0,
    };
  },
};

const bindings = defineLlmRoleBindings({
  planner: {
    provider,
    model: "planner-model",
    providerHints: {
      maxOutputTokens: 1000,
      transportRetries: 2,
    },
  },
  reviewer: {
    provider,
    model: "reviewer-model",
  },
  refiner: {
    provider,
    model: "refiner-model",
    providerHints: {
      maxOutputTokens: 1400,
    },
  },
});

assert.deepEqual(resolveLlmRole(bindings, "planner").providerHints, {
  maxOutputTokens: 1000,
  transportRetries: 2,
});

assert.equal(
  resolveLlmRole(bindings, "reviewer").providerHints,
  undefined,
);

assert.deepEqual(resolveLlmRole(bindings, "refiner").providerHints, {
  maxOutputTokens: 1400,
});

// Provider hints are optional metadata. The base structured request remains
// valid without pretending these controls are portable guarantees.
const result = await provider.generateStructured({
  model: "portable-model",
  prompt: "Return JSON",
  validate: (value) => value as { ok: true },
});

assert.deepEqual(result.data, { ok: true });
assert.equal(calls.length, 1);
assert.equal(calls[0]?.providerHints, undefined);

console.log("✅ H-ARCH-003 Step 3 provider-hint separation passed.");
