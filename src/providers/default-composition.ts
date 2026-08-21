import { nvidiaProvider } from "./nvidia.js";

import {
  defineLlmRoleBindings,
  type LlmRoleBindings,
} from "./role-composition.js";

const DEFAULT_PLANNER_MODEL =
  "nvidia/nemotron-3.5-lightning-30b-a3b";

const DEFAULT_REVIEW_MODEL = "openai/gpt-oss-20b";

const plannerModel =
  process.env.NVIDIA_PLANNER_MODEL ?? DEFAULT_PLANNER_MODEL;

const reviewModel =
  process.env.NVIDIA_REVIEW_MODEL ?? DEFAULT_REVIEW_MODEL;

function reviewMaxOutputTokens(model: string): number {
  return model.startsWith("openai/gpt-oss") ? 1800 : 1400;
}

/**
 * Current default runtime composition.
 *
 * Concrete provider/model selection belongs here rather than in graph nodes.
 * The graph consumes only provider-neutral role bindings.
 *
 * Provider execution hints preserve the current NVIDIA output-token and
 * transport-retry behavior. They are not portable Harness execution policy.
 */
export const defaultLlmRoleBindings: LlmRoleBindings =
  defineLlmRoleBindings({
    planner: {
      provider: nvidiaProvider,
      model: plannerModel,
      providerHints: {
        maxOutputTokens: 1800,
        transportRetries: 6,
      },
    },

    reviewer: {
      provider: nvidiaProvider,
      model: reviewModel,
      providerHints: {
        maxOutputTokens: reviewMaxOutputTokens(reviewModel),
        transportRetries: 6,
      },
    },

    refiner: {
      provider: nvidiaProvider,
      model: plannerModel,
      providerHints: {
        maxOutputTokens: 2600,
        transportRetries: 6,
      },
    },
  });
