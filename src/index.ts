import { runHarness } from "./app/run-harness.js";
import { createManualHarnessRunRequest } from "./intake/manual.js";

const task = `
Evoluir o Workflow Canvas do Q-Flow para uma experiência de criação semelhante ao n8n. O usuário deve poder adicionar um novo node diretamente pelo canvas através de um botão/context menu próximo ao fluxo, inserir um node entre dois nodes já conectados, e acessar ações de edge para remover ou inserir um passo. Preserve a arquitetura, @xyflow/react, modelo de draft, plugin registry e identidade visual existentes. Investigue antes de alterar.

Nesta execução faça apenas análise e planejamento.
Não modifique arquivos.
`.trim();

const request = createManualHarnessRunRequest({
  env: process.env,
  taskId: "qflow-workflow-canvas-analysis",
  request: task,
});

const result = await runHarness(request);

console.log(`\n📈 Run telemetry: ${result.persistedTelemetry.path}`);

console.log("\n========================================");

console.log("FINAL STATE");

console.log("========================================");

console.dir(result.state, {
  depth: null,
});
