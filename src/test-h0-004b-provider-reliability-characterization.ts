import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import type {
  CapabilityAwareStructuredLlmProvider,
  StructuredLlmRequest,
} from "./providers/contracts.js";
import { executeStructuredLlm } from "./providers/execution.js";

process.env.NVIDIA_API_KEY = "test-key";
process.env.NVIDIA_BASE_URL = "https://nvidia.test/v1";

const executionSource = await readFile(
  new URL("./providers/execution.ts", import.meta.url),
  "utf8",
);
const nvidiaSource = await readFile(
  new URL("./providers/nvidia.ts", import.meta.url),
  "utf8",
);

assert.doesNotMatch(
  executionSource,
  /AbortSignal\.timeout|Promise\.race|setTimeout\s*\(/,
  "executeStructuredLlm must not create a whole-call deadline in the characterized baseline.",
);
assert.match(
  executionSource,
  /runtime\.provider\.generateStructured/,
  "Portable execution must still delegate one complete call to the resolved provider.",
);
assert.match(
  executionSource,
  /request\.signal/,
  "Portable execution must forward cooperative cancellation when supplied.",
);

assert.match(
  nvidiaSource,
  /for \(let attempt = 0; attempt <= maxRetries; attempt\+\+\)/,
  "NVIDIA transport retry must remain adapter-owned.",
);
assert.match(
  nvidiaSource,
  /fetch\([\s\S]*?signal/,
  "NVIDIA fetch must receive the cooperative cancellation signal.",
);
assert.match(
  nvidiaSource,
  /if \(signal\?\.aborted\)[\s\S]*?throw abortReason\(signal\)/,
  "NVIDIA must treat cancellation as terminal instead of retrying it.",
);
assert.doesNotMatch(
  nvidiaSource,
  /AbortSignal\.timeout/,
  "NVIDIA transport retries must not be mistaken for a wall-clock deadline.",
);

assert.doesNotMatch(
  executionSource,
  /expectedOutcome|benchmark/i,
  "Benchmark expected outcome must not influence provider execution policy.",
);
assert.doesNotMatch(
  nvidiaSource,
  /expectedOutcome/,
  "NVIDIA transport behavior must not depend on benchmark expected outcome.",
);

const propagatedError = new Error("provider/runtime failure");
let providerCalls = 0;

const failingProvider: CapabilityAwareStructuredLlmProvider = {
  capabilities: {
    supportsOutputTokenLimit: false,
    supportsTransportRetries: false,
  },

  async generateStructured() {
    providerCalls += 1;
    throw propagatedError;
  },
};

await assert.rejects(
  executeStructuredLlm(
    {
      provider: failingProvider,
      model: "failing-model",
    },
    {
      prompt: "fail",
      validate: (value) => value,
    },
  ),
  (error: unknown) => error === propagatedError,
);

assert.equal(
  providerCalls,
  1,
  "Portable execution must propagate provider/runtime errors without a hidden whole-call retry.",
);

const signalController = new AbortController();
let observedSignal: AbortSignal | undefined;

const signalProvider: CapabilityAwareStructuredLlmProvider = {
  capabilities: {
    supportsOutputTokenLimit: false,
    supportsTransportRetries: false,
  },

  async generateStructured<T>(request: StructuredLlmRequest<T>) {
    observedSignal = request.signal;

    return {
      data: request.validate({ ok: true }),
      elapsedSeconds: 0,
    };
  },
};

await executeStructuredLlm(
  {
    provider: signalProvider,
    model: "signal-model",
  },
  {
    prompt: "signal",
    validate: (value) => value as { ok: true },
    signal: signalController.signal,
  },
);

assert.equal(
  observedSignal,
  signalController.signal,
  "StructuredLlmRequest.signal must cross the portable execution boundary unchanged.",
);

const originalFetch = globalThis.fetch;
let fetchCalls = 0;
let nvidiaSettled = false;

globalThis.fetch = (async (
  _input: string | URL | Request,
  init?: RequestInit,
) => {
  fetchCalls += 1;

  const signal = init?.signal;

  if (!signal) {
    throw new Error("Expected NVIDIA fetch to receive an AbortSignal.");
  }

  return new Promise<Response>((_resolve, reject) => {
    const rejectAborted = () => {
      reject(
        signal.reason instanceof Error
          ? signal.reason
          : new Error("mock NVIDIA request aborted"),
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
}) as typeof fetch;

try {
  const { NvidiaProvider } = await import("./providers/nvidia.js");

  const nvidia = new NvidiaProvider();
  const controller = new AbortController();
  const abortReason = new Error("stop pending NVIDIA fetch");

  const pendingCall = nvidia
    .generateStructured({
      model: "vendor/model",
      prompt: "remain pending",
      validate: (value) => value,
      signal: controller.signal,
      providerHints: {
        transportRetries: 6,
      },
    })
    .finally(() => {
      nvidiaSettled = true;
    });

  await Promise.resolve();
  await Promise.resolve();

  assert.equal(
    fetchCalls,
    1,
    "transportRetries=6 must not create another attempt while the first fetch is still pending.",
  );
  assert.equal(
    nvidiaSettled,
    false,
    "An in-flight NVIDIA fetch remains pending until transport completion, failure, or cancellation; retry count is not a deadline.",
  );

  controller.abort(abortReason);

  await assert.rejects(
    pendingCall,
    (error: unknown) => error === abortReason,
  );

  assert.equal(
    fetchCalls,
    1,
    "Cancellation of the in-flight fetch must stop transport retry progression.",
  );
} finally {
  globalThis.fetch = originalFetch;
}

console.log(
  "✅ H0-004B Step 1 provider reliability characterization passed.",
);
