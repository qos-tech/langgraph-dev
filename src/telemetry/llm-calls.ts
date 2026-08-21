import type { StructuredLlmResult } from "../providers/contracts.js";
import type { LlmCallTelemetry } from "./contracts.js";

export interface LlmCallTelemetrySink {
  record(call: LlmCallTelemetry): void;
}

export interface LlmCallTelemetryCollector extends LlmCallTelemetrySink {
  snapshot(): readonly LlmCallTelemetry[];
}

export function createLlmCallTelemetryCollector(): LlmCallTelemetryCollector {
  const calls: LlmCallTelemetry[] = [];

  return {
    record(call) {
      calls.push({
        ...call,
      });
    },
    snapshot() {
      return calls.map((call) => ({
        ...call,
      }));
    },
  };
}

export function captureStructuredLlmCall<T>(
  sink: LlmCallTelemetrySink | undefined,
  role: LlmCallTelemetry["role"],
  model: string,
  result: StructuredLlmResult<T>,
): void {
  if (!sink) {
    return;
  }

  sink.record({
    role,
    model,
    elapsedSeconds: result.elapsedSeconds,
    ...(result.usage?.promptTokens !== undefined
      ? {
          promptTokens: result.usage.promptTokens,
        }
      : {}),
    ...(result.usage?.completionTokens !== undefined
      ? {
          completionTokens: result.usage.completionTokens,
        }
      : {}),
    ...(result.usage?.totalTokens !== undefined
      ? {
          totalTokens: result.usage.totalTokens,
        }
      : {}),
  });
}
