import { performance } from "node:perf_hooks";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

type ReviewIssue = {
  severity: "low" | "medium" | "high" | "critical";
  type:
    | "unnecessary_context"
    | "missing_context"
    | "unsupported_assumption"
    | "architecture"
    | "dependency"
    | "validation"
    | "other";
  problem: string;
  evidence: string;
  recommendation: string;
};

type PlanReview = {
  approved: boolean;
  shouldReadMoreFiles: boolean;
  missingEvidence: string[];
  issues: ReviewIssue[];
  summary: string;
};

type NvidiaResponse = {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string;
      reasoning_content?: string;
    };
    finish_reason?: string;
  }>;

  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

/**
 * ============================================================
 * CONFIG
 * ============================================================
 */

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

const NVIDIA_BASE_URL =
  process.env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1";

const REVIEW_MODEL =
  process.env.NVIDIA_REVIEW_MODEL ?? "deepseek-ai/deepseek-v4-flash";

if (!NVIDIA_API_KEY) {
  throw new Error(
    [
      "NVIDIA_API_KEY não definida.",
      "",
      "Configure no .env:",
      "",
      "NVIDIA_API_KEY=nvapi-xxxxxxxx",
    ].join("\n"),
  );
}

/**
 * ============================================================
 * TEST FIXTURE
 * ============================================================
 *
 * Este é propositalmente o plano que o Nemotron acabou
 * de gerar e que consideramos excessivamente exploratório.
 */

const task = "Criar endpoint GET /health";

const packageJson = `
{
  "name": "langgraph",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx src/index.ts",
    "typecheck": "tsc --noEmit",
    "test:tools": "tsx src/test-tools.ts",
    "test:structured": "tsx src/test-structured.ts",
    "test:nvidia": "node --env-file=.env --import tsx src/test-nvidia-planner.ts"
  },
  "type": "module",
  "dependencies": {
    "@langchain/langgraph": "^1.4.10",
    "@langchain/ollama": "^1.3.0",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@types/node": "^26.2.0",
    "tsx": "^4.23.12",
    "typescript": "^7.0.2"
  }
}
`.trim();

const indexTs = `
import { devGraph } from "./graph.js";

const result = await devGraph.invoke({
  task: "Criar endpoint GET /health",
  repositoryPath: process.cwd(),
  fileContents: {},
  fileSummaries: {},
  recentlyReadFiles: [],
  filesChanged: [],
  attempts: 0,
  maxAttempts: 3,
  planningAttempts: 0,
  maxPlanningAttempts: 4,
  forcedPlanning: false,
  status: "pending",
});

console.log("\\n========================================");
console.log("FINAL STATE");
console.log("========================================");

console.dir(result, {
  depth: null,
});
`.trim();

const nemotronPlan = {
  understanding:
    "Determinar se o repositório possui capacidade nativa para servir endpoints HTTP GET /health ou se é necessário introduzir um servidor HTTP externo. O package.json mostra dependências de LangGraph e Ollama, mas não indica framework web. O src/index.ts invoca um grafo devGraph, sugerindo uma arquitetura orientada a agentes em vez de API web tradicional.",

  needsMoreContext: true,

  filesToRead: [
    {
      path: "src/graph.ts",
      reason:
        "Verificar a estrutura do grafo LangGraph e se ele expõe alguma rota HTTP ou se a aplicação depende exclusivamente da execução do grafo via CLI/programática.",
    },
    {
      path: "src/state.ts",
      reason:
        "Entender o modelo de estado da aplicação para determinar se um endpoint /health seria lógico dentro do fluxo de trabalho do grafo ou se requer infraestrutura externa.",
    },
    {
      path: "src/repository/tools.ts",
      reason:
        "Verificar se há ferramentas de utilidade ou funções de servidor já definidas que poderiam ser reutilizadas para um endpoint health check.",
    },
  ],

  observations: [
    "O package.json não lista nenhum framework web (express, fastify, hono, etc.) nem scripts de inicialização HTTP.",
    "O src/index.ts usa LangGraph para invocar um grafo, indicando foco em orquestração de agentes em vez de API REST.",
    "A dependência @langchain/langgraph sugere que a lógica principal reside no grafo, não em rotas HTTP tradicionais.",
  ],

  unknowns: [
    "Se o grafo LangGraph ou a arquitetura atual suporta exposição de endpoints HTTP, ou se é necessário criar um servidor separado.",
    "Se o endpoint /health deve ser um simples health check de sistema ou integrado ao estado e fluxo do grafo.",
  ],
};

/**
 * ============================================================
 * JSON EXTRACTION
 * ============================================================
 */

function extractJsonObject(content: string): string {
  const trimmed = content.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (fencedMatch?.[1]) {
    const candidate = fencedMatch[1].trim();

    if (candidate.startsWith("{") && candidate.endsWith("}")) {
      return candidate;
    }
  }

  const firstBrace = trimmed.indexOf("{");

  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new Error("Nenhum objeto JSON encontrado.");
}

/**
 * ============================================================
 * VALIDATION
 * ============================================================
 */

function validateReview(value: unknown): PlanReview {
  if (typeof value !== "object" || value === null) {
    throw new Error("Review não é um objeto.");
  }

  const candidate = value as Record<string, unknown>;

  if (typeof candidate.approved !== "boolean") {
    throw new Error("Campo approved inválido.");
  }

  if (typeof candidate.shouldReadMoreFiles !== "boolean") {
    throw new Error("Campo shouldReadMoreFiles inválido.");
  }

  if (!Array.isArray(candidate.missingEvidence)) {
    throw new Error("Campo missingEvidence inválido.");
  }

  if (!Array.isArray(candidate.issues)) {
    throw new Error("Campo issues inválido.");
  }

  if (typeof candidate.summary !== "string") {
    throw new Error("Campo summary inválido.");
  }

  const missingEvidence = candidate.missingEvidence.map((item) => {
    if (typeof item !== "string") {
      throw new Error("missingEvidence contém item inválido.");
    }

    return item;
  });

  const issues: ReviewIssue[] = candidate.issues.map((item) => {
    if (typeof item !== "object" || item === null) {
      throw new Error("Issue inválida.");
    }

    const issue = item as Record<string, unknown>;

    if (
      typeof issue.severity !== "string" ||
      typeof issue.type !== "string" ||
      typeof issue.problem !== "string" ||
      typeof issue.evidence !== "string" ||
      typeof issue.recommendation !== "string"
    ) {
      throw new Error("Campos inválidos em issue.");
    }

    const severities = ["low", "medium", "high", "critical"] as const;

    const types = [
      "unnecessary_context",
      "missing_context",
      "unsupported_assumption",
      "architecture",
      "dependency",
      "validation",
      "other",
    ] as const;

    if (!severities.includes(issue.severity as (typeof severities)[number])) {
      throw new Error(`severity inválida: ${issue.severity}`);
    }

    if (!types.includes(issue.type as (typeof types)[number])) {
      throw new Error(`type inválido: ${issue.type}`);
    }

    return {
      severity: issue.severity as ReviewIssue["severity"],

      type: issue.type as ReviewIssue["type"],

      problem: issue.problem,

      evidence: issue.evidence,

      recommendation: issue.recommendation,
    };
  });

  return {
    approved: candidate.approved,

    shouldReadMoreFiles: candidate.shouldReadMoreFiles,

    missingEvidence,

    issues,

    summary: candidate.summary,
  };
}

/**
 * ============================================================
 * DEEPSEEK CLIENT
 * ============================================================
 */

async function reviewPlan(): Promise<{
  review: PlanReview;
  elapsedSeconds: number;
  usage: NvidiaResponse["usage"];
}> {
  const prompt = `
Você é o REVIEWER de planejamento de um agente autônomo de desenvolvimento.

Seu trabalho NÃO é criar um novo plano.

Seu trabalho é revisar criticamente o plano produzido por outro modelo e decidir se ele está tentando obter contexto realmente necessário ou se está explorando arquivos desnecessariamente.

TAREFA ORIGINAL:

${task}

EVIDÊNCIA JÁ DISPONÍVEL:

### package.json

${packageJson}

### src/index.ts

${indexTs}

PLANO PROPOSTO PELO PLANNER:

${JSON.stringify(nemotronPlan, null, 2)}

CRITÉRIOS DE REVISÃO:

1. Avalie SOMENTE se o plano tem evidência suficiente para avançar.
2. Não invente requisitos que não existem.
3. Não exija leitura de arquivos só por precaução.
4. A ausência de framework HTTP em package.json é evidência válida.
5. A ausência de servidor HTTP em src/index.ts é evidência válida.
6. Não é necessário ler src/graph.ts apenas para aprender como LangGraph funciona.
7. Não é necessário ler src/state.ts se GET /health puder ser independente do estado do grafo.
8. Não é necessário ler repository/tools.ts se ele não participa do runtime HTTP.
9. Se package.json + src/index.ts já forem suficientes para concluir que não existe servidor HTTP e que será necessário introduzir um, shouldReadMoreFiles deve ser false.
10. Não refaça o plano inteiro.
11. Não escreva código.
12. Não faça sugestões genéricas.
13. Toda issue deve apontar evidência concreta.
14. approved=false NÃO implica automaticamente shouldReadMoreFiles=true.
15. Um plano pode ser reprovado justamente porque está pedindo arquivos demais.

INTERPRETAÇÃO DOS CAMPOS:

approved:
- true = o comportamento do planner está adequado e pode seguir.
- false = existe um problema relevante no plano.

shouldReadMoreFiles:
- true = falta evidência concreta e algum arquivo adicional é realmente necessário.
- false = já existe evidência suficiente para encerrar exploração.

missingEvidence:
- liste somente fatos que realmente precisam ser obtidos antes de avançar.
- se nada bloquear o avanço, retorne [].

issues:
- liste problemas concretos do plano.

severity:
- low
- medium
- high
- critical

type:
- unnecessary_context
- missing_context
- unsupported_assumption
- architecture
- dependency
- validation
- other

FORMATO DE SAÍDA:

Retorne SOMENTE JSON válido.

Não use Markdown.
Não use bloco de código.
Não exponha reasoning.
Não escreva texto antes ou depois do JSON.

Formato exato:

{
  "approved": false,
  "shouldReadMoreFiles": false,
  "missingEvidence": [],
  "issues": [
    {
      "severity": "high",
      "type": "unnecessary_context",
      "problem": "descrição",
      "evidence": "evidência concreta",
      "recommendation": "ação recomendada"
    }
  ],
  "summary": "resumo curto da decisão"
}
`.trim();

  const startedAt = performance.now();

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${NVIDIA_API_KEY}`,

      "Content-Type": "application/json",

      Accept: "application/json",
    },

    body: JSON.stringify({
      model: REVIEW_MODEL,

      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],

      /**
       * A documentação NVIDIA do
       * DeepSeek V4 Flash expõe:
       *
       * none
       * high
       * max
       *
       * Para reviewer rápido queremos
       * reasoning desligado.
       */
      //   reasoning_effort: "none",

      temperature: 0,

      max_tokens: 1200,

      stream: false,
    }),
  });

  const elapsedSeconds = (performance.now() - startedAt) / 1000;

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(
      [`NVIDIA API retornou HTTP ${response.status}.`, "", raw].join("\n"),
    );
  }

  let payload: NvidiaResponse;

  try {
    payload = JSON.parse(raw) as NvidiaResponse;
  } catch {
    throw new Error(["Resposta HTTP não é JSON.", "", raw].join("\n"));
  }

  const message = payload.choices?.[0]?.message;

  const content = message?.content;

  if (typeof content !== "string") {
    console.dir(payload, {
      depth: null,
    });

    throw new Error("DeepSeek não retornou message.content.");
  }

  let parsed: unknown;

  try {
    const json = extractJsonObject(content);

    parsed = JSON.parse(json);
  } catch (error) {
    throw new Error(
      [
        "Não foi possível extrair JSON válido.",
        "",
        `Erro: ${error instanceof Error ? error.message : String(error)}`,
        "",
        "CONTENT:",
        content,
        "",
        "REASONING_CONTENT:",
        message?.reasoning_content ?? "(não retornado)",
      ].join("\n"),
    );
  }

  return {
    review: validateReview(parsed),

    elapsedSeconds,

    usage: payload.usage,
  };
}

/**
 * ============================================================
 * MAIN
 * ============================================================
 */

async function main(): Promise<void> {
  console.log("========================================");

  console.log("NVIDIA PLAN REVIEW BENCHMARK");

  console.log("========================================");

  console.log(`Planner: nvidia/nemotron-3.5-lightning-30b-a3b`);

  console.log(`Reviewer: ${REVIEW_MODEL}`);

  console.log(`Endpoint: ${NVIDIA_BASE_URL}`);

  console.log("\n📋 PLAN TO REVIEW");

  console.dir(nemotronPlan, {
    depth: null,
  });

  console.log("\n🔍 DEEPSEEK REVIEW");

  const result = await reviewPlan();

  console.log(`⏱ Review: ${result.elapsedSeconds.toFixed(1)}s`);

  console.log("\n--- REVIEW ---");

  console.dir(result.review, {
    depth: null,
  });

  console.log("\nUsage:", result.usage ?? "(não retornado)");

  console.log("\n========================================");

  console.log("QUALITY SIGNALS");

  console.log("========================================");

  if (result.review.approved === false) {
    console.log("✅ Reviewer identificou problema no plano.");
  } else {
    console.log("⚠️ Reviewer aprovou o plano sem ressalvas.");
  }

  if (result.review.shouldReadMoreFiles === false) {
    console.log("✅ Reviewer concluiu que não é necessário ler mais arquivos.");
  } else {
    console.log("⚠️ Reviewer quer mais contexto.");
  }

  const unnecessaryContextIssue = result.review.issues.some(
    (issue) => issue.type === "unnecessary_context",
  );

  if (unnecessaryContextIssue) {
    console.log("✅ Reviewer detectou exploração desnecessária.");
  } else {
    console.log("⚠️ Reviewer não marcou unnecessary_context.");
  }

  if (result.review.missingEvidence.length === 0) {
    console.log("✅ Nenhuma evidência bloqueante adicional.");
  } else {
    console.log("⚠️ Missing evidence:");

    for (const item of result.review.missingEvidence) {
      console.log(`   - ${item}`);
    }
  }

  console.log("\n========================================");
}

await main();
