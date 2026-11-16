import type { AnyAgentTool, OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import {
  buildWrongQuestionWritePlan,
  parseWrongQuestion,
} from "../../../skills/wrong-question/src/index.js";

export const WRONG_QUESTION_PLAN_TOOL_NAME = "wrong_question_plan";
export const INVALID_INPUT_ERROR = "INVALID_INPUT";

type WrongQuestionPlanInput = {
  readonly archive: boolean;
  readonly question: Record<string, unknown>;
};

const parameters = {
  type: "object",
  additionalProperties: false,
  properties: {
    archive: {
      type: "boolean",
      description: "Must be the literal boolean true; any other value is rejected.",
    },
    question: {
      type: "object",
      additionalProperties: true,
      description: "Structured wrong-question fields accepted by the wrong-question skill.",
    },
  },
  required: ["archive", "question"],
} as const;

const toolParameters = parameters as unknown as AnyAgentTool["parameters"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function registerWrongQuestionPlanTool(
  api: Pick<OpenClawPluginApi, "registerTool">,
): void {
  api.registerTool({
    name: WRONG_QUESTION_PLAN_TOOL_NAME,
    label: "Wrong Question Plan",
    description:
      "Validate a wrong-question record and return a deterministic write plan. This tool never writes files or accesses the network.",
    parameters: toolParameters,
    async execute(_toolCallId, params) {
      try {
        if (!isRecord(params)) throw new Error();
        if (params.archive !== true) throw new Error();
        const input = params as Partial<WrongQuestionPlanInput>;
        if (!isRecord(input.question)) throw new Error();
        const question = parseWrongQuestion(input.question);
        const plan = buildWrongQuestionWritePlan(question, { archive: true });
        return {
          content: [{ type: "text", text: JSON.stringify(plan) }],
          details: plan,
        };
      } catch {
        throw new Error(INVALID_INPUT_ERROR);
      }
    },
  });
}
