import assert from "node:assert/strict";
import { test } from "node:test";
import { POST as scenarios } from "../app/api/scenarios/route";
import { POST as conversation } from "../app/api/conversation/route";
import { demoInput, demoScenarios } from "../lib/demo";
import { scenarioSetSchema } from "../lib/domain";

function request(body: unknown) {
  return new Request("http://localhost/api", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}

test("scenario route rejects malformed JSON and invalid constraints", async () => {
  const malformed = new Request("http://localhost/api", { method: "POST", body: "{" });
  assert.equal((await scenarios(malformed)).status, 400);
  const response = await scenarios(request({ input: { ...demoInput, hours: -1 } }));
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /input.hours/);
});

test("explicit demo mode returns exactly three validated paths", async () => {
  const response = await scenarios(request({ input: demoInput, demo: true }));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.source, "demo");
  assert.equal(scenarioSetSchema.safeParse(result.scenarios).success, true);
});

test("conversation route returns a labeled and grounded demo reply", async () => {
  const response = await conversation(request({
    input: demoInput, demo: true, scenario: demoScenarios[0], question: "What should I start today?",
  }));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.source, "demo");
  assert.match(result.answer, /imagined/);
  assert.ok(result.answer.includes(demoScenarios[0].nextSteps[0]));
});

test("live scenario route requests strict structured output and validates the model response", async (t) => {
  const key = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key";
  t.after(() => {
    if (key === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = key;
  });

  const mockedFetch = t.mock.method(globalThis, "fetch", async () => Response.json({
    status: "completed",
    output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ scenarios: demoScenarios }) }] }],
  }));

  const response = await scenarios(request({ input: demoInput }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).source, "ai");
  const calls = mockedFetch.mock.calls as unknown as { arguments: [string, RequestInit] }[];
  assert.equal(calls[0].arguments[0], "https://api.openai.com/v1/responses");
  const body = JSON.parse(String(calls[0].arguments[1].body));
  assert.equal(body.text.format.strict, true);
  assert.equal(body.text.format.schema.additionalProperties, false);
  assert.deepEqual(body.text.format.schema.required, ["scenarios"]);
  const scenarioList = body.text.format.schema.properties.scenarios;
  assert.equal(scenarioList.minItems, 3);
  assert.equal(scenarioList.maxItems, 3);
  assert.equal(scenarioList.items.properties.effortHours.exclusiveMinimum, 0);
  assert.equal(body.store, false);

  mockedFetch.mock.mockImplementationOnce(async () => Response.json({}, { status: 429 }));
  const limited = await scenarios(request({ input: demoInput }));
  const limitedResult = await limited.json();
  assert.equal(limitedResult.source, "demo");
  assert.match(limitedResult.message, /rate-limited/);

  mockedFetch.mock.mockImplementationOnce(async () => Response.json({
    status: "completed",
    output: [{ type: "message", content: [{ type: "output_text", text: '{"scenarios":[]}' }] }],
  }));
  const previous = { input: demoInput, scenarios: demoScenarios };
  const invalid = await scenarios(request({ input: { ...demoInput, hours: 5 }, previous }));
  const invalidResult = await invalid.json();
  assert.equal(invalidResult.source, "previous");
  assert.deepEqual(invalidResult.scenarios, demoScenarios);
  assert.match(invalidResult.message, /invalid/);

  const beyondHorizon = await scenarios(request({ input: { ...demoInput, months: 3 } }));
  assert.equal((await beyondHorizon.json()).source, "demo");

  mockedFetch.mock.mockImplementationOnce(async () => Response.json({
    status: "completed",
    output: [{ type: "message", content: [{ type: "refusal", refusal: "Declined" }] }],
  }));
  const refused = await scenarios(request({ input: demoInput }));
  assert.match((await refused.json()).message, /declined/);
});
