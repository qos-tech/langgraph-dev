import assert from "node:assert/strict";

import type {
  ClaudeCliExecutionOptions,
  ClaudeCliRunner,
} from "./providers/claude-cli.js";
import { ClaudeCliProvider } from "./providers/claude-cli.js";

type CapturedCall = {
  command: string;
  args: readonly string[];
  options?: ClaudeCliExecutionOptions;
};

const calls: CapturedCall[] = [];

let stdout = JSON.stringify({
  subtype: "success",
  result: '{"ok":true}',
  usage: {
    input_tokens: 12,
    output_tokens: 5,
  },
});

const runner: ClaudeCliRunner = async (command, args, options) => {
  calls.push({
    command,
    args: [...args],
    ...(options ? { options } : {}),
  });
  return { stdout, stderr: "" };
};

const provider = new ClaudeCliProvider({
  binary: "/test/bin/claude",
  runner,
});

const controller = new AbortController();

const base = await provider.generateStructured({
  model: "sonnet",
  prompt: "Return JSON",
  validate: (value) => value as { ok: boolean },
  signal: controller.signal,
  providerHints: {
    maxOutputTokens: 999,
    transportRetries: 4,
  },
});

assert.deepEqual(base.data, { ok: true });
assert.deepEqual(base.usage, {
  promptTokens: 12,
  completionTokens: 5,
  totalTokens: 17,
});

assert.equal(calls.length, 1);
assert.equal(calls[0]?.command, "/test/bin/claude");
assert.equal(calls[0]?.options?.signal, controller.signal);

const args = calls[0]?.args ?? [];
assert.deepEqual(args, [
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

assert.equal(args.includes("--max-turns"), false);
assert.equal(args.includes("--json-schema"), false);

stdout = JSON.stringify({
  subtype: "success",
  result: '```json\\n{"value":42}\\n```',
});

const fenced = await provider.generateStructured({
  model: "sonnet",
  prompt: "Return fenced JSON",
  validate: (value) => value as { value: number },
});
assert.deepEqual(fenced.data, { value: 42 });

stdout = JSON.stringify({
  subtype: "success",
  structured_output: { native: true },
});

const structured = await provider.generateStructured({
  model: "sonnet",
  prompt: "Return native structured output",
  validate: (value) => value as { native: boolean },
});
assert.deepEqual(structured.data, { native: true });

stdout = JSON.stringify({ subtype: "success", result: '{"wrong":true}' });
await assert.rejects(
  () => provider.generateStructured({
    model: "sonnet",
    prompt: "Validation failure",
    validate: () => { throw new Error("schema failed"); },
  }),
  /não passou na validação/,
);

stdout = "not-json";
await assert.rejects(
  () => provider.generateStructured({
    model: "sonnet",
    prompt: "Invalid envelope",
    validate: (value) => value,
  }),
  /envelope JSON válido/,
);

stdout = JSON.stringify({ subtype: "success" });
await assert.rejects(
  () => provider.generateStructured({
    model: "sonnet",
    prompt: "Missing result",
    validate: (value) => value,
  }),
  /Não foi possível extrair JSON válido/,
);

stdout = JSON.stringify({
  subtype: "error_max_structured_output_retries",
  is_error: true,
});
await assert.rejects(
  () => provider.generateStructured({
    model: "sonnet",
    prompt: "CLI error",
    validate: (value) => value,
  }),
  /Claude CLI encerrou com erro/,
);

console.log("✅ H-ARCH-002 Step 7 Claude CLI provider tests passed.");
