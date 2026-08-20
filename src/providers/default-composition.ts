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

function reviewMaxTokens(model: string): number {
  return model.startsWith("openai/gpt-oss") ? 1800 : 1400;
}

/**
 * Current runtime composition.
 *
 * This module is the only Step-5 location that knows the concrete provider
 * used by the planner/reviewer/refiner roles. Graph nodes remain unchanged
 * until Step 6.
 *
 * The duplicated model/token settings intentionally mirror the current nodes
 * during this transitional step. Step 6 removes the node-local copies after
 * the composition has been characterized.
 */
export const defaultLlmRoleBindings: LlmRoleBindings =
  defineLlmRoleBindings({
    planner: {
      provider: nvidiaProvider,
      model: plannerModel,
      maxTokens: 1800,
      maxRetries: 6,
    },

    reviewer: {
      provider: nvidiaProvider,
      model: reviewModel,
      maxTokens: reviewMaxTokens(reviewModel),
      maxRetries: 6,
    },

    refiner: {
      provider: nvidiaProvider,
      model: plannerModel,
      maxTokens: 2600,
      maxRetries: 6,
    },
  });
