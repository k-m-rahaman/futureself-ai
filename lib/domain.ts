import { z } from "zod";

const text = z.string().trim().min(1).max(2000);
const list = z.array(text).min(1).max(12);
const id = z.string().min(1).max(80).regex(/^[a-z0-9-]+$/);

export const MAX_BUDGET_USD = 10_000_000;

export const decisionSchema = z.strictObject({
  situation: text,
  decision: text,
  goals: text,
  skills: z.string().trim().max(2000),
  hours: z.number().min(0).max(168),
  budget: z.number().min(0).max(MAX_BUDGET_USD),
  risk: z.enum(["Low", "Moderate", "High"]),
  months: z.union([z.literal(3), z.literal(6), z.literal(12), z.literal(36)]),
  skillLevel: z.enum(["Beginner", "Intermediate", "Advanced"]),
  priorities: z.string().trim().max(2000),
});

export const milestoneSchema = z.strictObject({
  id, title: text, month: z.number().int().min(1).max(36),
  details: text, actions: list, dependencies: z.array(text).max(12), risks: list,
  opportunities: list, effortHours: z.number().positive().max(30_000), assumptions: list,
});

export const scenarioSchema = z.strictObject({
  id, name: text, tagline: text, narrative: text,
  assumptions: list, effortHours: z.number().positive().max(30_000),
  cost: z.number().min(0).max(10_000_000), skills: list, flexibility: text,
  alignment: text, opportunities: list, risks: list, tradeoffs: list,
  milestones: z.array(milestoneSchema).min(2).max(6),
  alternatives: list, uncertainties: list, nextSteps: list,
}).superRefine((scenario, ctx) => {
  const { milestones, effortHours } = scenario;
  if (new Set(milestones.map(({ id }) => id)).size !== milestones.length) {
    ctx.addIssue({ code: "custom", path: ["milestones"], message: "Milestone IDs must be unique." });
  }
  if (milestones.some(({ month }, index) => index > 0 && month < milestones[index - 1].month)) {
    ctx.addIssue({ code: "custom", path: ["milestones"], message: "Milestones must be in chronological order." });
  }
  if (milestones.reduce((sum, milestone) => sum + milestone.effortHours, 0) > effortHours + 0.01) {
    ctx.addIssue({ code: "custom", path: ["effortHours"], message: "Total effort must cover all milestones." });
  }
});

export const scenarioSetSchema = z.array(scenarioSchema).length(3).superRefine((scenarios, ctx) => {
  if (new Set(scenarios.map(({ id }) => id)).size !== 3 ||
      new Set(scenarios.map(({ name }) => name.toLowerCase())).size !== 3) {
    ctx.addIssue({ code: "custom", message: "Scenarios must have distinct IDs and names." });
  }
});

export type DecisionInput = z.infer<typeof decisionSchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
