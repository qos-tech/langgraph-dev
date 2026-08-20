import { devGraph } from "./graph.js";

const repositoryPath = process.env.TARGET_REPOSITORY;

if (!repositoryPath) {
  throw new Error("TARGET_REPOSITORY não definido.");
}

const task = `
Evoluir o Workflow Canvas do Q-Flow para uma experiência de criação semelhante ao n8n. O usuário deve poder adicionar um novo node diretamente pelo canvas através de um botão/context menu próximo ao fluxo, inserir um node entre dois nodes já conectados, e acessar ações de edge para remover ou inserir um passo. Preserve a arquitetura, @xyflow/react, modelo de draft, plugin registry e identidade visual existentes. Investigue antes de alterar.

Nesta execução faça apenas análise e planejamento.
Não modifique arquivos.
`.trim();

const result = await devGraph.invoke({
  task,
  repositoryPath,

  fileContents: {},
  fileSummaries: {},
  recentlyReadFiles: [],

  filesChanged: [],

  attempts: 0,
  maxAttempts: 3,

  planningAttempts: 0,
  reviewAttempts: 0,

  maxPlanningAttempts: Number(process.env.MAX_PLANNING_ATTEMPTS ?? 4),

  failureReason: undefined,

  status: "pending",
});

console.log("\n========================================");

console.log("FINAL STATE");

console.log("========================================");

console.dir(result, {
  depth: null,
});
