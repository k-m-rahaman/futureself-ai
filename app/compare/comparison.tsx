"use client";

import { ArrowRight, Columns3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { branchColors, formatUsd, pathNumber } from "../../components/exploration/presentation";
import { evaluate } from "../../lib/simulation";
import { useWorkspace } from "../../lib/storage";

type ChartItem = { path: string; effort: number; cost: number };

function ComparisonChart({ items, metric, capacity }: { items: ChartItem[]; metric: "effort" | "cost"; capacity: number }) {
  const isCost = metric === "cost";
  const format = (value: number) => isCost ? formatUsd(value) : `${value} h`;
  const max = Math.max(1, capacity, ...items.map((item) => item[metric]));
  return (
    <section className="explore-surface compare-chart" aria-label={isCost ? "Estimated cost chart" : "Estimated effort chart"}>
      <header><div><div className="explore-kicker">{isCost ? "02 / COST" : "01 / EFFORT"}</div><h2>{isCost ? "Estimated spending" : "Estimated work"}</h2></div><span>{format(capacity)} {isCost ? "budgeted" : "available"}</span></header>
      <div className="compare-plot">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={items} layout="vertical" margin={{ left: 2, right: 20, top: 10, bottom: 2 }} accessibilityLayer>
            <CartesianGrid horizontal={false} stroke="#263149" strokeDasharray="3 4" />
            <XAxis type="number" domain={[0, Math.ceil(max * 1.1)]} tickFormatter={format} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis dataKey="path" type="category" width={56} stroke="#c1cbe0" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: "#1b2437" }} formatter={(value) => [format(Number(value)), isCost ? "Estimated cost" : "Estimated effort"]} contentStyle={{ background: "#141d30", border: "1px solid #2b354c", borderRadius: 8, color: "#f8fafc", fontSize: 12 }} itemStyle={{ color: "#f8fafc" }} />
            <Bar dataKey={metric} barSize={17} radius={[0, 4, 4, 0]} isAnimationActive={false}>{items.map((item, index) => <Cell key={item.path} fill={branchColors[index]} />)}</Bar>
            <ReferenceLine x={capacity} stroke="#f8fafc" strokeDasharray="3 4" ifOverflow="extendDomain" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p>The dashed line marks your {isCost ? "available budget" : "available hours"}.</p>
    </section>
  );
}

export default function Comparison() {
  const { ready, active, update } = useWorkspace();
  const router = useRouter();
  if (!ready) return <div className="shell explorer"><div className="explore-loading" role="status">Opening your comparison…</div></div>;
  if (!active) return <div className="shell explorer"><div className="panel explore-empty"><Columns3 size={34} /><h1>See your choices side by side.</h1><p>Generate scenarios to compare what each path asks of you.</p><div><Link className="btn primary" href="/studio">Open Decision Studio <ArrowRight size={16} /></Link><Link className="btn" href="/explore?demo=1">Try the demo</Link></div></div></div>;

  const rows = active.scenarios.map((scenario, index) => ({ scenario, stats: evaluate(active.input, scenario), color: branchColors[index] }));
  const items = rows.map(({ scenario }, index) => ({ path: `Path ${pathNumber(index)}`, effort: scenario.effortHours, cost: scenario.cost }));
  const criteria = [
    { label: "Estimated effort", value: (row: typeof rows[number]) => `${row.scenario.effortHours} h` },
    { label: "Estimated cost", value: (row: typeof rows[number]) => formatUsd(row.scenario.cost) },
    { label: "Capacity checks", value: (row: typeof rows[number]) => row.stats.flags.length ? row.stats.flags : "Fits the modeled time and budget" },
    { label: "Skill development", value: (row: typeof rows[number]) => row.scenario.skills },
    { label: "Flexibility", value: (row: typeof rows[number]) => row.scenario.flexibility },
    { label: "Risk and uncertainty", value: (row: typeof rows[number]) => [...row.scenario.risks, ...row.scenario.uncertainties] },
    { label: "Goal alignment", value: (row: typeof rows[number]) => row.scenario.alignment },
    { label: "Major trade-offs", value: (row: typeof rows[number]) => row.scenario.tradeoffs },
  ];

  return (
    <div className="shell explorer compare">
      <div className="explore-breadcrumb"><Link href="/explore">Future Explorer</Link><span>/</span><span>Compare paths</span></div>
      <header className="explore-heading">
        <div><div className="explore-kicker"><Columns3 size={15} /> DECISION COMPARISON</div><h1>Compare paths</h1><p>{active.input.decision}</p></div>
        <span className="explore-mode"><i />{active.source === "ai" ? "AI-generated scenarios" : active.message ? "Offline template" : "Offline demo"}</span>
      </header>
      <div className="compare-charts">
        <ComparisonChart items={items} metric="effort" capacity={rows[0].stats.availableHours} />
        <ComparisonChart items={items} metric="cost" capacity={active.input.budget} />
      </div>
      <section className="explore-surface compare-matrix" aria-labelledby="compare-title">
        <header><div className="explore-kicker">03 / TRADE-OFFS</div><h2 id="compare-title">What each path asks of you</h2><p>Estimates are planning assumptions. Review the trade-offs against what matters to you.</p></header>
        <div className="compare-table-wrap" tabIndex={0} role="region" aria-label="Scenario comparison table. Scroll to see more columns.">
          <table>
            <thead><tr><th scope="col">Decision lens</th>{rows.map(({ scenario, color }, index) => <th scope="col" key={scenario.id}><div className="compare-path-label" style={{ color }}>PATH {pathNumber(index)}</div><div>{scenario.name}</div></th>)}</tr></thead>
            <tbody>
              {criteria.map(({ label, value }) => <tr key={label}><th scope="row">{label}</th>{rows.map((row) => {
                const detail = value(row);
                return <td key={row.scenario.id}>{Array.isArray(detail) ? <ul>{detail.map((item, index) => <li key={index}>{item}</li>)}</ul> : detail}</td>;
              })}</tr>)}
              <tr><th scope="row">Next move</th>{rows.map(({ scenario }) => <td key={scenario.id}><button className="btn" onClick={() => {
                update(active.id, { selectedId: scenario.id });
                router.push("/roadmap");
              }}>Build roadmap <ArrowRight size={15} /></button></td>)}</tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
