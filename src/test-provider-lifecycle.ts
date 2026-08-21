import assert from "node:assert/strict";

import {
  ClaudeCliProvider,
  runClaudeProcess,
  type ClaudeCliRunner,
} from "./providers/claude-cli.js";

process.env.NVIDIA_API_KEY = "test-key";
process.env.NVIDIA_BASE_URL = "https://nvidia.test/v1";

const originalFetch = globalThis.fetch;

const nvidiaSignals: AbortSignal[] = [];
let nvidiaFetchCalls = 0;

globalThis.fetch = (async (
  _input: string | URL | Request,
  init?: RequestInit,
) => {
  nvidiaFetchCalls += 1;

  const signal = init?.signal;

  if (!signal) {
    throw new Error("Expected NVIDIA fetch to receive an AbortSignal.");
  }

  nvidiaSignals.push(signal);

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

const { NvidiaProvider } = await import("./providers/nvidia.js");

try {
  const nvidia = new NvidiaProvider();
  const nvidiaController = new AbortController();
  const nvidiaReason = new Error("cancel NVIDIA");

  const nvidiaCall = nvidia.generateStructured({
    model: "vendor/model",
    prompt: "wait",
    validate: (value) => value,
    signal: nvidiaController.signal,
    providerHints: {
      transportRetries: 3,
    },
  });

  await Promise.resolve();

  nvidiaController.abort(nvidiaReason);

  await assert.rejects(
    nvidiaCall,
    (error: unknown) => error === nvidiaReason,
  );

  assert.equal(nvidiaFetchCalls, 1);
  assert.equal(nvidiaSignals[0], nvidiaController.signal);

  let claudeSignal: AbortSignal | undefined;
  let claudeRunnerCalls = 0;

  const claudeRunner: ClaudeCliRunner = async (
    _command,
    _args,
    options,
  ) => {
    claudeRunnerCalls += 1;
    claudeSignal = options?.signal;

    const signal = options?.signal;

    if (!signal) {
      throw new Error("Expected Claude runner to receive an AbortSignal.");
    }

    return new Promise((_resolve, reject) => {
      const rejectAborted = () => {
        reject(
          signal.reason instanceof Error
            ? signal.reason
            : new Error("mock Claude process aborted"),
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

  const claude = new ClaudeCliProvider({
    binary: "/test/bin/claude",
    runner: claudeRunner,
  });

  const claudeController = new AbortController();
  const claudeReason = new Error("cancel Claude");

  const claudeCall = claude.generateStructured({
    model: "sonnet",
    prompt: "wait",
    validate: (value) => value,
    signal: claudeController.signal,
  });

  await Promise.resolve();

  claudeController.abort(claudeReason);

  await assert.rejects(
    claudeCall,
    (error: unknown) => error === claudeReason,
  );

  assert.equal(claudeRunnerCalls, 1);
  assert.equal(claudeSignal, claudeController.signal);

  const processController = new AbortController();
  const processReason = new Error("cancel child process");

  const child = runClaudeProcess(
    process.execPath,
    [
      "-e",
      "setInterval(() => {}, 10_000)",
    ],
    {
      signal: processController.signal,
    },
  );

  setTimeout(() => {
    processController.abort(processReason);
  }, 25);

  await assert.rejects(
    child,
    (error: unknown) => error === processReason,
  );

  console.log("✅ H-ARCH-003 Step 6 provider lifecycle cancellation passed.");
} finally {
  globalThis.fetch = originalFetch;
}
