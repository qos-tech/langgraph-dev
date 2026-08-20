import type { DevStateType } from "../state.js";
import type { Exploration } from "./schemas.js";

/**
 * ============================================================
 * CONTEXT HELPERS
 * ============================================================
 */

export function listFiles(state: DevStateType): string {
  const files = state.repositoryContext?.files ?? [];

  if (files.length === 0) {
    return "Nenhum arquivo encontrado.";
  }

  return files.map((file) => `- ${file}`).join("\n");
}

export function packageContext(state: DevStateType): string {
  const packageJson = state.repositoryContext?.packageJson;

  if (!packageJson) {
    return "package.json não disponível.";
  }

  return JSON.stringify(packageJson, null, 2);
}

export function knownFileContext(state: DevStateType, maxChars = 40_000): string {
  const entries = Object.entries(state.fileContents);

  if (entries.length === 0) {
    return "Nenhum arquivo lido ainda.";
  }

  let output = "";

  for (const [file, content] of entries) {
    const block = [
      `### FILE: ${file}`,
      "",
      content,
      "",
      `### END FILE: ${file}`,
      "",
    ].join("\n");

    if (output.length + block.length > maxChars) {
      output += "\n[Context budget atingido]\n";

      break;
    }

    output += block;
  }

  return output;
}

export function reviewFeedback(state: DevStateType): string {
  if (!state.planReview) {
    return "Nenhum review anterior.";
  }

  return JSON.stringify(state.planReview, null, 2);
}

/**
 * ============================================================
 * REQUEST NORMALIZATION
 * ============================================================
 */

export function normalizeRequests(
  state: DevStateType,
  plan: Exploration,
): Exploration {
  const available = new Set(state.repositoryContext?.files ?? []);

  const alreadyRead = new Set(Object.keys(state.fileContents));

  const seen = new Set<string>();

  const filesToRead = plan.filesToRead.filter((item) => {
    const path = item.path.trim();

    if (path.includes("*")) {
      console.log(`⚠ Planner pediu path com wildcard: ${path}`);

      return false;
    }

    if (!available.has(path)) {
      console.log(`⚠ Planner pediu arquivo inexistente: ${path}`);

      return false;
    }

    if (alreadyRead.has(path)) {
      console.log(`↪ Planner pediu arquivo já lido: ${path}`);

      return false;
    }

    if (seen.has(path)) {
      return false;
    }

    seen.add(path);

    return true;
  });

  const needsMoreContext = plan.needsMoreContext && filesToRead.length > 0;

  if (plan.needsMoreContext && filesToRead.length === 0) {
    console.log(
      "↪ Planner marcou needsMoreContext=true, mas não restou nenhum arquivo válido para leitura. Normalizando para false.",
    );
  }

  return {
    ...plan,

    needsMoreContext,

    filesToRead,
  };
}
