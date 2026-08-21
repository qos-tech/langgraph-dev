import assert from "node:assert/strict";

import type {
  StructuredLlmProvider,
  StructuredLlmRequest,
  StructuredLlmResult,
} from "./providers/contracts.js";

const fakeProvider: StructuredLlmProvider = {
  async generateStructured<T>(
    request: StructuredLlmRequest<T>,
  ): Promise<StructuredLlmResult<T>> {
    const parsed: unknown = {
      model: request.model,
      prompt: request.prompt,
    };

    return {
      data: request.validate(parsed),
      elapsedSeconds: 0.01,
      usage: {
        promptTokens: 2,
        completionTokens: 3,
        totalTokens: 5,
      },
    };
  },
};

const result = await fakeProvider.generateStructured({
  model: "provider-neutral-model",
  prompt: "return structured data",
  validate: (value) => {
    const candidate = value as {
      model?: unknown;
      prompt?: unknown;
    };

    assert.equal(candidate.model, "provider-neutral-model");
    assert.equal(candidate.prompt, "return structured data");

    return {
      accepted: true as const,
    };
  },
  providerHints: {
    maxOutputTokens: 500,
    transportRetries: 2,
  },
});

assert.deepEqual(result.data, {
  accepted: true,
});

assert.equal(result.elapsedSeconds, 0.01);

assert.deepEqual(result.usage, {
  promptTokens: 2,
  completionTokens: 3,
  totalTokens: 5,
});

console.log("✅ H-ARCH-002 Step 2 provider contract tests passed.");
