import { z } from "zod";

/**
 * ============================================================
 * EXPLORATION
 * ============================================================
 */

export const ExplorationSchema = z.object({
  understanding: z.string().min(1),

  needsMoreContext: z.boolean(),

  filesToRead: z
    .array(
      z.object({
        path: z.string().min(1),

        reason: z.string().min(1),
      }),
    )
    .default([]),

  observations: z.array(z.string()).default([]),

  unknowns: z.array(z.string()).default([]),
});

/**
 * ============================================================
 * REVIEW
 * ============================================================
 */

export const ReviewSchema = z.object({
  decision: z.enum(["approve_read", "revise_read", "enough_context"]),

  missingEvidence: z
    .array(
      z.object({
        area: z.string().min(1),

        reason: z.string().min(1),
      }),
    )
    .default([]),

  issues: z
    .array(
      z.object({
        severity: z.enum(["low", "medium", "high", "critical"]),

        type: z.string().min(1),

        problem: z.string().min(1),

        evidence: z.string().min(1),

        recommendation: z.string().min(1),
      }),
    )
    .default([]),

  summary: z.string().default(""),
});

/**
 * ============================================================
 * REFINED PLAN
 * ============================================================
 */

export const RefinedSchema = z.object({
  outcome: z.enum(["changes_required", "already_satisfied", "blocked"]),

  understanding: z.string().min(1),

  changes: z
    .array(
      z.object({
        file: z.string().min(1),

        action: z.enum(["create", "modify", "delete"]),

        description: z.string().min(1),
      }),
    )
    .default([]),

  validation: z
    .array(
      z.object({
        command: z.string().min(1),

        expected: z.string().min(1),
      }),
    )
    .default([]),

  blockingUnknowns: z.array(z.string()).default([]),

  nonBlockingNotes: z.array(z.string()).default([]),
});

export type Exploration = z.infer<typeof ExplorationSchema>;
