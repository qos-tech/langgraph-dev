/**
 * Provider-neutral helpers for extracting structured JSON from model output.
 *
 * This module intentionally knows nothing about NVIDIA, Claude, Ollama,
 * HTTP transport, model families, retries, reasoning, or validation libraries.
 */

/**
 * Extract a valid JSON object from common LLM response shapes:
 *
 * - pure JSON;
 * - fenced JSON;
 * - text followed by JSON;
 * - a balanced object embedded in additional text.
 */
export function extractJsonObject(content: string): string {
  const trimmed = content.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      JSON.parse(trimmed);

      return trimmed;
    } catch {
      // Continue trying supported fallback shapes.
    }
  }

  const fencedMatches = [...trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];

  for (const match of fencedMatches.reverse()) {
    const candidate = match[1]?.trim();

    if (!candidate) {
      continue;
    }

    try {
      JSON.parse(candidate);

      return candidate;
    } catch {
      // Continue trying supported fallback shapes.
    }
  }

  for (
    let start = trimmed.lastIndexOf("{");
    start >= 0;
    start = trimmed.lastIndexOf("{", start - 1)
  ) {
    const candidate = trimmed.slice(start);

    try {
      JSON.parse(candidate);

      return candidate;
    } catch {
      // Continue trying supported fallback shapes.
    }
  }

  for (let start = 0; start < trimmed.length; start++) {
    if (trimmed[start] !== "{") {
      continue;
    }

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < trimmed.length; i++) {
      const char = trimmed[i];

      if (inString) {
        if (escaped) {
          escaped = false;

          continue;
        }

        if (char === "\\") {
          escaped = true;

          continue;
        }

        if (char === '"') {
          inString = false;
        }

        continue;
      }

      if (char === '"') {
        inString = true;

        continue;
      }

      if (char === "{") {
        depth++;
      } else if (char === "}") {
        depth--;
      }

      if (depth === 0) {
        const candidate = trimmed.slice(start, i + 1);

        try {
          JSON.parse(candidate);

          return candidate;
        } catch {
          break;
        }
      }
    }
  }

  throw new Error("Nenhum objeto JSON válido encontrado na resposta.");
}
