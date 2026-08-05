const GITHUB_API = "https://api.github.com";
const DEFAULT_REPO = "changfeng360/changfeng-blog";
const DEFAULT_BRANCH = "main";
const COMMENTS_PATH = "content/comments.json";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-admin-token",
    },
  });
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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

function encodePath(filePath) {
  return filePath.split("/").map(encodeURIComponent).join("/");
}

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder().decode(bytes);
}

function encodeBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

async function githubFetch(pathname, env, options = {}) {
  if (!env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is not configured");
  }
  const response = await fetch(`${GITHUB_API}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "changfeng-blog-guestbook",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${response.status}: ${text.slice(0, 300)}`);
  }
  return response;
}

async function getFile(env) {
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const response = await githubFetch(
    `/repos/${repo}/contents/${encodePath(COMMENTS_PATH)}?ref=${encodeURIComponent(branch)}`,
    env,
  );
  const data = await response.json();
  if (!data.content) {
    throw new Error("Comments file not found");
  }
  return {
    ...data,
    content: decodeBase64(data.content),
  };
}

async function writeFile(content, message, env, sha) {
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const response = await githubFetch(
    `/repos/${repo}/contents/${encodePath(COMMENTS_PATH)}`,
    env,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        content: encodeBase64(content),
        branch,
        sha,
      }),
    },
  );
  return response.json();
}

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function visitorKey(request) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const data = new TextEncoder().encode(`changfeng-guest:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function findTarget(messages, id, parentId) {
  if (!parentId) {
    return { message: messages.find((item) => item.id === id), reply: null };
  }
  const message = messages.find((item) => item.id === parentId);
  const reply = message?.replies?.find((item) => item.id === id) ?? null;
  return { message, reply };
}

function validateNickname(value) {
  const nickname = String(value ?? "").trim();
  if (!nickname || nickname.length > 30) {
    throw new Error("昵称不能为空且不能超过 30 个字符");
  }
  return nickname;
}

function validateContent(value) {
  const content = String(value ?? "").trim();
  if (!content || content.length > 1000) {
    throw new Error("留言内容不能为空且不能超过 1000 个字符");
  }
  return content;
}

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const file = await getFile(env);
    const messages = JSON.parse(file.content || "[]");
    return json({ messages });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const isAdmin = authorizeAdmin(request, env);
  try {
    const body = await request.json();
    const file = await getFile(env);
    const messages = JSON.parse(file.content || "[]");

    if (body.action === "add") {
      const nickname = isAdmin ? "长风" : validateNickname(body.nickname);
      const content = validateContent(body.content);
      messages.unshift({
        id: createId(),
        nickname,
        content,
        isAuthor: isAdmin,
        likes: 0,
        likedBy: [],
        createdAt: new Date().toISOString(),
        replies: [],
      });
      await writeFile(
        JSON.stringify(messages, null, 2),
        isAdmin ? "博主留言" : "新增访客留言",
        env,
        file.sha,
      );
      return json({ ok: true, messages });
    }

    if (body.action === "reply") {
      const parent = messages.find((item) => item.id === body.parentId);
      if (!parent) {
        return json({ error: "留言不存在" }, 404);
      }
      const nickname = isAdmin ? "长风" : validateNickname(body.nickname);
      const content = validateContent(body.content);
      parent.replies = parent.replies || [];
      parent.replies.push({
        id: createId(),
        nickname,
        content,
        isAuthor: isAdmin,
        likes: 0,
        likedBy: [],
        createdAt: new Date().toISOString(),
      });
      await writeFile(
        JSON.stringify(messages, null, 2),
        isAdmin ? "博主回复留言" : "新增留言回复",
        env,
        file.sha,
      );
      return json({ ok: true, messages });
    }

    if (body.action === "like") {
      const { message, reply } = findTarget(
        messages,
        body.id,
        body.parentId,
      );
      const target = reply || message;
      if (!target) {
        return json({ error: "留言不存在" }, 404);
      }
      const key = await visitorKey(request);
      target.likedBy = target.likedBy || [];
      if (!target.likedBy.includes(key)) {
        target.likedBy.push(key);
        target.likes = (target.likes || 0) + 1;
      }
      await writeFile(
        JSON.stringify(messages, null, 2),
        "点赞留言",
        env,
        file.sha,
      );
      return json({ ok: true, messages });
    }

    return json({ error: "未知操作" }, 400);
  } catch (error) {
    return json({ error: error.message }, 400);
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!authorizeAdmin(request, env)) {
    return json({ error: "未授权" }, 401);
  }
  try {
    const body = await request.json();
    const file = await getFile(env);
    const messages = JSON.parse(file.content || "[]");
    let next = messages;
    if (body.parentId) {
      next = messages.map((message) => {
        if (message.id !== body.parentId) {
          return message;
        }
        return {
          ...message,
          replies: (message.replies || []).filter(
            (reply) => reply.id !== body.id,
          ),
        };
      });
    } else {
      next = messages.filter((message) => message.id !== body.id);
    }
    await writeFile(
      JSON.stringify(next, null, 2),
      "删除留言",
      env,
      file.sha,
    );
    return json({ ok: true, messages: next });
  } catch (error) {
    return json({ error: error.message }, 400);
  }
}
