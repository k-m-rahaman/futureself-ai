"use client";

import { CalendarDays, Clock3, Download, Plus, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { calendarIcs, planCalendar, type TimeBlock } from "../../lib/calendar-plan";
import "./experiment-scheduler.css";

type ExperimentPath = { id: string; name: string; task: string };
type SchedulerProps = { minutes: number; paths: [ExperimentPath, ExperimentPath] };
type Plan = NonNullable<ReturnType<typeof planCalendar>>;
type BlockKind = "work" | "busy";

const dayLabel = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" });
const timeLabel = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const endLabel = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZoneName: "short" });

function describeBlock({ start, end }: TimeBlock) {
  const lastDay = dayLabel.format(end);
  const firstDay = dayLabel.format(start);
  return `${firstDay}, ${timeLabel.format(start)} – ${firstDay === lastDay ? "" : lastDay + ", "}${endLabel.format(end)}`;
}

function localTime(date: string, time: string) {
  const local = new Date(`${date}T${time}`);
  const [hour, minute] = time.split(":").map(Number);
  return local.getHours() === hour && local.getMinutes() === minute ? local.getTime() : NaN;
}

function downloadCalendar(events: Parameters<typeof calendarIcs>[0], fileName: string) {
  const url = URL.createObjectURL(new Blob([calendarIcs(events)], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function BlockEditor({ kind, blocks, add, remove }: {
  kind: BlockKind;
  blocks: TimeBlock[];
  add: (block: TimeBlock) => void;
  remove: (index: number) => void;
}) {
  const [error, setError] = useState("");
  const isBusy = kind === "busy";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const date = String(fields.get("date"));
    const start = localTime(date, String(fields.get("start")));
    const end = localTime(date, String(fields.get("end")));
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      setError("Choose an end time after the start time on the same day.");
      return;
    }
    if (blocks.some(block => block.start === start && block.end === end)) {
      setError("This time range is already in the list.");
      return;
    }
    add({ start, end });
    setError("");
  }

  return <div className="experiment-scheduler-editor">
    <form onSubmit={submit} onChange={() => setError("")}>
      <fieldset>
        <legend>{isBusy ? "Busy blocks (optional)" : "Work windows"}</legend>
        <div className="experiment-scheduler-fields">
          <label>{isBusy ? "Busy date" : "Available date"}<input name="date" type="date" required /></label>
          <label>{isBusy ? "Busy from" : "Available from"}<input name="start" type="time" required /></label>
          <label>{isBusy ? "Busy until" : "Available until"}<input name="end" type="time" required /></label>
        </div>
        <button className="btn" type="submit"><Plus size={15} aria-hidden="true" /> {isBusy ? "Add busy block" : "Add work window"}</button>
        {error && <p role="alert" className="experiment-scheduler-error">{error}</p>}
      </fieldset>
    </form>
    {blocks.length > 0 && <ul className="experiment-scheduler-blocks" aria-label={isBusy ? "Busy blocks" : "Work windows"}>
      {blocks.map((block, index) => <li key={`${block.start}/${block.end}`}><span>{describeBlock(block)}</span><button type="button" aria-label={`Remove ${isBusy ? "busy block" : "work window"} for ${describeBlock(block)}`} onClick={() => remove(index)}><X size={15} aria-hidden="true" /></button></li>)}
    </ul>}
  </div>;
}

export function ExperimentScheduler({ minutes, paths }: SchedulerProps) {
  const [windows, setWindows] = useState<TimeBlock[]>([]);
  const [busy, setBusy] = useState<TimeBlock[]>([]);
  const [result, setResult] = useState<{ minutes: number; plan: Plan | null }>();
  const plan = result?.minutes === minutes ? result.plan : undefined;

  function changeBlocks(kind: BlockKind, update: (current: TimeBlock[]) => TimeBlock[]) {
    (kind === "work" ? setWindows : setBusy)(update);
    setResult(undefined);
  }

  const events = plan?.slots.map((slot, index) => ({
    ...slot,
    title: `FutureSelf AI · ${paths[index].name} experiment`,
    description: `${paths[index].task} Record what you completed, what blocked you, and what you learned.`,
  }));

  return <details className="experiment-scheduler">
    <summary><CalendarDays size={17} aria-hidden="true" /><span>Find time this week<small>Fit both trial sessions around your commitments.</small></span></summary>
    <div className="experiment-scheduler-body">
      <h3>Enter availability manually</h3>
      <p>Add one or more times you can work over the next seven days. Add any busy time inside those windows to keep it clear. Times use your device’s time zone.</p>
      <div className="experiment-scheduler-editors">
        <BlockEditor kind="work" blocks={windows} add={block => changeBlocks("work", current => [...current, block])} remove={index => changeBlocks("work", current => current.filter((_, i) => i !== index))} />
        <BlockEditor kind="busy" blocks={busy} add={block => changeBlocks("busy", current => [...current, block])} remove={index => changeBlocks("busy", current => current.filter((_, i) => i !== index))} />
      </div>
      <div className="experiment-scheduler-actions">
        <button type="button" className="btn primary" disabled={!windows.length || minutes < 15} onClick={() => setResult({ minutes, plan: planCalendar({ now: Date.now(), windows, busy, preferredMinutes: minutes }) })}><Clock3 size={16} aria-hidden="true" /> Find times</button>
        {minutes < 15
          ? <p>Set aside at least 30 minutes per week to schedule two trials.</p>
          : !windows.length && <p>Add a work window to look for two sessions.</p>}
      </div>
      <div aria-live="polite">
        {plan === null && <p className="experiment-scheduler-error">No two slots of at least 15 minutes fit over the next seven days. Add another work window or adjust your busy blocks.</p>}
        {plan && events && <div className="experiment-scheduler-results">
          <header><h4>Two {plan.durationMinutes}-minute sessions</h4><button className="btn" type="button" onClick={() => downloadCalendar(events, "futureself-experiments.ics")}><Download size={15} aria-hidden="true" /> Download both (.ics)</button></header>
          {plan.durationMinutes < minutes && <p>These sessions are shorter than planned so both fit your work windows.</p>}
          <p>Import the downloaded file into your calendar to add the sessions.</p>
          <ol>{plan.slots.map((slot, index) => <li key={paths[index].id}><div><strong>{paths[index].name}</strong><span>{describeBlock(slot)}</span></div><button className="btn" type="button" aria-label={`Download ${paths[index].name} session (.ics)`} onClick={() => downloadCalendar([events[index]], `futureself-session-${index + 1}.ics`)}><Download size={15} aria-hidden="true" /><span>.ics</span></button></li>)}</ol>
        </div>}
      </div>
    </div>
  </details>;
}
