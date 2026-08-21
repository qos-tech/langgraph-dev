/**
 * Provider-neutral contracts for structured LLM generation.
 *
 * This module intentionally contains no NVIDIA, Claude, Ollama, HTTP,
 * LangGraph, or model-family-specific concepts.
 */

export type LlmUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type StructuredLlmProviderHints = Readonly<{
  /**
   * Provider-side output token ceiling when supported.
   */
  maxOutputTokens?: number;

  /**
   * Provider/transport retries beyond the initial attempt when supported.
   *
   * This is intentionally not a Harness-level task retry policy.
   */
  transportRetries?: number;
}>;

export type StructuredLlmRequest<T> = {
  model: string;
  prompt: string;
  validate: (value: unknown) => T;

  /**
   * Portable cooperative cancellation signal for the complete provider call.
   *
   * Concrete adapters must wire this signal to their real transport/process
   * lifecycle rather than only stop awaiting the result.
   */
  signal?: AbortSignal;

  /**
   * Optional provider execution hints.
   *
   * These are not portable guarantees. Consumers can inspect provider
   * capabilities before depending on a hint being honored.
   */
  providerHints?: StructuredLlmProviderHints;
};

export type StructuredLlmResult<T> = {
  data: T;
  elapsedSeconds: number;
  usage?: LlmUsage;
};

export interface StructuredLlmProvider {
  generateStructured<T>(
    request: StructuredLlmRequest<T>,
  ): Promise<StructuredLlmResult<T>>;
}

/**
 * Provider capabilities that are observable and relevant to orchestration.
 *
 * Keep this contract intentionally small. It describes semantic controls the
 * provider can actually honor; it must not expose transport/lifecycle details
 * that the orchestrator does not need.
 */
export type StructuredLlmProviderCapabilities = Readonly<{
  supportsOutputTokenLimit: boolean;
  supportsTransportRetries: boolean;
}>;

/**
 * Transitional capability-aware provider contract.
 *
 * Role bindings continue to accept StructuredLlmProvider during Step 2 so this
 * step can define and prove capability metadata without simultaneously
 * redesigning runtime policy. Later H-ARCH-003 steps may promote this boundary
 * where orchestration actually needs capability-aware decisions.
 */
export interface CapabilityAwareStructuredLlmProvider
  extends StructuredLlmProvider {
  readonly capabilities: StructuredLlmProviderCapabilities;
}
