import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import type {
  ClaudeCliRunner,
} from "./providers/claude-cli.js";
import { ClaudeCliProvider } from "./providers/claude-cli.js";

type FetchCall = {
  input: string;
  init: RequestInit | undefined;
};

const originalFetch = globalThis.fetch;
const fetchCalls: FetchCall[] = [];

process.env.NVIDIA_API_KEY = "test-key";
process.env.NVIDIA_BASE_URL = "https://nvidia.test/v1";

globalThis.fetch = (async (
  input: string | URL | Request,
  init?: RequestInit,
) => {
  fetchCalls.push({
    input: String(input),
    init,
  });

  return new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            role: "assistant",
            content: '{"ok":true}',
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 7,
        completion_tokens: 3,
        total_tokens: 10,
      },
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    },
  );
}) as typeof fetch;

const { NvidiaProvider } = await import("./providers/nvidia.js");

type ClaudeCall = {
  command: string;
  args: readonly string[];
};

const claudeCalls: ClaudeCall[] = [];

const claudeRunner: ClaudeCliRunner = async (command, args) => {
  claudeCalls.push({
    command,
    args: [...args],
  });

  return {
    stdout: JSON.stringify({
      subtype: "success",
      result: '{"ok":true}',
      usage: {
        input_tokens: 8,
        output_tokens: 4,
      },
    }),
    stderr: "",
  };
};

function validate(value: unknown): { ok: true } {
  if (
    typeof value !== "object" ||
    value === null ||
    !("ok" in value) ||
    value.ok !== true
  ) {
    throw new Error("Expected { ok: true }.");
  }

  return { ok: true };
}

try {
  const nvidia = new NvidiaProvider();

  const nvidiaResult = await nvidia.generateStructured({
    model: "vendor/model",
    prompt: "Return JSON",
    validate,
    providerHints: {
      maxOutputTokens: 321,
      transportRetries: 0,
    },
  });

  assert.deepEqual(nvidiaResult.data, { ok: true });
  assert.deepEqual(nvidiaResult.usage, {
    promptTokens: 7,
    completionTokens: 3,
    totalTokens: 10,
  });

  assert.equal(fetchCalls.length, 1);

  const nvidiaBodyRaw = fetchCalls[0]?.init?.body;
  assert.equal(typeof nvidiaBodyRaw, "string");

  const nvidiaBody = JSON.parse(
    nvidiaBodyRaw as string,
  ) as Record<string, unknown>;

  assert.equal(nvidiaBody.max_tokens, 321);

  const claude = new ClaudeCliProvider({
    binary: "/test/bin/claude",
    runner: claudeRunner,
  });

  const claudeResult = await claude.generateStructured({
    model: "sonnet",
    prompt: "Return JSON",
    validate,
    providerHints: {
      maxOutputTokens: 321,
      transportRetries: 4,
    },
  });

  assert.deepEqual(claudeResult.data, { ok: true });
  assert.deepEqual(claudeResult.usage, {
    promptTokens: 8,
    completionTokens: 4,
    totalTokens: 12,
  });

  assert.equal(claudeCalls.length, 1);

  const claudeArgs = claudeCalls[0]?.args ?? [];

  assert.equal(claudeArgs.includes("--max-turns"), false);
  assert.equal(claudeArgs.includes("--max-tokens"), false);
  assert.equal(claudeArgs.includes("--retries"), false);

  assert.deepEqual(claudeArgs, [
    "-p",
    "Return JSON",
    "--model",
    "sonnet",
    "--output-format",
    "json",
    "--safe-mode",
    "--tools",
    "",
    "--disallowedTools",
    "mcp__*",
    "--no-session-persistence",
    "--disable-slash-commands",
  ]);

  const nvidiaSource = await readFile(
    new URL("./providers/nvidia.ts", import.meta.url),
    "utf8",
  );

  const claudeSource = await readFile(
    new URL("./providers/claude-cli.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    nvidiaSource,
    /for \(let attempt = 0; attempt <= maxRetries; attempt\+\+\)/,
  );
  assert.match(nvidiaSource, /isRetryableStatus/);

  assert.doesNotMatch(
    nvidiaSource,
    /AbortSignal\.timeout/,
  );
  assert.doesNotMatch(
    claudeSource,
    /AbortSignal\.timeout|\btimeout\s*:/,
  );

  assert.match(nvidiaSource, /signal/);
  assert.match(nvidiaSource, /fetch\(/);

  assert.match(claudeSource, /execFile\(/);
  assert.match(claudeSource, /killSignal:\s*"SIGTERM"/);
  assert.match(claudeSource, /request\.signal/);

  assert.match(nvidiaSource, /extractJsonObject\(content\)/);
  assert.match(claudeSource, /"--output-format",\s*"json"/);
  assert.match(claudeSource, /structured_output/);

  const contractsSource = await readFile(
    new URL("./providers/contracts.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(contractsSource, /\bmaxTokens\?:/);
  assert.doesNotMatch(contractsSource, /\bmaxRetries\?:/);
  assert.match(contractsSource, /maxOutputTokens\?: number/);
  assert.match(contractsSource, /transportRetries\?: number/);

  console.log("✅ H-ARCH-003 Step 1 execution-policy characterization passed.");
} finally {
  globalThis.fetch = originalFetch;
}
