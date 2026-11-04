import assert from "node:assert/strict";
import { test } from "node:test";
import { demoFor, demoInput, demoScenarios, examples } from "../lib/demo";
import { decisionSchema, scenarioSetSchema } from "../lib/domain";
import { compareInputs, evaluate, roadmap } from "../lib/simulation";

test("demo and example data match the production schemas", () => {
  for (const example of examples) {
    assert.equal(decisionSchema.safeParse(example.input).success, true);
    assert.equal(scenarioSetSchema.safeParse(demoFor(example.input)).success, true);
  }
});

test("reducing weekly hours from 12 to 5 changes capacity, dates and recommendations", () => {
  const scenario = demoScenarios[0];
  const baseline = evaluate(demoInput, scenario);
  const lowerHours = { ...demoInput, hours: 5 };
  const result = evaluate(lowerHours, scenario);
  assert.equal(baseline.availableHours, 312);
  assert.equal(result.availableHours, 130);
  assert.equal(result.hourDelta, -90);
  assert.deepEqual(baseline.milestones.map((milestone) => milestone.month), [1, 3, 6]);
  assert.deepEqual(result.milestones.map((milestone) => milestone.month), [2, 6, 11]);
  assert.deepEqual(result.milestones.map((milestone) => milestone.status), ["Rescheduled", "Rescheduled", "Beyond horizon"]);
  assert.notDeepEqual(result.recommendations, baseline.recommendations);
  assert.match(result.recommendations[0], /Investigate model errors.*8\.5h\/week/);
  assert.deepEqual(compareInputs(demoInput, lowerHours), ["Weekly hours: 12 → 5"]);
});

test("zero time leaves milestones unscheduled and zero budget surfaces the cost gap", () => {
  const result = evaluate({ ...demoInput, hours: 0, budget: 0 }, demoScenarios[0]);
  assert.equal(result.availableHours, 0);
  assert.equal(result.budgetDelta, -75);
  assert.ok(result.milestones.every((milestone) => milestone.scheduledMonth === null));
  assert.ok(result.flags.some((flag) => flag.includes("$75")));
});

test("a fractional capacity shortfall still makes the plan over capacity", () => {
  const scenario = {
    ...demoScenarios[0],
    effortHours: 13.01,
    milestones: demoScenarios[0].milestones.slice(0, 2).map(milestone => ({ ...milestone, effortHours: 4 })),
  };
  const result = evaluate({ ...demoInput, hours: 1, months: 3 }, scenario);
  assert.equal(result.availableHours, 13);
  assert.ok(result.hourDelta < 0);
  assert.match(result.flags[0], /needs 0\.01 more hours/);
});

test("a reality check revises the first-month plan and identifies assumptions to revisit", () => {
  const baseline = roadmap(demoInput, demoScenarios[0]);
  const updated = roadmap(demoInput, demoScenarios[0], "I collected data but lost access to the campus lab.");
  assert.equal(baseline.firstActions.length, 3);
  assert.notDeepEqual(updated.month, baseline.month);
  assert.match(updated.reality.join(" "), /campus lab/);
  assert.match(updated.reality.join(" "), /local notebook/);
});

test("completed milestones and a changed assumption inform the refreshed roadmap", () => {
  const updated = roadmap(demoInput, demoScenarios[0], {
    note: "",
    actualHours: 37,
    actualBudget: 5,
    invalidatedAssumptions: ["The dataset supports meaningful error categories."],
  }, ["baseline"]);
  assert.match(updated.firstActions[0], /held-out errors/);
  assert.match(updated.month[0].detail, /meaningful error categories/);
  assert.match(updated.reality.join(" "), /marked complete: Build a baseline/);
  assert.match(updated.reality.join(" "), /Logged 37h against 312h/);
});
