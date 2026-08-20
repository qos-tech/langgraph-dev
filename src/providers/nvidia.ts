import { performance } from "node:perf_hooks";

import type {
  StructuredLlmProvider,
  StructuredLlmRequest,
  StructuredLlmResult,
} from "./contracts.js";

import { extractJsonObject } from "./structured-output.js";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

export type NvidiaUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

export type NvidiaCallResult<T> = {
  data: T;
  elapsedSeconds: number;
  usage?: NvidiaUsage;
};

type NvidiaMessage = {
  role?: string;
  content?: string | null;
  reasoning?: string | null;
  reasoning_content?: string | null;
};

type NvidiaResponse = {
  choices?: Array<{
    message?: NvidiaMessage;
    finish_reason?: string;
  }>;

  usage?: NvidiaUsage;
};

type NvidiaCallOptions = {
  maxTokens?: number;

  /**
   * Número de retries HTTP/rede além da
   * chamada inicial.
   */
  maxRetries?: number;
};

/**
 * ============================================================
 * CONFIG
 * ============================================================
 */

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

const NVIDIA_BASE_URL =
  process.env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1";

if (!NVIDIA_API_KEY) {
  throw new Error("NVIDIA_API_KEY não definida.");
}

/**
 * ============================================================
 * MODEL HELPERS
 * ============================================================
 */

function isGptOss(model: string): boolean {
  return model.startsWith("openai/gpt-oss");
}

function isNemotron(model: string): boolean {
  return model.startsWith("nvidia/nemotron");
}

/**
 * Campos específicos por família.
 */
function modelExtraBody(model: string): Record<string, unknown> {
  /**
   * Planner/refiner Nemotron:
   * reasoning explícito não é necessário
   * nesse fluxo.
   */
  if (isNemotron(model)) {
    return {
      chat_template_kwargs: {
        thinking: false,
      },
    };
  }

  /**
   * GPT-OSS:
   *
   * low é importante porque reasoning
   * consome o mesmo budget de max_tokens.
   */
  if (isGptOss(model)) {
    return {
      reasoning_effort: "low",
    };
  }

  return {};
}

/**
 * ============================================================
 * RETRY HELPERS
 * ============================================================
 */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableStatus(status: number): boolean {
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

function parseRetryAfterMs(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const seconds = Number(value);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const parsedDate = Date.parse(value);

  if (Number.isNaN(parsedDate)) {
    return undefined;
  }

  return Math.max(0, parsedDate - Date.now());
}

function calculateBackoffMs(retryIndex: number): number {
  const schedule = [2_000, 5_000, 10_000, 20_000, 40_000, 60_000] as const;

  const index = Math.min(Math.max(retryIndex, 0), schedule.length - 1);

  const base = schedule[index] ?? 60_000;

  const jitter = Math.floor(Math.random() * 1_000);

  return base + jitter;
}

/**
 * ============================================================
 * REQUEST
 * ============================================================
 */

async function requestNvidia(
  model: string,
  prompt: string,
  maxTokens: number,
  maxRetries: number,
): Promise<NvidiaResponse> {
  const requestBody: Record<string, unknown> = {
    model,

    messages: [
      {
        role: "user",

        content: prompt,
      },
    ],

    temperature: 0,

    max_tokens: maxTokens,

    stream: false,

    ...modelExtraBody(model),
  };

  let lastRaw = "";

  let lastStatus: number | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let response: Response;

    try {
      response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
        method: "POST",

        headers: {
          Authorization: `Bearer ${NVIDIA_API_KEY}`,

          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      if (attempt >= maxRetries) {
        throw new Error(
          [
            `Falha de rede ao chamar NVIDIA após ${attempt + 1} tentativa(s).`,
            "",
            error instanceof Error ? error.message : String(error),
          ].join("\n"),
        );
      }

      const waitMs = calculateBackoffMs(attempt);

      console.log(
        `⏳ NVIDIA network error; retry ${attempt + 1}/${maxRetries} em ${(waitMs / 1000).toFixed(1)}s`,
      );

      await sleep(waitMs);

      continue;
    }

    lastStatus = response.status;

    lastRaw = await response.text();

    if (response.ok) {
      try {
        return JSON.parse(lastRaw) as NvidiaResponse;
      } catch {
        throw new Error(
          ["Resposta HTTP da NVIDIA não é JSON válido.", "", lastRaw].join(
            "\n",
          ),
        );
      }
    }

    if (!isRetryableStatus(response.status)) {
      throw new Error(
        [`NVIDIA HTTP ${response.status}`, "", lastRaw].join("\n"),
      );
    }

    if (attempt >= maxRetries) {
      throw new Error(
        [
          `NVIDIA HTTP ${response.status} após ${attempt + 1} tentativa(s).`,
          "",
          lastRaw,
        ].join("\n"),
      );
    }

    const retryAfterMs = parseRetryAfterMs(response.headers.get("retry-after"));

    const calculatedMs = calculateBackoffMs(attempt);

    const waitMs =
      retryAfterMs !== undefined
        ? Math.max(retryAfterMs, calculatedMs)
        : calculatedMs;

    console.log(
      `⏳ NVIDIA HTTP ${response.status}; retry ${attempt + 1}/${maxRetries} em ${(waitMs / 1000).toFixed(1)}s`,
    );

    await sleep(waitMs);
  }

  throw new Error(
    [
      "NVIDIA request terminou inesperadamente.",
      `Last status: ${lastStatus ?? "unknown"}`,
      "",
      lastRaw,
    ].join("\n"),
  );
}

/**
 * ============================================================
 * GPT-OSS EMPTY-CONTENT RECOVERY
 * ============================================================
 */

function getReasoning(message: NvidiaMessage | undefined): string {
  return message?.reasoning_content ?? message?.reasoning ?? "";
}

/**
 * GPT-OSS às vezes consome toda a geração em reasoning
 * e não chega ao content final.
 *
 * Nesse caso fazemos UMA nova chamada específica,
 * com:
 *
 * - reasoning_effort low;
 * - budget maior;
 * - prompt explicitamente focado somente no JSON final.
 *
 * Não usamos reasoning_content como resposta porque
 * ele não é contrato estruturado.
 */
async function retryEmptyGptOssContent(
  model: string,
  originalPrompt: string,
  originalMaxTokens: number,
  maxRetries: number,
): Promise<NvidiaResponse> {
  const recoveryPrompt = `
${originalPrompt}

INSTRUÇÃO FINAL CRÍTICA:

Na resposta anterior você consumiu a geração em raciocínio e não produziu o JSON final.

Agora:
- faça o mínimo de raciocínio necessário;
- NÃO explique seu raciocínio;
- NÃO repita a análise;
- retorne SOMENTE o JSON final solicitado;
- não use Markdown;
- não escreva texto antes ou depois do JSON.
`.trim();

  const recoveryMaxTokens = Math.max(originalMaxTokens, 2_000);

  console.log(
    `↻ GPT-OSS retornou content vazio. Fazendo 1 retry de recuperação com max_tokens=${recoveryMaxTokens}.`,
  );

  return requestNvidia(model, recoveryPrompt, recoveryMaxTokens, maxRetries);
}

/**
 * ============================================================
 * PUBLIC API
 * ============================================================
 */

export async function callNvidiaJson<T>(
  model: string,
  prompt: string,
  validate: (value: unknown) => T,
  options?: NvidiaCallOptions,
): Promise<NvidiaCallResult<T>> {
  const startedAt = performance.now();

  const maxTokens = options?.maxTokens ?? 1600;

  const maxRetries = options?.maxRetries ?? 6;

  let payload = await requestNvidia(model, prompt, maxTokens, maxRetries);

  let message = payload.choices?.[0]?.message;

  let content = message?.content;

  /**
   * Tratamento específico GPT-OSS.
   */
  if (
    isGptOss(model) &&
    (typeof content !== "string" || content.trim().length === 0)
  ) {
    const reasoning = getReasoning(message);

    if (reasoning.trim().length > 0) {
      payload = await retryEmptyGptOssContent(
        model,
        prompt,
        maxTokens,
        maxRetries,
      );

      message = payload.choices?.[0]?.message;

      content = message?.content;
    }
  }

  const elapsedSeconds = (performance.now() - startedAt) / 1000;

  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error(
      [
        `Modelo ${model} não retornou message.content válido.`,
        "",
        "REASONING_CONTENT:",
        getReasoning(message) || "(não retornado)",
      ].join("\n"),
    );
  }

  let parsed: unknown;

  try {
    const json = extractJsonObject(content);

    parsed = JSON.parse(json);
  } catch (error) {
    throw new Error(
      [
        `Não foi possível extrair JSON válido da resposta de ${model}.`,
        "",
        `Erro: ${error instanceof Error ? error.message : String(error)}`,
        "",
        "CONTENT:",
        content,
        "",
        "REASONING_CONTENT:",
        getReasoning(message) || "(não retornado)",
      ].join("\n"),
    );
  }

  let validated: T;

  try {
    validated = validate(parsed);
  } catch (error) {
    throw new Error(
      [
        `Resposta do modelo ${model} não passou na validação.`,
        "",
        `Erro: ${error instanceof Error ? error.message : String(error)}`,
        "",
        "JSON RECEBIDO:",
        JSON.stringify(parsed, null, 2),
      ].join("\n"),
    );
  }

  return {
    data: validated,

    elapsedSeconds,

    ...(payload.usage
      ? {
          usage: payload.usage,
        }
      : {}),
  };
}

/**
 * ============================================================
 * PROVIDER ADAPTER
 * ============================================================
 */

/**
 * Provider-neutral adapter over the characterized NVIDIA implementation.
 *
 * `callNvidiaJson` remains exported as a compatibility API for focused NVIDIA
 * tests and legacy callers. Graph nodes consume this adapter through the
 * provider-neutral contract. The adapter also maps NVIDIA token-usage field
 * names into the provider-neutral contract.
 */
export class NvidiaProvider implements StructuredLlmProvider {
  async generateStructured<T>(
    request: StructuredLlmRequest<T>,
  ): Promise<StructuredLlmResult<T>> {
    const options: NvidiaCallOptions = {
      ...(request.maxTokens !== undefined
        ? {
            maxTokens: request.maxTokens,
          }
        : {}),
      ...(request.maxRetries !== undefined
        ? {
            maxRetries: request.maxRetries,
          }
        : {}),
    };

    const result = await callNvidiaJson(
      request.model,
      request.prompt,
      request.validate,
      options,
    );

    return {
      data: result.data,
      elapsedSeconds: result.elapsedSeconds,
      ...(result.usage
        ? {
            usage: {
              ...(result.usage.prompt_tokens !== undefined
                ? {
                    promptTokens: result.usage.prompt_tokens,
                  }
                : {}),
              ...(result.usage.completion_tokens !== undefined
                ? {
                    completionTokens: result.usage.completion_tokens,
                  }
                : {}),
              ...(result.usage.total_tokens !== undefined
                ? {
                    totalTokens: result.usage.total_tokens,
                  }
                : {}),
            },
          }
        : {}),
    };
  }
}

export const nvidiaProvider: StructuredLlmProvider = new NvidiaProvider();

