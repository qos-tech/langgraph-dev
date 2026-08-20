import { defaultLlmRoleBindings } from "./providers/default-composition.js";

import { buildDevGraph as buildInjectedDevGraph } from "./graph/build-dev-graph.js";

import { createGraphNodes } from "./graph/nodes.js";

export {
  knownFileContext,
  listFiles,
  normalizeRequests,
  packageContext,
  reviewFeedback,
} from "./graph/context.js";

export {
  buildPlannerPrompt,
  buildRefinePrompt,
  buildReviewerPrompt,
} from "./graph/prompts.js";

export {
  afterPlanRouter,
  afterReadRouter,
  planGateRouter,
  reviewRouter,
} from "./graph/routers.js";

export { createGraphNodes } from "./graph/nodes.js";
export { buildDevGraph as buildInjectedDevGraph } from "./graph/build-dev-graph.js";

const defaultGraphNodes = createGraphNodes(defaultLlmRoleBindings);

export const {
  analyzeNode,
  failedNode,
  planGateNode,
  planNode,
  readContextNode,
  refineNode,
  reportNode,
  reviewPlanNode,
} = defaultGraphNodes;

export function buildDevGraph() {
  return buildInjectedDevGraph(defaultLlmRoleBindings);
}

export const devGraph = buildDevGraph();
