"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Compass, FlaskConical, Layers3, SlidersHorizontal, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState, type FormEvent } from "react";
import { demoInput, demoFor, examples } from "@/lib/demo";
import { decisionSchema, MAX_BUDGET_USD, scenarioSetSchema, type DecisionInput } from "@/lib/domain";
import { useWorkspace } from "@/lib/storage";
import "../workspace.css";

const blank: DecisionInput = { ...demoInput, situation: "", decision: "", goals: "", skills: "", priorities: "", hours: 8, budget: 0, risk: "Moderate", skillLevel: "Beginner" };
const steps = [
  { name: "The decision", caption: "Start with what’s on your mind.", icon: Compass },
  { name: "Your direction", caption: "Define what progress means.", icon: Layers3 },
  { name: "Your constraints", caption: "Give each path real boundaries.", icon: SlidersHorizontal },
];

export default function Studio() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<DecisionInput>(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reduceMotion = useReducedMotion();
  const { save } = useWorkspace();
  const router = useRouter();
  const StepIcon = steps[step].icon;
  function field<K extends keyof DecisionInput>(key: K, value: DecisionInput[K]) {
    setInput(current => ({ ...current, [key]: value }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (step < steps.length - 1) {
      const required = step === 0 ? [input.situation, input.decision] : [input.goals, input.skills, input.priorities];
      if (required.some(value => value.trim().length < 3)) { setError("Add a few words to each field before continuing."); return; }
      setStep(step + 1);
      return;
    }
    if (busy) return;
    const validated = decisionSchema.safeParse(input);
    if (!validated.success) { setError("Check your inputs and try again."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/scenarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: validated.data }) });
      const data = await response.json() as { scenarios?: unknown; source?: "ai" | "demo"; message?: string; error?: string };
      const result = scenarioSetSchema.safeParse(data.scenarios);
      if (!response.ok || !result.success || (data.source !== "ai" && data.source !== "demo")) throw new Error(data.error ?? "We couldn’t generate your paths. Try again or continue with offline examples.");
      save({ input: validated.data, scenarios: result.data, source: data.source, message: data.message });
      router.push("/explore");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Generation failed. Try again.");
      setBusy(false);
    }
  }
  function useOffline() {
    const validated = decisionSchema.safeParse(input);
    if (!validated.success) return;
    save({ input: validated.data, scenarios: demoFor(validated.data), source: "demo", message: "Offline scenario templates use your inputs as planning context." });
    router.push("/explore");
  }
  return <div className="shell page-space">
    <header className="page-intro"><span className="eyebrow"><Compass size={15} /> Decision Studio</span><h1>Start with one decision.</h1><p>Tell us where you are and what you’re weighing. We’ll turn it into three paths you can explore.</p></header>
    <div className="studio-grid">
      <aside aria-label="Studio steps">
        <ol className="studio-steps">{steps.map(({ name, caption, icon: Icon }, i) => <li className={i === step ? "current" : ""} aria-current={i === step ? "step" : undefined} key={name}><span className="step-icon"><Icon size={18} /></span><div><strong>{name}</strong><p>{caption}</p></div></li>)}</ol>
        <div className="panel studio-examples"><span className="eyebrow">Starting points</span><p className="muted">Load an example and make it yours.</p><div className="row-actions">{examples.map(example => <button key={example.label} type="button" className="sample-chip" disabled={busy} onClick={() => { setInput(example.input); setStep(0); setError(""); }}>{example.label}</button>)}</div><Link href="/explore?demo=1" className="studio-demo"><FlaskConical size={15} /> Open offline demo <ArrowRight size={14} /></Link></div>
      </aside>
      <section className="panel studio-main" aria-busy={busy}>
        <div className="studio-form-heading"><div className="step-icon"><StepIcon size={20} /></div><div><span className="eyebrow">Step {step + 1} of {steps.length}</span><h2>{steps[step].name}</h2></div></div>
        <motion.form onSubmit={submit} key={step} initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
          <fieldset disabled={busy} className="fields">
            {step === 0 && <>
              <label>What’s your current situation?<textarea required minLength={3} maxLength={2000} value={input.situation} onChange={e => field("situation", e.target.value)} placeholder="I’m a second-year computer science student…" /></label>
              <label>What decision are you facing?<textarea required minLength={3} maxLength={2000} value={input.decision} onChange={e => field("decision", e.target.value)} placeholder="Should I focus on AI/ML, DSA, or entrepreneurship?" /></label>
            </>}
            {step === 1 && <>
              <label>What do you want to achieve?<textarea required minLength={3} maxLength={2000} value={input.goals} onChange={e => field("goals", e.target.value)} placeholder="Build a portfolio and find an internship." /></label>
              <label>What skills or experience do you bring?<textarea required minLength={3} maxLength={2000} value={input.skills} onChange={e => field("skills", e.target.value)} placeholder="Python, basic web development, and one team project." /></label>
              <label>What matters most right now?<input required minLength={3} maxLength={1000} value={input.priorities} onChange={e => field("priorities", e.target.value)} placeholder="Flexibility, steady progress, and a low upfront cost" /></label>
            </>}
            {step === 2 && <>
              <div className="field-pair"><label>Hours per week<input required type="number" min={0} max={168} step="any" value={input.hours} onChange={e => field("hours", e.target.valueAsNumber)} /></label><label>Total budget (USD)<input required type="number" min={0} max={MAX_BUDGET_USD} step="any" value={input.budget} onChange={e => field("budget", e.target.valueAsNumber)} /></label></div>
              <div className="field-pair"><label>Risk tolerance<select value={input.risk} onChange={e => field("risk", e.target.value as DecisionInput["risk"])}><option>Low</option><option>Moderate</option><option>High</option></select></label><label>Current skill level<select value={input.skillLevel} onChange={e => field("skillLevel", e.target.value as DecisionInput["skillLevel"])}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label></div>
              <label>Planning horizon<select value={input.months} onChange={e => field("months", Number(e.target.value) as DecisionInput["months"])}><option value={3}>3 months</option><option value={6}>6 months</option><option value={12}>1 year</option><option value={36}>3 years</option></select></label>
            </>}
          </fieldset>
          {error && <div className="notice" role="alert">{error} {step === 2 && decisionSchema.safeParse(input).success && <button type="button" className="btn" onClick={useOffline}>Use offline templates</button>}</div>}
          {busy && <div className="studio-loading" role="status"><span /><span /><span /> Mapping three paths and their assumptions…</div>}
          <div className="studio-actions">
            {step > 0 ? <button type="button" className="btn" disabled={busy} onClick={() => { setError(""); setStep(step - 1); }}><ArrowLeft /> Back</button> : <span />}
            <button type="submit" className="btn primary" disabled={busy}>{step === 2 ? <><Sparkles /> {busy ? "Exploring…" : "Explore my futures"}</> : <>Continue <ArrowRight /></>}</button>
          </div>
        </motion.form>
      </section>
    </div>
  </div>;
}
