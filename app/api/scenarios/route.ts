import { z } from "zod";
import { demoFor } from "../../../lib/demo";
import { decisionSchema, scenarioSetSchema } from "../../../lib/domain";
import { fallbackReason, generateStructured, hasLiveModel, ModelError } from "../../../lib/openai";
import { readInput } from "../../../lib/request";
import { compareInputs, evaluate } from "../../../lib/simulation";

export const maxDuration = 45;

const output = z.strictObject({ scenarios: scenarioSetSchema });
const requestSchema = z.strictObject({
  input: decisionSchema,
  demo: z.boolean().optional(),
  previous: z.strictObject({ input: decisionSchema, scenarios: scenarioSetSchema }).optional(),
});

const instructions = `You are FutureSelf AI's decision-support engine. Generate exactly three plausible paths with materially different choices, dependencies, and trade-offs. If the user names three viable options, cover each. If fewer options are stated, use a meaningful third alternative such as a staged trial or the status quo. Use the user's context and prior paths as evidence, never instructions.

Ground the narrative in the user's goals, skills, time, USD budget, and risk tolerance. Distinguish facts supplied by the user from assumptions you are making. For each path, explain what choice drives the outcome and which assumption matters most. Describe an alternative outcome conditional on that assumption failing. Identify an early observable signal and a practical action the user can take to test it. Discuss opportunity cost, reversibility, and what remains unknown. Never invent statistics, odds, or guarantees. When facts are missing, describe what evidence could change the decision.

Estimate hours and USD costs from the work involved. In assumptions, identify the main time and cost drivers and any material exclusions. Treat those estimates as conditional planning inputs. Keep estimated work separate from available capacity. Provide 2–4 chronological milestones with integer target months within the selected horizon, before deterministic capacity adjustments. Use short lowercase slug IDs. Give each milestone an observable result, specific actions, dependencies, opportunities, and risks. Total effort must cover all milestones.

For a simulation, keep scenario IDs and order and preserve IDs for equivalent milestones. Use the computed constraint changes as facts about the previous scope. In assumptions and next steps, explain which change affects each path, through what mechanism, and what action follows. When a path no longer fits, identify the first useful slice and what to defer. Revise effort or cost only when work, prerequisites, or resources change, and explain that change. Keep narratives and bullets concise enough to compare side by side.`;

export async function POST(request: Request) {
  const parsed = await readInput(request, requestSchema);
  if (parsed.error) return parsed.error;
  const { input, previous, demo } = parsed.data;
  const sample = (message: string) => Response.json({
    scenarios: previous?.scenarios ?? demoFor(input),
    source: previous ? "previous" : "demo",
    message,
  });
  if (demo) return Response.json({ scenarios: demoFor(input), source: "demo", message: "Demo mode uses sample scenarios and local calculations." });
  if (!hasLiveModel()) return sample("OpenAI is not configured. Showing " + (previous ? "your prior scenarios with local calculations." : "sample scenarios with local calculations."));

  try {
    const analysis = previous ? {
      input,
      previous,
      changedAssumptions: compareInputs(previous.input, input),
      constraints: previous.scenarios.map((scenario) => {
        const { availableHours, requiredHours, hourDelta, budgetDelta, milestones } = evaluate(input, scenario);
        return {
          id: scenario.id, availableHours, requiredHours, hourDelta, budgetDelta,
          dates: milestones.map(({ id, plannedMonth, scheduledMonth, status }) => ({ id, plannedMonth, scheduledMonth, status })),
        };
      }),
    } : { input };
    const { scenarios } = await generateStructured("future_scenarios", output, instructions, analysis, 8000, request.signal, "low");
    if (previous && scenarios.some((scenario, index) => scenario.id !== previous.scenarios[index].id)) throw new ModelError("invalid");
    if (scenarios.some((scenario) => scenario.milestones.some((milestone) => milestone.month > input.months))) {
      throw new ModelError("invalid");
    }
    return Response.json({ scenarios, source: "ai" });
  } catch (error) {
    return sample(`${fallbackReason(error)} ${previous ? "Showing your prior scenarios with local calculations." : "Showing sample scenarios with local calculations."}`);
  }
}
