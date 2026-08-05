export const KV_KEYS = {
  profile: "content:profile",
  projects: "content:projects",
  friends: "content:friends",
  site: "content:site",
  posts: "content:posts",
  guestbook: "guestbook:messages",
};

export function kvAvailable(env) {
  return Boolean(env.BLOG_KV);
}

export async function readJson(env, key) {
  if (!kvAvailable(env)) {
    return null;
  }
  return env.BLOG_KV.get(key, "json");
}

export async function writeJson(env, key, value) {
  if (!kvAvailable(env)) {
    throw new Error("BLOG_KV is not configured");
  }
  await env.BLOG_KV.put(key, JSON.stringify(value));
  return value;
}

export async function removeKey(env, key) {
  if (kvAvailable(env)) {
    await env.BLOG_KV.delete(key);
  }
}
