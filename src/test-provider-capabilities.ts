import assert from "node:assert/strict";

import type {
  CapabilityAwareStructuredLlmProvider,
  StructuredLlmProviderCapabilities,
} from "./providers/contracts.js";

process.env.NVIDIA_API_KEY = "test-key";

const { NvidiaProvider } = await import("./providers/nvidia.js");
const { ClaudeCliProvider } = await import("./providers/claude-cli.js");

function assertCapabilities(
  provider: CapabilityAwareStructuredLlmProvider,
  expected: StructuredLlmProviderCapabilities,
) {
  assert.deepEqual(provider.capabilities, expected);
}

assertCapabilities(new NvidiaProvider(), {
  supportsOutputTokenLimit: true,
  supportsTransportRetries: true,
});

assertCapabilities(new ClaudeCliProvider(), {
  supportsOutputTokenLimit: false,
  supportsTransportRetries: false,
});

// Capability metadata describes semantic controls relevant to orchestration.
// It intentionally does not expose process-vs-HTTP lifecycle implementation
// details or invent timeout support that Step 1 showed does not exist yet.
const nvidiaCapabilities = Object.keys(new NvidiaProvider().capabilities).sort();
const claudeCapabilities = Object.keys(
  new ClaudeCliProvider().capabilities,
).sort();

assert.deepEqual(nvidiaCapabilities, [
  "supportsOutputTokenLimit",
  "supportsTransportRetries",
]);

assert.deepEqual(claudeCapabilities, nvidiaCapabilities);

console.log("✅ H-ARCH-003 Step 2 provider capability contract passed.");
