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
