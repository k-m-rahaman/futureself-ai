"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, ChartNoAxesColumnIncreasing, CircleDot, Clock3, GitFork, Sparkles, SlidersHorizontal, Waypoints } from "lucide-react";

const paths = [
  {
    name: "AI / Machine Learning", label: "AI / ML", color: "#a397ff", letter: "A", y: 65,
    milestones: ["Build a baseline", "Investigate model errors", "Publish a case study"],
    summary: "Build a portfolio around a single model you can explain, evaluate, and improve.",
    effort: "Project-based practice", upside: "Applied ML portfolio", tradeoff: "More time spent debugging data",
  },
  {
    name: "Data Structures & Algorithms", label: "Algorithms", color: "#5ed7ee", letter: "B", y: 150,
    milestones: ["Map your skill gaps", "Build a practice rhythm", "Run mock interviews"],
    summary: "Practice problem-solving patterns and use mock interviews to find gaps in your reasoning.",
    effort: "Recurring timed practice", upside: "Interview preparation", tradeoff: "Fewer portfolio artifacts",
  },
  {
    name: "Entrepreneurship", label: "Startup", color: "#70dcb1", letter: "C", y: 235,
    milestones: ["Interview potential users", "Test a manual prototype", "Make a continue-or-stop decision"],
    summary: "Test a real problem with potential users before committing your time to building a product.",
    effort: "Research and iteration", upside: "Direct customer feedback", tradeoff: "More dependence on user access",
  },
];

const features = [
  { number: "01", icon: Sparkles, title: "Frame your decision", description: "Describe the choice, what matters to you, and the time and resources you can commit." },
  { number: "02", icon: Waypoints, title: "Explore parallel futures", description: "Inspect the milestones, assumptions, and trade-offs along three distinct paths." },
  { number: "03", icon: SlidersHorizontal, title: "Stress-test the plan", description: "Change the hours, budget, or priorities and see what each path would ask of you." },
  { number: "04", icon: ChartNoAxesColumnIncreasing, title: "Build a roadmap", description: "Choose a path, plan your first 30 days, and revisit the milestones as you make progress." },
];

const branchCurves = [
  "M144,150 C188,150 169,65 226,65 H523",
  "M144,150 H523",
  "M144,150 C188,150 169,235 226,235 H523",
];

export default function LandingPage() {
  const [active, setActive] = useState(0);
  const selected = paths[active];

  return (
    <div className="fs-landing">
      <section className="fs-hero fs-shell" aria-labelledby="fs-hero-title">
        <div className="fs-hero-copy">
          <div className="fs-eyebrow"><span /> One Decision. Multiple Futures.</div>
          <h1 id="fs-hero-title">Your Future Has More Than <em>One Version.</em></h1>
          <p className="fs-hero-description">Explore the paths ahead, understand the trade-offs, and make your next decision with greater clarity.</p>
          <div className="fs-actions">
            <Link className="fs-button fs-button-primary" href="/studio">Explore My Futures <ArrowRight size={17} aria-hidden="true" /></Link>
            <a className="fs-button fs-button-secondary" href="#how-it-works">See How It Works <ArrowDown size={15} aria-hidden="true" /></a>
          </div>
          <div className="fs-hero-meta"><CircleDot size={14} aria-hidden="true" /> Scenario exploration grounded in your constraints</div>
        </div>

        <div className="fs-preview" style={{ "--preview-accent": selected.color } as CSSProperties}>
          <div className="fs-preview-top">
            <div className="fs-preview-title"><GitFork size={17} aria-hidden="true" /><div>Parallel futures <small>Computer science student</small></div></div>
            <span className="fs-tag"><span /> Interactive example</span>
          </div>
          <div
            className="fs-graph"
            role="group"
            aria-label="Three futures branch from your present situation"
            onPointerMove={(event) => {
              if (event.pointerType !== "mouse") return;
              const graph = event.currentTarget;
              const bounds = graph.getBoundingClientRect();
              graph.style.setProperty("--graph-x", `${event.clientX - bounds.left}px`);
              graph.style.setProperty("--graph-y", `${event.clientY - bounds.top}px`);
            }}
          >
            <svg className="fs-graph-svg" viewBox="0 0 570 296" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <pattern id="fs-dot-pattern" width="19" height="19" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="0.85" fill="#293249" />
                </pattern>
              </defs>
              <rect width="570" height="296" fill="url(#fs-dot-pattern)" />
              <path d="M 106,150 H 144" stroke="#838bac" strokeWidth="1.3" />
              {paths.map((path, index) => (
                <g key={path.letter} style={{ opacity: active === index ? 1 : 0.62, "--branch-delay": index * 130 + "ms" } as CSSProperties} className="fs-graph-line">
                  <path d={branchCurves[index]} stroke={path.color} fill="none" strokeWidth={active === index ? 2.1 : 1.3} />
                  <path d={branchCurves[index]} pathLength="1" stroke={path.color} fill="none" strokeWidth="3.5" strokeLinecap="round" className="fs-branch-sweep" />
                  {[247, 372, 523].map((x, node) => (
                    <g key={x}>
                      <circle cx={x} cy={path.y} r={active === index ? 12 : 8} fill={path.color} opacity=".13" />
                      <circle cx={x} cy={path.y} r={node === 2 ? 6.5 : 5} fill={active === index ? path.color : "#0e1424"} stroke={path.color} strokeWidth="1.6" />
                    </g>
                  ))}
                </g>
              ))}
              <circle cx="144" cy="150" r="3" fill="#f8faff" />
            </svg>
            <div className="fs-graph-origin"><CircleDot size={15} aria-hidden="true" /><span>Today</span></div>
            {paths.map((path, index) => (
              <button className="fs-graph-path" key={path.letter} style={{ top: path.y / 296 * 100 + "%", color: path.color }} aria-pressed={index === active} onClick={() => setActive(index)} type="button">
                {path.label}
              </button>
            ))}
            <div className="fs-graph-axis"><span>Present</span><span>Month 1</span><span>Month 3</span><span>Month 6</span></div>
          </div>
          <div className="fs-preview-bottom" aria-live="polite">
            <div className="fs-preview-path">
              <span className="fs-path-icon" style={{ color: selected.color }}>{selected.letter}</span>
              <div key={selected.letter} className="fs-preview-caption"><strong>{selected.name}</strong><small>{selected.milestones.join(" → ")}</small></div>
            </div>
            <Link href="/explore?demo=1" aria-label="Open the interactive demo"><ArrowUpRight size={19} aria-hidden="true" /></Link>
          </div>
          <div className="fs-preview-context">
            <span><Clock3 size={13} aria-hidden="true" /> 12 hours/week</span>
            <span><CalendarDays size={13} aria-hidden="true" /> 6-month horizon</span>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="fs-section fs-shell" aria-labelledby="fs-how-title">
        <div className="fs-section-label">THE PROCESS</div>
        <h2 id="fs-how-title">From open question to a plan you can test.</h2>
        <div className="fs-feature-grid">
          {features.map(({ number, icon: Icon, title, description }) => (
            <article className="fs-feature" key={number}>
              <div className="fs-feature-top"><Icon size={20} aria-hidden="true" /><span>{number}</span></div>
              <h3>{title}</h3><p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="fs-section fs-shell" aria-labelledby="fs-example-title">
        <div className="fs-section-label">SAMPLE DECISION</div>
        <div className="fs-section-heading">
          <h2 id="fs-example-title">Where should I spend the next six months?</h2>
          <Link className="fs-button fs-button-secondary" href="/explore?demo=1">Open demo <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </div>
        <p className="fs-section-description">A second-year computer science student has 12 hours a week. See how those hours might translate into projects, interview practice, or a first customer pilot.</p>
        <div className="fs-compare-grid">
          {paths.map((path, index) => (
            <article className="fs-compare-card" key={path.letter} data-selected={index === active}>
              <button aria-pressed={index === active} type="button" onClick={() => setActive(index)}>
                <span className="fs-path-icon" style={{ color: path.color }}>{path.letter}</span><strong>{path.name}</strong>
              </button>
              <p>{path.summary}</p>
              <dl>
                <div><dt>Effort</dt><dd>{path.effort}</dd></div>
                <div><dt>Opportunity</dt><dd>{path.upside}</dd></div>
                <div><dt>Trade-off</dt><dd>{path.tradeoff}</dd></div>
              </dl>
            </article>
          ))}
        </div>
        <div className="fs-compare-note" aria-live="polite"><CircleDot size={15} style={{ color: selected.color }} aria-hidden="true" /><span><strong>{selected.name} milestones</strong> {selected.milestones.join(" → ")}</span></div>
      </section>

      <section className="fs-section fs-shell fs-highlight" aria-labelledby="fs-highlight-title">
        <div>
          <div className="fs-section-label">INSIDE THE WORKSPACE</div>
          <h2 id="fs-highlight-title">Ask the question the timeline can’t answer.</h2>
          <p className="fs-section-description">Ask an imagined future self what was difficult, what they might have sacrificed, or what they would do this week. Their answers draw on the path you’re exploring.</p>
          <Link href="/explore?demo=1" className="fs-highlight-link">Open sample workspace <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
        <figure className="fs-voice-preview">
          <figcaption><Sparkles size={17} aria-hidden="true" /> Future voice <span>Illustrative exchange</span></figcaption>
          <blockquote>“What should I start doing today?”</blockquote>
          <p>“I’d pick one public dataset and block two notebook sessions. Start with a simple baseline and write down how you’ll check for data leakage.”</p>
        </figure>
      </section>
      <section className="fs-shell fs-final">
        <div><div className="fs-section-label">YOUR NEXT MOVE</div><h2>Give your decision room to branch.</h2></div>
        <Link className="fs-button fs-button-primary" href="/studio">Explore My Futures <ArrowRight size={17} aria-hidden="true" /></Link>
      </section>
      <footer className="fs-footer">
        <div className="fs-shell">
          <Link href="/" className="fs-brand"><span className="fs-brand-mark"><GitFork size={17} aria-hidden="true" /></span><span>FutureSelf<span className="fs-brand-ai"> AI</span></span></Link>
          <p>One Decision. Multiple Futures.</p>
          <Link href="/studio">Decision Studio <ArrowUpRight size={14} aria-hidden="true" /></Link>
        </div>
      </footer>
    </div>
  );
}
