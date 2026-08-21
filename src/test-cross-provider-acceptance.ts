import assert from "node:assert/strict";

import type {
  StructuredLlmProvider,
  StructuredLlmRequest,
} from "./providers/contracts.js";

import {
  ClaudeCliProvider,
  type ClaudeCliRunner,
} from "./providers/claude-cli.js";

import {
  defineLlmRoleBindings,
} from "./providers/role-composition.js";

import { buildDevGraph } from "./graph/build-dev-graph.js";

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

const prompt =
  'Return only this JSON object: {"ok":true,"source":"portable"}';

async function assertPortableScenario(
  name: string,
  provider: StructuredLlmProvider,
  model: string,
): Promise<void> {
  const request: StructuredLlmRequest<PortableShape> = {
    model,
    prompt,
    validate: validatePortableShape,
    providerHints: {
      maxOutputTokens: 400,
      transportRetries: 0,
    },
  };

  const result = await provider.generateStructured(request);

  assert.deepEqual(result.data, {
    ok: true,
    source: "portable",
  });

  assert.ok(result.elapsedSeconds >= 0);

  console.log(`✅ ${name} satisfied the shared structured-output scenario.`);
}

const originalFetch = globalThis.fetch;

process.env.NVIDIA_API_KEY = "test-key";

const { NvidiaProvider } = await import("./providers/nvidia.js");

globalThis.fetch = async () =>
  new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            content: '{"ok":true,"source":"portable"}',
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

const claudeRunner: ClaudeCliRunner = async () => ({
  stdout: JSON.stringify({
    subtype: "success",
    result: '{"ok":true,"source":"portable"}',
    usage: {
      input_tokens: 11,
      output_tokens: 5,
    },
  }),
  stderr: "",
});

const nvidiaProvider = new NvidiaProvider();

const claudeProvider = new ClaudeCliProvider({
  binary: "/test/bin/claude",
  runner: claudeRunner,
});

try {
  await assertPortableScenario(
    "NVIDIA",
    nvidiaProvider,
    "nvidia/nemotron-3.5-lightning-30b-a3b",
  );

  await assertPortableScenario(
    "Claude CLI",
    claudeProvider,
    "sonnet",
  );

  const mixedBindings = defineLlmRoleBindings({
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
        transportRetries: 6,
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

  const mixedGraph = buildDevGraph(mixedBindings);

  assert.ok(mixedGraph);

  console.log(
    "✅ Mixed Claude/NVIDIA graph composition built without graph-node edits.",
  );
} finally {
  globalThis.fetch = originalFetch;
}

console.log("✅ H-ARCH-002 Step 8 cross-provider acceptance passed.");
