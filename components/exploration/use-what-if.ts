"use client";

import { useEffect, useMemo, useState } from "react";
import type { DecisionInput, Scenario } from "../../lib/domain";

type SimulationResult = { scenarios: Scenario[]; source: "ai" | "demo" | "previous"; message?: string };

const simulationCache = new Map<string, SimulationResult>();

export function useWhatIf(baseInput: DecisionInput, baseScenarios: Scenario[], input: DecisionInput, source: "ai" | "demo") {
  const key = useMemo(() => JSON.stringify({ input, previous: { input: baseInput, scenarios: baseScenarios } }), [input, baseInput, baseScenarios]);
  const changed = JSON.stringify(baseInput) !== JSON.stringify(input);
  const live = source === "ai" && changed;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; attempt: number; data?: SimulationResult; error?: string }>();

  useEffect(() => {
    if (!live || simulationCache.has(key)) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/scenarios", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: key, signal: controller.signal,
        });
        if (!response.ok) throw new Error("The qualitative review is temporarily unavailable.");
        const data: SimulationResult = await response.json();
        if (controller.signal.aborted) return;
        if (data.source !== "ai") {
          setResult({ key, attempt, error: data.message || "The qualitative review is temporarily unavailable." });
          return;
        }
        if (simulationCache.size >= 20) {
          const oldest = simulationCache.keys().next().value;
          if (oldest) simulationCache.delete(oldest);
        }
        simulationCache.set(key, data);
        setResult({ key, attempt, data });
      } catch {
        if (!controller.signal.aborted) setResult({ key, attempt, error: "The qualitative review is temporarily unavailable." });
      }
    }, 700);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [live, key, attempt]);

  const latest = result?.key === key && result.attempt === attempt ? result : undefined;
  const analysis = live ? simulationCache.get(key) ?? latest?.data : undefined;
  return {
    changed,
    scenarios: analysis?.scenarios ?? baseScenarios,
    pending: live && !analysis && !latest?.error,
    error: live ? latest?.error : undefined,
    retry: () => setAttempt((current) => current + 1),
  };
}
