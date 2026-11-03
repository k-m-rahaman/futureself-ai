import type { DecisionInput, Scenario } from "./domain";

const weeksPerMonth = 52 / 12;
const round = (value: number) => Math.round(value * 10) / 10;
const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function evaluate(input: DecisionInput, scenario: Scenario) {
  const weeks = Math.round(input.months * weeksPerMonth);
  const availableHours = round(weeks * input.hours);
  const hourDelta = round(availableHours - scenario.effortHours);
  const budgetDelta = Math.round((input.budget - scenario.cost) * 100) / 100;
  let cumulativeHours = 0;
  const milestones = scenario.milestones.map((milestone) => {
    cumulativeHours += milestone.effortHours;
    const capacityMonth = input.hours > 0 ? Math.ceil(cumulativeHours / input.hours / weeksPerMonth) : Infinity;
    const scheduled = Math.max(milestone.month, capacityMonth);
    const status = scheduled > input.months ? "Beyond horizon" : scheduled > milestone.month ? "Rescheduled" : "On track";
    const scheduledMonth = Number.isFinite(scheduled) ? scheduled : null;
    return { ...milestone, status, plannedMonth: milestone.month, month: scheduledMonth ?? milestone.month, scheduledMonth };
  });

  const flags: string[] = [];
  const recommendations: string[] = [];
  if (hourDelta < 0) {
    flags.push(`The full plan needs ${-hourDelta} more hours within this horizon.`);
    const first = milestones[0];
    const lastInHorizon = milestones.findLast((milestone) => milestone.status !== "Beyond horizon");
    const hoursPerWeek = Math.ceil(scenario.effortHours / weeks * 10) / 10;
    recommendations.push(lastInHorizon
      ? `At ${input.hours}h/week, plan through “${lastInHorizon.title}.” The full workload would need about ${hoursPerWeek}h/week across this horizon.`
      : `Shrink the first step, “${first.title},” to a trial that fits your time. The full workload would need about ${hoursPerWeek}h/week across this horizon.`);
  }
  if (budgetDelta < 0) {
    flags.push(`Estimated cost exceeds the budget by ${dollars.format(-budgetDelta)}.`);
    recommendations.push("Price the first milestone separately and choose a free substitute before committing to paid resources.");
  }
  const delayed = milestones.filter((milestone) => milestone.status !== "On track");
  if (delayed.length) {
    flags.push(`${delayed.length} milestone${delayed.length === 1 ? "" : "s"} need a new date or smaller scope.`);
    const first = delayed[0];
    recommendations.push(first.scheduledMonth === null
      ? "Reserve a work session before setting a milestone date."
      : `At this pace, “${first.title}” could fit around month ${first.scheduledMonth} if earlier work stays within estimate.`);
  }
  if (input.risk === "Low") recommendations.push("Use a reversible trial and set a stop condition before increasing the commitment.");
  if (input.risk === "High") recommendations.push(`Consider the larger opportunity, “${scenario.opportunities[0]},” once you can describe the downside and cap the loss.`);
  if (input.skillLevel === "Beginner") recommendations.push("Verify prerequisites with a small practice task before committing to the first milestone.");
  if (input.skillLevel === "Advanced") recommendations.push(`Check whether your experience covers ${scenario.skills[0]}. If it does, demonstrate the first deliverable early and identify which planned work you can skip.`);
  if (input.priorities) recommendations.push(`Use your priority, “${input.priorities},” as a checkpoint when choosing which work to keep.`);
  if (!flags.length) flags.push("Estimated effort and cost fit the current constraints.");
  return { weeks, availableHours, requiredHours: scenario.effortHours, hourDelta, budgetDelta, flags, milestones, recommendations: [...recommendations, ...scenario.nextSteps] };
}

const changeLabels = {
  hours: "Weekly hours", budget: "Budget (USD)", months: "Horizon (months)",
  risk: "Risk tolerance", skillLevel: "Skill level", priorities: "Priorities",
} as const;
const displayValue = (value: string | number) => value === "" ? "None set" : value;

export function compareInputs(before: DecisionInput, after: DecisionInput) {
  return (Object.keys(changeLabels) as Array<keyof typeof changeLabels>)
    .filter((key) => before[key] !== after[key])
    .map((key) => `${changeLabels[key]}: ${displayValue(before[key])} → ${displayValue(after[key])}`);
}

type RealityProgress = {
  note: string;
  actualHours?: number;
  actualBudget?: number;
  invalidatedAssumptions?: string[];
};

export function roadmap(input: DecisionInput, scenario: Scenario, progress?: string | RealityProgress, completed: string[] = []) {
  const assessment = evaluate(input, scenario);
  const achieved = scenario.milestones.filter((milestone) => completed.includes(milestone.id));
  const first = scenario.milestones.find((milestone) => !completed.includes(milestone.id)) ?? scenario.milestones.at(-1)!;
  const checkIn = typeof progress === "string" ? { note: progress } : progress;
  const review = checkIn?.note.trim();
  const changedAssumptions = checkIn?.invalidatedAssumptions ?? [];
  const firstActions = [...new Set(achieved.length ? [...first.actions, ...scenario.nextSteps] : [...scenario.nextSteps, ...first.actions])].slice(0, 3);
  const week = [
    { id: "week-schedule", title: "Reserve a work session", detail: input.hours > 0 ? `Block up to ${input.hours} hours this week and choose when to review the result.` : "Find a realistic time slot or choose a no-commitment research task." },
    { id: "week-start", title: firstActions[0], detail: review ? "Use your latest check-in to choose the smallest remaining step." : first.details },
    { id: "week-review", title: "Check the first dependency", detail: first.dependencies[0] ?? "Check that you have the time, tools, and access the first milestone needs." },
  ];
  const month = [
    { id: "month-trial", title: review || changedAssumptions.length ? "Run a smaller follow-up trial" : "Run the smallest practical trial", detail: changedAssumptions.length ? `Test a substitute for this assumption: “${changedAssumptions[0]}”` : review ? `Use this observation to revise your trial: “${review}”` : firstActions[1] ?? first.details },
    { id: "month-evidence", title: "Review evidence at day 30", detail: `Compare actual time, spending, and results with “${first.title},” then decide which assumption to test next.` },
    { id: "month-decision", title: "Choose the next commitment", detail: assessment.hourDelta < 0 || assessment.budgetDelta < 0 ? assessment.recommendations[0] : firstActions[2] ?? "Schedule the next milestone if the trial supports continuing." },
  ];
  return {
    firstActions, week, month,
    milestones: assessment.milestones.map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      detail: `${milestone.scheduledMonth === null ? "Unscheduled" : `Month ${milestone.scheduledMonth}`} · ${milestone.effortHours}h · ${milestone.details}`,
    })),
    resources: [...new Set([...first.dependencies, ...scenario.skills])],
    obstacles: [...(assessment.hourDelta < 0 || assessment.budgetDelta < 0 ? assessment.flags : []), ...scenario.risks],
    reality: [
      ...(review ? [`Your check-in: “${review}”`] : []),
      ...(achieved.length ? [`Milestones marked complete: ${achieved.map((milestone) => milestone.title).join(", ")}.`] : []),
      ...(checkIn?.actualHours !== undefined ? [`Logged ${checkIn.actualHours}h against ${assessment.availableHours}h of total planned capacity.`] : []),
      ...(checkIn?.actualBudget !== undefined ? [`Logged ${dollars.format(checkIn.actualBudget)} in spending against a total budget of ${dollars.format(input.budget)}.`] : []),
      ...changedAssumptions.map((assumption) => `Assumption marked as changed: ${assumption}`),
      ...(review || changedAssumptions.length ? [
        `Compare your progress with “${first.title}.” Evidence to look for: ${first.details}`,
        ...first.assumptions.filter((assumption) => !changedAssumptions.includes(assumption)).map((assumption) => `Recheck this assumption before carrying the estimate forward: ${assumption}`),
      ] : []),
    ],
  };
}
