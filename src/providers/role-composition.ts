import type { StructuredLlmProvider } from "./contracts.js";

export type LlmRole = "planner" | "reviewer" | "refiner";

export type LlmRoleBinding = Readonly<{
  provider: StructuredLlmProvider;
  model: string;
  maxTokens: number;
  maxRetries: number;
}>;

export type LlmRoleBindings = Readonly<Record<LlmRole, LlmRoleBinding>>;

/**
 * Defines the provider/model execution binding for each current LLM role.
 *
 * The graph must consume role bindings rather than branch on concrete provider
 * names. Concrete provider selection belongs in composition.
 */
export function defineLlmRoleBindings(
  bindings: LlmRoleBindings,
): LlmRoleBindings {
  return bindings;
}

export function resolveLlmRole(
  bindings: LlmRoleBindings,
  role: LlmRole,
): LlmRoleBinding {
  return bindings[role];
}
