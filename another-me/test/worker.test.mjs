import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/worker.js";

const encoder = new TextEncoder();

function streamOf(text) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

function requestFor(messages) {
  return new Request("https://example.test/qroom-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
}

test("streams the primary model response", async () => {
  const models = [];
  const inputs = [];
  const env = {
    CHAT_MODEL: "@cf/moonshotai/kimi-k2.6",
    CHAT_FALLBACK_MODEL: "fallback-model",
    AI: {
      async run(model, input) {
        models.push(model);
        inputs.push(input);
        return streamOf("你好");
      },
    },
  };

  const response = await worker.fetch(requestFor([{ role: "user", content: "你好" }]), env, {});
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /^text\/event-stream/);
  assert.deepEqual(models, ["@cf/moonshotai/kimi-k2.6"]);
  assert.deepEqual(inputs[0].chat_template_kwargs, { thinking: false });
  assert.equal(inputs[0].max_completion_tokens, 400);
  assert.equal("max_tokens" in inputs[0], false);
  assert.match(await response.text(), /你好/);
});

test("falls back when the primary model fails", async () => {
  const models = [];
  const env = {
    CHAT_MODEL: "primary-model",
    CHAT_FALLBACK_MODEL: "fallback-model",
    AI: {
      async run(model) {
        models.push(model);
        if (model === "primary-model") throw new Error("primary unavailable");
        return streamOf("备用模型已连接");
      },
    },
  };

  const response = await worker.fetch(requestFor([{ role: "user", content: "在吗" }]), env, {});
  assert.equal(response.status, 200);
  assert.deepEqual(models, ["primary-model", "fallback-model"]);
  assert.match(await response.text(), /备用模型已连接/);
});

test("rejects a request that does not end with a user message", async () => {
  const response = await worker.fetch(requestFor([{ role: "assistant", content: "你好" }]), {}, {});
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "a user message is required" });
});

test("rejects an oversized request before model inference", async () => {
  const response = await worker.fetch(
    requestFor([{ role: "user", content: "x".repeat(40_000) }]),
    {},
    {},
  );
  assert.equal(response.status, 413);
});
