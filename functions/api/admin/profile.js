import {
  KV_KEYS,
  kvAvailable,
  readJson,
  writeJson,
} from "../_lib/kv.js";

const GITHUB_API = "https://api.github.com";
const DEFAULT_REPO = "changfeng360/changfeng-blog";
const DEFAULT_BRANCH = "main";
const PROFILE_PATH = "content/profile.json";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function authorize(request, env) {
  const expected = env.ADMIN_TOKEN;
  if (!expected) {
    return {
      ok: false,
      response: json({ error: "ADMIN_TOKEN is not configured" }, 503),
    };
  }

  const provided = request.headers.get("x-admin-token") || "";
  const providedBytes = new TextEncoder().encode(provided);
  const expectedBytes = new TextEncoder().encode(expected);
  if (providedBytes.length !== expectedBytes.length) {
    return {
      ok: false,
      response: json({ error: "Unauthorized" }, 401),
    };
  }

  let diff = 0;
  for (let index = 0; index < providedBytes.length; index += 1) {
    diff |= providedBytes[index] ^ expectedBytes[index];
  }

  return diff === 0
    ? { ok: true }
    : {
        ok: false,
        response: json({ error: "Unauthorized" }, 401),
      };
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
      "User-Agent": "changfeng-blog-admin",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${response.status}: ${text.slice(0, 300)}`);
  }

  return response;
}

async function getFile(filePath, env) {
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const response = await githubFetch(
    `/repos/${repo}/contents/${encodePath(filePath)}?ref=${encodeURIComponent(branch)}`,
    env,
  );
  const data = await response.json();
  if (!data.content) {
    throw new Error("File not found");
  }
  return {
    ...data,
    content: decodeBase64(data.content),
  };
}

async function writeFile(filePath, content, message, env, sha) {
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const body = {
    message,
    content: encodeBase64(content),
    branch,
  };
  if (sha) {
    body.sha = sha;
  }

  const response = await githubFetch(
    `/repos/${repo}/contents/${encodePath(filePath)}`,
    env,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  return response.json();
}

async function getProfileData(env) {
  if (kvAvailable(env)) {
    const stored = await readJson(env, KV_KEYS.profile);
    if (stored) {
      return stored;
    }
    const file = await getFile(PROFILE_PATH, env);
    const parsed = JSON.parse(file.content);
    await writeJson(env, KV_KEYS.profile, parsed);
    return parsed;
  }
  const file = await getFile(PROFILE_PATH, env);
  return JSON.parse(file.content);
}

export async function onRequestGet(context) {
  const auth = authorize(context.request, context.env);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    return json(await getProfileData(context.env));
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}

export async function onRequestPut(context) {
  const auth = authorize(context.request, context.env);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const profile = await context.request.json();
    if (!profile || typeof profile !== "object") {
      return json({ error: "Profile must be a JSON object" }, 400);
    }

    const requiredFields = [
      "name",
      "location",
      "coffee",
      "aboutDescription",
      "tagline",
      "intro",
      "email",
      "github",
      "bilibili",
      "tags",
      "skills",
    ];
    const missingField = requiredFields.find(
      (field) => !(field in profile),
    );
    if (missingField) {
      return json({ error: `Missing profile field: ${missingField}` }, 400);
    }
    if (!Array.isArray(profile.tags) || !Array.isArray(profile.skills)) {
      return json(
        { error: "Profile tags and skills must be arrays" },
        400,
      );
    }

    if (kvAvailable(context.env)) {
      await writeJson(context.env, KV_KEYS.profile, profile);
      return json({ ok: true, storage: "kv" });
    }
    const existing = await getFile(PROFILE_PATH, context.env);
    await writeFile(
      PROFILE_PATH,
      `${JSON.stringify(profile, null, 2)}\n`,
      "Update profile via admin",
      context.env,
      existing.sha,
    );
    return json({ ok: true });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}
