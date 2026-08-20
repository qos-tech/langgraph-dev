import { ChatOllama } from "@langchain/ollama";

import { z } from "zod";

const PlannerFileRequestSchema = z.object({
  path: z.string(),

  reason: z.string(),
});

const TestSchema = z.object({
  understanding: z.string(),

  needsMoreContext: z.boolean(),

  filesToRead: z.array(PlannerFileRequestSchema),
});

const model = new ChatOllama({
  model: process.env.OLLAMA_MODEL ?? "gpt-oss:20b",

  baseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",

  temperature: 0,

  numCtx: 4096,

  keepAlive: "30m",
});

const structured = model.withStructuredOutput(TestSchema);

const prompt = `
Você é o planner de um agente de desenvolvimento.

TAREFA:

Criar endpoint GET /health.

ARQUIVOS EXISTENTES:

- src/index.ts
- package.json
- src/graph.ts
- src/state.ts

Nenhum arquivo foi lido ainda.

Decida se precisa ler algum arquivo antes de planejar a implementação.

Não escreva código.
Não invente arquivos.
`.trim();

console.log(`Modelo: ${process.env.OLLAMA_MODEL ?? "gpt-oss:20b"}`);

const startedAt = performance.now();

try {
  const result = await structured.invoke(prompt);

  const elapsed = (performance.now() - startedAt) / 1000;

  console.log(`\n⏱ Structured output: ${elapsed.toFixed(1)}s`);

  console.log("\nRESULT:");

  console.dir(result, {
    depth: null,
  });
} catch (error) {
  const elapsed = (performance.now() - startedAt) / 1000;

  console.log(`\n❌ Structured output failed after ${elapsed.toFixed(1)}s`);

  console.error(error);

  process.exitCode = 1;
}
