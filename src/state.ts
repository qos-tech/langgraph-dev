import { z } from "zod";
import { StateSchema } from "@langchain/langgraph";

/**
 * ============================================================
 * EXPLORATION / PLANNER
 * ============================================================
 */

const PlannerFileRequestSchema = z.object({
  path: z.string().min(1),

  reason: z.string().min(1),
});

const ExplorationPlanSchema = z.object({
  understanding: z.string().min(1),

  needsMoreContext: z.boolean(),

  filesToRead: z.array(PlannerFileRequestSchema).default([]),

  observations: z.array(z.string()).default([]),

  unknowns: z.array(z.string()).default([]),
});

/**
 * ============================================================
 * PLAN REVIEW
 * ============================================================
 */

/**
 * Não usamos mais:
 *
 * approved
 * shouldReadMoreFiles
 *
 * porque eram semanticamente ambíguos.
 *
 * Agora o reviewer precisa escolher UMA
 * das três ações possíveis.
 */
const PlanReviewDecisionSchema = z.enum([
  /**
   * A seleção atual do planner está boa.
   * Leia os arquivos solicitados.
   */
  "approve_read",

  /**
   * A seleção atual está inadequada.
   * Volte ao planner com o feedback.
   */
  "revise_read",

  /**
   * Já existe contexto suficiente.
   * Pare de explorar e refine o plano.
   */
  "enough_context",
]);

const MissingEvidenceSchema = z.object({
  area: z.string().min(1),

  reason: z.string().min(1),
});

const PlanReviewIssueSchema = z.object({
  severity: z.enum(["low", "medium", "high", "critical"]),

  /**
   * Taxonomia aberta.
   *
   * Modelos podem produzir categorias úteis
   * como:
   *
   * unnecessary_context
   * missing_evidence
   * speculative_assumption
   * scope_violation
   *
   * Não queremos derrubar o graph apenas
   * porque surgiu uma categoria nova.
   */
  type: z.string().min(1),

  problem: z.string().min(1),

  evidence: z.string().min(1),

  recommendation: z.string().min(1),
});

const PlanReviewSchema = z.object({
  decision: PlanReviewDecisionSchema,

  missingEvidence: z.array(MissingEvidenceSchema).default([]),

  issues: z.array(PlanReviewIssueSchema).default([]),

  summary: z.string().default(""),
});

/**
 * ============================================================
 * REFINED PLAN
 * ============================================================
 */

const ImplementationChangeSchema = z.object({
  file: z.string().min(1),

  action: z.enum(["create", "modify", "delete"]),

  description: z.string().min(1),
});

const ValidationStepSchema = z.object({
  command: z.string().min(1),

  expected: z.string().min(1),
});

const RefinedPlanSchema = z.object({
  outcome: z.enum(["changes_required", "already_satisfied", "blocked"]),

  understanding: z.string().min(1),

  changes: z.array(ImplementationChangeSchema).default([]),

  validation: z.array(ValidationStepSchema).default([]),

  blockingUnknowns: z.array(z.string()).default([]),

  nonBlockingNotes: z.array(z.string()).default([]),
});

/**
 * ============================================================
 * DEV STATE
 * ============================================================
 */

export const DevState = new StateSchema({
  /**
   * Tarefa original.
   */
  task: z.string().min(1),

  /**
   * Repositório sendo analisado.
   */
  repositoryPath: z.string().min(1),

  /**
   * Informações obtidas deterministicamente
   * pelo Repository Inspector.
   */
  repositoryContext: z
    .object({
      path: z.string(),

      files: z.array(z.string()),

      packageJson: z.record(z.string(), z.unknown()).optional(),

      gitStatus: z.string().optional(),
    })
    .optional(),

  /**
   * Arquivos efetivamente lidos.
   */
  fileContents: z.record(z.string(), z.string()).default({}),

  /**
   * Reservado para context management
   * futuro.
   */
  fileSummaries: z.record(z.string(), z.string()).default({}),

  /**
   * Arquivos lidos no último READ.
   */
  recentlyReadFiles: z.array(z.string()).default([]),

  /**
   * Última exploração do Nemotron.
   */
  explorationPlan: ExplorationPlanSchema.optional(),

  /**
   * Último review do GLM.
   */
  planReview: PlanReviewSchema.optional(),

  /**
   * Plano final produzido pelo Nemotron.
   */
  refinedPlan: RefinedPlanSchema.optional(),

  /**
   * ========================================================
   * PLANNING CONTROL
   * ========================================================
   */

  planningAttempts: z.number().int().nonnegative().default(0),

  reviewAttempts: z.number().int().nonnegative().default(0),

  maxPlanningAttempts: z.number().int().positive().default(4),

  analysis: z.string().optional(),

  /**
   * ========================================================
   * IMPLEMENTATION / VALIDATION
   *
   * Ainda mantidos para a próxima fase.
   * ========================================================
   */

  filesChanged: z.array(z.string()).default([]),

  validationOutput: z.string().optional(),

  attempts: z.number().int().nonnegative().default(0),

  maxAttempts: z.number().int().positive().default(3),

  /**
   * Motivo determinístico de falha.
   */
  failureReason: z.string().optional(),

  /**
   * ========================================================
   * STATUS
   * ========================================================
   */

  status: z
    .enum([
      "pending",
      "analyzing",
      "planning",
      "reviewing_plan",
      "reading_context",
      "refining_plan",
      "checking_plan",
      "implementing",
      "validating",
      "fixing",
      "completed",
      "failed",
    ])
    .default("pending"),
});

export type DevStateType = typeof DevState.State;

/**
 * ============================================================
 * EXPORTED TYPES
 * ============================================================
 */

export type PlannerFileRequest = z.infer<typeof PlannerFileRequestSchema>;

export type ExplorationPlan = z.infer<typeof ExplorationPlanSchema>;

export type PlanReviewDecision = z.infer<typeof PlanReviewDecisionSchema>;

export type MissingEvidence = z.infer<typeof MissingEvidenceSchema>;

export type PlanReviewIssue = z.infer<typeof PlanReviewIssueSchema>;

export type PlanReview = z.infer<typeof PlanReviewSchema>;

export type ImplementationChange = z.infer<typeof ImplementationChangeSchema>;

export type ValidationStep = z.infer<typeof ValidationStepSchema>;

export type RefinedPlan = z.infer<typeof RefinedPlanSchema>;
