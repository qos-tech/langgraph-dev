import assert from "node:assert/strict";

import type {
  StructuredLlmProvider,
} from "./providers/contracts.js";

import { ClaudeCliProvider } from "./providers/claude-cli.js";
import { NvidiaProvider } from "./providers/nvidia.js";

type PortableShape = {
  ok: true;
  source: "portable";
};

function validatePortableShape(value: unknown): PortableShape {
  if (
    typeof value !== "object" ||
    value === null ||
    !("ok" in value) ||
    value.ok !== true ||
    !("source" in value) ||
    value.source !== "portable"
  ) {
    throw new Error(
      'Expected {"ok":true,"source":"portable"}.',
    );
  }

  return {
    ok: true,
    source: "portable",
  };
}

const prompt =
  'Return only this JSON object: {"ok":true,"source":"portable"}';

async function runLiveScenario(
  name: string,
  provider: StructuredLlmProvider,
  model: string,
): Promise<void> {
  const result = await provider.generateStructured({
    model,
    prompt,
    validate: validatePortableShape,
  });

  assert.deepEqual(result.data, {
    ok: true,
    source: "portable",
  });

  console.log(
    `✅ ${name} live acceptance passed in ${result.elapsedSeconds.toFixed(1)}s.`,
  );
}

await runLiveScenario(
  "NVIDIA",
  new NvidiaProvider(),
  process.env.NVIDIA_CROSS_PROVIDER_MODEL ??
    "nvidia/nemotron-3.5-lightning-30b-a3b",
);

await runLiveScenario(
  "Claude CLI",
  new ClaudeCliProvider(),
  process.env.CLAUDE_CROSS_PROVIDER_MODEL ?? "sonnet",
);

console.log("✅ H-ARCH-002 Step 8 live cross-provider acceptance passed.");
