"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, Clock3, Compass, Flag, ListChecks, Route } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useWorkspace, type Workspace } from "@/lib/storage";
import { compareInputs, evaluate, roadmap } from "@/lib/simulation";
import "../workspace.css";
import "./roadmap.css";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export default function Roadmap() {
  const { ready, active, update } = useWorkspace();
  if (!ready) return <div className="shell page-space"><p role="status">Loading your roadmap…</p></div>;
  if (!active) return <div className="shell page-space"><div className="panel empty-workspace"><Route size={30} /><h1>Your roadmap starts with a path.</h1><p className="muted">Explore a decision and select the future you want to work toward.</p><Link href="/explore?demo=1" className="btn primary">Explore the demo <ArrowRight /></Link></div></div>;
  return <Plan key={active.id + active.selectedId} record={active} update={patch => update(active.id, patch)} />;
}

function Plan({ record, update }: { record: Workspace; update: (patch: Partial<Workspace>) => void }) {
  const scenario = record.scenarios.find(item => item.id === record.selectedId) ?? record.scenarios[0];
  const checkIn = record.checkIns?.[scenario.id];
  const plan = roadmap(record.input, scenario, {
    note: checkIn?.note ?? "",
    invalidatedAssumptions: record.invalidatedAssumptions?.[scenario.id] ?? [],
  }, record.completed.filter(id => id.startsWith(scenario.id + "/")).map(id => id.slice(scenario.id.length + 1)));
  const feasibility = evaluate(record.input, scenario);
  const taskIds = new Set([...plan.week, ...plan.month, ...plan.milestones].map(task => scenario.id + "/" + task.id));
  const done = record.completed.filter(id => taskIds.has(id)).length;
  const [observations, setObservations] = useState(checkIn?.note ?? "");
  const [hours, setHours] = useState(record.input.hours);
  const [budget, setBudget] = useState(record.input.budget);
  const [updated, setUpdated] = useState(false);
  const [invalidated, setInvalidated] = useState(record.invalidatedAssumptions?.[scenario.id] ?? []);
  const milestoneIds = new Set(scenario.milestones.map(milestone => scenario.id + "/" + milestone.id));
  const completedMilestones = record.completed.filter(id => milestoneIds.has(id)).length;
  const changes = checkIn ? compareInputs(checkIn.previousConstraints, record.input) : [];
  const previous = checkIn ? evaluate(checkIn.previousConstraints, scenario) : undefined;
  const nextMilestone = feasibility.milestones.find(milestone => !record.completed.includes(scenario.id + "/" + milestone.id));
  const priorMilestone = previous?.milestones.find(milestone => milestone.id === nextMilestone?.id);
  const monthLabel = (month: number | null) => month === null ? "Unscheduled" : `Month ${month}`;

  function realityCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update({
      checkIns: { ...record.checkIns, [scenario.id]: { note: observations.trim(), previousConstraints: record.input } },
      input: { ...record.input, hours, budget },
      invalidatedAssumptions: { ...record.invalidatedAssumptions, [scenario.id]: invalidated },
    });
    setUpdated(true);
  }
  function checklist(title: string, tasks: typeof plan.week) {
    return <section className="panel roadmap-list"><h2>{title}</h2>{tasks.map(task => {
      const id = scenario.id + "/" + task.id;
      const checked = record.completed.includes(id);
      return <label className="roadmap-task" key={id}><input type="checkbox" aria-label={task.title} checked={checked} onChange={event => update({ completed: event.target.checked ? [...record.completed, id] : record.completed.filter(item => item !== id) })} /><span><strong>{task.title}</strong><small>{task.detail}</small></span></label>;
    })}</section>;
  }
  return <div className="shell page-space">
    <Link className="back-link" href="/explore"><ArrowLeft size={16} /> Back to Explore</Link>
    <header className="page-intro"><span className="eyebrow"><Route size={16} /> Reverse Roadmap</span><h1>{scenario.name}</h1><p>Start with the smallest useful action, then check your progress against the milestones you chose.</p><div className="row-actions"><span className="sample-chip"><Clock3 size={14} /> {record.input.hours} h/week</span><span className="sample-chip">{record.source === "demo" ? "Offline scenario" : "AI-assisted scenario"}</span></div></header>
    <div className="roadmap-grid">
      <div className="roadmap-stack">
        <section className="panel roadmap-list roadmap-next">
          <span className="eyebrow"><Compass size={16} /> Next milestone</span>
          <h2>{nextMilestone?.title ?? "All milestones completed"}</h2>
          {nextMilestone ? <>
            <div className="row-actions"><span className="sample-chip">{monthLabel(nextMilestone.scheduledMonth)}</span><span className="sample-chip">{nextMilestone.effortHours} h estimated</span></div>
            <p className="muted">{nextMilestone.details}</p>
            <p className="roadmap-next-action"><strong>Next action</strong> {nextMilestone.actions[0]}</p>
          </> : <p className="muted">Review what you learned and decide whether to extend this path.</p>}
        </section>
        <section className="panel roadmap-list"><h2><Compass size={18} /> First three actions</h2><ol className="first-actions">{plan.firstActions.map((action, i) => <li key={i}><span>0{i + 1}</span>{action}</li>)}</ol></section>
        {checklist("7-day action plan", plan.week)}
        {checklist("30-day roadmap", plan.month)}
        {checklist("Monthly milestones", plan.milestones)}
      </div>
      <aside className="roadmap-stack">
        <section className="panel roadmap-list"><h2><ListChecks size={18} /> Progress</h2><div className="progress-count"><strong>{done}</strong><span> / {taskIds.size} tasks complete</span></div><progress max={Math.max(1, taskIds.size)} value={done} aria-label="Roadmap progress" /><p className="muted">Your checklist is saved in this browser.</p></section>
        <section className="panel roadmap-list"><h2><Flag size={18} /> Resources and obstacles</h2><h3>Resources</h3><ul>{plan.resources.map((text, i) => <li key={i}>{text}</li>)}</ul><h3>Obstacles</h3><ul>{plan.obstacles.map((text, i) => <li key={i}>{text}</li>)}</ul></section>
        <section className="panel roadmap-list"><h2><ClipboardCheck size={18} /> Reality Check</h2><p className="muted">Record what you completed, which milestone slipped, and what changed.</p>
          <form className="fields" onSubmit={realityCheck} onChange={() => setUpdated(false)}>
            <label>What happened?<textarea required maxLength={1600} value={observations} onChange={event => setObservations(event.target.value)} placeholder="I finished the first milestone, but my weekly availability fell during exams." /></label>
            <div className="field-pair"><label>Hours per week<input required type="number" min={0} max={168} step="any" value={hours} onChange={event => setHours(event.target.valueAsNumber)} /></label><label>Budget (USD)<input required type="number" min={0} max={1000000} step="any" value={budget} onChange={event => setBudget(event.target.valueAsNumber)} /></label></div>
            <fieldset className="assumption-picker"><legend>Assumptions that no longer hold</legend>{scenario.assumptions.map(assumption => <label key={assumption}><input type="checkbox" checked={invalidated.includes(assumption)} onChange={event => setInvalidated(event.target.checked ? [...invalidated, assumption] : invalidated.filter(item => item !== assumption))} />{assumption}</label>)}</fieldset>
            <button className="btn primary" type="submit">Update roadmap <ArrowRight /></button>
          </form>
          {updated && <p role="status" className="roadmap-confirm"><CheckCircle2 size={17} /> Check-in saved. Your roadmap uses your updated time and budget.</p>}
          {checkIn && previous && <div className="roadmap-revision">
            <h3>What changed</h3>
            <dl>
              <div><dt>Capacity over {feasibility.weeks} weeks</dt><dd><span>{previous.availableHours} h</span><ArrowRight size={13} /><strong>{feasibility.availableHours} h</strong></dd></div>
              <div><dt>Total budget</dt><dd><span>{usd.format(checkIn.previousConstraints.budget)}</span><ArrowRight size={13} /><strong>{usd.format(record.input.budget)}</strong></dd></div>
              {nextMilestone && priorMilestone && <div><dt>Next milestone estimate</dt><dd><span>{monthLabel(priorMilestone.scheduledMonth)}</span><ArrowRight size={13} /><strong>{monthLabel(nextMilestone.scheduledMonth)}</strong></dd></div>}
            </dl>
            {changes.length > 0 && <ul>{changes.map(change => <li key={change}>{change}</li>)}</ul>}
          </div>}
          {plan.reality.length > 0 && <><h3>Milestone review</h3><p className="muted">{completedMilestones} of {scenario.milestones.length} planned milestones marked complete.</p><ul className="reality-list">{plan.reality.map((text, i) => <li key={i}>{text}</li>)}</ul></>}
          {feasibility.flags.length > 0 && <><h3>Constraints to revisit</h3><ul>{feasibility.flags.map((flag, i) => <li key={i}>{flag}</li>)}</ul></>}
        </section>
      </aside>
    </div>
  </div>;
}
