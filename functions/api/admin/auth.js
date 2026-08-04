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

export async function onRequestPost(context) {
  const auth = authorize(context.request, context.env);
  if (!auth.ok) {
    return auth.response;
  }
  return json({
    ok: true,
    githubToken: Boolean(context.env.GITHUB_TOKEN),
  });
}
