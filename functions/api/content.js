import {
  KV_KEYS,
  readJson,
} from "./_lib/kv.js";
import { readPosts } from "./_lib/posts.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const [profile, projects, friends, site, posts] = await Promise.all([
      readJson(env, KV_KEYS.profile),
      readJson(env, KV_KEYS.projects),
      readJson(env, KV_KEYS.friends),
      readJson(env, KV_KEYS.site),
      readPosts(env),
    ]);

    return json({
      profile: profile ?? undefined,
      projects: projects ?? undefined,
      friends: friends ?? undefined,
      site: site ?? undefined,
      posts: posts.length ? posts : undefined,
    });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}
