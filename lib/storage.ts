"use client";

import { useSyncExternalStore } from "react";
import { decisionSchema, scenarioSetSchema, type DecisionInput, type Scenario } from "./domain";

type Result = { input: DecisionInput; scenarios: Scenario[]; source: "ai" | "demo"; message?: string };
export type Workspace = Result & {
  id: string; createdAt: string; updatedAt: string; selectedId: string; completed: string[];
  checkIns?: Record<string, { note: string; previousConstraints: DecisionInput }>;
  invalidatedAssumptions?: Record<string, string[]>;
};
type Store = { ready: boolean; records: Workspace[]; activeId: string | null };
const initial: Store = { ready: false, records: [], activeId: null };
const key = "futureself.workspace.v1";
let state = initial;
const listeners = new Set<() => void>();

function restore(): Store {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? "null") as Partial<Store> | null;
    if (raw && Array.isArray(raw.records)) {
      const records = raw.records.filter(item => item && typeof item.id === "string" &&
        typeof item.updatedAt === "string" && typeof item.selectedId === "string" &&
        (item.source === "ai" || item.source === "demo") && decisionSchema.safeParse(item.input).success &&
        scenarioSetSchema.safeParse(item.scenarios).success && Array.isArray(item.completed));
      return { ready: true, records, activeId: raw.activeId ?? null };
    }
  } catch { /* An unavailable store still permits this session to work. */ }
  return { ...initial, ready: true };
}
function emit() { for (const listener of listeners) listener(); }
function refresh(event: StorageEvent) {
  if (event.key === key || event.key === null) { state = restore(); emit(); }
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", refresh);
  if (!state.ready) { state = restore(); emit(); }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener("storage", refresh);
  };
}
function commit(next: Store) {
  state = next;
  try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Keep changes in memory. */ }
  emit();
}
function save(payload: Result): Workspace {
  const time = new Date().toISOString();
  const record = { ...payload, id: crypto.randomUUID(), createdAt: time, updatedAt: time, selectedId: payload.scenarios[0]?.id ?? "", completed: [] };
  commit({ ready: true, activeId: record.id, records: [record, ...state.records] });
  return record;
}
function update(id: string, patch: Partial<Omit<Workspace, "id" | "createdAt" | "updatedAt">>) {
  commit({ ...state, records: state.records.map(record => record.id === id ? { ...record, ...patch, updatedAt: new Date().toISOString() } : record) });
}
function activate(id: string) { commit({ ...state, activeId: id }); }
function remove(id: string) { commit({ ...state, activeId: state.activeId === id ? null : state.activeId, records: state.records.filter(record => record.id !== id) }); }

export function useWorkspace() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => initial);
  return { ready: snapshot.ready, records: snapshot.records, active: snapshot.records.find(record => record.id === snapshot.activeId), save, update, activate, remove };
}
