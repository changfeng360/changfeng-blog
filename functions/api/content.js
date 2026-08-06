import {
  KV_KEYS,
  kvAvailable,
  readJson,
} from "./_lib/kv.js";
import { readPosts } from "./_lib/posts.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const [profile, projects, friends, site, photos, posts] = await Promise.all([
      readJson(env, KV_KEYS.profile),
      readJson(env, KV_KEYS.projects),
      readJson(env, KV_KEYS.friends),
      readJson(env, KV_KEYS.site),
      readJson(env, KV_KEYS.photos),
      readPosts(env),
    ]);

    return json({
      profile: profile ?? undefined,
      projects: projects ?? undefined,
      friends: friends ?? undefined,
      site: site ?? undefined,
      photos: photos ?? undefined,
      posts: kvAvailable(env) ? posts : undefined,
    });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}
