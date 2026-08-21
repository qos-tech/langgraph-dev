import type {
  StructuredLlmRequest,
  StructuredLlmResult,
} from "./contracts.js";

import type {
  ResolvedLlmRoleRuntime,
} from "./runtime-composition.js";

/**
 * Portable structured-LLM execution boundary.
 *
 * Ownership rules:
 *
 * - provider/transport retries remain inside concrete adapters;
 * - whole-provider-call retries belong here, but are not implemented until a
 *   retryable-error contract exists;
 * - call timeout belongs here, but is not implemented in Step 6; this
 *   boundary now forwards cooperative cancellation to adapters so a future
 *   timeout can cancel real provider work safely.
 *
 * The current behavior is deliberately one provider invocation with no
 * Harness-level timeout or retry.
 */
export async function executeStructuredLlm<T>(
  runtime: ResolvedLlmRoleRuntime,
  request: Omit<StructuredLlmRequest<T>, "model" | "providerHints">,
): Promise<StructuredLlmResult<T>> {
  return runtime.provider.generateStructured({
    model: runtime.model,
    prompt: request.prompt,
    validate: request.validate,
    ...(request.signal
      ? {
          signal: request.signal,
        }
      : {}),
    ...(runtime.providerHints
      ? {
          providerHints: runtime.providerHints,
        }
      : {}),
  });
}
