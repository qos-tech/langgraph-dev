import fs from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

type PlannerFileRequest = {
  path: string;
  reason: string;
};

type ExplorationPlan = {
  understanding: string;
  needsMoreContext: boolean;
  filesToRead: PlannerFileRequest[];
  observations: string[];
  unknowns: string[];
};

type NvidiaUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
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
  usage?: NvidiaUsage;
};

/**
 * ============================================================
 * CONFIG
 * ============================================================
 */

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

const NVIDIA_MODEL =
  process.env.NVIDIA_MODEL ?? "nvidia/nemotron-3.5-lightning-30b-a3b";

const NVIDIA_BASE_URL =
  process.env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1";

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

const repositoryPath = process.cwd();

/**
 * Neste benchmark estamos fornecendo explicitamente
 * a lista de arquivos existentes.
 *
 * Depois podemos substituir isso pelo nosso
 * repository inspector.
 */
const repositoryFiles = [
  "package.json",
  "src/index.ts",
  "src/graph.ts",
  "src/state.ts",
  "src/repository/inspect.ts",
  "src/repository/tools.ts",
  "src/test-tools.ts",
  "tsconfig.json",
];

/**
 * ============================================================
 * JSON EXTRACTION
 * ============================================================
 */

/**
 * Alguns modelos podem retornar:
 *
 * 1. JSON puro
 *
 * {
 *   ...
 * }
 *
 * 2. Markdown
 *
 * ```json
 * {
 *   ...
 * }
 * ```
 *
 * 3. Reasoning + JSON
 *
 * Thinking...
 * ...
 *
 * {
 *   ...
 * }
 *
 * Este helper tenta lidar com esses três casos.
 */
function extractJsonObject(content: string): string {
  const trimmed = content.trim();

  /**
   * Caso ideal:
   * JSON puro.
   */
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  /**
   * JSON dentro de fenced block.
   */
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (fencedMatch?.[1]) {
    const candidate = fencedMatch[1].trim();

    if (candidate.startsWith("{") && candidate.endsWith("}")) {
      return candidate;
    }
  }

  /**
   * Fallback:
   *
   * tenta localizar um objeto JSON no meio
   * de texto adicional.
   */
  const firstBrace = trimmed.indexOf("{");

  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new Error("Nenhum objeto JSON encontrado na resposta.");
}

/**
 * ============================================================
 * PLAN VALIDATION
 * ============================================================
 */

/**
 * Não estamos usando Zod neste benchmark de propósito.
 *
 * Queremos testar primeiro o comportamento cru
 * da API NVIDIA sem envolver LangChain ou parsers
 * externos.
 */
function validatePlan(value: unknown): ExplorationPlan {
  if (typeof value !== "object" || value === null) {
    throw new Error("Planner não retornou um objeto.");
  }

  const candidate = value as Record<string, unknown>;

  if (typeof candidate.understanding !== "string") {
    throw new Error("Campo understanding inválido.");
  }

  if (typeof candidate.needsMoreContext !== "boolean") {
    throw new Error("Campo needsMoreContext inválido.");
  }

  if (!Array.isArray(candidate.filesToRead)) {
    throw new Error("Campo filesToRead inválido.");
  }

  if (!Array.isArray(candidate.observations)) {
    throw new Error("Campo observations inválido.");
  }

  if (!Array.isArray(candidate.unknowns)) {
    throw new Error("Campo unknowns inválido.");
  }

  const filesToRead: PlannerFileRequest[] = [];

  for (const item of candidate.filesToRead) {
    if (typeof item !== "object" || item === null) {
      throw new Error("Item inválido em filesToRead.");
    }

    const file = item as Record<string, unknown>;

    if (typeof file.path !== "string" || typeof file.reason !== "string") {
      throw new Error("Item de filesToRead precisa de path e reason.");
    }

    filesToRead.push({
      path: file.path,
      reason: file.reason,
    });
  }

  const observations = candidate.observations.map((item) => {
    if (typeof item !== "string") {
      throw new Error("Item inválido em observations.");
    }

    return item;
  });

  const unknowns = candidate.unknowns.map((item) => {
    if (typeof item !== "string") {
      throw new Error("Item inválido em unknowns.");
    }

    return item;
  });

  return {
    understanding: candidate.understanding,

    needsMoreContext: candidate.needsMoreContext,

    filesToRead,

    observations,

    unknowns,
  };
}

/**
 * ============================================================
 * NVIDIA CLIENT
 * ============================================================
 */

async function callPlanner(prompt: string): Promise<{
  plan: ExplorationPlan;
  elapsedSeconds: number;
  usage: NvidiaUsage | undefined;
  rawContent: string;
  reasoningContent: string | undefined;
}> {
  const startedAt = performance.now();

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${NVIDIA_API_KEY}`,

      "Content-Type": "application/json",

      Accept: "application/json",
    },

    body: JSON.stringify({
      model: NVIDIA_MODEL,

      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],

      temperature: 0,

      max_tokens: 1200,

      stream: false,

      chat_template_kwargs: {
        thinking: false,
      },
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
    throw new Error(
      ["Resposta HTTP da NVIDIA não é JSON.", "", raw].join("\n"),
    );
  }

  const message = payload.choices?.[0]?.message;

  const content = message?.content;

  if (typeof content !== "string") {
    console.dir(payload, {
      depth: null,
    });

    throw new Error("NVIDIA não retornou message.content.");
  }

  let parsed: unknown;

  try {
    const json = extractJsonObject(content);

    parsed = JSON.parse(json);
  } catch (error) {
    throw new Error(
      [
        "Não foi possível extrair JSON válido da resposta.",
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

  const plan = validatePlan(parsed);

  return {
    plan,
    elapsedSeconds,
    usage: payload.usage,
    rawContent: content,
    reasoningContent: message?.reasoning_content,
  };
}

/**
 * ============================================================
 * PROMPT
 * ============================================================
 */

function buildBasePrompt(): string {
  return `
Você é o PLANNER EXPLORATÓRIO de um agente autônomo de desenvolvimento.

Seu trabalho é descobrir o contexto mínimo necessário para planejar uma alteração em um repositório real.

Você NÃO implementa código nesta etapa.

TAREFA:

Criar endpoint GET /health.

REPOSITÓRIO:

${repositoryPath}

ARQUIVOS EXISTENTES:

${repositoryFiles.map((file) => `- ${file}`).join("\n")}

REGRAS:

- Não escreva código.
- Não implemente nada.
- Não execute comandos.
- Não invente arquivos.
- Não invente arquitetura existente.
- Não invente frameworks ou dependências.
- Só solicite arquivos presentes na lista ARQUIVOS EXISTENTES.
- Solicite apenas o mínimo necessário para decidir como implementar a tarefa.
- Não solicite arquivos apenas porque podem ser interessantes.
- A ausência de servidor HTTP, framework web ou sistema de rotas é uma evidência válida.
- Não procure indefinidamente por uma arquitetura que pode não existir.
- Se já houver contexto suficiente para escolher uma solução concreta, needsMoreContext deve ser false.
- Se precisar ler arquivos adicionais, needsMoreContext deve ser true.
- Quando needsMoreContext for true, filesToRead deve conter somente os arquivos realmente necessários.
- Quando needsMoreContext for false, filesToRead deve ser [].
- observations deve conter somente fatos sustentados pelas informações fornecidas.
- unknowns deve conter somente dúvidas que realmente dependem de evidência adicional.
- Não transforme unknowns em uma lista de possibilidades genéricas.

IMPORTANTE SOBRE AUSÊNCIA DE EVIDÊNCIA:

Se package.json mostrar que não existe framework HTTP e o entry point mostrar que não existe servidor HTTP, isso pode ser contexto suficiente para concluir que será necessário introduzir uma implementação HTTP.

Não continue lendo arquivos não relacionados apenas para confirmar novamente essa ausência.

FORMATO DE SAÍDA OBRIGATÓRIO:

Retorne SOMENTE um objeto JSON válido.

Não use Markdown.
Não use bloco de código.
Não escreva explicações antes do JSON.
Não escreva explicações depois do JSON.
Não escreva "thinking".
Não escreva "thinking process".
Não exponha seu processo de raciocínio.

O objeto deve possuir EXATAMENTE esta estrutura:

{
  "understanding": "descrição objetiva do que precisa ser descoberto ou feito",
  "needsMoreContext": true,
  "filesToRead": [
    {
      "path": "caminho exato presente em ARQUIVOS EXISTENTES",
      "reason": "motivo concreto para ler este arquivo"
    }
  ],
  "observations": [
    "fato observável"
  ],
  "unknowns": [
    "informação realmente necessária que ainda não está disponível"
  ]
}
`.trim();
}

/**
 * ============================================================
 * FILE READING
 * ============================================================
 */

async function readRepositoryFile(relativePath: string): Promise<string> {
  if (!repositoryFiles.includes(relativePath)) {
    throw new Error(`Planner solicitou arquivo fora da lista: ${relativePath}`);
  }

  const absolutePath = path.join(repositoryPath, relativePath);

  return fs.readFile(absolutePath, "utf8");
}

/**
 * ============================================================
 * MAIN BENCHMARK
 * ============================================================
 */

async function main(): Promise<void> {
  console.log("========================================");

  console.log("NVIDIA PLANNER BENCHMARK");

  console.log("========================================");

  console.log(`Model: ${NVIDIA_MODEL}`);

  console.log(`Endpoint: ${NVIDIA_BASE_URL}`);

  /**
   * ========================================================
   * PLAN #1
   * ========================================================
   */

  console.log("\n🧠 NVIDIA PLAN #1");

  const firstPrompt = `
${buildBasePrompt()}

ESTADO ATUAL:

Nenhum arquivo foi lido ainda.

Decida quais são os MENORES arquivos necessários para começar a investigar a tarefa.
`.trim();

  const first = await callPlanner(firstPrompt);

  console.log(`⏱ Plan #1: ${first.elapsedSeconds.toFixed(1)}s`);

  console.log("\n--- PLAN #1 ---");

  console.dir(first.plan, {
    depth: null,
  });

  console.log("\nUsage:", first.usage ?? "(não retornado)");

  const firstRequested = first.plan.filesToRead.map((item) => item.path);

  console.log(
    "\nArquivos solicitados:",
    firstRequested.length > 0 ? firstRequested : "nenhum",
  );

  /**
   * ========================================================
   * CONTEXT FOR PLAN #2
   * ========================================================
   *
   * Para manter o benchmark comparável com nossos testes
   * anteriores, vamos fornecer src/index.ts + package.json.
   *
   * Mesmo se o modelo pedir somente um deles, queremos testar
   * especificamente se ESSES DOIS são suficientes para fazê-lo
   * convergir.
   */

  const secondPlanFiles = ["src/index.ts", "package.json"];

  const contextParts: string[] = [];

  console.log("\n📖 READ CONTEXT");

  for (const file of secondPlanFiles) {
    console.log(`📄 ${file}`);

    const content = await readRepositoryFile(file);

    console.log(`   ${content.length} chars`);

    contextParts.push(
      [`### FILE: ${file}`, content, `### END FILE: ${file}`].join("\n"),
    );
  }

  /**
   * ========================================================
   * PLAN #2
   * ========================================================
   */

  console.log("\n🧠 NVIDIA PLAN #2");

  const secondPrompt = `
${buildBasePrompt()}

ARQUIVOS JÁ LIDOS:

- src/index.ts
- package.json

CONTEÚDO DOS ARQUIVOS:

${contextParts.join("\n\n")}

REGRAS ADICIONAIS PARA ESTA RODADA:

- Não solicite novamente src/index.ts.
- Não solicite novamente package.json.
- package.json é evidência das dependências instaladas.
- src/index.ts é evidência de como a aplicação é inicializada atualmente.
- Se esses dois arquivos demonstrarem que não existe servidor HTTP ou framework web, trate essa ausência como evidência suficiente.
- Não solicite src/graph.ts apenas para entender LangGraph se a implementação de GET /health não depender do grafo.
- Não solicite src/state.ts apenas para entender estado se o endpoint não depender desse estado.
- Não solicite arquivos de repository tooling se eles não participarem da execução HTTP.
- Só solicite outro arquivo se o conteúdo desse arquivo for NECESSÁRIO para decidir concretamente como implementar GET /health.
- Se já for possível decidir uma implementação concreta, needsMoreContext deve ser false.
`.trim();

  const second = await callPlanner(secondPrompt);

  console.log(`⏱ Plan #2: ${second.elapsedSeconds.toFixed(1)}s`);

  console.log("\n--- PLAN #2 ---");

  console.dir(second.plan, {
    depth: null,
  });

  console.log("\nUsage:", second.usage ?? "(não retornado)");

  /**
   * ========================================================
   * BENCHMARK RESULT
   * ========================================================
   */

  const totalSeconds = first.elapsedSeconds + second.elapsedSeconds;

  console.log("\n========================================");

  console.log("BENCHMARK RESULT");

  console.log("========================================");

  console.log(`Model: ${NVIDIA_MODEL}`);

  console.log(`Plan #1: ${first.elapsedSeconds.toFixed(1)}s`);

  console.log(`Plan #2: ${second.elapsedSeconds.toFixed(1)}s`);

  console.log(`Total LLM: ${totalSeconds.toFixed(1)}s`);

  console.log("");

  console.log(`Plan #1 needsMoreContext: ${first.plan.needsMoreContext}`);

  console.log(
    `Plan #1 files: ${
      first.plan.filesToRead.map((item) => item.path).join(", ") || "nenhum"
    }`,
  );

  console.log("");

  console.log(`Plan #2 needsMoreContext: ${second.plan.needsMoreContext}`);

  console.log(
    `Plan #2 files: ${
      second.plan.filesToRead.map((item) => item.path).join(", ") || "nenhum"
    }`,
  );

  /**
   * ========================================================
   * SIMPLE QUALITY SIGNALS
   * ========================================================
   */

  console.log("\n--- QUALITY SIGNALS ---");

  const idealFirstFiles = ["src/index.ts", "package.json"];

  const unnecessaryFirstFiles = first.plan.filesToRead.filter(
    (item) => !idealFirstFiles.includes(item.path),
  );

  if (unnecessaryFirstFiles.length === 0) {
    console.log("✅ PLAN #1 não pediu arquivos claramente desnecessários.");
  } else {
    console.log("⚠️ PLAN #1 pediu arquivos adicionais:");

    for (const item of unnecessaryFirstFiles) {
      console.log(`   - ${item.path}`);
    }
  }

  if (
    second.plan.needsMoreContext === false &&
    second.plan.filesToRead.length === 0
  ) {
    console.log("✅ PLAN #2 convergiu sem solicitar mais contexto.");
  } else {
    console.log("⚠️ PLAN #2 ainda solicitou contexto.");

    for (const item of second.plan.filesToRead) {
      console.log(`   - ${item.path}: ${item.reason}`);
    }
  }

  console.log("\n========================================");
}

await main();
