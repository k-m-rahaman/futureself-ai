"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Background, BackgroundVariant, Controls, getBezierPath, Handle, Position, ReactFlow, type Edge, type EdgeProps, type Node, type NodeProps } from "@xyflow/react";
import { Circle, Compass, GitBranch } from "lucide-react";
import type { DecisionInput, Scenario } from "../../lib/domain";
import { evaluate } from "../../lib/simulation";

import { branchColors, pathNumber } from "./presentation";

type TimelineNode = Node<{
  title: string;
  caption: string;
  color: string;
  activate?: () => void;
  kind: "root" | "path" | "milestone";
  active: boolean;
  final?: boolean;
  delay?: number;
  compact: boolean;
}, "future">;

function BranchNode({ data }: NodeProps<TimelineNode>) {
  const { title, caption, color, activate, kind, active, final, compact } = data;
  const Icon = kind === "root" ? Compass : kind === "path" ? GitBranch : Circle;
  const content = <><span className="flow-node-icon"><Icon size={14} aria-hidden="true" /></span><span><small>{caption}</small><strong>{title}</strong></span></>;
  return (
    <div className={`flow-node flow-node-${kind}${active ? " is-active" : ""}`} style={{ "--branch": color, "--node-delay": `${data.delay ?? 0}ms` } as React.CSSProperties}>
      {kind !== "root" && <Handle type="target" position={compact ? Position.Top : Position.Left} isConnectable={false} />}
      {activate ? <button className="nodrag nopan" onClick={activate} aria-pressed={active} aria-label={`${caption} — ${title}`}>{content}</button> : <div className="flow-node-label">{content}</div>}
      {!final && <Handle type="source" position={compact ? Position.Bottom : Position.Right} isConnectable={false} />}
    </div>
  );
}

type TimelineEdge = Edge<{ color: string; delay: number; active: boolean }, "trajectory">;

function TrajectoryEdge({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, data }: EdgeProps<TimelineEdge>) {
  const [path] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  if (!data) return null;
  return (
    <g className={`trajectory${data.active ? " is-active" : ""}`} style={{ "--branch": data.color, "--edge-delay": `${data.delay}ms` } as React.CSSProperties}>
      <path className="trajectory-track" d={path} />
      <path className="trajectory-signal" d={path} pathLength={1} />
    </g>
  );
}

const nodeTypes = { future: BranchNode };
const edgeTypes = { trajectory: TrajectoryEdge };

const compactQuery = "(max-width: 600px)";
const compactSnapshot = () => window.matchMedia(compactQuery).matches;
const desktopSnapshot = () => false;

function subscribeCompact(listener: () => void) {
  const query = window.matchMedia(compactQuery);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

export function FutureTimeline({ input, scenarios, selectedId, milestoneId, select }: {
  input: DecisionInput;
  scenarios: Scenario[];
  selectedId: string;
  milestoneId?: string;
  select: (scenario: string, milestone?: string) => void;
}) {
  const compact = useSyncExternalStore(subscribeCompact, compactSnapshot, desktopSnapshot);
  const { nodes, edges } = useMemo(() => {
    const nodes: TimelineNode[] = [{
      id: "present", type: "future", position: compact ? { x: 109, y: 0 } : { x: 0, y: 136 },
      data: { title: input.situation, caption: "YOU TODAY", color: "#e2e8f0", kind: "root", active: false, compact },
    }];
    const edges: TimelineEdge[] = [];
    scenarios.forEach((scenario, index) => {
      const color = branchColors[index];
      const active = scenario.id === selectedId;
      const y = 20 + index * 116;
      const items = [
        { id: `path:${scenario.id}`, title: scenario.name, caption: `PATH ${pathNumber(index)}`, milestone: undefined },
        ...evaluate(input, scenario).milestones.map((milestone) => ({
          id: `milestone:${scenario.id}:${milestone.id}`, title: milestone.title, caption: milestone.scheduledMonth === null ? "UNSCHEDULED" : `MONTH ${milestone.scheduledMonth}`, milestone: milestone.id,
        })),
      ];
      items.forEach((item, itemIndex) => {
        nodes.push({
          id: item.id, type: "future", position: compact ? { x: index * 109, y: 87 + itemIndex * 67 } : { x: 215 + itemIndex * 195, y },
          data: { title: item.title, caption: item.caption, color, kind: itemIndex ? "milestone" : "path", active: active && milestoneId === item.milestone, final: itemIndex === items.length - 1, delay: 100 + itemIndex * 75 + index * 70, compact, activate: () => select(scenario.id, item.milestone) },
        });
        edges.push({
          id: `edge-${item.id}`, source: items[itemIndex - 1]?.id ?? "present", target: item.id,
          type: "trajectory", data: { color, active, delay: itemIndex * 80 + index * 75 },
        });
      });
    });
    return { nodes, edges };
  }, [compact, input, scenarios, selectedId, milestoneId, select]);

  return (
    <div className="timeline-canvas" data-compact={compact} role="region" aria-label="Branching timeline. Use Tab to reach each milestone or use the view controls to zoom and reset.">
      <ReactFlow key={compact ? "compact" : "wide"} nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} attributionPosition="bottom-left" nodesDraggable={false} nodesConnectable={false} nodesFocusable={false} edgesFocusable={false} elementsSelectable={false} fitView fitViewOptions={{ padding: compact ? 0.08 : 0.13 }} minZoom={0.2} maxZoom={2} zoomOnScroll={false} panOnScroll={false}>
        <Background variant={BackgroundVariant.Dots} color="#29324c" gap={21} size={1.2} />
        <Controls position="bottom-right" showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
