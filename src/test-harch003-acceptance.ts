import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import type {
  ClaudeCliRunner,
} from "./providers/claude-cli.js";
import { ClaudeCliProvider } from "./providers/claude-cli.js";

import {
  defineLlmRuntimeConfig,
  resolveLlmRoleRuntime,
} from "./providers/runtime-composition.js";

import { executeStructuredLlm } from "./providers/execution.js";

type PortableShape = {
  ok: true;
  source: string;
};

function validatePortableShape(value: unknown): PortableShape {
  if (
    typeof value !== "object" ||
    value === null ||
    !("ok" in value) ||
    value.ok !== true ||
    !("source" in value) ||
    typeof value.source !== "string"
  ) {
    throw new Error("Invalid portable structured response.");
  }

  return {
    ok: true,
    source: value.source,
  };
}

process.env.NVIDIA_API_KEY = "test-key";
process.env.NVIDIA_BASE_URL = "https://nvidia.test/v1";

const originalFetch = globalThis.fetch;

let fetchMode: "success" | "wait" = "success";
let nvidiaSignal: AbortSignal | undefined;
let nvidiaFetchCalls = 0;

globalThis.fetch = (async (
  _input: string | URL | Request,
  init?: RequestInit,
) => {
  nvidiaFetchCalls += 1;
  nvidiaSignal = init?.signal ?? undefined;

  if (fetchMode === "success") {
    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: '{"ok":true,"source":"nvidia"}',
            },
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 4,
          total_tokens: 14,
        },
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }

  const signal = init?.signal;

  if (!signal) {
    throw new Error("Expected NVIDIA cancellation signal.");
  }

  return new Promise<Response>((_resolve, reject) => {
    const rejectAborted = () => {
      reject(
        signal.reason instanceof Error
          ? signal.reason
          : new Error("NVIDIA aborted"),
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

const { NvidiaProvider } = await import("./providers/nvidia.js");

let claudeMode: "success" | "wait" = "success";
let claudeSignal: AbortSignal | undefined;
let claudeRunnerCalls = 0;

const claudeRunner: ClaudeCliRunner = async (
  _command,
  _args,
  options,
) => {
  claudeRunnerCalls += 1;
  claudeSignal = options?.signal;

  if (claudeMode === "success") {
    return {
      stdout: JSON.stringify({
        subtype: "success",
        result: '{"ok":true,"source":"claude"}',
        usage: {
          input_tokens: 11,
          output_tokens: 5,
        },
      }),
      stderr: "",
    };
  }

  const signal = options?.signal;

  if (!signal) {
    throw new Error("Expected Claude cancellation signal.");
  }

  return new Promise((_resolve, reject) => {
    const rejectAborted = () => {
      reject(
        signal.reason instanceof Error
          ? signal.reason
          : new Error("Claude aborted"),
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
};

const nvidiaProvider = new NvidiaProvider();

const claudeProvider = new ClaudeCliProvider({
  binary: "/test/bin/claude",
  runner: claudeRunner,
});

const runtimeConfig = defineLlmRuntimeConfig({
  planner: {
    provider: claudeProvider,
    model: "sonnet",
    providerHints: {
      maxOutputTokens: 1800,
      transportRetries: 6,
    },
  },

  reviewer: {
    provider: nvidiaProvider,
    model: "openai/gpt-oss-20b",
    providerHints: {
      maxOutputTokens: 1800,
      transportRetries: 0,
    },
  },

  refiner: {
    provider: claudeProvider,
    model: "sonnet",
    providerHints: {
      maxOutputTokens: 2600,
      transportRetries: 6,
    },
  },
});

try {
  const planner = resolveLlmRoleRuntime(runtimeConfig, "planner");
  const reviewer = resolveLlmRoleRuntime(runtimeConfig, "reviewer");

  // Capability-aware runtime resolution strips unsupported Claude hints while
  // preserving supported NVIDIA hints.
  assert.equal(planner.provider, claudeProvider);
  assert.equal(planner.model, "sonnet");
  assert.equal(planner.providerHints, undefined);

  assert.equal(reviewer.provider, nvidiaProvider);
  assert.deepEqual(reviewer.providerHints, {
    maxOutputTokens: 1800,
    transportRetries: 0,
  });

  const claudeResult = await executeStructuredLlm(planner, {
    prompt: "Return portable JSON",
    validate: validatePortableShape,
  });

  assert.deepEqual(claudeResult.data, {
    ok: true,
    source: "claude",
  });

  const nvidiaResult = await executeStructuredLlm(reviewer, {
    prompt: "Return portable JSON",
    validate: validatePortableShape,
  });

  assert.deepEqual(nvidiaResult.data, {
    ok: true,
    source: "nvidia",
  });

  // Portable cancellation must cross the execution boundary and cancel the
  // actual provider work in both adapters.
  fetchMode = "wait";

  const nvidiaController = new AbortController();
  const nvidiaReason = new Error("cancel NVIDIA through execution boundary");
  const nvidiaCallsBeforeCancel = nvidiaFetchCalls;

  const pendingNvidia = executeStructuredLlm(reviewer, {
    prompt: "Wait",
    validate: validatePortableShape,
    signal: nvidiaController.signal,
  });

  await Promise.resolve();
  nvidiaController.abort(nvidiaReason);

  await assert.rejects(
    pendingNvidia,
    (error: unknown) => error === nvidiaReason,
  );

  assert.equal(nvidiaSignal, nvidiaController.signal);
  assert.equal(
    nvidiaFetchCalls,
    nvidiaCallsBeforeCancel + 1,
    "Cancellation must not become an NVIDIA transport retry.",
  );

  claudeMode = "wait";

  const claudeController = new AbortController();
  const claudeReason = new Error("cancel Claude through execution boundary");
  const claudeCallsBeforeCancel = claudeRunnerCalls;

  const pendingClaude = executeStructuredLlm(planner, {
    prompt: "Wait",
    validate: validatePortableShape,
    signal: claudeController.signal,
  });

  await Promise.resolve();
  claudeController.abort(claudeReason);

  await assert.rejects(
    pendingClaude,
    (error: unknown) => error === claudeReason,
  );

  assert.equal(claudeSignal, claudeController.signal);
  assert.equal(
    claudeRunnerCalls,
    claudeCallsBeforeCancel + 1,
    "Harness execution must not add whole-call retries.",
  );

  const [
    contractsSource,
    runtimeSource,
    executionSource,
    nodesSource,
    nvidiaSource,
    claudeSource,
  ] = await Promise.all([
    readFile(new URL("./providers/contracts.ts", import.meta.url), "utf8"),
    readFile(
      new URL("./providers/runtime-composition.ts", import.meta.url),
      "utf8",
    ),
    readFile(new URL("./providers/execution.ts", import.meta.url), "utf8"),
    readFile(new URL("./graph/nodes.ts", import.meta.url), "utf8"),
    readFile(new URL("./providers/nvidia.ts", import.meta.url), "utf8"),
    readFile(new URL("./providers/claude-cli.ts", import.meta.url), "utf8"),
  ]);

  // Final H-ARCH-003 architecture review.
  assert.match(contractsSource, /signal\?: AbortSignal/);
  assert.match(contractsSource, /providerHints\?: StructuredLlmProviderHints/);
  assert.doesNotMatch(contractsSource, /\bmaxTokens\?:/);
  assert.doesNotMatch(contractsSource, /\bmaxRetries\?:/);

  assert.doesNotMatch(
    runtimeSource,
    /providers\/(?:nvidia|claude-cli)/,
  );
  assert.match(runtimeSource, /supportsOutputTokenLimit/);
  assert.match(runtimeSource, /supportsTransportRetries/);

  assert.match(executionSource, /runtime\.provider\.generateStructured/);
  assert.match(executionSource, /request\.signal/);
  assert.doesNotMatch(executionSource, /AbortSignal\.timeout/);
  assert.doesNotMatch(executionSource, /\bsetTimeout\(/);
  assert.doesNotMatch(executionSource, /\bfor\s*\([^)]*attempt/);

  assert.match(nodesSource, /executeStructuredLlm/);
  assert.doesNotMatch(
    nodesSource,
    /providers\/(?:nvidia|claude-cli)/,
  );
  assert.doesNotMatch(
    nodesSource,
    /supportsOutputTokenLimit|supportsTransportRetries/,
  );

  assert.match(nvidiaSource, /isRetryableStatus/);
  assert.match(nvidiaSource, /await sleep\(waitMs, signal\)/);
  assert.match(nvidiaSource, /\bsignal\b/);

  assert.match(claudeSource, /killSignal:\s*"SIGTERM"/);
  assert.match(claudeSource, /request\.signal/);
  assert.doesNotMatch(claudeSource, /["\']--max-turns["\']/);

  console.log("✅ H-ARCH-003 Step 7 cross-provider runtime acceptance passed.");
} finally {
  globalThis.fetch = originalFetch;
}
