import assert from "node:assert/strict";

import type {
  CapabilityAwareStructuredLlmProvider,
  StructuredLlmRequest,
} from "./providers/contracts.js";

import { executeStructuredLlm } from "./providers/execution.js";

const calls: Array<StructuredLlmRequest<unknown>> = [];

const provider: CapabilityAwareStructuredLlmProvider = {
  capabilities: {
    supportsOutputTokenLimit: true,
    supportsTransportRetries: true,
  },

  async generateStructured<T>(request: StructuredLlmRequest<T>) {
    calls.push(request as StructuredLlmRequest<unknown>);

    return {
      data: request.validate({ ok: true }),
      elapsedSeconds: 0.25,
    };
  },
};

const result = await executeStructuredLlm(
  {
    provider,
    model: "runtime-model",
    providerHints: {
      maxOutputTokens: 900,
      transportRetries: 2,
    },
  },
  {
    prompt: "Return JSON",
    validate: (value) => value as { ok: true },
  },
);

assert.deepEqual(result, {
  data: { ok: true },
  elapsedSeconds: 0.25,
});

assert.equal(calls.length, 1);
assert.deepEqual(calls[0], {
  model: "runtime-model",
  prompt: "Return JSON",
  validate: calls[0]?.validate,
  providerHints: {
    maxOutputTokens: 900,
    transportRetries: 2,
  },
});

const expectedError = new Error("provider failed");
let failingCalls = 0;

const failingProvider: CapabilityAwareStructuredLlmProvider = {
  capabilities: {
    supportsOutputTokenLimit: false,
    supportsTransportRetries: false,
  },

  async generateStructured() {
    failingCalls += 1;
    throw expectedError;
  },
};

await assert.rejects(
  executeStructuredLlm(
    {
      provider: failingProvider,
      model: "failing-model",
    },
    {
      prompt: "Fail once",
      validate: (value) => value,
    },
  ),
  (error: unknown) => error === expectedError,
);

assert.equal(
  failingCalls,
  1,
  "Harness execution boundary must not add whole-call retries yet.",
);

console.log("✅ H-ARCH-003 Step 5 LLM execution ownership passed.");
