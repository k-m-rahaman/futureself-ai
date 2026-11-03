"use client";

import { ArrowDown, ArrowRight, BookmarkPlus, CalendarDays, Clock3, GitBranch, RotateCcw, SlidersHorizontal, Sparkles, Workflow } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Conversation } from "../../components/exploration/conversation";
import { FutureTimeline } from "../../components/exploration/timeline";
import { branchColors, formatUsd, pathNumber } from "../../components/exploration/presentation";
import { useWhatIf } from "../../components/exploration/use-what-if";
import { demoInput, demoScenarios } from "../../lib/demo";
import type { DecisionInput } from "../../lib/domain";
import { compareInputs, evaluate } from "../../lib/simulation";
import { type Workspace, useWorkspace } from "../../lib/storage";

export default function Explorer() {
  const workspace = useWorkspace();
  const router = useRouter();
  const demo = useSearchParams().get("demo") === "1";
  const initialized = useRef(false);
  const { active, ready, save } = workspace;

  useEffect(() => {
    if (!demo) {
      initialized.current = false;
      return;
    }
    if (!ready || initialized.current) return;
    initialized.current = true;
    if (active?.source !== "demo" || active.message || JSON.stringify(active.input) !== JSON.stringify(demoInput)) {
      save({ input: demoInput, scenarios: demoScenarios, source: "demo" });
    }
    router.replace("/explore");
  }, [active, demo, ready, router, save]);

  if (!ready || demo) return <div className="shell explorer"><div className="explore-loading" role="status">Opening your workspace…</div></div>;
  if (!active) {
    return <div className="shell explorer"><div className="panel explore-empty"><Workflow size={35} /><h1>Every future starts with a decision.</h1><p>Start with a decision from your own life or explore three example paths.</p><div><Link className="btn primary" href="/studio">Open Decision Studio <ArrowRight size={16} /></Link><Link className="btn" href="/explore?demo=1">Try the demo</Link></div></div></div>;
  }
  return <ExplorerWorkspace key={active.id} record={active} save={workspace.save} update={workspace.update} />;
}

function ExplorerWorkspace({ record, save, update }: {
  record: Workspace;
  save: ReturnType<typeof useWorkspace>["save"];
  update: ReturnType<typeof useWorkspace>["update"];
}) {
  const router = useRouter();
  const [input, setInput] = useState(record.input);
  const [selection, setSelection] = useState({ path: record.selectedId, milestone: undefined as string | undefined });
  const [conversation, setConversation] = useState(false);
  const simulation = useWhatIf(record.input, record.scenarios, input, record.source);
  const { scenarios } = simulation;
  const selectedIndex = Math.max(0, scenarios.findIndex((item) => item.id === selection.path));
  const selected = scenarios[selectedIndex];
  const measured = evaluate(input, selected);
  const milestone = measured.milestones.find((item) => item.id === selection.milestone);
  const changes = compareInputs(record.input, input);
  const select = useCallback((path: string, milestone?: string) => {
    setSelection({ path, milestone });
    setConversation(false);
  }, []);

  function change<K extends keyof DecisionInput>(key: K, value: DecisionInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function persist() {
    const active = simulation.changed
      ? save({ input, scenarios, source: record.source, message: simulation.error || record.message })
      : record;
    update(active.id, { selectedId: selected.id });
  }

  function navigate(path: string) {
    persist();
    router.push(path);
  }

  return (
    <div className="shell explorer">
      <div className="explore-breadcrumb"><Link href="/studio">Decision Studio</Link><span>/</span><span>Future Explorer</span></div>
      <header className="explore-heading">
        <div><div className="explore-kicker"><Workflow size={15} /> SCENARIO WORKSPACE</div><h1>Future Explorer</h1><p>{record.input.decision}</p></div>
        <div className="explore-heading-actions"><span className="explore-mode"><i />{record.source === "ai" ? "AI-generated scenarios" : record.message ? "Offline template" : "Offline demo"}</span><button className="btn" onClick={() => navigate("/compare")} disabled={simulation.pending}>Compare paths <ArrowRight size={16} /></button></div>
      </header>
      {record.message && <p className="explore-status">{record.message}</p>}

      <div className="explore-layout">
        <section className="explore-surface timeline-panel" aria-labelledby="timeline-title">
          <header className="timeline-heading"><div><div className="explore-kicker">01 / BRANCHING TIMELINE</div><h2 id="timeline-title">Your paths ahead</h2></div><span><CalendarDays size={15} /> {input.months}-month horizon</span></header>
          <FutureTimeline input={input} scenarios={scenarios} selectedId={selected.id} milestoneId={milestone?.id} select={select} />
          <div className="timeline-legend" role="group" aria-label="Select a path">
            {scenarios.map((scenario, index) => (
              <button type="button" key={scenario.id} aria-pressed={selected.id === scenario.id} onClick={() => select(scenario.id)} style={{ "--branch": branchColors[index] } as React.CSSProperties}>
                <i /> <span>{scenario.name}</span>
              </button>
            ))}
          </div>
          <div className="timeline-hint"><span>Select a milestone to inspect it. Drag the canvas to pan.</span><a href="#what-if">Run a What-If <ArrowDown size={13} /></a></div>
        </section>

        <aside className="explore-surface path-inspector" style={{ "--branch": branchColors[selectedIndex] } as React.CSSProperties} aria-labelledby="inspector-title">
          <header><div className="explore-kicker"><GitBranch size={15} /> PATH {pathNumber(selectedIndex)}</div><h2 id="inspector-title">{selected.name}</h2><p>{selected.tagline}</p></header>
          <div className="path-tabs" aria-label="Path inspector views">
            <button aria-pressed={!conversation} onClick={() => setConversation(false)}>Path details</button>
            <button aria-pressed={conversation} onClick={() => setConversation(true)}><Sparkles size={14} /> Future voice</button>
          </div>
          {conversation ? (
            <Conversation key={selected.id} input={input} scenario={selected} demo={record.source === "demo"} />
          ) : milestone ? (
            <div className="path-details">
              <button className="path-back" onClick={() => select(selected.id)}>← Path overview</button>
              <div className="milestone-context">{milestone.scheduledMonth === null ? "UNSCHEDULED" : `MONTH ${milestone.scheduledMonth}`} · {milestone.effortHours} EST. HOURS</div>
              <h3>{milestone.title}</h3>
              <p className="path-narrative">{milestone.details}</p>
              <p className="explore-status">{milestone.status}</p>
              <DetailList title="Required actions" items={milestone.actions} open />
              <DetailList title="Dependencies" items={milestone.dependencies} />
              <DetailList title="Risks" items={milestone.risks} />
              <DetailList title="Opportunities" items={milestone.opportunities} />
              <DetailList title="Assumptions" items={milestone.assumptions} />
            </div>
          ) : (
            <div className="path-details">
              <p className="path-narrative">{selected.narrative}</p>
              <div className="path-metrics"><div><Clock3 size={15} /><strong>{selected.effortHours} h</strong><small>Estimated effort</small></div><div><strong>{formatUsd(selected.cost)}</strong><small>Estimated cost</small></div></div>
              <details><summary>Milestones</summary><ul className="path-milestone-list">{measured.milestones.map((item) => <li key={item.id}><button onClick={() => select(selected.id, item.id)}><strong>{item.title}</strong><small>{item.scheduledMonth === null ? "Unscheduled" : `Month ${item.scheduledMonth}`} · {item.status}</small></button></li>)}</ul></details>
              <DetailList title="Assumptions" items={selected.assumptions} />
              <DetailList title="Opportunities" items={selected.opportunities} />
              <DetailList title="Risks and uncertainties" items={[...selected.risks, ...selected.uncertainties]} />
              <DetailList title="Trade-offs and alternative outcomes" items={[...selected.tradeoffs, ...selected.alternatives]} />
              <DetailList title="Suggested next steps" items={selected.nextSteps} />
            </div>
          )}
          <footer><button className="btn primary" onClick={() => navigate("/roadmap")} disabled={simulation.pending}>Build this roadmap <ArrowRight size={16} /></button></footer>
        </aside>
      </div>

      <section id="what-if" className="explore-surface what-if" aria-labelledby="what-if-title">
        <header className="what-if-heading"><div><div className="explore-kicker"><SlidersHorizontal size={15} /> 02 / SIMULATION</div><h2 id="what-if-title">What if things change?</h2><p>Adjust your constraints to see where the plan fits and where it needs to change.</p></div>{simulation.changed && <button className="btn" onClick={() => setInput(record.input)}><RotateCcw size={15} /> Reset assumptions</button>}</header>
        <div className="what-if-body">
          <div className="what-if-controls">
            <label className="what-if-hours"><span>Weekly availability <strong>{input.hours} h</strong></span><input type="range" min={0} max={Math.max(40, Math.ceil(record.input.hours))} step="1" value={input.hours} onChange={(event) => change("hours", Number(event.target.value))} /><span className="range-ends"><small>0 hours</small><small>{Math.max(40, Math.ceil(record.input.hours))} hours</small></span></label>
            <label>Budget (USD)<input type="number" min={0} max={10000000} step="0.01" value={input.budget} onChange={(event) => change("budget", Math.max(0, Math.min(10000000, Number(event.target.value))))} /></label>
            <label>Timeline<select value={input.months} onChange={(event) => change("months", Number(event.target.value) as DecisionInput["months"])}><option value={3}>3 months</option><option value={6}>6 months</option><option value={12}>1 year</option><option value={36}>3 years</option></select></label>
            <label>Risk tolerance<select value={input.risk} onChange={(event) => change("risk", event.target.value as DecisionInput["risk"])}><option>Low</option><option>Moderate</option><option>High</option></select></label>
            <label>Skill level<select value={input.skillLevel} onChange={(event) => change("skillLevel", event.target.value as DecisionInput["skillLevel"])}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
            <label className="what-if-priorities">Personal priorities<input type="text" value={input.priorities} maxLength={2000} placeholder="What matters most right now?" onChange={(event) => change("priorities", event.target.value)} /></label>
          </div>
          <div className="what-if-readout" aria-live="polite">
            <div className="explore-kicker">CURRENT CAPACITY</div>
            <h3>{measured.availableHours} <small>hours available</small></h3>
            <p>{measured.requiredHours} estimated hours for {selected.name} over {measured.weeks} weeks.</p>
            {measured.flags.length > 0 && <ul>{measured.flags.map((flag) => <li key={flag}>{flag}</li>)}</ul>}
            {changes.length > 0 && <><h4>Assumptions changed</h4><ul>{changes.map((item) => <li key={item}>{item}</li>)}</ul></>}
            {measured.recommendations.length > 0 && <><h4>Suggested adjustments</h4><ul>{measured.recommendations.map((item) => <li key={item}>{item}</li>)}</ul></>}
            {simulation.pending && <p className="explore-status" role="status"><Sparkles size={15} /> Reviewing qualitative trade-offs…</p>}
            {simulation.error && <div className="what-if-error"><p>{simulation.error} The capacity analysis is current.</p><button className="btn" onClick={simulation.retry}>Retry review</button></div>}
            {simulation.changed && record.source === "demo" && <p className="voice-note">Offline simulation uses fixed scenario estimates and recalculates capacity and scheduling.</p>}
            {simulation.changed && <button className="btn" onClick={persist} disabled={simulation.pending}><BookmarkPlus size={15} /> Save simulation</button>}
          </div>
        </div>
      </section>
      <p className="explore-footnote"><ArrowDown size={14} /> Explore the trade-offs, then choose an experiment you can try this week. These paths are plausible scenarios.</p>
    </div>
  );
}

function DetailList({ title, items, open }: { title: string; items: string[]; open?: boolean }) {
  if (!items.length) return null;
  return <details open={open}><summary>{title}</summary><ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul></details>;
}
