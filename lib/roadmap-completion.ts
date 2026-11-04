export const ROADMAP_TASK_IDS = {
  week: { schedule: "week-schedule", start: "week-start", review: "week-review" },
  month: { trial: "month-trial", evidence: "month-evidence", decision: "month-decision" },
} as const;

export type RoadmapTaskKind = "week" | "month" | "milestone";

export function roadmapCompletionKey(scenarioId: string, kind: RoadmapTaskKind, taskId: string) {
  return `${scenarioId}/${kind}/${taskId}`;
}

export function normalizeRoadmapCompletions(completed: string[], scenarioId: string, milestoneIds: string[]) {
  const groups = [
    ["week", Object.values(ROADMAP_TASK_IDS.week)],
    ["month", Object.values(ROADMAP_TASK_IDS.month)],
    ["milestone", milestoneIds],
  ] as const;
  const legacyKeys = new Map<string, string | null>();
  for (const [kind, taskIds] of groups) {
    for (const id of taskIds) {
      const legacyKey = `${scenarioId}/${id}`;
      // Older keys cannot identify which task was checked when two sections shared an ID.
      legacyKeys.set(legacyKey, legacyKeys.has(legacyKey) ? null : roadmapCompletionKey(scenarioId, kind, id));
    }
  }
  const normalized = new Set<string>();
  for (const key of completed) {
    const replacement = legacyKeys.get(key);
    if (replacement !== null) normalized.add(replacement ?? key);
  }
  return normalized;
}
