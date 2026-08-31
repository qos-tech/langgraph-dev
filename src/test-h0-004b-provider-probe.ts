import assert from "node:assert/strict";

import type {
  StructuredLlmProvider,
  StructuredLlmRequest,
} from "./providers/contracts.js";
import {
  runProviderReliabilityProbe,
} from "./benchmarks/provider-reliability-probe.js";

const observedRequests: Array<StructuredLlmRequest<unknown>> = [];

const successProvider: StructuredLlmProvider = {
  async generateStructured<T>(request: StructuredLlmRequest<T>) {
    observedRequests.push(request as StructuredLlmRequest<unknown>);

    return {
      data: request.validate({
        ok: true,
        probe: "h0-004b",
      }),
      elapsedSeconds: 0.01,
      usage: {
        promptTokens: 5,
        completionTokens: 3,
        totalTokens: 8,
      },
    };
  },
};

const success = await runProviderReliabilityProbe(successProvider, {
  models: ["model-a", "model-b"],
  rounds: 2,
  timeoutMs: 1_000,
  maxOutputTokens: 256,
  transportRetries: 0,
});

assert.deepEqual(
  success.observations.map((observation) => observation.model),
  ["model-a", "model-b", "model-a", "model-b"],
);

assert.deepEqual(
  success.observations.map((observation) => observation.status),
  ["success", "success", "success", "success"],
);

assert.equal(observedRequests.length, 4);

for (const request of observedRequests) {
  assert.ok(request.signal instanceof AbortSignal);
  assert.equal(request.signal.aborted, false);
  assert.deepEqual(request.providerHints, {
    maxOutputTokens: 256,
    transportRetries: 0,
  });
}

let timeoutCalls = 0;

const timeoutProvider: StructuredLlmProvider = {
  async generateStructured<T>(request: StructuredLlmRequest<T>) {
    timeoutCalls += 1;

    const signal = request.signal;

    if (!signal) {
      throw new Error("Expected diagnostic probe signal.");
    }

    return new Promise((_resolve, reject) => {
      const rejectAborted = () => {
        reject(
          signal.reason instanceof Error
            ? signal.reason
            : new Error("probe aborted"),
        );
      };

      if (signal.aborted) {
        rejectAborted();
        return;
      }

      signal.addEventListener("abort", rejectAborted, {
        once: true,
      });
    });
  },
};

const timeout = await runProviderReliabilityProbe(timeoutProvider, {
  models: ["slow-model"],
  rounds: 1,
  timeoutMs: 10,
  maxOutputTokens: 64,
  transportRetries: 0,
});

assert.equal(timeoutCalls, 1);
assert.equal(timeout.observations.length, 1);
assert.equal(timeout.observations[0]?.status, "timeout");
assert.match(
  timeout.observations[0]?.error ?? "",
  /ProbeDeadlineError: H0-004B diagnostic deadline exceeded/,
);

console.log("✅ H0-004B Step 2 provider probe boundary passed.");
