import assert from "node:assert/strict";
import { test } from "node:test";
import { POST } from "../app/api/conversation/route";
import { demoInput, demoScenarios, maxConversationReplyLength } from "../lib/demo";

test("a long demo conversation reply can be sent back as follow-up history", async () => {
  const scenario = {
    ...demoScenarios[0],
    skills: ["🔍".repeat(1000), "🧪".repeat(1000)],
  };
  const ask = (question: string, history?: { role: "assistant"; content: string }[]) => POST(
    new Request("http://localhost/api/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: demoInput, scenario, demo: true, question, history }),
    }),
  );

  const first = await ask("What skills would I learn?");
  assert.equal(first.status, 200);
  const { answer, source } = await first.json() as { answer: string; source: string };
  assert.equal(source, "demo");
  assert.ok(answer.length <= maxConversationReplyLength);
  assert.ok(answer.isWellFormed());
  assert.match(answer, /…$/);

  const followUp = await ask("What would be the hardest part?", [{ role: "assistant", content: answer }]);
  assert.equal(followUp.status, 200);
  assert.match((await followUp.json()).answer, /risk/);
});
