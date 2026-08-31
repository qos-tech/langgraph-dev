import { performance } from "node:perf_hooks";

import type {
  StructuredLlmProvider,
  StructuredLlmRequest,
} from "../providers/contracts.js";

export const H0_004B_PROBE_MODELS = [
  "openai/gpt-oss-20b",
  "nvidia/nemotron-3.5-lightning-30b-a3b",
] as const;

export const H0_004B_PROBE_ROUNDS = 3;
export const H0_004B_PROBE_TIMEOUT_MS = 120_000;
export const H0_004B_PROBE_MAX_OUTPUT_TOKENS = 256;
export const H0_004B_PROBE_TRANSPORT_RETRIES = 0;

export type ProviderReliabilityProbeObservation = Readonly<{
  sequenceIndex: number;
  round: number;
  model: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  status: "success" | "error" | "timeout";
  providerElapsedSeconds: number | null;
  usage: Readonly<{
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  }> | null;
  error: string | null;
}>;

export type ProviderReliabilityProbeResult = Readonly<{
  settings: Readonly<{
    models: readonly string[];
    rounds: number;
    timeoutMs: number;
    maxOutputTokens: number;
    transportRetries: number;
  }>;
  observations: readonly ProviderReliabilityProbeObservation[];
}>;

export type ProviderReliabilityProbeOptions = Readonly<{
  models: readonly string[];
  rounds: number;
  timeoutMs: number;
  maxOutputTokens: number;
  transportRetries: number;
}>;

type ProbePayload = Readonly<{
  ok: true;
  probe: "h0-004b";
}>;

const PROBE_PROMPT =
  'Return only this JSON object exactly: {"ok":true,"probe":"h0-004b"}';

function validateProbePayload(value: unknown): ProbePayload {
  if (
    typeof value !== "object" ||
    value === null ||
    !("ok" in value) ||
    value.ok !== true ||
    !("probe" in value) ||
    value.probe !== "h0-004b"
  ) {
    throw new Error('Expected {"ok":true,"probe":"h0-004b"}.');
  }

  return {
    ok: true,
    probe: "h0-004b",
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

export async function runProviderReliabilityProbe(
  provider: StructuredLlmProvider,
  options: ProviderReliabilityProbeOptions,
): Promise<ProviderReliabilityProbeResult> {
  if (options.models.length === 0) {
    throw new Error("Provider reliability probe requires at least one model.");
  }

  if (!Number.isInteger(options.rounds) || options.rounds <= 0) {
    throw new Error("Provider reliability probe rounds must be a positive integer.");
  }

  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) {
    throw new Error("Provider reliability probe timeoutMs must be positive.");
  }

  const observations: ProviderReliabilityProbeObservation[] = [];
  let sequenceIndex = 0;

  for (let round = 1; round <= options.rounds; round += 1) {
    for (const model of options.models) {
      sequenceIndex += 1;

      const controller = new AbortController();
      const deadlineError = new Error(
        `H0-004B diagnostic deadline exceeded after ${options.timeoutMs}ms.`,
      );
      deadlineError.name = "ProbeDeadlineError";

      const startedAt = new Date().toISOString();
      const startedMonotonic = performance.now();

      const timer = setTimeout(() => {
        controller.abort(deadlineError);
      }, options.timeoutMs);

      console.log(
        `[H0-004B probe ${sequenceIndex}/${options.models.length * options.rounds}] model=${model} round=${round}`,
      );

      try {
        const request: StructuredLlmRequest<ProbePayload> = {
          model,
          prompt: PROBE_PROMPT,
          validate: validateProbePayload,
          signal: controller.signal,
          providerHints: {
            maxOutputTokens: options.maxOutputTokens,
            transportRetries: options.transportRetries,
          },
        };

        const result = await provider.generateStructured(request);
        const finishedAt = new Date().toISOString();

        observations.push({
          sequenceIndex,
          round,
          model,
          startedAt,
          finishedAt,
          durationMs: Math.round(performance.now() - startedMonotonic),
          status: "success",
          providerElapsedSeconds: result.elapsedSeconds,
          usage: result.usage ?? null,
          error: null,
        });
      } catch (error) {
        const finishedAt = new Date().toISOString();
        const timedOut =
          controller.signal.aborted &&
          controller.signal.reason === deadlineError;

        observations.push({
          sequenceIndex,
          round,
          model,
          startedAt,
          finishedAt,
          durationMs: Math.round(performance.now() - startedMonotonic),
          status: timedOut ? "timeout" : "error",
          providerElapsedSeconds: null,
          usage: null,
          error: errorMessage(error),
        });
      } finally {
        clearTimeout(timer);
      }
    }
  }

  return {
    settings: {
      models: [...options.models],
      rounds: options.rounds,
      timeoutMs: options.timeoutMs,
      maxOutputTokens: options.maxOutputTokens,
      transportRetries: options.transportRetries,
    },
    observations,
  };
}
