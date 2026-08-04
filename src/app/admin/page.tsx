"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  LogIn,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import type { Profile } from "@/data/content";

type AdminPost = {
  name: string;
  slug: string;
  path: string;
  sha?: string;
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [profileText, setProfileText] = useState("");
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [postContent, setPostContent] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newContent, setNewContent] = useState("");
  const [projectsText, setProjectsText] = useState("");
  const [friendsText, setFriendsText] = useState("");
  const [siteText, setSiteText] = useState("");

  async function api(
    path: string,
    options: RequestInit = {},
    authToken = token,
  ) {
    const response = await fetch(`/api/admin/${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": authToken,
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  }

  async function loadData(authToken: string) {
    const [profileData, postList, projectsData, friendsData, siteData] =
      await Promise.all([
      api("profile", {}, authToken),
      api("posts", {}, authToken),
      api("data/projects", {}, authToken),
      api("data/friends", {}, authToken),
      api("data/site", {}, authToken),
    ]);
    setProfileText(JSON.stringify(profileData, null, 2));
    setPosts(postList);
    setProjectsText(JSON.stringify(projectsData, null, 2));
    setFriendsText(JSON.stringify(friendsData, null, 2));
    setSiteText(JSON.stringify(siteData, null, 2));
  }

  async function login() {
    setLoading(true);
    setStatus("");
    try {
      await loadData(token);
      window.sessionStorage.setItem("cf-admin-token", token);
      setAuthenticated(true);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const savedToken = window.sessionStorage.getItem("cf-admin-token");
    if (!savedToken) {
      return;
    }
    setToken(savedToken);
    setLoading(true);
    loadData(savedToken)
      .then(() => setAuthenticated(true))
      .catch(() => window.sessionStorage.removeItem("cf-admin-token"))
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile() {
    setLoading(true);
    setStatus("");
    try {
      const profile = JSON.parse(profileText) as Profile;
      await api("profile", {
        method: "PUT",
        body: JSON.stringify(profile),
      });
      setStatus("Profile saved");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveData(name: string, text: string, label: string) {
    setLoading(true);
    setStatus("");
    try {
      const data = JSON.parse(text);
      await api(`data/${name}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      setStatus(`${label} saved`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function selectPost(slug: string) {
    setLoading(true);
    setStatus("");
    try {
      const post = await api(`posts/${encodeURIComponent(slug)}`);
      setSelectedSlug(slug);
      setPostContent(post.content);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  async function savePost() {
    if (!selectedSlug) {
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      await api(`posts/${encodeURIComponent(selectedSlug)}`, {
        method: "PUT",
        body: JSON.stringify({ content: postContent }),
      });
      setStatus("Post saved");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function createPost() {
    setLoading(true);
    setStatus("");
    try {
      const created = await api("posts", {
        method: "POST",
        body: JSON.stringify({ slug: newSlug, content: newContent }),
      });
      setPosts((current) => [
        ...current,
        { name: `${created.slug}.mdx`, slug: created.slug, path: created.path },
      ]);
      setNewSlug("");
      setNewContent("");
      setStatus("Post created");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Create failed");
    } finally {
      setLoading(false);
    }
  }

  async function deletePost() {
    if (!selectedSlug || !window.confirm(`Delete ${selectedSlug}?`)) {
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      await api(`posts/${encodeURIComponent(selectedSlug)}`, {
        method: "DELETE",
      });
      setPosts((current) =>
        current.filter((post) => post.slug !== selectedSlug),
      );
      setSelectedSlug("");
      setPostContent("");
      setStatus("Post deleted");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5 pb-10 pt-28">
        <div className="glass w-full max-w-sm rounded-5xl p-8">
          <span className="chip pixel-font !text-[14px] text-accent-blue">
            ADMIN
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">
            {loading ? "Loading..." : "Sign in"}
          </h1>
          <input
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Admin token"
            className="mt-5 w-full rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-sm text-ink outline-none backdrop-blur-xl dark:border-white/10 dark:bg-white/10"
          />
          <button
            type="button"
            onClick={login}
            disabled={loading}
            className="pixel-btn mt-4 w-full justify-center rounded-full px-5 py-3"
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </button>
          {status ? (
            <p className="mt-4 text-sm text-accent-pink">{status}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-12 pt-28 sm:px-8 sm:pt-32">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="chip pixel-font !text-[14px] text-accent-blue">
            CONTENT ADMIN
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
            Edit profile & posts
          </h1>
        </div>
        <button
          type="button"
          onClick={() => {
            window.sessionStorage.removeItem("cf-admin-token");
            setAuthenticated(false);
          }}
          className="chip hover:bg-white"
        >
          Sign out
        </button>
        <Link href="/" className="chip hover:bg-white">
          Open site
        </Link>
      </div>

      {status ? (
        <p className="mt-5 text-sm text-accent-blue">{status}</p>
      ) : null}

      <div className="mt-8 grid gap-5 lg:grid-cols-5">
        <section className="glass rounded-4xl p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent-tangerine" />
            <h2 className="text-lg font-semibold text-ink">Profile</h2>
          </div>
          <textarea
            value={profileText}
            onChange={(event) => setProfileText(event.target.value)}
            className="mt-4 h-[420px] w-full resize-y rounded-2xl border border-white/60 bg-white/55 p-4 font-mono text-xs leading-relaxed text-ink outline-none backdrop-blur-xl dark:border-white/10 dark:bg-white/10"
          />
          <button
            type="button"
            onClick={saveProfile}
            disabled={loading}
            className="pixel-btn mt-4 rounded-full px-5 py-3"
          >
            <Save className="h-4 w-4" />
            Save profile
          </button>
        </section>

        <section className="glass rounded-4xl p-6 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent-mint" />
              <h2 className="text-lg font-semibold text-ink">Posts</h2>
            </div>
            <span className="pixel-font text-[12px] text-ink-soft">
              {posts.length} FILES
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {posts.map((post) => (
              <button
                key={post.slug}
                type="button"
                onClick={() => selectPost(post.slug)}
                className={`chip transition-transform duration-150 ease-out active:scale-95 ${
                  selectedSlug === post.slug
                    ? "border-pixel-ink bg-pixel-cream text-pixel-ink shadow-pixel-sm"
                    : "hover:bg-white"
                }`}
              >
                {post.slug}
              </button>
            ))}
          </div>

          {selectedSlug ? (
            <div className="mt-5">
              <textarea
                value={postContent}
                onChange={(event) => setPostContent(event.target.value)}
                className="h-[360px] w-full resize-y rounded-2xl border border-white/60 bg-white/55 p-4 font-mono text-xs leading-relaxed text-ink outline-none backdrop-blur-xl dark:border-white/10 dark:bg-white/10"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={savePost}
                  disabled={loading}
                  className="pixel-btn rounded-full px-5 py-3"
                >
                  <Save className="h-4 w-4" />
                  Save post
                </button>
                <button
                  type="button"
                  onClick={deletePost}
                  disabled={loading}
                  className="pixel-btn rounded-full px-5 py-3"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-white/50 bg-white/30 p-5 backdrop-blur-xl dark:border-white/15 dark:bg-white/10">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-accent-blue" />
                <span className="text-sm font-medium text-ink">
                  New post
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  value={newSlug}
                  onChange={(event) => setNewSlug(event.target.value)}
                  placeholder="post-slug"
                  className="rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-sm text-ink outline-none backdrop-blur-xl dark:border-white/10 dark:bg-white/10"
                />
                <button
                  type="button"
                  onClick={createPost}
                  disabled={loading}
                  className="pixel-btn rounded-full px-5 py-3"
                >
                  <Plus className="h-4 w-4" />
                  Create
                </button>
              </div>
              <textarea
                value={newContent}
                onChange={(event) => setNewContent(event.target.value)}
                placeholder="---"
                className="mt-3 h-64 w-full resize-y rounded-2xl border border-white/60 bg-white/55 p-4 font-mono text-xs leading-relaxed text-ink outline-none backdrop-blur-xl dark:border-white/10 dark:bg-white/10"
              />
            </div>
          )}
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <section className="glass rounded-4xl p-6">
          <h2 className="text-lg font-semibold text-ink">Projects</h2>
          <textarea
            value={projectsText}
            onChange={(event) => setProjectsText(event.target.value)}
            className="mt-4 h-80 w-full resize-y rounded-2xl border border-white/60 bg-white/55 p-4 font-mono text-xs leading-relaxed text-ink outline-none backdrop-blur-xl dark:border-white/10 dark:bg-white/10"
          />
          <button
            type="button"
            onClick={() => saveData("projects", projectsText, "Projects")}
            disabled={loading}
            className="pixel-btn mt-4 rounded-full px-5 py-3"
          >
            <Save className="h-4 w-4" />
            Save projects
          </button>
        </section>

        <section className="glass rounded-4xl p-6">
          <h2 className="text-lg font-semibold text-ink">Friends</h2>
          <textarea
            value={friendsText}
            onChange={(event) => setFriendsText(event.target.value)}
            className="mt-4 h-80 w-full resize-y rounded-2xl border border-white/60 bg-white/55 p-4 font-mono text-xs leading-relaxed text-ink outline-none backdrop-blur-xl dark:border-white/10 dark:bg-white/10"
          />
          <button
            type="button"
            onClick={() => saveData("friends", friendsText, "Friends")}
            disabled={loading}
            className="pixel-btn mt-4 rounded-full px-5 py-3"
          >
            <Save className="h-4 w-4" />
            Save friends
          </button>
        </section>

        <section className="glass rounded-4xl p-6">
          <h2 className="text-lg font-semibold text-ink">Site style</h2>
          <textarea
            value={siteText}
            onChange={(event) => setSiteText(event.target.value)}
            className="mt-4 h-80 w-full resize-y rounded-2xl border border-white/60 bg-white/55 p-4 font-mono text-xs leading-relaxed text-ink outline-none backdrop-blur-xl dark:border-white/10 dark:bg-white/10"
          />
          <button
            type="button"
            onClick={() => saveData("site", siteText, "Site style")}
            disabled={loading}
            className="pixel-btn mt-4 rounded-full px-5 py-3"
          >
            <Save className="h-4 w-4" />
            Save style
          </button>
        </section>
      </div>
    </div>
  );
}
