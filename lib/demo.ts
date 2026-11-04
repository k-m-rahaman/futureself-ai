import type { DecisionInput, Milestone, Scenario } from "./domain";

export const demoInput: DecisionInput = {
  situation: "I’m a second-year computer science student.",
  decision: "Should I focus on AI/ML, data structures and algorithms, or building a startup?",
  goals: "Build practical skills, strengthen my internship prospects, and find work I enjoy.",
  skills: "Introductory Python, basic data structures, and two class projects.",
  hours: 12,
  budget: 150,
  risk: "Moderate",
  months: 6,
  skillLevel: "Beginner",
  priorities: "Internship readiness and hands-on experience",
};

export const examples: { label: string; input: DecisionInput }[] = [
  { label: "Student", input: demoInput },
  { label: "Professional", input: { ...demoInput, situation: "I’m a product analyst with three years of experience.", decision: "Pursue management, move into product design, or stay in analytics?", goals: "Develop more autonomy and make use of my existing skills.", skills: "SQL, workshop facilitation, and reporting", hours: 7, budget: 300, skillLevel: "Intermediate", priorities: "Stability and ownership" } },
  { label: "Entrepreneur", input: { ...demoInput, situation: "I’ve validated a small software idea with several customers.", decision: "Bootstrap the product, look for a cofounder, or offer it as a service?", goals: "Test demand without exceeding my runway.", skills: "Prototyping, customer interviews", hours: 18, budget: 1200, risk: "High", skillLevel: "Intermediate", priorities: "Customer evidence and a manageable burn rate" } },
  { label: "Creator", input: { ...demoInput, situation: "I publish essays about design in my spare time.", decision: "Launch a newsletter, make short videos, or build a paid workshop?", goals: "Find a sustainable publishing rhythm and deepen my relationship with readers.", skills: "Writing, editing, visual storytelling", hours: 6, budget: 200, priorities: "Creative control and consistency" } },
];

function milestone(id: string, title: string, month: number, effortHours: number, details: string, action: string, dependency: string, risk: string, opportunity: string, assumption: string): Milestone {
  return { id, title, month, effortHours, details, actions: [action], dependencies: [dependency], risks: [risk], opportunities: [opportunity], assumptions: [assumption] };
}

export const demoScenarios: Scenario[] = [
  {
    id: "ai-ml", name: "AI / ML", tagline: "Build a portfolio through applied machine learning",
    narrative: "You spend the semester learning to evaluate models and explain their limitations. By the end, you could have a small portfolio project you can defend in an interview, including the decisions that made it reproducible.",
    assumptions: ["You can use a public dataset and work locally on a CPU.", "You have enough Python experience to modify a notebook."],
    effortHours: 220, cost: 75, skills: ["Python", "Model evaluation", "Data preparation"],
    flexibility: "High during coursework. A small dataset keeps the project easy to rescope.",
    alignment: "Produces a practical portfolio artifact and helps test interest in applied ML.",
    opportunities: ["Get feedback from a faculty member or campus ML group."],
    risks: ["A project can look polished while using an unreliable evaluation split."],
    tradeoffs: ["Less time for interview drills or customer discovery."],
    milestones: [
      milestone("baseline", "Build a baseline", 1, 40, "Train a simple classifier on a public dataset and document a held-out test split.", "Write a notebook that compares the model with a majority-class baseline.", "An open dataset with clear license terms", "Data leakage may inflate evaluation results.", "Discover whether the task is worth improving.", "A local notebook can handle the dataset."),
      milestone("model-study", "Investigate model errors", 3, 70, "Audit mistakes, compare two feature sets, and explain which errors matter.", "Manually inspect a sample of held-out errors.", "A reproducible baseline and test split", "Feature tuning may inadvertently contaminate the test set.", "Practice explaining model limitations.", "The dataset supports meaningful error categories."),
      milestone("case-study", "Publish a case study", 6, 110, "Share the experiment, reproducible instructions, and model limitations.", "Ask a peer to reproduce the notebook before sharing it.", "A reviewer and a public repository", "Polish can crowd out reproducibility work.", "Show your reasoning in internship conversations.", "You can publish the work under the data license."),
    ],
    alternatives: ["Publish a smaller baseline-and-error-analysis case study if the model comparison slips."],
    uncertainties: ["You may prefer data engineering once you try cleaning and evaluating real data."],
    nextSteps: ["Pick one public tabular dataset.", "Reserve two short notebook sessions.", "Write down how you will identify data leakage."],
  },
  {
    id: "dsa", name: "Algorithms & DSA", tagline: "Build fluency for coding interviews",
    narrative: "You develop a consistent problem-solving routine and practice explaining your choices under time pressure. The clearest evidence of progress would be solving an unfamiliar problem with less prompting.",
    assumptions: ["Coding interviews are relevant to some roles you want.", "You can find a peer for practice."],
    effortHours: 170, cost: 0, skills: ["Algorithmic reasoning", "Complexity analysis", "Technical communication"],
    flexibility: "High. Individual practice blocks can move around your class schedule.",
    alignment: "Supports internship preparation through deliberate interview practice.",
    opportunities: ["Form a peer practice group and trade mock interviews."],
    risks: ["Memorizing solutions can hide gaps in reasoning."],
    tradeoffs: ["Steady practice creates fewer public artifacts than a portfolio project."],
    milestones: [
      milestone("diagnostic", "Map your skill gaps", 1, 25, "Sample unfamiliar array, graph, and recursion problems and record where you get stuck.", "Make a short diagnostic log with hints used and complexity explanations.", "A free practice problem archive", "Familiar prompts can give a misleading baseline.", "Identify the patterns that deserve more practice.", "The problem archive provides varied prompts."),
      milestone("practice", "Build a practice rhythm", 3, 60, "Use spaced repetition to revisit missed patterns and explain alternatives aloud.", "Create a weekly review list with a mix of new and missed problems.", "A diagnostic log", "Accumulating solved problems may distract from retention.", "Identify transferable patterns across topics.", "You can protect at least one recurring practice block."),
      milestone("interviews", "Run mock interviews", 6, 85, "Complete timed practice with feedback on communication, correctness, and testing.", "Schedule a mock with a peer and ask for feedback on your reasoning.", "A practice partner", "Time pressure may obscure specific technical gaps.", "Gather useful evidence before applying for interviews.", "A peer can offer candid feedback."),
    ],
    alternatives: ["Keep a narrow practice routine and document an implementation project alongside it."],
    uncertainties: ["Target employers may assess skills through take-home projects instead."],
    nextSteps: ["Try three unfamiliar problems.", "Track why you needed each hint.", "Ask a classmate to trade a mock interview."],
  },
  {
    id: "startup", name: "Entrepreneurship", tagline: "Test a real problem with a small experiment",
    narrative: "You learn to turn an observation into a testable idea. With careful scoping, you could end the semester with evidence about a customer problem and a prototype that makes the next decision easier.",
    assumptions: ["You can reach people experiencing the problem.", "A manual test is possible before building software."],
    effortHours: 260, cost: 120, skills: ["Customer discovery", "Rapid prototyping", "Prioritization"],
    flexibility: "Moderate. Customer availability affects scheduling, but prototype scope is adjustable.",
    alignment: "Builds practical experience and reveals whether you enjoy working through ambiguity.",
    opportunities: ["Find a project partner through campus communities."],
    risks: ["Friends may express interest without adopting the product."],
    tradeoffs: ["Unstructured work leaves less time for predictable interview preparation."],
    milestones: [
      milestone("interviews-startup", "Interview potential users", 1, 35, "Talk to people who experience the same problem and document their current workaround.", "Invite classmates to short, open-ended interviews.", "Access to people in one target group", "Leading questions could bias feedback.", "Find a narrow problem worth testing.", "You can recruit people outside your immediate circle."),
      milestone("prototype", "Test a manual prototype", 3, 95, "Offer a small service or clickable mock-up and observe actual use.", "Define one behavior you can observe during a short test.", "A credible recurring problem from interviews", "People may try a free prototype once and never return.", "Identify what users value before writing production code.", "A prototype can deliver part of the value manually."),
      milestone("go-no-go", "Make a continue-or-stop decision", 6, 130, "Use repeated usage and feedback to choose whether to continue, change scope, or pause.", "Summarize actual usage and write the next decision with its supporting evidence.", "Enough participation to observe repeat behavior", "A small group may not represent a broader market.", "Turn the experiment into a concrete project story.", "Participants agree to a follow-up."),
    ],
    alternatives: ["Keep the interviews and prototype as a case study if usage fails to repeat."],
    uncertainties: ["Interest, usage, and willingness to pay may tell different stories."],
    nextSteps: ["Write a one-sentence problem hypothesis.", "Recruit interviewees who already face the problem.", "Choose a date and an observable stop condition."],
  },
];

export function demoFor(input: DecisionInput): Scenario[] {
  if (input.decision === demoInput.decision) return demoScenarios;
  const reference = input.decision.length > 140 ? `${input.decision.slice(0, 140)}…` : input.decision;
  const goal = input.goals.length > 140 ? `${input.goals.slice(0, 140)}…` : input.goals;
  return [
    { id: "small-trial", name: "Run a small trial", tagline: "Buy evidence with a reversible commitment", effort: [8, 24, 18], cost: 0, action: "Choose one assumption to test in a one-week trial.", skill: "Experiment design", risk: "A short trial may miss longer-term effects.", tradeoff: "Less early momentum in exchange for a lower cost of changing course.", alignment: "Find a useful signal before investing more time." },
    { id: "deep-commitment", name: "Commit to one direction", tagline: "Develop depth around a single priority", effort: [22, 70, 52], cost: 100, action: "Write the strongest argument for one option and identify its hardest requirement.", skill: "Focused execution", risk: "An early commitment can make contradictory evidence easier to ignore.", tradeoff: "More depth, with higher switching costs.", alignment: "Turn a priority into observable progress by protecting recurring time." },
    { id: "parallel-test", name: "Compare two options", tagline: "Keep your options open while you gather evidence", effort: [14, 40, 35], cost: 30, action: "Pick two options and define one comparable trial for each.", skill: "Comparative analysis", risk: "Splitting attention can slow progress on both options.", tradeoff: "More context before choosing, with slower progress on any one option.", alignment: "Learn which option fits your goals and available effort." },
  ].map((path) => {
    const assumptions = ["The listed hours and USD costs are sample planning estimates.", "You can define one observable outcome and revisit it after the trial."];
    return {
      id: path.id, name: path.name, tagline: path.tagline,
      narrative: `Sample decision strategy for “${reference}” with this goal in mind: “${goal}”`,
      assumptions, effortHours: path.effort.reduce((sum, hours) => sum + hours, 0), cost: path.cost,
      skills: [path.skill], flexibility: path.tradeoff, alignment: path.alignment,
      opportunities: [path.alignment], risks: [path.risk], tradeoffs: [path.tradeoff],
      milestones: [
        milestone("scope", "Define your test", 1, path.effort[0], path.action, path.action, "A written description of the options", path.risk, path.alignment, assumptions[1]),
        milestone("trial", "Gather first evidence", 2, path.effort[1], "Record actual time, money, and outcomes for the test.", "Write one observation after every work session.", "A test and a review date", path.risk, path.alignment, assumptions[1]),
        milestone("review", "Decide what to carry forward", 3, path.effort[2], "Review your observations against your stated goal.", "Choose what to continue, adjust, or pause.", "A record of actual outcomes", path.risk, path.alignment, assumptions[1]),
      ],
      alternatives: ["Extend the trial or narrow the scope if the evidence is mixed."],
      uncertainties: ["Actual effort and results depend on the chosen activity and available support."],
      nextSteps: [path.action, "Set a review date.", "Write down what would justify changing direction."],
    };
  });
}

export const maxConversationReplyLength = 3500;

export function demoChat(scenario: Scenario, question: string): string {
  const answer = buildDemoReply(scenario, question);
  if (answer.length <= maxConversationReplyLength) return answer;
  const excerpt = answer.slice(0, maxConversationReplyLength - 1);
  // A UTF-16 boundary can fall in the middle of an emoji or another supplementary character.
  const tail = excerpt.charCodeAt(excerpt.length - 1);
  const completeExcerpt = tail >= 0xd800 && tail <= 0xdbff ? excerpt.slice(0, -1) : excerpt;
  return completeExcerpt.trimEnd() + "…";
}

function buildDemoReply(scenario: Scenario, question: string): string {
  const query = question.toLowerCase();
  const framing = "In this imagined version of your future, ";
  if (/hard|challenge|risk|mistake|obstacle/.test(query)) return `${framing}I would have kept a close eye on this risk: ${scenario.risks[0]} I’d use “${scenario.milestones[0].title}” to see how it shows up early.`;
  if (/sacrific|cost|trade.?off|miss|give up/.test(query)) return `${framing}the trade-off I would revisit is this: ${scenario.tradeoffs[0]} I’d test it before increasing my commitment.`;
  if (/start|today|first|step|now/.test(query)) return `${framing}I’d start here: ${scenario.nextSteps[0]} Then I’d check whether this assumption holds: ${scenario.assumptions[0]}`;
  if (/learn|skill|experience/.test(query)) return `${framing}I could practice ${scenario.skills.join(", ")}. The first concrete practice would be “${scenario.milestones[0].title}.”`;
  return `${framing}I’d come back to the goal of this path: ${scenario.alignment} One open question is this: ${scenario.uncertainties[0]} What would give you evidence this week?`;
}
