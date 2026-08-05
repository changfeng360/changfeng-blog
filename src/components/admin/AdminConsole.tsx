"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import {
  BookOpenText,
  ExternalLink,
  FolderKanban,
  Globe2,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Reply,
  Save,
  Settings2,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import type { Friend, Post, Profile, Project } from "@/data/content";
import RichText from "@/components/RichText";
import RichTextEditor from "@/components/RichTextEditor";
import AdminModal from "./AdminModal";
import {
  CheckboxField,
  ColorField,
  NumberField,
  RichTextAreaField,
  SelectField,
  SkillsEditor,
  StringListField,
  TextField,
} from "./AdminFields";

type SectionKey =
  | "dashboard"
  | "profile"
  | "posts"
  | "projects"
  | "friends"
  | "guestbook"
  | "style";

type AdminPost = Post & {
  body: string;
  name: string;
};

type SiteSettings = {
  baseFontSize: number;
  headingItalic: boolean;
  accentColor: string;
  backgroundColor: string;
  darkBackground: string;
};

type PostModalState = {
  mode: "new" | "edit";
  draft: AdminPost;
};

type ProjectModalState = {
  index: number | null;
  draft: Project;
};

type FriendModalState = {
  index: number | null;
  draft: Friend;
};

type AdminGuestReply = {
  id: string;
  nickname: string;
  content: string;
  email?: string;
  avatarUrl?: string;
  images?: string[];
  isAuthor: boolean;
  likes: number;
  createdAt: string;
};

type AdminGuestMessage = AdminGuestReply & {
  replies: AdminGuestReply[];
};

const sectionMeta: Record<SectionKey, { label: string; eyebrow: string }> = {
  dashboard: { label: "仪表盘", eyebrow: "OVERVIEW" },
  profile: { label: "个人简介", eyebrow: "PROFILE" },
  posts: { label: "文章管理", eyebrow: "POSTS" },
  projects: { label: "项目管理", eyebrow: "PROJECTS" },
  friends: { label: "友链管理", eyebrow: "FRIENDS" },
  guestbook: { label: "留言管理", eyebrow: "GUESTBOOK" },
  style: { label: "站点样式", eyebrow: "STYLE" },
};

const accentOptions = [
  { value: "mint", label: "薄荷绿" },
  { value: "blue", label: "苹果蓝" },
  { value: "tangerine", label: "橘橙" },
  { value: "pink", label: "粉红" },
  { value: "lilac", label: "紫罗兰" },
  { value: "gold", label: "金色" },
];

function parseFrontmatter(raw: string) {
  const meta: Record<string, string | string[] | boolean> = {};
  let arrayKey: string | null = null;

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    if (arrayKey && trimmed.startsWith("-")) {
      const value = trimmed
        .replace(/^-\s*/, "")
        .replace(/^["']|["']$/g, "");
      const current = (meta[arrayKey] as string[]) || [];
      meta[arrayKey] = [...current, value];
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

  return meta;
}

function parseMdx(raw: string, fallbackSlug: string) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  const frontmatter = match?.[1] ?? "";
  const body = match?.[2]?.trim() ?? raw.trim();
  const meta = parseFrontmatter(frontmatter);

  const post: Post = {
    slug: String(meta.slug ?? fallbackSlug),
    title: String(meta.title ?? fallbackSlug),
    excerpt: String(meta.excerpt ?? ""),
    date: String(meta.date ?? ""),
    tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
    readTime: String(meta.readTime ?? "5 min"),
    emoji: String(meta.emoji ?? "📝"),
    featured: Boolean(meta.featured),
  };

  return { post, body };
}

function serializePost(post: Post, body: string) {
  const tags = post.tags.map((tag) => `  - ${tag}`).join("\n");
  const featured = post.featured ? "featured: true\n" : "";
  return `---\ntitle: ${JSON.stringify(post.title)}\nslug: ${post.slug}\nexcerpt: ${JSON.stringify(post.excerpt)}\ndate: ${post.date}\nreadTime: ${JSON.stringify(post.readTime)}\nemoji: ${JSON.stringify(post.emoji)}\ntags:\n${tags}\n${featured}---\n\n${body.trim()}\n`;
}

function blankPost(): AdminPost {
  return {
    slug: "",
    title: "",
    excerpt: "",
    date: new Date().toISOString().slice(0, 10),
    tags: [],
    readTime: "5 min",
    emoji: "📝",
    featured: false,
    body: "",
    name: "",
  };
}

function blankProject(): Project {
  return {
    name: "",
    description: "",
    year: String(new Date().getFullYear()),
    stack: [],
    icon: "▣",
    accent: "mint",
    github: "",
    website: "",
  };
}

function blankFriend(): Friend {
  return {
    name: "",
    description: "",
    url: "",
    category: "",
    rating: 5,
    tags: [],
  };
}

function formatDate(value: string) {
  if (!value) {
    return "未设置";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export default function AdminConsole() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [section, setSection] = useState<SectionKey>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileDraft, setProfileDraft] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [guestbookMessages, setGuestbookMessages] = useState<
    AdminGuestMessage[]
  >([]);
  const [guestbookLoading, setGuestbookLoading] = useState(false);
  const [guestbookError, setGuestbookError] = useState("");
  const [guestReplyTarget, setGuestReplyTarget] = useState<{
    messageId: string;
  } | null>(null);
  const [guestReplyContent, setGuestReplyContent] = useState("");
  const [siteDraft, setSiteDraft] = useState<SiteSettings | null>(null);

  const [profileModal, setProfileModal] = useState(false);
  const [postModal, setPostModal] = useState<PostModalState | null>(null);
  const [projectModal, setProjectModal] =
    useState<ProjectModalState | null>(null);
  const [friendModal, setFriendModal] = useState<FriendModalState | null>(
    null,
  );

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

  async function loadGuestbook(authToken: string) {
    setGuestbookLoading(true);
    setGuestbookError("");
    try {
      const response = await fetch("/api/guestbook", {
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": authToken,
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "留言加载失败");
      }
      setGuestbookMessages(data.messages || []);
    } catch (error) {
      setGuestbookError(
        error instanceof Error ? error.message : "留言加载失败",
      );
      setGuestbookMessages([]);
    } finally {
      setGuestbookLoading(false);
    }
  }

  async function guestbookApi(options: RequestInit = {}) {
    const response = await fetch("/api/guestbook", {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "留言请求失败");
    }
    return data as { messages: AdminGuestMessage[] };
  }

  async function loadPosts(authToken: string) {
    const list = (await api("posts", {}, authToken)) as {
      name: string;
      slug: string;
      path: string;
    }[];
    const items = await Promise.all(
      list.map(async (item) => {
        try {
          const file = (await api(
            `posts/${encodeURIComponent(item.slug)}`,
            {},
            authToken,
          )) as { content: string };
          const parsed = parseMdx(file.content, item.slug);
          return {
            ...parsed.post,
            body: parsed.body,
            name: item.name,
          } as AdminPost;
        } catch {
          return {
            slug: item.slug,
            title: item.slug,
            excerpt: "",
            date: "",
            tags: [],
            readTime: "",
            emoji: "📝",
            featured: false,
            body: "",
            name: item.name,
          } as AdminPost;
        }
      }),
    );
    setPosts(items);
  }

  async function loadData(authToken: string) {
    const [profileData, projectsData, friendsData, siteData] =
      await Promise.all([
        api("profile", {}, authToken),
        api("data/projects", {}, authToken),
        api("data/friends", {}, authToken),
        api("data/site", {}, authToken),
      ]);

    setProfile(profileData as Profile);
    setProfileDraft(profileData as Profile);
    setProjects(projectsData as Project[]);
    setFriends(friendsData as Friend[]);
    setSiteDraft(siteData as SiteSettings);
    await loadGuestbook(authToken);
    await loadPosts(authToken);
  }

  async function login() {
    if (!token.trim()) {
      setStatus("请输入管理员令牌");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      await loadData(token);
      window.sessionStorage.setItem("cf-admin-token", token);
      setAuthenticated(true);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "登录失败");
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

  function signOut() {
    window.sessionStorage.removeItem("cf-admin-token");
    setAuthenticated(false);
    setToken("");
    setSection("dashboard");
  }

  async function saveProfile() {
    if (!profileDraft) {
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      await api("profile", {
        method: "PUT",
        body: JSON.stringify(profileDraft),
      });
      setProfile(profileDraft);
      setProfileModal(false);
      setStatus("个人简介已保存");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function savePost() {
    if (!postModal) {
      return;
    }
    const draft = postModal.draft;
    if (!/^[a-z0-9-]+$/i.test(draft.slug)) {
      setStatus("文章 slug 只能包含字母、数字和短横线");
      return;
    }
    if (!draft.title.trim()) {
      setStatus("文章标题不能为空");
      return;
    }

    setSaving(true);
    setStatus("");
    try {
      const content = serializePost(draft, draft.body);
      if (postModal.mode === "new") {
        await api("posts", {
          method: "POST",
          body: JSON.stringify({ slug: draft.slug, content }),
        });
      } else {
        await api(`posts/${encodeURIComponent(draft.slug)}`, {
          method: "PUT",
          body: JSON.stringify({ content }),
        });
      }
      await loadPosts(token);
      setPostModal(null);
      setStatus(postModal.mode === "new" ? "文章已创建" : "文章已保存");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function deletePost(slug: string) {
    if (!window.confirm(`确定删除文章 ${slug} 吗？`)) {
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      await api(`posts/${encodeURIComponent(slug)}`, { method: "DELETE" });
      await loadPosts(token);
      setStatus("文章已删除");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "删除失败");
    } finally {
      setSaving(false);
    }
  }

  async function saveProjects() {
    if (!projectModal) {
      return;
    }
    const draft = projectModal.draft;
    if (!draft.name.trim()) {
      setStatus("项目名称不能为空");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      const next = [...projects];
      if (projectModal.index === null) {
        next.push(draft);
      } else {
        next[projectModal.index] = draft;
      }
      await api("data/projects", {
        method: "PUT",
        body: JSON.stringify(next),
      });
      setProjects(next);
      setProjectModal(null);
      setStatus("项目已保存");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject(index: number) {
    const project = projects[index];
    if (!window.confirm(`确定删除项目 ${project.name} 吗？`)) {
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      const next = projects.filter((_, itemIndex) => itemIndex !== index);
      await api("data/projects", {
        method: "PUT",
        body: JSON.stringify(next),
      });
      setProjects(next);
      setStatus("项目已删除");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "删除失败");
    } finally {
      setSaving(false);
    }
  }

  async function saveFriends() {
    if (!friendModal) {
      return;
    }
    const draft = friendModal.draft;
    if (!draft.name.trim() || !draft.url.trim()) {
      setStatus("友链名称和链接不能为空");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      const next = [...friends];
      if (friendModal.index === null) {
        next.push(draft);
      } else {
        next[friendModal.index] = draft;
      }
      await api("data/friends", {
        method: "PUT",
        body: JSON.stringify(next),
      });
      setFriends(next);
      setFriendModal(null);
      setStatus("友链已保存");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function deleteFriend(index: number) {
    const friend = friends[index];
    if (!window.confirm(`确定删除友链 ${friend.name} 吗？`)) {
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      const next = friends.filter((_, itemIndex) => itemIndex !== index);
      await api("data/friends", {
        method: "PUT",
        body: JSON.stringify(next),
      });
      setFriends(next);
      setStatus("友链已删除");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "删除失败");
    } finally {
      setSaving(false);
    }
  }

  async function saveSite() {
    if (!siteDraft) {
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      await api("data/site", {
        method: "PUT",
        body: JSON.stringify(siteDraft),
      });
      setStatus("站点样式已保存");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function deleteGuestbookEntry(id: string, parentId?: string) {
    if (
      !window.confirm(parentId ? "确定删除这条回复吗？" : "确定删除这条留言吗？")
    ) {
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      const data = await guestbookApi({
        method: "DELETE",
        body: JSON.stringify({ id, parentId }),
      });
      setGuestbookMessages(data.messages || []);
      setStatus("留言已删除");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "删除失败");
    } finally {
      setSaving(false);
    }
  }

  async function submitGuestReply() {
    if (!guestReplyTarget) {
      return;
    }
    if (!guestReplyContent.trim()) {
      setStatus("回复内容不能为空");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      const data = await guestbookApi({
        method: "POST",
        body: JSON.stringify({
          action: "reply",
          parentId: guestReplyTarget.messageId,
          nickname: "长风",
          email: "",
          content: guestReplyContent,
          images: [],
        }),
      });
      setGuestbookMessages(data.messages || []);
      setGuestReplyTarget(null);
      setGuestReplyContent("");
      setStatus("回复已发布");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "回复失败");
    } finally {
      setSaving(false);
    }
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5 pb-10 pt-20">
        <div className="glass w-full max-w-sm rounded-5xl p-8">
          <span className="chip pixel-font !text-[14px] text-accent-blue">
            CF ADMIN
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">
            {loading ? "正在进入..." : "管理员登录"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            输入管理员令牌后即可编辑个人简介、文章、项目、友链和留言。
          </p>
          <input
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                login();
              }
            }}
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
            {loading ? "Loading..." : "登录"}
          </button>
          {status ? (
            <p className="mt-4 text-sm text-accent-pink">{status}</p>
          ) : null}
        </div>
      </div>
    );
  }

  const navItems: {
    key: SectionKey;
    label: string;
    icon: ComponentType<{ className?: string }>;
    count?: number;
  }[] = [
    { key: "dashboard", label: "仪表盘", icon: LayoutDashboard },
    { key: "profile", label: "个人简介", icon: UserRound },
    { key: "posts", label: "文章", icon: BookOpenText, count: posts.length },
    {
      key: "projects",
      label: "项目",
      icon: FolderKanban,
      count: projects.length,
    },
    {
      key: "friends",
      label: "友链",
      icon: Globe2,
      count: friends.length,
    },
    {
      key: "guestbook",
      label: "留言",
      icon: MessageSquare,
      count: guestbookMessages.length,
    },
    { key: "style", label: "站点样式", icon: Settings2 },
  ];

  return (
    <div className="min-h-screen">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/15 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/50 bg-white/65 shadow-apple backdrop-blur-2xl transition-transform duration-300 dark:border-white/10 dark:bg-[#161619]/75 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 pb-5 pt-6">
          <div>
            <p className="pixel-font text-[12px] text-accent-blue">
              CF CONSOLE
            </p>
            <h1 className="mt-2 text-lg font-semibold tracking-tight text-ink">
              长风的博客后台
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="icon-button !h-9 !w-9 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = section === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setSection(item.key);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ease-out ${
                  active
                    ? "border border-white/70 bg-white/85 text-ink shadow-apple-sm dark:border-white/15 dark:bg-white/15 dark:text-white"
                    : "text-ink-soft hover:bg-white/50 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {typeof item.count === "number" ? (
                  <span className="pixel-font text-[12px] text-ink-soft">
                    {item.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-white/50 p-4 dark:border-white/10">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-center gap-2 rounded-full border border-white/60 bg-white/60 px-4 py-2.5 text-sm font-medium text-ink shadow-apple-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            打开站点
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-white/60 bg-white/60 px-4 py-2.5 text-sm font-medium text-ink shadow-apple-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-white"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-white/50 bg-white/55 px-5 py-3 backdrop-blur-2xl dark:border-white/10 dark:bg-[#161619]/65 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="icon-button !h-9 !w-9 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <p className="pixel-font text-[12px] text-accent-blue">
                  {sectionMeta[section].eyebrow}
                </p>
                <h1 className="truncate text-lg font-semibold tracking-tight text-ink">
                  {sectionMeta[section].label}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="chip hidden text-ink-soft sm:inline-flex">
                GIT SYNC
              </span>
              <button
                type="button"
                onClick={signOut}
                className="icon-button !h-9 !w-9"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-5 py-7 sm:px-8 sm:py-10">
          {status ? (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-3xl border border-white/60 bg-white/60 px-4 py-3 text-sm text-ink shadow-apple-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-white">
              <span>{status}</span>
              <button
                type="button"
                onClick={() => setStatus("")}
                className="icon-button !h-7 !w-7"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}

          {section === "dashboard" ? (
            <Dashboard
              profile={profile}
              posts={posts}
              projects={projects}
              friends={friends}
              guestbookMessages={guestbookMessages}
              onNavigate={setSection}
            />
          ) : null}

          {section === "profile" && profile && profileDraft ? (
            <section className="space-y-5">
              <SectionHeading
                title="个人简介"
                description="管理主页、关于页和底部社交信息。"
                action={
                  <PrimaryButton
                    icon={<Pencil className="h-4 w-4" />}
                    onClick={() => setProfileModal(true)}
                  >
                    编辑个人简介
                  </PrimaryButton>
                }
              />
              <div className="glass rounded-4xl p-6 sm:p-8">
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoItem label="名字" value={profile.name} />
                  <InfoItem label="定位" value={profile.location} />
                  <InfoItem label="口号" value={profile.tagline} />
                  <InfoItem label="邮箱" value={profile.email} />
                  <InfoItem label="GitHub" value={profile.github} />
                  <InfoItem label="Bilibili" value={profile.bilibili} />
                  <div className="sm:col-span-2 lg:col-span-3">
                    <InfoItem label="介绍" value={profile.intro} />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <InfoItem label="关于我" value={profile.aboutDescription} />
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-1.5">
                  {profile.tags.map((tag) => (
                    <span key={tag} className="chip pixel-font !text-[14px]">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {section === "posts" ? (
            <section className="space-y-5">
              <SectionHeading
                title="文章管理"
                description="创建、修改或删除 MDX 文章。"
                action={
                  <PrimaryButton
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() =>
                      setPostModal({ mode: "new", draft: blankPost() })
                    }
                  >
                    新建文章
                  </PrimaryButton>
                }
              />
              <div className="grid gap-5 md:grid-cols-2">
                {posts.map((post) => (
                  <PostCard
                    key={post.slug}
                    post={post}
                    onEdit={() =>
                      setPostModal({ mode: "edit", draft: { ...post } })
                    }
                    onDelete={() => deletePost(post.slug)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {section === "projects" ? (
            <section className="space-y-5">
              <SectionHeading
                title="项目管理"
                description="维护作品集中的项目卡片。"
                action={
                  <PrimaryButton
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() =>
                      setProjectModal({
                        index: null,
                        draft: blankProject(),
                      })
                    }
                  >
                    新建项目
                  </PrimaryButton>
                }
              />
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project, index) => (
                  <DataCard
                    key={`${project.name}-${index}`}
                    icon={project.icon}
                    title={project.name}
                    meta={project.year}
                    description={project.description}
                    tags={project.stack}
                    onEdit={() =>
                      setProjectModal({
                        index,
                        draft: { ...project },
                      })
                    }
                    onDelete={() => deleteProject(index)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {section === "friends" ? (
            <section className="space-y-5">
              <SectionHeading
                title="友链管理"
                description="维护分享页的推荐与友链卡片。"
                action={
                  <PrimaryButton
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() =>
                      setFriendModal({
                        index: null,
                        draft: blankFriend(),
                      })
                    }
                  >
                    新建友链
                  </PrimaryButton>
                }
              />
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {friends.map((friend, index) => (
                  <DataCard
                    key={`${friend.name}-${index}`}
                    icon="★"
                    title={friend.name}
                    meta={`${friend.rating} / 5`}
                    description={friend.description}
                    tags={friend.tags}
                    category={friend.category}
                    onEdit={() =>
                      setFriendModal({
                        index,
                        draft: { ...friend },
                      })
                    }
                    onDelete={() => deleteFriend(index)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {section === "guestbook" ? (
            <section className="space-y-5">
              <SectionHeading
                title="留言管理"
                description="查看、回复或删除访客留言。"
                action={
                  <PrimaryButton
                    icon={<RefreshCw className="h-4 w-4" />}
                    onClick={() => loadGuestbook(token)}
                  >
                    刷新留言
                  </PrimaryButton>
                }
              />
              {guestbookError ? (
                <div className="rounded-3xl border border-white/60 bg-white/60 px-4 py-3 text-sm text-accent-pink shadow-apple-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
                  {guestbookError}
                </div>
              ) : null}
              <div className="space-y-5">
                {guestbookMessages.map((message) => (
                  <AdminGuestbookCard
                    key={message.id}
                    message={message}
                    onReply={(messageId) => {
                      setGuestReplyTarget({ messageId });
                      setGuestReplyContent("");
                    }}
                    onDelete={(id, parentId) =>
                      deleteGuestbookEntry(id, parentId)
                    }
                  />
                ))}
                {!guestbookLoading &&
                !guestbookError &&
                guestbookMessages.length === 0 ? (
                  <div className="glass rounded-4xl p-10 text-center text-sm text-ink-soft">
                    还没有留言
                  </div>
                ) : null}
                {guestbookLoading ? (
                  <div className="glass rounded-4xl p-10 text-center text-sm text-ink-soft">
                    正在加载留言...
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {section === "style" && siteDraft ? (
            <section className="space-y-5">
              <SectionHeading
                title="站点样式"
                description="调整基础字号、标题斜体和全局配色。"
              />
              <div className="glass rounded-4xl p-6 sm:p-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <NumberField
                    label="基础字号"
                    value={siteDraft.baseFontSize}
                    onChange={(value) =>
                      setSiteDraft({ ...siteDraft, baseFontSize: value })
                    }
                    min={14}
                    max={24}
                    hint="px"
                  />
                  <CheckboxField
                    label="标题使用斜体"
                    checked={siteDraft.headingItalic}
                    onChange={(checked) =>
                      setSiteDraft({ ...siteDraft, headingItalic: checked })
                    }
                  />
                  <ColorField
                    label="强调色"
                    value={siteDraft.accentColor}
                    onChange={(value) =>
                      setSiteDraft({ ...siteDraft, accentColor: value })
                    }
                  />
                  <ColorField
                    label="浅色背景"
                    value={siteDraft.backgroundColor}
                    onChange={(value) =>
                      setSiteDraft({ ...siteDraft, backgroundColor: value })
                    }
                  />
                  <ColorField
                    label="深色背景"
                    value={siteDraft.darkBackground}
                    onChange={(value) =>
                      setSiteDraft({ ...siteDraft, darkBackground: value })
                    }
                  />
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <PrimaryButton
                    icon={<Save className="h-4 w-4" />}
                    onClick={saveSite}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "保存样式"}
                  </PrimaryButton>
                </div>
              </div>
            </section>
          ) : null}
        </main>
      </div>

      <AdminModal
        open={profileModal}
        title="编辑个人简介"
        onClose={() => setProfileModal(false)}
        wide
      >
        {profileDraft ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="名字"
              value={profileDraft.name}
              onChange={(value) =>
                setProfileDraft({ ...profileDraft, name: value })
              }
            />
            <TextField
              label="定位"
              value={profileDraft.location}
              onChange={(value) =>
                setProfileDraft({ ...profileDraft, location: value })
              }
            />
            <TextField
              label="咖啡状态"
              value={profileDraft.coffee}
              onChange={(value) =>
                setProfileDraft({ ...profileDraft, coffee: value })
              }
              className="sm:col-span-2"
            />
            <RichTextAreaField
              label="介绍"
              value={profileDraft.intro}
              onChange={(value) =>
                setProfileDraft({ ...profileDraft, intro: value })
              }
              rows={4}
              className="sm:col-span-2"
            />
            <RichTextAreaField
              label="关于我"
              value={profileDraft.aboutDescription}
              onChange={(value) =>
                setProfileDraft({
                  ...profileDraft,
                  aboutDescription: value,
                })
              }
              rows={4}
              className="sm:col-span-2"
            />
            <RichTextAreaField
              label="口号"
              value={profileDraft.tagline}
              onChange={(value) =>
                setProfileDraft({ ...profileDraft, tagline: value })
              }
              rows={3}
              className="sm:col-span-2"
            />
            <TextField
              label="邮箱"
              value={profileDraft.email}
              onChange={(value) =>
                setProfileDraft({ ...profileDraft, email: value })
              }
            />
            <TextField
              label="GitHub"
              value={profileDraft.github}
              onChange={(value) =>
                setProfileDraft({ ...profileDraft, github: value })
              }
            />
            <TextField
              label="Bilibili"
              value={profileDraft.bilibili}
              onChange={(value) =>
                setProfileDraft({ ...profileDraft, bilibili: value })
              }
              className="sm:col-span-2"
            />
            <StringListField
              label="标签"
              value={profileDraft.tags}
              onChange={(value) =>
                setProfileDraft({ ...profileDraft, tags: value })
              }
              placeholder="Next.js, TypeScript, C++"
              className="sm:col-span-2"
            />
            <SkillsEditor
              label="技能"
              value={profileDraft.skills}
              onChange={(value) =>
                setProfileDraft({ ...profileDraft, skills: value })
              }
              className="sm:col-span-2"
            />
          </div>
        ) : null}
        <ModalActions
          onCancel={() => setProfileModal(false)}
          onSave={saveProfile}
          saving={saving}
        />
      </AdminModal>

      <AdminModal
        open={Boolean(postModal)}
        title={postModal?.mode === "new" ? "新建文章" : "编辑文章"}
        onClose={() => setPostModal(null)}
        wide
      >
        {postModal ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Slug"
              value={postModal.draft.slug}
              onChange={(value) =>
                setPostModal({
                  ...postModal,
                  draft: { ...postModal.draft, slug: value },
                })
              }
              hint={postModal.mode === "edit" ? "创建后不可修改" : undefined}
              disabled={postModal.mode === "edit"}
            />
            <TextField
              label="标题"
              value={postModal.draft.title}
              onChange={(value) =>
                setPostModal({
                  ...postModal,
                  draft: { ...postModal.draft, title: value },
                })
              }
            />
            <RichTextAreaField
              label="摘要"
              value={postModal.draft.excerpt}
              onChange={(value) =>
                setPostModal({
                  ...postModal,
                  draft: { ...postModal.draft, excerpt: value },
                })
              }
              rows={3}
              className="sm:col-span-2"
            />
            <TextField
              label="日期"
              value={postModal.draft.date}
              onChange={(value) =>
                setPostModal({
                  ...postModal,
                  draft: { ...postModal.draft, date: value },
                })
              }
              placeholder="2026-08-04"
            />
            <TextField
              label="阅读时间"
              value={postModal.draft.readTime}
              onChange={(value) =>
                setPostModal({
                  ...postModal,
                  draft: { ...postModal.draft, readTime: value },
                })
              }
              placeholder="5 min"
            />
            <TextField
              label="Emoji"
              value={postModal.draft.emoji}
              onChange={(value) =>
                setPostModal({
                  ...postModal,
                  draft: { ...postModal.draft, emoji: value },
                })
              }
            />
            <StringListField
              label="标签"
              value={postModal.draft.tags}
              onChange={(value) =>
                setPostModal({
                  ...postModal,
                  draft: { ...postModal.draft, tags: value },
                })
              }
              placeholder="Tech, Agent, C++"
            />
            <CheckboxField
              label="设为精选"
              checked={Boolean(postModal.draft.featured)}
              onChange={(checked) =>
                setPostModal({
                  ...postModal,
                  draft: { ...postModal.draft, featured: checked },
                })
              }
            />
            <RichTextAreaField
              label="正文"
              value={postModal.draft.body}
              onChange={(value) =>
                setPostModal({
                  ...postModal,
                  draft: { ...postModal.draft, body: value },
                })
              }
              rows={14}
              className="sm:col-span-2"
            />
          </div>
        ) : null}
        <ModalActions
          onCancel={() => setPostModal(null)}
          onSave={savePost}
          saving={saving}
        />
      </AdminModal>

      <AdminModal
        open={Boolean(projectModal)}
        title={projectModal?.index === null ? "新建项目" : "编辑项目"}
        onClose={() => setProjectModal(null)}
        wide
      >
        {projectModal ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="名称"
              value={projectModal.draft.name}
              onChange={(value) =>
                setProjectModal({
                  ...projectModal,
                  draft: { ...projectModal.draft, name: value },
                })
              }
            />
            <TextField
              label="年份"
              value={projectModal.draft.year}
              onChange={(value) =>
                setProjectModal({
                  ...projectModal,
                  draft: { ...projectModal.draft, year: value },
                })
              }
            />
            <RichTextAreaField
              label="描述"
              value={projectModal.draft.description}
              onChange={(value) =>
                setProjectModal({
                  ...projectModal,
                  draft: { ...projectModal.draft, description: value },
                })
              }
              rows={4}
              className="sm:col-span-2"
            />
            <StringListField
              label="技术栈"
              value={projectModal.draft.stack}
              onChange={(value) =>
                setProjectModal({
                  ...projectModal,
                  draft: { ...projectModal.draft, stack: value },
                })
              }
              placeholder="TypeScript, React, Node.js"
              className="sm:col-span-2"
            />
            <TextField
              label="图标"
              value={projectModal.draft.icon}
              onChange={(value) =>
                setProjectModal({
                  ...projectModal,
                  draft: { ...projectModal.draft, icon: value },
                })
              }
            />
            <SelectField
              label="强调色"
              value={projectModal.draft.accent}
              onChange={(value) =>
                setProjectModal({
                  ...projectModal,
                  draft: { ...projectModal.draft, accent: value },
                })
              }
              options={accentOptions}
            />
            <TextField
              label="GitHub 链接"
              value={projectModal.draft.github}
              onChange={(value) =>
                setProjectModal({
                  ...projectModal,
                  draft: { ...projectModal.draft, github: value },
                })
              }
            />
            <TextField
              label="网站链接"
              value={projectModal.draft.website}
              onChange={(value) =>
                setProjectModal({
                  ...projectModal,
                  draft: { ...projectModal.draft, website: value },
                })
              }
            />
          </div>
        ) : null}
        <ModalActions
          onCancel={() => setProjectModal(null)}
          onSave={saveProjects}
          saving={saving}
        />
      </AdminModal>

      <AdminModal
        open={Boolean(friendModal)}
        title={friendModal?.index === null ? "新建友链" : "编辑友链"}
        onClose={() => setFriendModal(null)}
        wide
      >
        {friendModal ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="名称"
              value={friendModal.draft.name}
              onChange={(value) =>
                setFriendModal({
                  ...friendModal,
                  draft: { ...friendModal.draft, name: value },
                })
              }
            />
            <TextField
              label="分类"
              value={friendModal.draft.category}
              onChange={(value) =>
                setFriendModal({
                  ...friendModal,
                  draft: { ...friendModal.draft, category: value },
                })
              }
              placeholder="Platform"
            />
            <RichTextAreaField
              label="描述"
              value={friendModal.draft.description}
              onChange={(value) =>
                setFriendModal({
                  ...friendModal,
                  draft: { ...friendModal.draft, description: value },
                })
              }
              rows={3}
              className="sm:col-span-2"
            />
            <TextField
              label="链接"
              value={friendModal.draft.url}
              onChange={(value) =>
                setFriendModal({
                  ...friendModal,
                  draft: { ...friendModal.draft, url: value },
                })
              }
              placeholder="https://"
              className="sm:col-span-2"
            />
            <NumberField
              label="评分"
              value={friendModal.draft.rating}
              onChange={(value) =>
                setFriendModal({
                  ...friendModal,
                  draft: { ...friendModal.draft, rating: value },
                })
              }
              min={1}
              max={5}
              hint="1-5"
            />
            <StringListField
              label="标签"
              value={friendModal.draft.tags}
              onChange={(value) =>
                setFriendModal({
                  ...friendModal,
                  draft: { ...friendModal.draft, tags: value },
                })
              }
              placeholder="Design, CSS"
            />
          </div>
        ) : null}
        <ModalActions
          onCancel={() => setFriendModal(null)}
          onSave={saveFriends}
          saving={saving}
        />
      </AdminModal>

      <AdminModal
        open={Boolean(guestReplyTarget)}
        title="回复留言"
        onClose={() => {
          setGuestReplyTarget(null);
          setGuestReplyContent("");
        }}
      >
        <div className="space-y-4">
          <RichTextEditor
            value={guestReplyContent}
            onChange={setGuestReplyContent}
            placeholder="以博主身份回复..."
            rows={5}
            maxLength={1000}
          />
          <ModalActions
            onCancel={() => {
              setGuestReplyTarget(null);
              setGuestReplyContent("");
            }}
            onSave={submitGuestReply}
            saving={saving}
          />
        </div>
      </AdminModal>
    </div>
  );
}

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">
          {title}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">{description}</p>
      </div>
      {action}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  icon,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="pixel-btn rounded-full px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {icon}
      {children}
    </button>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/40 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
      <p className="text-xs font-medium text-ink-soft">{label}</p>
      <RichText
        content={value || "未设置"}
        className="mt-1.5 break-words text-sm leading-relaxed text-ink"
      />
    </div>
  );
}

function PostCard({
  post,
  onEdit,
  onDelete,
}: {
  post: AdminPost;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="card-hover glass rounded-4xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/5 bg-white/70 text-lg shadow-apple-sm">
            {post.emoji}
          </span>
          <div>
            <h3 className="text-base font-semibold leading-snug tracking-tight text-ink">
              {post.title}
            </h3>
            <p className="mt-1 text-xs text-ink-soft">{post.slug}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="icon-button !h-8 !w-8"
            aria-label={`Edit ${post.slug}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="icon-button !h-8 !w-8"
            aria-label={`Delete ${post.slug}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-ink-soft">
        {post.excerpt || "暂无摘要"}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
        <span>{formatDate(post.date)}</span>
        <span>{post.readTime}</span>
        {post.featured ? (
          <span className="chip pixel-font !text-[12px] text-accent-gold">
            FEATURED
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {post.tags.map((tag) => (
          <span key={tag} className="chip pixel-font !text-[12px]">
            #{tag}
          </span>
        ))}
      </div>
    </article>
  );
}

function DataCard({
  icon,
  title,
  meta,
  description,
  tags,
  category,
  onEdit,
  onDelete,
}: {
  icon: string;
  title: string;
  meta: string;
  description: string;
  tags: string[];
  category?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="card-hover glass rounded-4xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/5 bg-white/70 font-mono text-lg font-bold shadow-apple-sm">
            {icon}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-ink">
              {title}
            </h3>
            <p className="pixel-font mt-1 text-[12px] text-ink-soft">
              {meta}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="icon-button !h-8 !w-8"
            aria-label={`Edit ${title}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="icon-button !h-8 !w-8"
            aria-label={`Delete ${title}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {category ? (
        <span className="chip mt-4">{category}</span>
      ) : null}
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-soft">
        {description}
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className="chip pixel-font !text-[12px]">
            #{tag}
          </span>
        ))}
      </div>
    </article>
  );
}

function formatFullTime(value: string) {
  if (!value) {
    return "未知时间";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function AdminGuestImages({ images }: { images?: string[] }) {
  if (!images || images.length === 0) {
    return null;
  }
  return (
    <div className="mt-3 grid max-w-xl gap-2 sm:grid-cols-2">
      {images.map((src, index) => (
        <img
          key={`${src.slice(0, 32)}-${index}`}
          src={src}
          alt=""
          loading="lazy"
          className="max-h-64 w-full rounded-2xl border border-white/50 bg-white/40 object-cover dark:border-white/10 dark:bg-white/10"
        />
      ))}
    </div>
  );
}

function AdminGuestbookCard({
  message,
  onReply,
  onDelete,
}: {
  message: AdminGuestMessage;
  onReply: (messageId: string) => void;
  onDelete: (id: string, parentId?: string) => void;
}) {
  return (
    <article className="glass rounded-4xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/5 bg-white/80 font-mono text-sm font-bold text-accent-blue shadow-apple-sm dark:border-white/10 dark:bg-white/20">
            {message.nickname.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-ink">
                {message.nickname}
              </span>
              {message.isAuthor ? (
                <span className="chip pixel-font !text-[11px] text-accent-pink">
                  博主
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 break-words text-xs text-ink-soft">
              {formatFullTime(message.createdAt)}
              {message.email ? ` · ${message.email}` : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onReply(message.id)}
            className="icon-button !h-8 !w-8"
            aria-label="回复留言"
          >
            <Reply className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(message.id)}
            className="icon-button !h-8 !w-8"
            aria-label="删除留言"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <RichText
        content={message.content}
        className="mt-4 break-words text-sm leading-relaxed text-ink"
      />
      <AdminGuestImages images={message.images} />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="chip pixel-font !text-[12px]">
          {message.likes || 0} 赞
        </span>
      </div>

      {message.replies && message.replies.length > 0 ? (
        <div className="mt-5 space-y-3 border-l-2 border-white/50 pl-4 dark:border-white/15">
          {message.replies.map((reply) => (
            <div
              key={reply.id}
              className="rounded-2xl border border-white/50 bg-white/35 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/5 bg-white/80 font-mono text-xs font-bold text-accent-blue dark:border-white/10 dark:bg-white/20">
                    {reply.nickname.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold text-ink">
                    {reply.nickname}
                  </span>
                  {reply.isAuthor ? (
                    <span className="chip pixel-font !text-[11px] text-accent-pink">
                      博主
                    </span>
                  ) : null}
                  <span className="break-words text-xs text-ink-soft">
                    {formatFullTime(reply.createdAt)}
                    {reply.email ? ` · ${reply.email}` : ""}
                  </span>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => onReply(message.id)}
                    className="icon-button !h-7 !w-7"
                    aria-label="回复留言"
                  >
                    <Reply className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(reply.id, message.id)}
                    className="icon-button !h-7 !w-7"
                    aria-label="删除回复"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <RichText
                content={reply.content}
                className="mt-2 break-words text-sm leading-relaxed text-ink"
              />
              <AdminGuestImages images={reply.images} />
              <span className="chip pixel-font mt-3 !text-[11px]">
                {reply.likes || 0} 赞
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function Dashboard({
  profile,
  posts,
  projects,
  friends,
  guestbookMessages,
  onNavigate,
}: {
  profile: Profile | null;
  posts: AdminPost[];
  projects: Project[];
  friends: Friend[];
  guestbookMessages: AdminGuestMessage[];
  onNavigate: (section: SectionKey) => void;
}) {
  const stats = [
    { label: "文章", value: posts.length, section: "posts" as SectionKey },
    {
      label: "项目",
      value: projects.length,
      section: "projects" as SectionKey,
    },
    {
      label: "友链",
      value: friends.length,
      section: "friends" as SectionKey,
    },
    {
      label: "留言",
      value: guestbookMessages.length,
      section: "guestbook" as SectionKey,
    },
    {
      label: "个人简介",
      value: profile ? "已配置" : "未配置",
      section: "profile" as SectionKey,
    },
  ];

  return (
    <section className="space-y-6">
      <div className="glass rounded-4xl p-6 sm:p-8">
        <p className="pixel-font text-[12px] text-accent-blue">
          CONTENT OVERVIEW
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          欢迎回来，{profile?.name || "长风"}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          所有修改会写入 GitHub 仓库，部署后自动更新站点。
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={() => onNavigate(stat.section)}
            className="card-hover glass rounded-4xl p-5 text-left"
          >
            <p className="text-sm font-medium text-ink-soft">{stat.label}</p>
            <p className="pixel-font mt-3 text-xl text-ink">{stat.value}</p>
          </button>
        ))}
      </div>

      <div className="glass rounded-4xl p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-ink">最近文章</h3>
          <button
            type="button"
            onClick={() => onNavigate("posts")}
            className="chip hover:bg-white"
          >
            管理文章
          </button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {posts.slice(0, 4).map((post) => (
            <div
              key={post.slug}
              className="rounded-3xl border border-white/60 bg-white/40 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/10"
            >
              <p className="truncate text-sm font-semibold text-ink">
                {post.title}
              </p>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-ink-soft">
                <span>{formatDate(post.date)}</span>
                <span>{post.readTime}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ModalActions({
  onCancel,
  onSave,
  saving,
}: {
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="mt-7 flex flex-wrap justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-full border border-white/60 bg-white/60 px-5 py-3 text-sm font-medium text-ink backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-white"
      >
        取消
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="pixel-btn rounded-full px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {saving ? "Saving..." : "保存"}
      </button>
    </div>
  );
}
