import { z } from "zod";

const defaultModel = "gpt-6-luna";

export function hasLiveModel() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export class ModelError extends Error {
  constructor(public readonly code: "rate-limit" | "timeout" | "unavailable" | "invalid" | "refusal") {
    super(code);
  }
}

const responseSchema = z.object({
  status: z.string(),
  output: z.array(z.object({
    type: z.string(),
    content: z.array(z.object({
      type: z.string(),
      text: z.string().optional(),
    })).optional(),
  })),
});

export async function generateStructured<Schema extends z.ZodType>(
  name: string,
  schema: Schema,
  instructions: string,
  input: unknown,
  maxOutputTokens: number,
  signal: AbortSignal,
  reasoningEffort: "none" | "low" = "none",
): Promise<z.output<Schema>> {
  const model = process.env.OPENAI_MODEL?.trim() || defaultModel;
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new ModelError("unavailable");
  const { $schema: schemaVersion, ...jsonSchema } = z.toJSONSchema(schema, {
    target: "draft-7",
    override: ({ jsonSchema }) => {
      // Keep length limits in the runtime parser for models with a smaller schema subset.
      delete jsonSchema.minLength;
      delete jsonSchema.maxLength;
    },
  });
  void schemaVersion;
  const timeout = AbortSignal.timeout(35_000);
  let body: unknown;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: AbortSignal.any([timeout, signal]),
      cache: "no-store",
      body: JSON.stringify({
        model, instructions, input: JSON.stringify(input), store: false, max_output_tokens: maxOutputTokens,
        ...(model === defaultModel ? { reasoning: { effort: reasoningEffort } } : {}),
        text: { format: { type: "json_schema", name, strict: true, schema: jsonSchema } },
      }),
    });
    if (response.status === 429) throw new ModelError("rate-limit");
    if (!response.ok) throw new ModelError("unavailable");
    body = await response.json();
  } catch (error) {
    if (error instanceof ModelError) throw error;
    if (timeout.aborted) throw new ModelError("timeout");
    if (error instanceof SyntaxError) throw new ModelError("invalid");
    throw new ModelError("unavailable");
  }

  const payload = responseSchema.safeParse(body);
  if (!payload.success || payload.data.status !== "completed") throw new ModelError("invalid");
  const content = payload.data.output.flatMap((item) => item.type === "message" ? item.content ?? [] : []);
  if (content.some((item) => item.type === "refusal")) throw new ModelError("refusal");
  const text = content.filter((item) => item.type === "output_text").map((item) => item.text ?? "").join("");
  try {
    return schema.parse(JSON.parse(text));
  } catch {
    throw new ModelError("invalid");
  }
}

export function fallbackReason(error: unknown) {
  const reasons = {
    "rate-limit": "OpenAI is rate-limited. Try the live request again shortly.",
    timeout: "The live request timed out. Try again when ready.",
    unavailable: "The live model is unavailable. Try again when ready.",
    invalid: "The live model returned an incomplete or invalid result. Try again.",
    refusal: "The live model declined this request. Revise the input before trying again.",
  };
  return reasons[error instanceof ModelError ? error.code : "unavailable"];
}
