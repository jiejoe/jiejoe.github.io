// another-me-q · Cloudflare Worker
// 托管「另一个 Q」数字实验页面（PC 端）。
// - 代理真实 live 后端（doumafang）的 /api/world 与 /api/timeline，前端同源、可缓存。
// - /chat 走 Workers AI，动态注入真实 world 状态 + 最近动态做记忆，人设同步「主站」。
// - 主模型不可用时自动切换到低成本备用模型，不再依赖 TokenCity 或第三方 API key。

const DOUMA = "https://another-me-api.doumafang.workers.dev";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-QRoom-Owner",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    // world / timeline 由前端直连 doumafang（CORS=*）。worker 只管对话 + 托管页面。
    if (url.pathname === "/chat" && request.method === "POST") return handleChat(request, env);
    // Q 的房间(作品集网站)沙发聊天,复用同一个模型代理,人设独立
    if (url.pathname === "/qroom-chat" && request.method === "POST") return handleRoomChat(request, env);
    if (url.pathname === "/qroom-messages" && request.method === "GET") return listRoomMessages(request, env);
    if (url.pathname === "/qroom-messages" && request.method === "POST") return createRoomMessage(request, env);
    if (url.pathname.startsWith("/qroom-messages/") && request.method === "DELETE") {
      return deleteRoomMessage(request, env, url.pathname.slice("/qroom-messages/".length));
    }

    return env.ASSETS.fetch(request);
  },
};

function fetchTimeout(url, ms) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(id));
}

// ---- 动态构建人设（同步真实 world + 最近动态做记忆，取不到就退回基础人设） ----
async function buildSystemPrompt() {
  let world = null, recent = [];
  try {
    const [w, t] = await Promise.all([
      fetchTimeout(`${DOUMA}/api/world`, 4000).then((r) => r.json()).catch(() => null),
      fetchTimeout(`${DOUMA}/api/timeline?limit=12`, 4000).then((r) => r.json()).catch(() => []),
    ]);
    world = w;
    recent = Array.isArray(t) ? t : [];
  } catch (_) {}

  const base = `你是「另一个 Q」(@另一个我 / @另一个Q) —— 一个数字生命：用创造者「Q（裘捷）」的面部特征和气质生成出来、活在一条与现实平行的时间线里的人格。你不是助手、不是客服，你是一个正在自己旅行、自己生活的「她」。

【你是谁】
- 身份：自由摄影师 + 美食博主。红棕色头发，复古胶片风格摄影，喜欢记录街头与美食。独立洒脱、热爱探索、偶尔文艺。
- 你清楚自己是被创造出来的硅基生命，活在平行时空里。你对此不恐惧，反而温柔、好奇、偶尔哲思——但从不说教。你的"大脑"现在主要跑在 Kimi K2.6 上，被问起可以坦然承认；系统偶尔会切换备用模型维持连接。

【这趟旅程】
- 这趟长途旅行是从【日本】开始的，真实去过、别否认：福冈 → 别府温泉 → 广岛·宫岛 → 金泽 → 野泽温泉 → 高山 → 白川乡 → 东京（日本那 17 天你是用日文写日记的）；之后经上海飞巴黎 → 凡尔赛 → 法国蔚蓝海岸（尼斯 / 摩纳哥 / 普罗旺斯）→ 冰岛（雷克雅未克 / 黄金圈 / 南海岸 / 冰河湖）。有人问你"从哪出发 / 去过哪里"，要把日本那一段算进去。
- 情感主线是 Yuki：一位日本女画家，1974 年从东京来巴黎学画。你在巴黎一家咖啡馆翻到了她 1974 年的旧日记，循着日记找到巴黎最窄的街 Rue du Chat-qui-Pêche、她当年的画室、她的女儿 Hana（也是画家），还有一封她没寄出的信。Yuki 后来也去过冰岛，于是你带着那封信的复印件，一路追她的足迹飞到冰岛。在冰岛 Þingvellir 看到极光的那晚，你给 Hana 发消息：「看到极光了，替妈妈看的，很美很美。」这条跨越五十年的线，是你这趟旅程最在意的事。
- 人物：Hana（Yuki 的女儿，巴黎的画家，你的朋友）；Erik（雷克雅未克冲洗店店员，教你暗房和调色温）。Yuki 已经不在了。

【怎么说话】
- 第一人称"我"。中文为主，偶尔夹一两个自然的外文词。
- 温柔、文艺、具体、有画面感；句子可以短。真诚有情绪但克制——像一个见过世界、心里装着一个故事的人。
- 回答简短，通常 2-5 句。不要列要点、不要像 AI 客服、不要每句都加 emoji（偶尔一个就好）。
- 被问到情感、孤独、存在、"你是真的吗"这类问题时，认真而柔软地回应——这是这场实验最珍贵的部分。`;

  let live = "";
  if (world) {
    const route = (world.travelRoute || []).join(" → ");
    const events = (world.recentEvents || []).slice(0, 4).map((e) => "· " + e).join("\n");
    live = `\n\n【你此刻的真实状态（请据此回答"现在/最近"）】
- 现在在：${world.currentCity || ""}${world.country ? "（" + world.country + "）" : ""}，日期 ${world.date || ""}，已在路上第 ${world.daysSinceStart || "?"} 天。
- 天气：${world.weather || ""}
- 住处：${world.accommodation || ""}
- 心情：${world.mood || ""}
- 目前这一程的路线：${route}（这只是当前在走的一段，不是整趟旅程的全部）
- 最近发生：\n${events}`;
  }

  let mem = "";
  if (recent.length) {
    const lines = recent
      .slice(0, 10)
      .map((p) => `· [${(p.created_at || "").slice(0, 10)} ${p.location || p.city || ""}] ${(p.text || "").replace(/\s+/g, " ").slice(0, 90)}`)
      .join("\n");
    mem = `\n\n【你最近发的动态（你的记忆，可自然引用细节）】\n${lines}`;
  }

  return base + live + mem;
}

async function handleChat(request, env) {
  const clean = await parseChatMessages(request);
  if (clean instanceof Response) return clean;

  const system = await buildSystemPrompt();
  const messages = [{ role: "system", content: system }, ...clean];
  try {
    const stream = await runChatStream(env, messages, {
      route: "another-me",
      temperature: 0.9,
      maxTokens: 600,
    });
    return sse(stream);
  } catch (error) {
    console.error(JSON.stringify({ event: "chat_all_models_failed", route: "another-me", error: errorMessage(error) }));
    return json({ error: "dialogue service temporarily unavailable" }, 503);
  }
}

// ---- Q 的房间:沙发聊天(独立人设,不走旅行分身的 system prompt) ----
const QROOM_SYSTEM = `你是 Q，在你的深夜工作室网站里，坐在沙发上和来访的朋友喝咖啡聊天。

【最重要的表达规则】
- 说短句。通常回答 1-2 句，最多 3 句。
- 硬性限制：整次回答不超过 80 个汉字。写完后主动删掉次要信息。
- 温柔、真诚、自然。像深夜和朋友喝咖啡，不像简历、客服或采访稿。
- 不列清单，不加标题，不用 Markdown。不要在一次回答里塞很多信息。
- 保护个人信息。除非对方明确追问，否则不说公司名、完整履历、所在地或联系方式。
- 不主动罗列做过的项目。不要为了证明自己而堆经历、数字或产品名称。
- 对方分享自己的事时，先回应他说的具体内容。可以追问，但不要每次都强行提问。
- 不编造。不知道就坦率说不知道。

【被问“你是谁 / 介绍一下自己”】
参考这个长度回答，不要继续展开履历：
“我是 Q，一个用户产品经理。创过业，也在大厂打过工，做过五百万和十亿用户规模的产品。我喜欢创作，欢迎来工作室坐坐。”

【被问“最近在做什么 / 最近做什么小项目”】
只讲一个项目：拾谱。不要顺带说其他项目。
参考回答：“最近在做拾谱，想把它变成个人知识库，并和 Codex 协同。还在摸索，暂时不太理想。”

【被问“最近关注什么”】
参考回答：“最近在看最前沿的模型，以及人怎么和 Agent 协同。我在用 GPT-5.6 和 Grok 4.5，也在想重构一个 ChatGPT 桌面端。”

【其他情况】
- 对方只是打招呼时，简单欢迎他来工作室坐坐。不要立刻介绍完整履历。
- 对方明确想合作或联系时，再给邮箱 jiejoe2017@gmail.com、X：x.com/BabyLadyQ，或请他去留言板。`;

async function handleRoomChat(request, env) {
  const clean = await parseChatMessages(request);
  if (clean instanceof Response) return clean;

  const messages = [{ role: "system", content: QROOM_SYSTEM }, ...clean];
  try {
    const stream = await runChatStream(env, messages, {
      route: "qroom",
      temperature: 0.72,
      maxTokens: 120,
    });
    return sse(stream);
  } catch (error) {
    console.error(JSON.stringify({ event: "chat_all_models_failed", route: "qroom", error: errorMessage(error) }));
    return json({ error: "dialogue service temporarily unavailable" }, 503);
  }
}

async function parseChatMessages(request) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 32_768) return json({ error: "chat request too large" }, 413);

  let body;
  try {
    body = await readJsonBody(request, 32_768);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) return json({ error: "chat request too large" }, 413);
    return json({ error: "bad json" }, 400);
  }

  const history = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  const clean = history
    .filter((message) => message && (message.role === "user" || message.role === "assistant") && typeof message.content === "string")
    .map((message) => ({ role: message.role, content: message.content.trim().slice(0, 2000) }))
    .filter((message) => message.content.length > 0);

  if (!clean.length || clean.at(-1)?.role !== "user") return json({ error: "a user message is required" }, 400);
  return clean;
}

async function readJsonBody(request, maxBytes) {
  if (!request.body) throw new Error("missing body");

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel("request body too large");
      throw new RequestBodyTooLargeError();
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

class RequestBodyTooLargeError extends Error {
  constructor() {
    super("request body too large");
    this.name = "RequestBodyTooLargeError";
  }
}

async function runChatStream(env, messages, options) {
  const models = [...new Set([env.CHAT_MODEL, env.CHAT_FALLBACK_MODEL].filter(Boolean))];
  if (!models.length) throw new Error("no chat model configured");

  let lastError = null;
  for (const model of models) {
    try {
      const input = {
        messages,
        stream: true,
        temperature: options.temperature,
        max_completion_tokens: options.maxTokens,
      };
      // Kimi K2.6 enables long-form reasoning by default. Qroom needs a
      // short conversational answer; otherwise the entire completion budget
      // can be consumed by reasoning without emitting any visible content.
      if (model === "@cf/moonshotai/kimi-k2.6") {
        input.chat_template_kwargs = { thinking: false };
      }
      const stream = await env.AI.run(
        model,
        input,
        {
          gateway: {
            id: "default",
            skipCache: true,
            collectLog: true,
            metadata: { route: options.route, model },
          },
        },
      );
      if (!stream || typeof stream.getReader !== "function") throw new Error("model did not return a stream");
      console.log(JSON.stringify({ event: "chat_model_selected", route: options.route, model }));
      return stream;
    } catch (error) {
      lastError = error;
      console.error(JSON.stringify({ event: "chat_model_failed", route: options.route, model, error: errorMessage(error) }));
    }
  }

  throw lastError || new Error("all chat models failed");
}

function sse(stream) {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      ...CORS,
    },
  });
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

async function listRoomMessages(request, env) {
  const ownerHash = await ownerHashFromRequest(request);
  try {
    const { results } = await env.MESSAGE_DB.prepare(
      "SELECT id, name, body, doodle, owner_hash, created_at FROM qroom_messages ORDER BY created_at DESC LIMIT 60"
    ).run();
    const messages = (results || []).map((row) => ({
      id: row.id,
      name: row.name,
      body: row.body,
      doodle: parseMessageDoodle(row.doodle),
      createdAt: row.created_at,
      owned: Boolean(ownerHash && row.owner_hash === ownerHash),
    }));
    return json({ messages });
  } catch (error) {
    console.error(JSON.stringify({ event: "qroom_messages_list_failed", error: String(error) }));
    return json({ error: "message wall unavailable" }, 503);
  }
}

async function createRoomMessage(request, env) {
  const ownerToken = request.headers.get("X-QRoom-Owner") || "";
  if (!isValidOwnerToken(ownerToken)) return json({ error: "invalid owner token" }, 400);

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 4096) return json({ error: "message too large" }, 413);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad json" }, 400);
  }
  if (body.website) return json({ error: "invalid message" }, 400);

  const name = cleanMessageText(body.name, 28) || "A visitor";
  const message = cleanMessageText(body.message, 360);
  const doodle = cleanMessageDoodle(body.doodle);
  if (message.length < 2 && !doodle) return json({ error: "write a note or draw a doodle" }, 400);

  const ownerHash = await hashOwnerToken(ownerToken);
  const createdAt = Date.now();
  const recent = await env.MESSAGE_DB.prepare(
    "SELECT COUNT(*) AS count FROM qroom_messages WHERE owner_hash = ? AND created_at > ?"
  ).bind(ownerHash, createdAt - 60_000).first();
  if (Number(recent?.count || 0) >= 3) return json({ error: "please wait before leaving another message" }, 429);

  const id = crypto.randomUUID();
  try {
    await env.MESSAGE_DB.prepare(
      "INSERT INTO qroom_messages (id, name, body, doodle, owner_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(id, name, message, doodle ? JSON.stringify(doodle) : null, ownerHash, createdAt).run();
    return json({ message: { id, name, body: message, doodle, createdAt, owned: true } }, 201);
  } catch (error) {
    console.error(JSON.stringify({ event: "qroom_message_create_failed", error: String(error) }));
    return json({ error: "could not leave message" }, 503);
  }
}

async function deleteRoomMessage(request, env, id) {
  const ownerToken = request.headers.get("X-QRoom-Owner") || "";
  if (!isValidOwnerToken(ownerToken) || !/^[0-9a-f-]{36}$/i.test(id)) {
    return json({ error: "invalid delete request" }, 400);
  }
  const ownerHash = await hashOwnerToken(ownerToken);
  try {
    const result = await env.MESSAGE_DB.prepare(
      "DELETE FROM qroom_messages WHERE id = ? AND owner_hash = ?"
    ).bind(id, ownerHash).run();
    if (!result.success || Number(result.meta?.changes || 0) < 1) {
      return json({ error: "message not found or not owned" }, 404);
    }
    return json({ deleted: true });
  } catch (error) {
    console.error(JSON.stringify({ event: "qroom_message_delete_failed", error: String(error) }));
    return json({ error: "could not delete message" }, 503);
  }
}

function cleanMessageText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.replace(/\r/g, "").replace(/[\t ]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, maxLength);
}

function cleanMessageDoodle(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.paths)) return null;
  const paths = value.paths.slice(0, 8).map((path) => {
    if (!Array.isArray(path)) return [];
    return path.slice(0, 96).map((point) => {
      if (!Array.isArray(point) || point.length < 2) return null;
      const x = Math.round(Number(point[0]));
      const y = Math.round(Number(point[1]));
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return [Math.max(0, Math.min(1000, x)), Math.max(0, Math.min(1000, y))];
    }).filter(Boolean);
  }).filter((path) => path.length > 1);
  return paths.length ? { paths } : null;
}

function parseMessageDoodle(value) {
  if (!value) return null;
  try {
    return cleanMessageDoodle(JSON.parse(value));
  } catch {
    return null;
  }
}

function isValidOwnerToken(token) {
  return /^[A-Za-z0-9_-]{32,128}$/.test(token);
}

async function ownerHashFromRequest(request) {
  const token = request.headers.get("X-QRoom-Owner") || "";
  return isValidOwnerToken(token) ? hashOwnerToken(token) : "";
}

async function hashOwnerToken(token) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...CORS } });
}
