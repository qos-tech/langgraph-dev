import { StateGraph, START, END } from "@langchain/langgraph";

import { DevState } from "../state.js";

import type { LlmRoleBindings } from "../providers/role-composition.js";

import { createGraphNodes } from "./nodes.js";

import {
  afterPlanRouter,
  afterReadRouter,
  planGateRouter,
  reviewRouter,
} from "./routers.js";

export function buildDevGraph(llmRoleBindings: LlmRoleBindings) {
  const {
    analyzeNode,
    failedNode,
    planGateNode,
    planNode,
    readContextNode,
    refineNode,
    reportNode,
    reviewPlanNode,
  } = createGraphNodes(llmRoleBindings);

  return new StateGraph(DevState)
    .addNode("analyze", analyzeNode)
    .addNode("plan", planNode)
    .addNode("review_plan", reviewPlanNode)
    .addNode("read_context", readContextNode)
    .addNode("refine", refineNode)
    .addNode("plan_gate", planGateNode)
    .addNode("report", reportNode)
    .addNode("failed", failedNode)
    .addEdge(START, "analyze")
    .addEdge("analyze", "plan")
    .addConditionalEdges("plan", afterPlanRouter, {
      review: "review_plan",
      read: "read_context",
      failed: "failed",
    })
    .addConditionalEdges("review_plan", reviewRouter, {
      read: "read_context",
      revise: "plan",
      refine: "refine",
      failed: "failed",
    })
    .addConditionalEdges("read_context", afterReadRouter, {
      plan: "plan",
      failed: "failed",
    })
    .addEdge("refine", "plan_gate")
    .addConditionalEdges("plan_gate", planGateRouter, {
      report: "report",
      failed: "failed",
    })
    .addEdge("report", END)
    .addEdge("failed", END)
    .compile();
}
