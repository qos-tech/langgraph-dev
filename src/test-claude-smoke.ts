import assert from "node:assert/strict";

import { ClaudeCliProvider } from "./providers/claude-cli.js";

const provider = new ClaudeCliProvider();

const result = await provider.generateStructured({
  model: process.env.CLAUDE_SMOKE_MODEL ?? "sonnet",
  prompt: 'Return only this JSON object: {"ok":true}',
  validate: (value) => {
    if (
      typeof value !== "object" ||
      value === null ||
      !("ok" in value) ||
      value.ok !== true
    ) {
      throw new Error('Expected {"ok":true}.');
    }

    return value as { ok: true };
  },
});

assert.deepEqual(result.data, { ok: true });
console.log(`✅ Claude CLI smoke passed in ${result.elapsedSeconds.toFixed(1)}s.`);
