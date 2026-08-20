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

export type StructuredLlmRequest<T> = {
  model: string;
  prompt: string;
  validate: (value: unknown) => T;

  /**
   * Optional execution hints.
   *
   * Providers may honor these when equivalent controls exist. They are not
   * cross-provider guarantees: the current NVIDIA adapter supports them,
   * while Claude Code CLI has no equivalent max-token/retry semantics.
   *
   * Capability-aware execution policy is deferred to H-ARCH-003.
   */
  maxTokens?: number;
  maxRetries?: number;
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
