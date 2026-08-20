import { StateGraph, START, END } from "@langchain/langgraph";

import { DevState, type DevStateType } from "./state.js";

import { inspectRepository } from "./repository/inspect.js";

import { readFile } from "./repository/tools.js";

import { callNvidiaJson } from "./providers/nvidia.js";

import {
  ExplorationSchema,
  ReviewSchema,
  RefinedSchema,
} from "./graph/schemas.js";

/**
 * ============================================================
 * MODELS
 * ============================================================
 */

const PLANNER_MODEL =
  process.env.NVIDIA_PLANNER_MODEL ?? "nvidia/nemotron-3.5-lightning-30b-a3b";

const REVIEW_MODEL = process.env.NVIDIA_REVIEW_MODEL ?? "openai/gpt-oss-20b";

import {
  knownFileContext,
  listFiles,
  normalizeRequests,
  packageContext,
  reviewFeedback,
} from "./graph/context.js";

export {
  knownFileContext,
  listFiles,
  normalizeRequests,
  packageContext,
  reviewFeedback,
} from "./graph/context.js";

import {
  buildPlannerPrompt,
  buildRefinePrompt,
  buildReviewerPrompt,
} from "./graph/prompts.js";

export {
  buildPlannerPrompt,
  buildRefinePrompt,
  buildReviewerPrompt,
} from "./graph/prompts.js";

/**
 * ============================================================
 * ANALYZE
 * ============================================================
 */

const analyzeNode = async (
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
 * PLAN — NEMOTRON
 * ============================================================
 */

const planNode = async (
  state: DevStateType,
): Promise<Partial<DevStateType>> => {
  console.log("\n🧠 PLAN — NEMOTRON");

  const attempt = state.planningAttempts + 1;

  console.log(`Planning attempt: ${attempt}/${state.maxPlanningAttempts}`);

  const prompt = buildPlannerPrompt(state);

  const result = await callNvidiaJson(
    PLANNER_MODEL,
    prompt,
    (value) => ExplorationSchema.parse(value),
    {
      maxTokens: 1800,

      maxRetries: 6,
    },
  );

  const plan = normalizeRequests(state, result.data);

  console.log(`⏱ ${result.elapsedSeconds.toFixed(1)}s`);

  console.dir(plan, {
    depth: null,
  });

  return {
    status: "planning",

    planningAttempts: attempt,

    explorationPlan: plan,

    recentlyReadFiles: [],
  };
};

/**
 * ============================================================
 * REVIEW
 * ============================================================
 */

const reviewPlanNode = async (
  state: DevStateType,
): Promise<Partial<DevStateType>> => {
  console.log(`\n🔍 REVIEW PLAN — ${REVIEW_MODEL}`);

  const plan = state.explorationPlan;

  if (!plan) {
    throw new Error("Exploration plan required.");
  }

  const prompt = buildReviewerPrompt(state);

  const reviewMaxTokens = REVIEW_MODEL.startsWith("openai/gpt-oss")
    ? 1800
    : 1400;

  const result = await callNvidiaJson(
    REVIEW_MODEL,
    prompt,
    (value) => ReviewSchema.parse(value),
    {
      maxTokens: reviewMaxTokens,

      maxRetries: 6,
    },
  );

  console.log(`⏱ ${result.elapsedSeconds.toFixed(1)}s`);

  console.dir(result.data, {
    depth: null,
  });

  return {
    status: "reviewing_plan",

    reviewAttempts: state.reviewAttempts + 1,

    planReview: result.data,
  };
};

/**
 * ============================================================
 * READ
 * ============================================================
 */

const readContextNode = async (
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

const refineNode = async (
  state: DevStateType,
): Promise<Partial<DevStateType>> => {
  console.log("\n🎯 REFINE — NEMOTRON");

  const prompt = buildRefinePrompt(state);

  const result = await callNvidiaJson(
    PLANNER_MODEL,
    prompt,
    (value) => RefinedSchema.parse(value),
    {
      maxTokens: 2600,

      maxRetries: 6,
    },
  );

  console.log(`⏱ ${result.elapsedSeconds.toFixed(1)}s`);

  console.dir(result.data, {
    depth: null,
  });

  return {
    status: "refining_plan",

    refinedPlan: result.data,
  };
};

/**
 * ============================================================
 * PLAN GATE
 * ============================================================
 */

const planGateNode = async (
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

const reportNode = async (
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

const failedNode = async (
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

import {
  afterPlanRouter,
  afterReadRouter,
  planGateRouter,
  reviewRouter,
} from "./graph/routers.js";

export {
  afterPlanRouter,
  afterReadRouter,
  planGateRouter,
  reviewRouter,
} from "./graph/routers.js";

/**
 * ============================================================
 * GRAPH
 * ============================================================
 */

export const devGraph = new StateGraph(DevState)

  .addNode("analyze", analyzeNode)

  .addNode("plan", planNode)

  .addNode("review_plan", reviewPlanNode)

  .addNode("read_context", readContextNode)

  .addNode("refine", refineNode)

  .addNode("plan_gate", planGateNode)

  .addNode("report", reportNode)

  .addNode("failed", failedNode)

  .addEdge(START, "analyze")

  .addEdge("analyze", "plan")

  .addConditionalEdges("plan", afterPlanRouter, {
    review: "review_plan",

    read: "read_context",

    failed: "failed",
  })

  .addConditionalEdges("review_plan", reviewRouter, {
    read: "read_context",

    revise: "plan",

    refine: "refine",

    failed: "failed",
  })

  .addConditionalEdges("read_context", afterReadRouter, {
    plan: "plan",

    failed: "failed",
  })

  .addEdge("refine", "plan_gate")

  .addConditionalEdges("plan_gate", planGateRouter, {
    report: "report",

    failed: "failed",
  })

  .addEdge("report", END)

  .addEdge("failed", END)

  .compile();
