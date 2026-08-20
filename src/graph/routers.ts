import type { DevStateType } from "../state.js";

/**
 * ============================================================
 * ROUTERS
 * ============================================================
 */

export const afterPlanRouter = (state: DevStateType): "review" | "read" | "failed" => {
  const plan = state.explorationPlan;

  if (!plan) {
    return "failed";
  }

  if (
    state.planReview?.decision === "revise_read" &&
    plan.needsMoreContext &&
    plan.filesToRead.length > 0
  ) {
    console.log(
      "↪ Plano revisado contém arquivos válidos. Pulando review redundante e seguindo direto para READ.",
    );

    return "read";
  }

  return "review";
};

export const reviewRouter = (
  state: DevStateType,
): "read" | "revise" | "refine" | "failed" => {
  const review = state.planReview;

  const plan = state.explorationPlan;

  if (!review || !plan) {
    return "failed";
  }

  if (review.decision === "enough_context") {
    return "refine";
  }

  if (state.planningAttempts >= state.maxPlanningAttempts) {
    console.log("⚠ Máximo de planning attempts atingido.");

    return "failed";
  }

  if (review.decision === "revise_read") {
    return "revise";
  }

  if (review.decision === "approve_read") {
    if (plan.filesToRead.length === 0) {
      if (!plan.needsMoreContext) {
        console.log(
          "↪ Reviewer aprovou READ, mas não há mais arquivos válidos. Indo para REFINE.",
        );

        return "refine";
      }

      return "failed";
    }

    return "read";
  }

  return "failed";
};

export const afterReadRouter = (state: DevStateType): "plan" | "failed" => {
  if (state.status === "failed") {
    return "failed";
  }

  return "plan";
};

export const planGateRouter = (state: DevStateType): "report" | "failed" => {
  if (state.failureReason) {
    return "failed";
  }

  if (!state.refinedPlan) {
    return "failed";
  }

  return "report";
};
