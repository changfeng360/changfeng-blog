import {
  kvAvailable,
  parsePost,
  readPosts,
  savePosts,
  serializePost,
} from "../../_lib/posts.js";

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

async function deleteFile(filePath, sha, env) {
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const response = await githubFetch(
    `/repos/${repo}/contents/${encodePath(filePath)}`,
    env,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Delete post via admin",
        sha,
        branch,
      }),
    },
  );
  return response.json();
}

async function findPost(slug, env) {
  for (const extension of [".mdx", ".md"]) {
    try {
      const file = await getFile(`${POSTS_PATH}/${slug}${extension}`, env);
      return {
        slug,
        path: file.path,
        sha: file.sha,
        content: file.content,
      };
    } catch {
      // Try the next extension.
    }
  }
  return null;
}

export async function onRequestGet(context) {
  const auth = authorize(context.request, context.env);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const slug = String(context.params.slug || "");
    if (!/^[a-z0-9-]+$/i.test(slug)) {
      return json({ error: "Invalid slug" }, 400);
    }
    if (kvAvailable(context.env)) {
      const posts = await readPosts(context.env);
      const post = posts.find((item) => item.slug === slug);
      if (!post) {
        return json({ error: "Post not found" }, 404);
      }
      return json({
        slug,
        path: `${POSTS_PATH}/${slug}.mdx`,
        content: serializePost(post),
      });
    }
    const post = await findPost(slug, context.env);
    if (!post) {
      return json({ error: "Post not found" }, 404);
    }
    return json(post);
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
    const slug = String(context.params.slug || "");
    if (!/^[a-z0-9-]+$/i.test(slug)) {
      return json({ error: "Invalid slug" }, 400);
    }
    const body = await context.request.json();
    const content = String(body.content || "").trim();
    if (!content) {
      return json({ error: "Post content is required" }, 400);
    }

    if (kvAvailable(context.env)) {
      const posts = await readPosts(context.env);
      const index = posts.findIndex((item) => item.slug === slug);
      if (index < 0) {
        return json({ error: "Post not found" }, 404);
      }
      posts[index] = parsePost(content, slug);
      await savePosts(context.env, posts);
      return json({ ok: true, storage: "kv" });
    }
    return json(
      { error: "BLOG_KV is not configured; bind Cloudflare KV to enable saving" },
      503,
    );

    const post = await findPost(slug, context.env);
    if (!post) {
      return json({ error: "Post not found" }, 404);
    }

    await writeFile(
      post.path,
      content,
      `Update post ${slug} via admin`,
      context.env,
      post.sha,
    );
    return json({ ok: true });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}

export async function onRequestDelete(context) {
  const auth = authorize(context.request, context.env);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const slug = String(context.params.slug || "");
    if (!/^[a-z0-9-]+$/i.test(slug)) {
      return json({ error: "Invalid slug" }, 400);
    }
    if (kvAvailable(context.env)) {
      const posts = await readPosts(context.env);
      const next = posts.filter((item) => item.slug !== slug);
      if (next.length === posts.length) {
        return json({ error: "Post not found" }, 404);
      }
      await savePosts(context.env, next);
      return json({ ok: true, storage: "kv" });
    }
    return json(
      { error: "BLOG_KV is not configured; bind Cloudflare KV to enable saving" },
      503,
    );
    const post = await findPost(slug, context.env);
    if (!post) {
      return json({ error: "Post not found" }, 404);
    }

    await deleteFile(post.path, post.sha, context.env);
    return json({ ok: true });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}
