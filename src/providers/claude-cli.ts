import { execFile } from "node:child_process";
import { performance } from "node:perf_hooks";

import type {
  StructuredLlmProvider,
  StructuredLlmRequest,
  StructuredLlmResult,
} from "./contracts.js";

import { extractJsonObject } from "./structured-output.js";

type ClaudeCliUsage = {
  input_tokens?: number;
  output_tokens?: number;
};

type ClaudeCliEnvelope = {
  subtype?: string;
  is_error?: boolean;
  result?: string;
  structured_output?: unknown;
  usage?: ClaudeCliUsage;
};

export type ClaudeCliExecution = {
  stdout: string;
  stderr: string;
};

export type ClaudeCliRunner = (
  command: string,
  args: readonly string[],
) => Promise<ClaudeCliExecution>;

export type ClaudeCliProviderOptions = {
  binary?: string;
  runner?: ClaudeCliRunner;
};

const DEFAULT_MAX_BUFFER_BYTES = 10 * 1024 * 1024;

function runClaudeProcess(
  command: string,
  args: readonly string[],
): Promise<ClaudeCliExecution> {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      [...args],
      {
        encoding: "utf8",
        maxBuffer: DEFAULT_MAX_BUFFER_BYTES,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              [
                `Claude CLI falhou: ${error.message}`,
                "",
                "STDERR:",
                stderr || "(vazio)",
              ].join("\\n"),
            ),
          );
          return;
        }

        resolve({ stdout, stderr });
      },
    );
  });
}

function parseClaudeEnvelope(stdout: string): ClaudeCliEnvelope {
  try {
    return JSON.parse(stdout) as ClaudeCliEnvelope;
  } catch (error) {
    throw new Error(
      [
        "Claude CLI não retornou envelope JSON válido.",
        "",
        `Erro: ${error instanceof Error ? error.message : String(error)}`,
        "",
        "STDOUT:",
        stdout,
      ].join("\\n"),
    );
  }
}

function parseStructuredValue(envelope: ClaudeCliEnvelope): unknown {
  if (envelope.structured_output !== undefined) {
    return envelope.structured_output;
  }

  if (typeof envelope.result !== "string" || envelope.result.trim().length === 0) {
    throw new Error("Claude CLI não retornou result/structured_output válido.");
  }

  const json = extractJsonObject(envelope.result);
  return JSON.parse(json) as unknown;
}

export class ClaudeCliProvider implements StructuredLlmProvider {
  private readonly binary: string;
  private readonly runner: ClaudeCliRunner;

  constructor(options: ClaudeCliProviderOptions = {}) {
    this.binary = options.binary ?? process.env.CLAUDE_CLI_PATH ?? "claude";
    this.runner = options.runner ?? runClaudeProcess;
  }

  async generateStructured<T>(
    request: StructuredLlmRequest<T>,
  ): Promise<StructuredLlmResult<T>> {
    const startedAt = performance.now();

    /*
     * Claude Code CLI does not expose provider-neutral equivalents for the
     * current maxTokens/maxRetries request knobs. They remain accepted by the
     * shared contract but are intentionally not translated into unrelated CLI
     * flags such as --max-turns.
     */
    void request.maxTokens;
    void request.maxRetries;

    const args = [
      "-p",
      request.prompt,
      "--model",
      request.model,
      "--output-format",
      "json",
      "--safe-mode",
      "--tools",
      "",
      "--disallowedTools",
      "mcp__*",
      "--no-session-persistence",
      "--disable-slash-commands",
    ] as const;

    const execution = await this.runner(this.binary, args);
    const elapsedSeconds = (performance.now() - startedAt) / 1000;
    const envelope = parseClaudeEnvelope(execution.stdout);

    if (envelope.is_error === true || envelope.subtype?.startsWith("error_")) {
      throw new Error(
        [
          `Claude CLI encerrou com erro${envelope.subtype ? ` (${envelope.subtype})` : ""}.`,
          "",
          execution.stderr || "(sem detalhes em stderr)",
        ].join("\\n"),
      );
    }

    let parsed: unknown;
    try {
      parsed = parseStructuredValue(envelope);
    } catch (error) {
      throw new Error(
        [
          `Não foi possível extrair JSON válido da resposta do Claude (${request.model}).`,
          "",
          `Erro: ${error instanceof Error ? error.message : String(error)}`,
          "",
          "STDOUT:",
          execution.stdout,
        ].join("\\n"),
      );
    }

    let validated: T;
    try {
      validated = request.validate(parsed);
    } catch (error) {
      throw new Error(
        [
          `Resposta do Claude (${request.model}) não passou na validação.`,
          "",
          `Erro: ${error instanceof Error ? error.message : String(error)}`,
          "",
          "JSON RECEBIDO:",
          JSON.stringify(parsed, null, 2),
        ].join("\\n"),
      );
    }

    const inputTokens = envelope.usage?.input_tokens;
    const outputTokens = envelope.usage?.output_tokens;

    return {
      data: validated,
      elapsedSeconds,
      ...(inputTokens !== undefined || outputTokens !== undefined
        ? {
            usage: {
              ...(inputTokens !== undefined ? { promptTokens: inputTokens } : {}),
              ...(outputTokens !== undefined ? { completionTokens: outputTokens } : {}),
              ...(inputTokens !== undefined && outputTokens !== undefined
                ? { totalTokens: inputTokens + outputTokens }
                : {}),
            },
          }
        : {}),
    };
  }
}

export const claudeCliProvider: StructuredLlmProvider = new ClaudeCliProvider();
