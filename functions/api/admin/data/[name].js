import {
  KV_KEYS,
  kvAvailable,
  readJson,
  writeJson,
} from "../../_lib/kv.js";

const GITHUB_API = "https://api.github.com";
const DEFAULT_REPO = "changfeng360/changfeng-blog";
const DEFAULT_BRANCH = "main";

const DATA_FILES = {
  profile: "content/profile.json",
  projects: "content/projects.json",
  friends: "content/friends.json",
  site: "content/site.json",
  photos: "content/photos.json",
};

const KV_KEY_BY_NAME = {
  profile: KV_KEYS.profile,
  projects: KV_KEYS.projects,
  friends: KV_KEYS.friends,
  site: KV_KEYS.site,
  photos: KV_KEYS.photos,
};

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

export async function onRequestGet(context) {
  const auth = authorize(context.request, context.env);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const name = String(context.params.name || "");
    const filePath = DATA_FILES[name];
    if (!filePath) {
      return json({ error: "Unknown data file" }, 404);
    }
    if (kvAvailable(context.env)) {
      const stored = await readJson(
        context.env,
        KV_KEY_BY_NAME[name],
      );
      if (stored !== null && stored !== undefined) {
        return json(stored);
      }
    }
    const file = await getFile(filePath, context.env);
    const parsed = JSON.parse(file.content);
    if (kvAvailable(context.env)) {
      await writeJson(context.env, KV_KEY_BY_NAME[name], parsed);
    }
    return json(parsed);
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
    const name = String(context.params.name || "");
    const filePath = DATA_FILES[name];
    if (!filePath) {
      return json({ error: "Unknown data file" }, 404);
    }

    const data = await context.request.json();
    if (data === null || typeof data !== "object") {
      return json({ error: "Data must be a JSON object or array" }, 400);
    }

    if (kvAvailable(context.env)) {
      await writeJson(context.env, KV_KEY_BY_NAME[name], data);
      return json({ ok: true, storage: "kv" });
    }
    return json(
      { error: "BLOG_KV is not configured; bind Cloudflare KV to enable saving" },
      503,
    );
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}
