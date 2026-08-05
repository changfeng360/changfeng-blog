import {
  kvAvailable,
  parsePost,
  readPosts,
  savePosts,
} from "../_lib/posts.js";

const GITHUB_API = "https://api.github.com";
const DEFAULT_REPO = "changfeng360/changfeng-blog";
const DEFAULT_BRANCH = "main";
const POSTS_PATH = "content/posts";

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
  return data;
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
    if (kvAvailable(context.env)) {
      const posts = await readPosts(context.env);
      return json(
        posts.map((post) => ({
          name: `${post.slug}.mdx`,
          slug: post.slug,
          path: `${POSTS_PATH}/${post.slug}.mdx`,
        })),
      );
    }
    const repo = context.env.GITHUB_REPO || DEFAULT_REPO;
    const branch = context.env.GITHUB_BRANCH || DEFAULT_BRANCH;
    const response = await githubFetch(
      `/repos/${repo}/contents/${encodePath(POSTS_PATH)}?ref=${encodeURIComponent(branch)}`,
      context.env,
    );
    const data = await response.json();
    if (!Array.isArray(data)) {
      return json([]);
    }

    const posts = data
      .filter((item) => /\.(mdx|md)$/.test(item.name))
      .map((item) => ({
        name: item.name,
        slug: item.name.replace(/\.(mdx|md)$/, ""),
        path: item.path,
        sha: item.sha,
      }));
    return json(posts);
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}

export async function onRequestPost(context) {
  const auth = authorize(context.request, context.env);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await context.request.json();
    const slug = String(body.slug || "").trim();
    const content = String(body.content || "").trim();
    if (!/^[a-z0-9-]+$/i.test(slug)) {
      return json({ error: "Slug can only contain letters, numbers, and dashes" }, 400);
    }
    if (!content) {
      return json({ error: "Post content is required" }, 400);
    }

    if (kvAvailable(context.env)) {
      const posts = await readPosts(context.env);
      if (posts.some((post) => post.slug === slug)) {
        return json({ error: "Post already exists" }, 409);
      }
      const post = parsePost(content, slug);
      posts.unshift(post);
      await savePosts(context.env, posts);
      return json({ ok: true, slug, path: `${POSTS_PATH}/${slug}.mdx`, storage: "kv" });
    }
    return json(
      { error: "BLOG_KV is not configured; bind Cloudflare KV to enable saving" },
      503,
    );

    const filePath = `${POSTS_PATH}/${slug}.mdx`;
    try {
      await getFile(filePath, context.env);
      return json({ error: "Post already exists" }, 409);
    } catch {
      // The file does not exist yet, so we can create it.
    }

    await writeFile(
      filePath,
      content,
      `Create post ${slug} via admin`,
      context.env,
    );
    return json({ ok: true, slug, path: filePath });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}
