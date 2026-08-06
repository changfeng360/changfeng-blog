import {
  KV_KEYS,
  kvAvailable,
  readJson,
  writeJson,
} from "./_lib/kv.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-admin-token",
    },
  });
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-admin-token",
    },
  });
}

function authorizeAdmin(request, env) {
  const expected = env.ADMIN_TOKEN;
  if (!expected) {
    return false;
  }
  const provided = request.headers.get("x-admin-token") || "";
  const providedBytes = new TextEncoder().encode(provided);
  const expectedBytes = new TextEncoder().encode(expected);
  if (providedBytes.length !== expectedBytes.length) {
    return false;
  }
  let diff = 0;
  for (let index = 0; index < providedBytes.length; index += 1) {
    diff |= providedBytes[index] ^ expectedBytes[index];
  }
  return diff === 0;
}

async function visitorKey(request) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const data = new TextEncoder().encode(`changfeng-post:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function loadReactions(env) {
  if (!kvAvailable(env)) {
    throw new Error("Cloudflare KV is not configured");
  }
  const stored = await readJson(env, KV_KEYS.postReactions);
  return stored && typeof stored === "object" ? stored : {};
}

async function saveReactions(env, reactions) {
  await writeJson(env, KV_KEYS.postReactions, reactions);
}

function cleanReaction(reaction) {
  const likedBy = Array.isArray(reaction?.likedBy) ? reaction.likedBy : [];
  return {
    likes: reaction?.likes || 0,
    adminLiked: likedBy.includes("admin"),
    comments: Array.isArray(reaction?.comments) ? reaction.comments : [],
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug") || "";
    const reactions = await loadReactions(env);
    return json(cleanReaction(reactions[slug]));
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const isAdmin = authorizeAdmin(request, env);
  try {
    const body = await request.json();
    const slug = String(body.slug || "").trim();
    if (!/^[a-z0-9-]+$/i.test(slug)) {
      return json({ error: "Invalid slug" }, 400);
    }
    const reactions = await loadReactions(env);
    const reaction = reactions[slug] || {
      likes: 0,
      likedBy: [],
      comments: [],
    };

    if (body.action === "like") {
      const key = isAdmin ? "admin" : await visitorKey(request);
      reaction.likedBy = reaction.likedBy || [];
      if (!reaction.likedBy.includes(key)) {
        reaction.likedBy.push(key);
        reaction.likes = (reaction.likes || 0) + 1;
      }
      reactions[slug] = reaction;
      await saveReactions(env, reactions);
      return json(cleanReaction(reaction));
    }

    if (body.action === "comment") {
      const nickname = String(body.nickname || "").trim();
      const content = String(body.content || "").trim();
      if (!nickname || nickname.length > 30) {
        return json({ error: "昵称不能为空且不能超过 30 个字符" }, 400);
      }
      if (!content || content.length > 1000) {
        return json({ error: "评论内容不能为空且不能超过 1000 个字符" }, 400);
      }
      reaction.comments = reaction.comments || [];
      reaction.comments.push({
        id: createId(),
        nickname,
        content,
        createdAt: new Date().toISOString(),
      });
      reactions[slug] = reaction;
      await saveReactions(env, reactions);
      return json(cleanReaction(reaction));
    }

    return json({ error: "未知操作" }, 400);
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}
