import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeRoadmapCompletions, roadmapCompletionKey } from "../lib/roadmap-completion";

test("roadmap completions isolate task sections and preserve unambiguous saved progress", () => {
  const weekly = roadmapCompletionKey("path-a", "week", "week-start");
  const milestone = roadmapCompletionKey("path-a", "milestone", "week-start");
  const previous = [
    "path-a/week-start",
    "path-a/week-review",
    "path-a/review-results",
    "path-b/week-start",
    weekly,
  ];
  const milestones = ["week-start", "review-results"];
  const normalized = normalizeRoadmapCompletions(previous, "path-a", milestones);
  assert.deepEqual([...normalized], [
    "path-a/week/week-review",
    "path-a/milestone/review-results",
    "path-b/week-start",
    weekly,
  ]);
  assert.notEqual(weekly, milestone);
  assert.equal(normalized.has(milestone), false);
  assert.equal(normalizeRoadmapCompletions(["path-a/week-start"], "path-a", milestones).size, 0);
  normalized.add(milestone);
  normalized.delete(weekly);
  assert.equal(normalized.has(milestone), true);
});
