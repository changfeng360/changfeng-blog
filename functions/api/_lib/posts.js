import {
  KV_KEYS,
  kvAvailable,
  readJson,
  writeJson,
} from "./kv.js";

const GITHUB_API = "https://api.github.com";
const DEFAULT_REPO = "changfeng360/changfeng-blog";
const DEFAULT_BRANCH = "main";
const POSTS_PATH = "content/posts";

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

async function getGithubFile(filePath, env) {
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

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeDate(value) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value ?? "").slice(0, 10);
}

export function parsePost(raw, fallbackSlug) {
  const match = String(raw || "").match(
    /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/,
  );
  const frontmatter = match?.[1] ?? "";
  const body = match?.[2]?.trim() ?? String(raw || "").trim();
  const meta = {};

  let arrayKey = null;
  for (const line of frontmatter.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    if (arrayKey && trimmed.startsWith("-")) {
      meta[arrayKey] = meta[arrayKey] || [];
      meta[arrayKey].push(trimmed.replace(/^-\s*/, "").replace(/^["']|["']$/g, ""));
      continue;
    }
    arrayKey = null;
    const colonIndex = line.indexOf(":");
    if (colonIndex < 0) {
      continue;
    }
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    if (!value) {
      arrayKey = key;
      meta[key] = [];
      continue;
    }
    value = value.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    if (value === "true") {
      meta[key] = true;
    } else if (value === "false") {
      meta[key] = false;
    } else {
      meta[key] = value;
    }
  }

  return {
    slug: String(meta.slug ?? fallbackSlug),
    title: String(meta.title ?? fallbackSlug),
    excerpt: String(meta.excerpt ?? meta.description ?? ""),
    date: normalizeDate(meta.date),
    tags: normalizeTags(meta.tags),
    readTime: String(meta.readTime ?? "5 min"),
    emoji: String(meta.emoji ?? "📝"),
    featured: Boolean(meta.featured),
    body,
  };
}

export function serializePost(post) {
  const tags = (post.tags || []).map((tag) => `  - ${tag}`).join("\n");
  const featured = post.featured ? "featured: true\n" : "";
  return `---\ntitle: ${JSON.stringify(post.title)}\nslug: ${post.slug}\nexcerpt: ${JSON.stringify(
    post.excerpt || "",
  )}\ndate: ${post.date}\nreadTime: ${JSON.stringify(
    post.readTime || "5 min",
  )}\nemoji: ${JSON.stringify(post.emoji || "📝")}\ntags:\n${tags}\n${featured}---\n\n${
    post.body || ""
  }\n`;
}

export async function listGithubPosts(env) {
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const response = await githubFetch(
    `/repos/${repo}/contents/${encodePath(POSTS_PATH)}?ref=${encodeURIComponent(branch)}`,
    env,
  );
  const data = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }
  const posts = [];
  for (const item of data) {
    if (!/\.(md|mdx)$/.test(item.name)) {
      continue;
    }
    try {
      const file = await getGithubFile(item.path, env);
      const slug = item.name.replace(/\.(md|mdx)$/, "");
      posts.push(parsePost(file.content, slug));
    } catch {
      // Skip unreadable posts.
    }
  }
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export async function readPosts(env) {
  if (kvAvailable(env)) {
    const stored = await readJson(env, KV_KEYS.posts);
    if (Array.isArray(stored)) {
      return stored;
    }
    try {
      const seeded = await listGithubPosts(env);
      await writeJson(env, KV_KEYS.posts, seeded);
      return seeded;
    } catch {
      return [];
    }
  }
  return listGithubPosts(env);
}

export async function savePosts(env, posts) {
  if (kvAvailable(env)) {
    await writeJson(env, KV_KEYS.posts, posts);
    return;
  }
  throw new Error("BLOG_KV is not configured");
}
