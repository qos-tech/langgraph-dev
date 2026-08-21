import assert from "node:assert/strict";

process.env.NVIDIA_API_KEY = "test-key";
process.env.NVIDIA_BASE_URL = "https://nvidia.test/v1";

type FetchCall = { input: string; init: RequestInit | undefined };
type MockReply = {
  status?: number;
  body: unknown | string;
  headers?: Record<string, string>;
};

const calls: FetchCall[] = [];
let replies: MockReply[] = [];
const originalFetch = globalThis.fetch;

globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  calls.push({ input: String(input), init });
  const reply = replies.shift();
  if (!reply) throw new Error("Mock fetch called without queued reply.");
  return new Response(
    typeof reply.body === "string" ? reply.body : JSON.stringify(reply.body),
    {
      status: reply.status ?? 200,
      headers: { "Content-Type": "application/json", ...reply.headers },
    },
  );
}) as typeof fetch;

const { NvidiaProvider, callNvidiaJson } = await import(
  "./providers/nvidia.js"
);

function queue(...items: MockReply[]) {
  replies = [...items];
  calls.length = 0;
}

function success(content: string, usage?: Record<string, number>) {
  return {
    choices: [{ message: { role: "assistant", content }, finish_reason: "stop" }],
    ...(usage ? { usage } : {}),
  };
}

function requestBody(index = 0): Record<string, unknown> {
  const raw = calls[index]?.init?.body;

  if (typeof raw !== "string") {
    throw new Error(`Expected request body at call ${index} to be a string.`);
  }

  return JSON.parse(raw) as Record<string, unknown>;
}

try {
  queue({ body: success('{"ok":true}', { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 }) });
  const base = await callNvidiaJson("vendor/model", "hello", (v) => v as { ok: boolean }, {
    maxTokens: 321,
    maxRetries: 0,
  });
  assert.deepEqual(base.data, { ok: true });
  assert.equal(calls[0]?.input, "https://nvidia.test/v1/chat/completions");
  const headers = new Headers(calls[0]?.init?.headers);
  assert.equal(headers.get("authorization"), "Bearer test-key");
  const body = requestBody();
  assert.equal(body.model, "vendor/model");
  assert.deepEqual(body.messages, [{ role: "user", content: "hello" }]);
  assert.equal(body.temperature, 0);
  assert.equal(body.max_tokens, 321);
  assert.equal(body.stream, false);

  queue({ body: success('{"ok":true}') });
  await callNvidiaJson("nvidia/nemotron-example", "prompt", (v) => v, { maxRetries: 0 });
  assert.deepEqual(requestBody().chat_template_kwargs, { thinking: false });

  queue({ body: success('{"ok":true}') });
  await callNvidiaJson("openai/gpt-oss-20b", "prompt", (v) => v, { maxRetries: 0 });
  assert.equal(requestBody().reasoning_effort, "low");

  queue({ body: success('```json\n{"value":42}\n```') });
  const fenced = await callNvidiaJson("vendor/model", "prompt", (v) => v as { value: number }, { maxRetries: 0 });
  assert.deepEqual(fenced.data, { value: 42 });

  queue({ body: success('Result follows:\n{"value":7}') });
  const embedded = await callNvidiaJson(
    "vendor/model",
    "prompt",
    (v) => v as { value: number },
    { maxRetries: 0 },
  );
  assert.deepEqual(embedded.data, { value: 7 });

  queue({
    body: success(
      'prefix {"outer":{"text":"brace } inside string"},"items":[1,2]} suffix',
    ),
  });
  const balanced = await callNvidiaJson(
    "vendor/model",
    "prompt",
    (v) => v as { outer: { text: string }; items: number[] },
    { maxRetries: 0 },
  );
  assert.deepEqual(balanced.data, {
    outer: { text: "brace } inside string" },
    items: [1, 2],
  });

  queue({ body: success("not-json") });
  await assert.rejects(
    () => callNvidiaJson("vendor/model", "prompt", (v) => v, { maxRetries: 0 }),
    /Não foi possível extrair JSON válido/,
  );

  queue({ body: success('{"wrong":true}') });
  await assert.rejects(
    () => callNvidiaJson("vendor/model", "prompt", () => { throw new Error("schema failed"); }, { maxRetries: 0 }),
    /não passou na validação/,
  );

  queue({ status: 410, body: { error: "gone" } });
  await assert.rejects(
    () => callNvidiaJson("vendor/model", "prompt", (v) => v, { maxRetries: 0 }),
    /NVIDIA HTTP 410/,
  );
  assert.equal(calls.length, 1);

  queue({ status: 429, body: { error: "rate limited" }, headers: { "retry-after": "0" } });
  await assert.rejects(
    () => callNvidiaJson("vendor/model", "prompt", (v) => v, { maxRetries: 0 }),
    /NVIDIA HTTP 429 após 1 tentativa/,
  );
  assert.equal(calls.length, 1);

  queue({
    body: { choices: [{ message: { role: "assistant", content: "", reasoning_content: "internal reasoning" } }] },
  }, { body: success('{"recovered":true}') });
  const recovered = await callNvidiaJson(
    "openai/gpt-oss-20b",
    "original prompt",
    (v) => v as { recovered: boolean },
    { maxTokens: 100, maxRetries: 0 },
  );
  assert.deepEqual(recovered.data, { recovered: true });
  assert.equal(calls.length, 2);
  assert.equal(requestBody(1).max_tokens, 2000);
  assert.equal(requestBody(1).reasoning_effort, "low");


  // Step 4: the contract adapter must preserve structured behavior while
  // normalizing token usage into the provider-neutral contract.
  queue({
    body: success('{"adapter":true}', {
      prompt_tokens: 11,
      completion_tokens: 6,
      total_tokens: 17,
    }),
  });

  const provider = new NvidiaProvider();

  const adapterResult = await provider.generateStructured({
    model: "vendor/model",
    prompt: "adapter prompt",
    validate: (v) => v as { adapter: boolean },
    providerHints: {
      maxOutputTokens: 777,
      transportRetries: 0,
    },
  });

  assert.deepEqual(adapterResult.data, {
    adapter: true,
  });

  assert.deepEqual(adapterResult.usage, {
    promptTokens: 11,
    completionTokens: 6,
    totalTokens: 17,
  });

  const adapterBody = requestBody();
  assert.equal(adapterBody.model, "vendor/model");
  assert.equal(adapterBody.max_tokens, 777);
  assert.deepEqual(adapterBody.messages, [
    {
      role: "user",
      content: "adapter prompt",
    },
  ]);

  console.log("✅ H-ARCH-002 Step 1 provider characterization tests passed.");
} finally {
  globalThis.fetch = originalFetch;
}
