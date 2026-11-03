import { z } from "zod";

const maxBytes = 512 * 1024;

export async function readInput<Schema extends z.ZodType>(request: Request, schema: Schema) {
  const reader = request.body?.getReader();
  if (!reader) return { error: Response.json({ error: "Provide a JSON request body." }, { status: 400 }) } as const;
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        return { error: Response.json({ error: "Request body is too large." }, { status: 413 }) } as const;
      }
      chunks.push(value);
    }
    const decoder = new TextDecoder();
    const body = chunks.map((chunk) => decoder.decode(chunk, { stream: true })).join("") + decoder.decode();
    const result = schema.safeParse(JSON.parse(body));
    if (result.success) return { data: result.data } as const;
    const issue = result.error.issues[0];
    return { error: Response.json({ error: `Invalid ${issue.path.join(".") || "request"}: ${issue.message}` }, { status: 400 }) } as const;
  } catch {
    return { error: Response.json({ error: "Provide a valid JSON request body." }, { status: 400 }) } as const;
  } finally {
    reader.releaseLock();
  }
}
