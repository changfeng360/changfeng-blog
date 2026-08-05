const GITHUB_API = "https://api.github.com";
const DEFAULT_REPO = "changfeng360/changfeng-blog";
const DEFAULT_BRANCH = "main";
const COMMENTS_PATH = "content/comments.json";
const MAX_IMAGES = 2;
const MAX_IMAGE_LENGTH = 260000;
const AVATAR_BASE_URL = "https://cravatar.cn/avatar/";

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

function md5(inputString) {
  function add32(a, b) {
    return (a + b) & 0xffffffff;
  }
  function cmn(q, a, b, x, s, t) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }
  function ff(a, b, c, d, x, s, t) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a, b, c, d, x, s, t) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a, b, c, d, x, s, t) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function md5cycle(x, k) {
    let a = x[0];
    let b = x[1];
    let c = x[2];
    let d = x[3];
    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);
    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);
    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);
    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);
  }
  function md5blk(s) {
    const md5blks = [];
    for (let i = 0; i < 64; i += 4) {
      md5blks[i >> 2] =
        s.charCodeAt(i) +
        (s.charCodeAt(i + 1) << 8) +
        (s.charCodeAt(i + 2) << 16) +
        (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }
  function md51(s) {
    const n = s.length;
    const state = [1732584193, -271733879, -1732584194, 271733878];
    let i;
    for (i = 64; i <= n; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < s.length; i += 1) {
      tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    }
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) {
      md5cycle(state, tail);
      for (let j = 0; j < 16; j += 1) {
        tail[j] = 0;
      }
    }
    tail[14] = n << 3;
    md5cycle(state, tail);
    return state;
  }
  function toHex(num) {
    let hex = "";
    for (let i = 0; i < 4; i += 1) {
      hex += ((num >>> (i * 8)) & 0xff).toString(16).padStart(2, "0");
    }
    return hex;
  }
  const bytes = new TextEncoder().encode(inputString);
  const utf8 = Array.from(bytes)
    .map((byte) => String.fromCharCode(byte))
    .join("");
  return md51(utf8).map(toHex).join("");
}

function avatarUrlFor(email) {
  const normalized = String(email ?? "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }
  return `${AVATAR_BASE_URL}${md5(normalized)}?s=96&d=identicon`;
}

function withoutPrivateFields(item) {
  if (!item) {
    return item;
  }
  const { deleteToken, visitorKey, email, ...rest } = item;
  return email ? { ...rest, email } : rest;
}

function sanitizeMessages(messages, includeEmail = false) {
  const decorate = (item) => {
    const cleaned = withoutPrivateFields(item);
    if (cleaned.email) {
      cleaned.avatarUrl = avatarUrlFor(cleaned.email);
    }
    if (!includeEmail && cleaned.email) {
      delete cleaned.email;
    }
    cleaned.images = Array.isArray(cleaned.images) ? cleaned.images : [];
    return cleaned;
  };
  return (messages || []).map((message) => ({
    ...decorate(message),
    replies: (message.replies || []).map(decorate),
  }));
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

function validateContent(value, images = []) {
  const content = String(value ?? "").trim();
  if (!content && (!Array.isArray(images) || images.length === 0)) {
    throw new Error("留言内容不能为空且不能超过 1000 个字符");
  }
  if (content.length > 1000) {
    throw new Error("留言内容不能为空且不能超过 1000 个字符");
  }
  return content;
}

function validateImages(value) {
  const images = Array.isArray(value) ? value : [];
  if (images.length > MAX_IMAGES) {
    throw new Error("最多上传 2 张图片");
  }
  for (const image of images) {
    if (
      typeof image !== "string" ||
      image.length > MAX_IMAGE_LENGTH ||
      !/^data:image\/(jpeg|png|webp|gif);base64,/i.test(image.slice(0, 64))
    ) {
      throw new Error("图片格式或大小不符合要求");
    }
  }
  return images;
}

function validateEmail(value) {
  const email = String(value ?? "").trim();
  if (
    !email ||
    email.length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error("请填写有效的邮箱");
  }
  return email;
}

async function sendEmail(env, to, subject, text) {
  const apiKey = env.RESEND_API_KEY;
  const from = env.RESEND_FROM_EMAIL;
  const recipient = to || env.RESEND_TO_EMAIL || env.OWNER_EMAIL;
  if (!apiKey || !from || !recipient) {
    return { skipped: true };
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject,
      text,
    }),
  });
  if (!response.ok) {
    return { skipped: true, error: `Email API ${response.status}` };
  }
  return { skipped: false };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const file = await getFile(env);
    const messages = JSON.parse(file.content || "[]");
    return json({
      messages: sanitizeMessages(messages, authorizeAdmin(request, env)),
    });
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
      const images = validateImages(body.images);
      const content = validateContent(body.content, images);
      const email = isAdmin ? "" : validateEmail(body.email);
      const id = createId();
      messages.unshift({
        id,
        nickname,
        content,
        email,
        images,
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
      let emailResult = { skipped: true };
      if (!isAdmin) {
        try {
          emailResult = await sendEmail(
            env,
            env.RESEND_TO_EMAIL || env.OWNER_EMAIL,
            `【长风的博客】新留言：${nickname}`,
            `昵称：${nickname}\n邮箱：${email}\n图片：${images.length} 张\n内容：\n${content}`,
          );
        } catch {
          emailResult = { skipped: true, error: "email_failed" };
        }
      }
      return json({
        ok: true,
        messages: sanitizeMessages(messages, isAdmin),
        email: emailResult,
      });
    }

    if (body.action === "reply") {
      const parent = messages.find((item) => item.id === body.parentId);
      if (!parent) {
        return json({ error: "留言不存在" }, 404);
      }
      const nickname = isAdmin ? "长风" : validateNickname(body.nickname);
      const images = validateImages(body.images);
      const content = validateContent(body.content, images);
      const email = isAdmin ? "" : validateEmail(body.email);
      parent.replies = parent.replies || [];
      const id = createId();
      const reply = {
        id,
        nickname,
        content,
        email,
        images,
        isAuthor: isAdmin,
        likes: 0,
        likedBy: [],
        createdAt: new Date().toISOString(),
      };
      parent.replies.push(reply);
      await writeFile(
        JSON.stringify(messages, null, 2),
        isAdmin ? "博主回复留言" : "新增留言回复",
        env,
        file.sha,
      );
      let emailResult = { skipped: true };
      if (isAdmin) {
        if (parent.email) {
          try {
            emailResult = await sendEmail(
              env,
              parent.email,
              "【长风的博客】你的留言收到回复",
              `你好 ${parent.nickname}：\n\n你的留言：\n${parent.content}\n\n博主回复：\n${content}`,
            );
          } catch {
            emailResult = { skipped: true, error: "email_failed" };
          }
        } else {
          emailResult = { skipped: true, reason: "no_email" };
        }
      } else {
        try {
          emailResult = await sendEmail(
            env,
            env.RESEND_TO_EMAIL || env.OWNER_EMAIL,
            `【长风的博客】新回复：${nickname}`,
            `昵称：${nickname}\n邮箱：${email}\n图片：${images.length} 张\n回复内容：\n${content}`,
          );
        } catch {
          emailResult = { skipped: true, error: "email_failed" };
        }
      }
      return json({
        ok: true,
        messages: sanitizeMessages(messages, isAdmin),
        email: emailResult,
      });
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
      return json({
        ok: true,
        messages: sanitizeMessages(messages, isAdmin),
      });
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
    return json({
      ok: true,
      messages: sanitizeMessages(next, true),
    });
  } catch (error) {
    return json({ error: error.message }, 400);
  }
}
