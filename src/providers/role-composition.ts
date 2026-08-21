import type {
  LlmRole,
  LlmRoleRuntimeConfig,
  LlmRuntimeConfig,
} from "./runtime-composition.js";

import {
  defineLlmRuntimeConfig,
  resolveLlmRoleRuntime,
} from "./runtime-composition.js";

/**
 * Compatibility aliases retained while H-ARCH-003 migrates callers from the
 * old "binding" terminology to explicit runtime configuration.
 */
export type LlmRoleBinding = LlmRoleRuntimeConfig;
export type LlmRoleBindings = LlmRuntimeConfig;

export type { LlmRole };

export function defineLlmRoleBindings(
  bindings: LlmRoleBindings,
): LlmRoleBindings {
  return defineLlmRuntimeConfig(bindings);
}

export function resolveLlmRole(
  bindings: LlmRoleBindings,
  role: LlmRole,
): LlmRoleBinding {
  return resolveLlmRoleRuntime(bindings, role);
}
