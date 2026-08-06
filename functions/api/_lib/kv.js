export const KV_KEYS = {
  profile: "content:profile",
  projects: "content:projects",
  friends: "content:friends",
  site: "content:site",
  photos: "content:photos",
  music: "content:music",
  posts: "content:posts",
  guestbook: "guestbook:messages",
};

export function kvAvailable(env) {
  return Boolean(env.BLOG_KV || env.KV_BINDING);
}

function kvNamespace(env) {
  return env.BLOG_KV || env.KV_BINDING;
}

export async function readJson(env, key) {
  if (!kvAvailable(env)) {
    return null;
  }
  return kvNamespace(env).get(key, "json");
}

export async function writeJson(env, key, value) {
  if (!kvAvailable(env)) {
    throw new Error("BLOG_KV is not configured");
  }
  await kvNamespace(env).put(key, JSON.stringify(value));
  return value;
}

export async function removeKey(env, key) {
  if (kvAvailable(env)) {
    await kvNamespace(env).delete(key);
  }
}
