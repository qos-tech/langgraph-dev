import type {
  CapabilityAwareStructuredLlmProvider,
  StructuredLlmProviderHints,
} from "./contracts.js";

export type LlmRole = "planner" | "reviewer" | "refiner";

export type LlmRoleRuntimeConfig = Readonly<{
  provider: CapabilityAwareStructuredLlmProvider;
  model: string;

  /**
   * Provider-specific execution hints requested for this runtime role.
   *
   * Unsupported hints are removed when the role is resolved against the
   * provider's advertised capabilities.
   */
  providerHints?: StructuredLlmProviderHints;
}>;

export type LlmRuntimeConfig = Readonly<
  Record<LlmRole, LlmRoleRuntimeConfig>
>;

export type ResolvedLlmRoleRuntime = Readonly<{
  provider: CapabilityAwareStructuredLlmProvider;
  model: string;
  providerHints?: StructuredLlmProviderHints;
}>;

export function defineLlmRuntimeConfig(
  config: LlmRuntimeConfig,
): LlmRuntimeConfig {
  return config;
}

function supportedProviderHints(
  config: LlmRoleRuntimeConfig,
): StructuredLlmProviderHints | undefined {
  const requested = config.providerHints;

  if (!requested) {
    return undefined;
  }

  const capabilities = config.provider.capabilities;

  const providerHints: StructuredLlmProviderHints = {
    ...(capabilities.supportsOutputTokenLimit &&
    requested.maxOutputTokens !== undefined
      ? {
          maxOutputTokens: requested.maxOutputTokens,
        }
      : {}),
    ...(capabilities.supportsTransportRetries &&
    requested.transportRetries !== undefined
      ? {
          transportRetries: requested.transportRetries,
        }
      : {}),
  };

  return Object.keys(providerHints).length > 0
    ? providerHints
    : undefined;
}

/**
 * Resolves one role into the effective runtime configuration consumed by graph
 * nodes. This is the capability-aware boundary between composition and graph
 * execution.
 */
export function resolveLlmRoleRuntime(
  config: LlmRuntimeConfig,
  role: LlmRole,
): ResolvedLlmRoleRuntime {
  const roleConfig = config[role];
  const providerHints = supportedProviderHints(roleConfig);

  return {
    provider: roleConfig.provider,
    model: roleConfig.model,
    ...(providerHints
      ? {
          providerHints,
        }
      : {}),
  };
}
