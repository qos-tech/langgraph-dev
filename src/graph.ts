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

  const alreadyRead = Object.keys(state.fileContents);

  const prompt = `
Você é o PLANNER EXPLORATÓRIO de um agente autônomo de desenvolvimento.

Seu objetivo é descobrir o contexto MÍNIMO necessário antes da implementação.

TAREFA:

${state.task}

REPOSITÓRIO:

${state.repositoryPath}

ARQUIVOS EXISTENTES:

${listFiles(state)}

IMPORTANTE:

- A lista acima foi produzida deterministicamente.
- Todo caminho listado existe.
- Não invente caminhos.
- Não use wildcards.
- Não solicite diretórios.
- Solicite arquivos exatos.

PACKAGE.JSON:

${packageContext(state)}

ARQUIVOS JÁ LIDOS:

${
  alreadyRead.length > 0
    ? alreadyRead.map((file) => `- ${file}`).join("\n")
    : "Nenhum."
}

CONTEÚDO JÁ CONHECIDO:

${knownFileContext(state)}

ÚLTIMO REVIEW:

${reviewFeedback(state)}

REGRAS:

- Não implemente.
- Não escreva código.
- Não execute comandos.
- Não invente arquitetura.
- Não peça arquivo já lido.
- Solicite apenas arquivos existentes.
- Peça somente o mínimo necessário para a PRÓXIMA decisão.
- Não tente ler antecipadamente tudo que pode ser relevante no futuro.
- Prefira código diretamente ligado à mutação/fluxo atual.
- Testes são importantes quando ajudam a confirmar comportamento.
- package.json já está disponível.
- Se o reviewer pediu revise_read, corrija especificamente a seleção.
- Quando houver contexto suficiente, use needsMoreContext=false.
- Quando needsMoreContext=false, filesToRead deve ser [].
- observations devem ser fatos.
- unknowns devem ser dúvidas reais ainda não resolvidas.

Retorne SOMENTE JSON:

{
  "understanding": "...",
  "needsMoreContext": true,
  "filesToRead": [
    {
      "path": "...",
      "reason": "..."
    }
  ],
  "observations": [],
  "unknowns": []
}
`.trim();

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

  const prompt = `
Você é o REVIEWER independente do planejamento de um agente autônomo de desenvolvimento.

Você NÃO cria um plano novo.

Sua função é julgar se a próxima leitura proposta é realmente necessária e se ela é a MENOR leitura suficiente para desbloquear a próxima decisão.

TAREFA:

${state.task}

ARQUIVOS EXISTENTES:

${listFiles(state)}

PACKAGE.JSON:

${packageContext(state)}

ARQUIVOS JÁ LIDOS:

${
  Object.keys(state.fileContents).length > 0
    ? Object.keys(state.fileContents)
        .map((file) => `- ${file}`)
        .join("\n")
    : "Nenhum."
}

CONTEÚDO CONHECIDO:

${knownFileContext(state)}

PLANO DO PLANNER:

${JSON.stringify(plan, null, 2)}

VOCÊ DEVE ESCOLHER UMA DECISÃO:

"approve_read"

Use SOMENTE quando:
- ainda falta contexto;
- TODOS os arquivos em filesToRead são realmente necessários agora;
- a seleção já representa o menor conjunto suficiente para desbloquear a próxima decisão.

"revise_read"

Use quando:
- ainda falta contexto;
- MAS há arquivo desnecessário, prematuro ou excessivo na seleção;
- OU está faltando um arquivo mais diretamente relevante;
- OU o planner pediu muitos arquivos relacionados apenas "por segurança".

"enough_context"

Use quando:
- os arquivos já lidos e package.json são suficientes;
- nenhuma nova leitura é necessária;
- já é seguro produzir um plano concreto.

PRINCÍPIO CENTRAL:

NÃO aprove uma leitura apenas porque os arquivos são relacionados à tarefa.

A pergunta correta é:

"Todos estes arquivos precisam ser lidos AGORA para tomar a próxima decisão?"

Se a resposta for não, use revise_read.

PREFIRA:

- 1 a 4 arquivos diretamente relacionados

em vez de:

- muitos arquivos "potencialmente úteis".

Exemplos:

Se o planner precisa entender como o draft é mutado,
é melhor ler diretamente o hook/reducer/service responsável pela mutação
do que ler runtime, persistência, documentação e testes extensos antecipadamente.

Se o planner precisa entender como uma edge é renderizada,
prefira o componente de canvas/edge diretamente relacionado.

REGRAS:

- Não implemente.
- Não escreva código.
- Não invente requisitos.
- Não proponha dependências.
- Não escolha arquitetura final.
- Não exija arquivos por precaução.
- Testes são úteis, mas não precisam ser lidos cedo quando código-fonte suficiente já resolve a próxima dúvida.
- Runtime não deve ser lido apenas porque a alteração envolve workflows.
- Persistência não deve ser lida apenas porque há mutação local.
- Documentação extensa é secundária quando existe código diretamente relevante.
- Se recomendar outra seleção, use revise_read.
- Se a seleção atual for mínima e correta, use approve_read.
- Se não há mais leitura necessária, use enough_context.

SEMÂNTICA EXATA:

approve_read =
"Leia exatamente estes arquivos."

revise_read =
"Precisa ler, mas NÃO estes arquivos exatamente como estão."

enough_context =
"Não leia mais nenhum arquivo."

Retorne SOMENTE JSON válido:

{
  "decision": "approve_read",
  "missingEvidence": [
    {
      "area": "...",
      "reason": "..."
    }
  ],
  "issues": [
    {
      "severity": "medium",
      "type": "unnecessary_context",
      "problem": "...",
      "evidence": "...",
      "recommendation": "..."
    }
  ],
  "summary": "..."
}
`.trim();

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

  const prompt = `
Você é o ARQUITETO FINAL de uma tarefa de desenvolvimento.

A exploração terminou.

TAREFA:

${state.task}

REPOSITÓRIO:

${state.repositoryPath}

PACKAGE.JSON:

${packageContext(state)}

ARQUIVOS ANALISADOS:

${knownFileContext(state, 60_000)}

ÚLTIMO PLANO:

${JSON.stringify(state.explorationPlan, null, 2)}

ÚLTIMO REVIEW:

${JSON.stringify(state.planReview, null, 2)}

OUTCOME:

"changes_required"
- alterações reais são necessárias;
- changes >= 1;
- validation >= 1.

"already_satisfied"
- TODOS os requisitos já estão implementados;
- changes = [];
- validation deve provar comportamento;
- typecheck sozinho não basta quando existe teste relacionado.

"blocked"
- há impedimento real;
- blockingUnknowns >= 1.

REGRAS:

- Não solicite mais arquivos.
- Não escreva código.
- Não execute comandos.
- Escolha solução concreta.
- Reutilize arquitetura existente.
- Reutilize bibliotecas existentes.
- Não introduza dependência nova sem necessidade.
- Cada change deve apontar arquivo exato.
- Não invente caminhos.
- validation deve usar scripts existentes quando possível.
- Não use already_satisfied para implementação parcial.

Retorne SOMENTE JSON:

{
  "outcome": "changes_required",
  "understanding": "...",
  "changes": [
    {
      "file": "...",
      "action": "modify",
      "description": "..."
    }
  ],
  "validation": [
    {
      "command": "npm run typecheck",
      "expected": "..."
    }
  ],
  "blockingUnknowns": [],
  "nonBlockingNotes": []
}
`.trim();

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
