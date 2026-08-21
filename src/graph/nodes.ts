import type { DevStateType } from "../state.js";

import type { LlmRuntimeConfig } from "../providers/runtime-composition.js";
import { resolveLlmRoleRuntime } from "../providers/runtime-composition.js";

import { inspectRepository } from "../repository/inspect.js";

import { readFile } from "../repository/tools.js";

import {
  ExplorationSchema,
  ReviewSchema,
  RefinedSchema,
} from "./schemas.js";

import { normalizeRequests } from "./context.js";

import {
  buildPlannerPrompt,
  buildRefinePrompt,
  buildReviewerPrompt,
} from "./prompts.js";

/**
 * ============================================================
 * ANALYZE
 * ============================================================
 */

export const analyzeNode = async (
  state: DevStateType,
): Promise<Partial<DevStateType>> => {
  console.log("\n🔎 ANALYZE");

  console.log(`Task: ${state.task}`);

  console.log(`Repository: ${state.repositoryPath}`);

  const repository = await inspectRepository(state.repositoryPath);

  console.log(`Files: ${repository.files.length}`);

  console.log(`Git: ${repository.gitStatus ?? "clean"}`);

  return {
    status: "analyzing",

    repositoryContext: repository,

    analysis: [
      `Repository: ${repository.path}`,
      `Files: ${repository.files.length}`,
      `Git: ${repository.gitStatus ?? "clean"}`,
    ].join("\n"),
  };
};

/**
 * ============================================================
 * PLAN
 * ============================================================
 */

function createPlanNode(llmRuntimeConfig: LlmRuntimeConfig) {
  return async (
    state: DevStateType,
  ): Promise<Partial<DevStateType>> => {
    const binding = resolveLlmRoleRuntime(llmRuntimeConfig, "planner");

    console.log(`\n🧠 PLAN — ${binding.model}`);

    const attempt = state.planningAttempts + 1;

    console.log(`Planning attempt: ${attempt}/${state.maxPlanningAttempts}`);

    const prompt = buildPlannerPrompt(state);

    const result = await binding.provider.generateStructured({
      model: binding.model,
      prompt,
      validate: (value) => ExplorationSchema.parse(value),
      ...(binding.providerHints
        ? {
            providerHints: binding.providerHints,
          }
        : {}),
    });

    const plan = normalizeRequests(state, result.data);

    console.log(`⏱ ${result.elapsedSeconds.toFixed(1)}s`);

    console.dir(plan, { depth: null });

    return {
      status: "planning",
      planningAttempts: attempt,
      explorationPlan: plan,
      recentlyReadFiles: [],
    };
  };
}

/**
 * ============================================================
 * REVIEW
 * ============================================================
 */

function createReviewPlanNode(llmRuntimeConfig: LlmRuntimeConfig) {
  return async (
    state: DevStateType,
  ): Promise<Partial<DevStateType>> => {
    const binding = resolveLlmRoleRuntime(llmRuntimeConfig, "reviewer");

    console.log(`\n🔍 REVIEW PLAN — ${binding.model}`);

    const plan = state.explorationPlan;

    if (!plan) {
      throw new Error("Exploration plan required.");
    }

    const prompt = buildReviewerPrompt(state);

    const result = await binding.provider.generateStructured({
      model: binding.model,
      prompt,
      validate: (value) => ReviewSchema.parse(value),
      ...(binding.providerHints
        ? {
            providerHints: binding.providerHints,
          }
        : {}),
    });

    console.log(`⏱ ${result.elapsedSeconds.toFixed(1)}s`);

    console.dir(result.data, { depth: null });

    return {
      status: "reviewing_plan",
      reviewAttempts: state.reviewAttempts + 1,
      planReview: result.data,
    };
  };
}

/**
 * ============================================================
 * READ
 * ============================================================
 */

export const readContextNode = async (
  state: DevStateType,
): Promise<Partial<DevStateType>> => {
  console.log("\n📖 READ CONTEXT");

  const plan = state.explorationPlan;

  if (!plan) {
    throw new Error("Exploration plan required.");
  }

  if (plan.filesToRead.length === 0) {
    return {
      status: "failed",

      failureReason: "READ chamado sem arquivos válidos.",
    };
  }

  const contents = {
    ...state.fileContents,
  };

  const recentlyRead: string[] = [];

  for (const request of plan.filesToRead) {
    console.log(`📄 ${request.path}`);

    console.log(`   ${request.reason}`);

    try {
      const content = await readFile(state.repositoryPath, request.path);

      contents[request.path] = content;

      recentlyRead.push(request.path);

      console.log(`✅ ${content.length} chars`);
    } catch (error) {
      console.log(
        `❌ Falha ao ler ${request.path}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  if (recentlyRead.length === 0) {
    return {
      status: "failed",

      failureReason:
        "READ não conseguiu carregar nenhum dos arquivos aprovados.",
    };
  }

  const consumedRevisedRead = state.planReview?.decision === "revise_read";

  return {
    status: "reading_context",

    fileContents: contents,

    recentlyReadFiles: recentlyRead,

    ...(consumedRevisedRead
      ? {
          planReview: {
            decision: "approve_read" as const,

            missingEvidence: [],

            issues: [],

            summary:
              "Seleção revisada foi consumida e os arquivos foram lidos. O próximo planejamento deve passar novamente pelo reviewer.",
          },
        }
      : {}),
  };
};

/**
 * ============================================================
 * REFINE
 * ============================================================
 */

function createRefineNode(llmRuntimeConfig: LlmRuntimeConfig) {
  return async (
    state: DevStateType,
  ): Promise<Partial<DevStateType>> => {
    const binding = resolveLlmRoleRuntime(llmRuntimeConfig, "refiner");

    console.log(`\n🎯 REFINE — ${binding.model}`);

    const prompt = buildRefinePrompt(state);

    const result = await binding.provider.generateStructured({
      model: binding.model,
      prompt,
      validate: (value) => RefinedSchema.parse(value),
      ...(binding.providerHints
        ? {
            providerHints: binding.providerHints,
          }
        : {}),
    });

    console.log(`⏱ ${result.elapsedSeconds.toFixed(1)}s`);

    console.dir(result.data, { depth: null });

    return {
      status: "refining_plan",
      refinedPlan: result.data,
    };
  };
}

/**
 * ============================================================
 * PLAN GATE
 * ============================================================
 */

export const planGateNode = async (
  state: DevStateType,
): Promise<Partial<DevStateType>> => {
  console.log("\n🚦 PLAN GATE");

  const plan = state.refinedPlan;

  if (!plan) {
    return {
      status: "checking_plan",

      failureReason: "Refined plan ausente.",
    };
  }

  if (plan.outcome === "blocked") {
    if (plan.blockingUnknowns.length === 0) {
      return {
        status: "checking_plan",

        failureReason: "Plano blocked sem blockingUnknowns.",
      };
    }

    return {
      status: "checking_plan",

      failureReason: plan.blockingUnknowns.join("; "),
    };
  }

  if (plan.outcome === "already_satisfied") {
    if (plan.changes.length > 0) {
      return {
        status: "checking_plan",

        failureReason: "already_satisfied não pode possuir changes.",
      };
    }

    if (plan.blockingUnknowns.length > 0) {
      return {
        status: "checking_plan",

        failureReason: "already_satisfied não pode possuir blockingUnknowns.",
      };
    }

    if (plan.validation.length === 0) {
      return {
        status: "checking_plan",

        failureReason: "already_satisfied precisa possuir validação.",
      };
    }

    const analyzedTestFiles = Object.keys(state.fileContents).filter(
      (file) => file.includes(".test.") || file.includes(".spec."),
    );

    const hasBehavioralValidation = plan.validation.some((step) => {
      const command = step.command.toLowerCase();

      return (
        command.includes("vitest") ||
        command.includes("jest") ||
        command.includes("playwright") ||
        command.includes("npm test") ||
        command.includes("npm run test") ||
        command.includes("pnpm test") ||
        command.includes("yarn test")
      );
    });

    if (analyzedTestFiles.length > 0 && !hasBehavioralValidation) {
      return {
        status: "checking_plan",

        failureReason: [
          "already_satisfied possui testes analisados,",
          "mas nenhuma validação comportamental foi proposta.",
          `Testes: ${analyzedTestFiles.join(", ")}`,
        ].join(" "),
      };
    }

    console.log("✅ Tarefa já satisfeita pelo código atual.");

    return {
      status: "checking_plan",

      failureReason: undefined,
    };
  }

  if (plan.outcome === "changes_required") {
    if (plan.blockingUnknowns.length > 0) {
      return {
        status: "checking_plan",

        failureReason: "changes_required possui blockingUnknowns.",
      };
    }

    if (plan.changes.length === 0) {
      return {
        status: "checking_plan",

        failureReason: "changes_required sem changes.",
      };
    }

    if (plan.validation.length === 0) {
      return {
        status: "checking_plan",

        failureReason: "changes_required sem validation.",
      };
    }

    console.log(
      `✅ Plano aprovado: ${plan.changes.length} alteração(ões), ${plan.validation.length} validação(ões).`,
    );

    return {
      status: "checking_plan",

      failureReason: undefined,
    };
  }

  return {
    status: "checking_plan",

    failureReason: "Outcome desconhecido.",
  };
};

/**
 * ============================================================
 * REPORT / FAILED
 * ============================================================
 */

export const reportNode = async (
  state: DevStateType,
): Promise<Partial<DevStateType>> => {
  console.log("\n📋 PLANNING REPORT");

  console.log(`Plan calls: ${state.planningAttempts}`);

  console.log(`Reviews: ${state.reviewAttempts}`);

  console.log(`Files read: ${Object.keys(state.fileContents).length}`);

  console.log("\nFINAL PLAN:");

  console.dir(state.refinedPlan, {
    depth: null,
  });

  return {
    status: "completed",
  };
};

export const failedNode = async (
  state: DevStateType,
): Promise<Partial<DevStateType>> => {
  console.log("\n💥 FAILED");

  console.log(`Reason: ${state.failureReason ?? "unknown"}`);

  console.log(
    `Planning attempts: ${state.planningAttempts}/${state.maxPlanningAttempts}`,
  );

  console.log(`Review attempts: ${state.reviewAttempts}`);

  console.log(`Files read: ${Object.keys(state.fileContents).length}`);

  return {
    status: "failed",
  };
};

/**
 * ============================================================
 * NODE FACTORY
 * ============================================================
 */

export function createGraphNodes(llmRuntimeConfig: LlmRuntimeConfig) {
  return {
    analyzeNode,
    planNode: createPlanNode(llmRuntimeConfig),
    reviewPlanNode: createReviewPlanNode(llmRuntimeConfig),
    readContextNode,
    refineNode: createRefineNode(llmRuntimeConfig),
    planGateNode,
    reportNode,
    failedNode,
  };
}
