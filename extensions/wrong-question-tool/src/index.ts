import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { registerWrongQuestionPlanTool } from "./register.js";

export default definePluginEntry({
  id: "wrong-question-tool",
  name: "Wrong Question Tool",
  description: "Validate wrong-question input and return a write plan without touching files or the network.",
  register(api) {
    registerWrongQuestionPlanTool(api);
  },
});
