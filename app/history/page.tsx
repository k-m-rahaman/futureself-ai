"use client";

import Link from "next/link";
import { ArrowRight, Clock3, FolderOpen, GitFork, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useWorkspace } from "@/lib/storage";
import "../workspace.css";

export default function History() {
  const { ready, records, activate, remove } = useWorkspace();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  return <div className="shell page-space">
    <header className="page-intro"><span className="eyebrow"><Clock3 size={16} /> Your workspace</span><h1>Decision history</h1><p>Return to your saved paths and pick up where you left off. Your decisions and checklist progress are stored in this browser.</p></header>
    <Link href="/studio" className="btn primary"><Plus /> New decision</Link>
    {!ready ? <p role="status" className="history-list muted">Loading saved decisions…</p> : !records.length ? <div className="panel empty-workspace history-list"><FolderOpen size={28} /><h2>No saved decisions yet</h2><p className="muted">Explore your first decision or see what a saved path looks like in the demo.</p><Link href="/explore?demo=1" className="btn">Try the demo <ArrowRight /></Link></div> :
      <div className="history-list">{[...records].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(record => <article className="panel history-card" key={record.id}>
        <div className="history-copy"><span className="eyebrow"><GitFork size={14} /> {record.source === "demo" ? "Offline scenarios" : "AI scenarios"}</span><h2>{record.input.decision}</h2><p className="muted">{record.scenarios.length} paths · {record.input.months} months · Updated {new Date(record.updatedAt).toLocaleDateString()}</p></div>
        <div className="row-actions">
          <Link href="/explore" className="btn" onClick={() => activate(record.id)}>Open decision <ArrowRight /></Link>
          {pendingDelete === record.id ? <><button className="btn" onClick={() => { remove(record.id); setPendingDelete(null); }}>Confirm delete</button><button className="btn" onClick={() => setPendingDelete(null)}>Cancel</button></> : <button className="btn" aria-label={"Delete " + record.input.decision} onClick={() => setPendingDelete(record.id)}><Trash2 /></button>}
        </div>
      </article>)}</div>}
  </div>;
}
